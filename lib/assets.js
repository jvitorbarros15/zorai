const crypto = require("crypto");
const { assert } = require("./api");

const MAX_ASSET_BYTES = 3 * 1024 * 1024;
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}
function parseMarker(text) {
  assert(
    text.length <= 4096,
    400,
    "invalid_metadata",
    "The ZorAI marker is too large.",
  );
  let marker;
  try {
    marker = JSON.parse(text);
  } catch {
    assert(false, 400, "invalid_metadata", "The ZorAI marker is malformed.");
  }
  assert(
    marker &&
      Object.keys(marker).length === 3 &&
      marker.version === 1 &&
      typeof marker.issuerId === "string" &&
      typeof marker.nonce === "string" &&
      /^[a-zA-Z0-9._:/-]{1,120}$/.test(marker.issuerId || "") &&
      /^[a-zA-Z0-9._:/-]{1,120}$/.test(marker.nonce || ""),
    400,
    "invalid_metadata",
    "Unsupported ZorAI marker.",
  );
  return marker;
}
function inspectAsset(input) {
  const bytes = Buffer.from(input);
  assert(
    bytes.length > 0 && bytes.length <= MAX_ASSET_BYTES,
    413,
    "file_size",
    "Select a PNG or JPEG no larger than 3 MB.",
  );
  let format,
    marker = null,
    hasSourceCredentials = false,
    insertionOffset;
  function collect(text) {
    assert(
      !marker,
      400,
      "ambiguous_metadata",
      "Multiple ZorAI markers are not supported.",
    );
    marker = parseMarker(text);
  }
  if (bytes.subarray(0, 8).equals(PNG)) {
    format = "png";
    let offset = 8,
      count = 0,
      hasImage = false,
      ended = false;
    while (offset + 12 <= bytes.length) {
      const size = bytes.readUInt32BE(offset);
      assert(
        size <= bytes.length - offset - 12,
        400,
        "invalid_image",
        "Truncated PNG chunk.",
      );
      const type = bytes.toString("ascii", offset + 4, offset + 8);
      const data = bytes.subarray(offset + 8, offset + 8 + size);
      assert(
        bytes.readUInt32BE(offset + 8 + size) ===
          crc32(bytes.subarray(offset + 4, offset + 8 + size)),
        400,
        "invalid_image",
        "PNG checksum failed.",
      );
      if (count === 0) {
        assert(
          type === "IHDR" && size === 13,
          400,
          "invalid_image",
          "PNG header missing.",
        );
        const width = data.readUInt32BE(0),
          height = data.readUInt32BE(4);
        assert(
          width > 0 && height > 0 && width * height <= 25000000,
          400,
          "image_dimensions",
          "Image dimensions exceed the supported limit.",
        );
      } else
        assert(type !== "IHDR", 400, "invalid_image", "Duplicate PNG header.");
      if (type === "IDAT") hasImage = true;
      if (type === "caBX") hasSourceCredentials = true;
      if (type === "tEXt" && data.subarray(0, 6).equals(Buffer.from("ZorAI\0")))
        collect(data.toString("utf8", 6));
      if (type === "IEND") {
        assert(
          size === 0 && hasImage && offset + 12 === bytes.length,
          400,
          "invalid_image",
          "Invalid PNG ending.",
        );
        insertionOffset = offset;
        ended = true;
        break;
      }
      offset += size + 12;
      count++;
    }
    assert(ended, 400, "invalid_image", "Incomplete PNG.");
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    format = "jpeg";
    assert(
      bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9,
      400,
      "invalid_image",
      "Incomplete JPEG.",
    );
    let offset = 2,
      foundScan = false,
      foundFrame = false,
      checkFirstSegment = true;
    insertionOffset = 2;
    while (offset + 4 <= bytes.length) {
      while (bytes[offset] === 0xff && bytes[offset + 1] === 0xff)
        offset++;
      assert(
        offset + 4 <= bytes.length,
        400,
        "invalid_image",
        "Invalid JPEG segment.",
      );
      assert(
        bytes[offset] === 0xff,
        400,
        "invalid_image",
        "Invalid JPEG segment.",
      );
      const type = bytes[offset + 1];
      const size = bytes.readUInt16BE(offset + 2);
      assert(
        size >= 2 && offset + 2 + size <= bytes.length,
        400,
        "invalid_image",
        "Truncated JPEG segment.",
      );
      const data = bytes.subarray(offset + 4, offset + 2 + size);
      if (checkFirstSegment && type === 0xe0 && data.subarray(0, 5).equals(Buffer.from("JFIF\0")))
        insertionOffset = offset + 2 + size;
      checkFirstSegment = false;
      if ([0xc0, 0xc1, 0xc2].includes(type)) {
        assert(
          data.length >= 6 &&
            data.readUInt16BE(1) > 0 &&
            data.readUInt16BE(3) > 0 &&
            data.readUInt16BE(1) * data.readUInt16BE(3) <= 25000000,
          400,
          "image_dimensions",
          "Invalid JPEG dimensions.",
        );
        foundFrame = true;
      }
      if (type === 0xeb && data.includes(Buffer.from("c2pa")))
        hasSourceCredentials = true;
      if (type === 0xe1) {
        const text = data.toString("utf8");
        const matches = [
          ...text.matchAll(/<zorai:marker>([A-Za-z0-9+/=]+)<\/zorai:marker>/g),
        ];
        for (const match of matches)
          collect(Buffer.from(match[1], "base64").toString("utf8"));
      }
      if (type === 0xda) {
        foundScan = true;
        break;
      }
      offset += 2 + size;
    }
    assert(
      foundScan && foundFrame,
      400,
      "invalid_image",
      "Unsupported or incomplete JPEG.",
    );
  } else
    assert(
      false,
      415,
      "unsupported_image",
      "Only PNG and JPEG images are currently supported.",
    );
  return {
    imageHash: sha256(bytes),
    format,
    bytes: bytes.length,
    marker,
    hasSourceCredentials,
    insertionOffset,
  };
}
function prepareAsset(input, marker) {
  const bytes = Buffer.from(input);
  const info = inspectAsset(bytes);
  assert(
    !info.marker,
    409,
    "already_marked",
    "This file already has a ZorAI marker. Publish the existing bytes unchanged.",
  );
  assert(
    !info.hasSourceCredentials,
    422,
    "source_credentials_present",
    "Preserve the existing signed source credentials. C2PA ingestion must be validated before modifying this file.",
  );
  const text = JSON.stringify(marker);
  parseMarker(text);
  let addition;
  if (info.format === "png")
    addition = pngChunk("tEXt", Buffer.from("ZorAI\0" + text, "utf8"));
  else {
    const xml =
      'http://ns.adobe.com/xap/1.0/\0<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:zorai="https://zorai.vercel.app/ns/1.0/"><zorai:marker>' +
      Buffer.from(text).toString("base64") +
      "</zorai:marker></rdf:Description></rdf:RDF></x:xmpmeta>";
    const data = Buffer.from(xml);
    const header = Buffer.from([0xff, 0xe1, 0, 0]);
    header.writeUInt16BE(data.length + 2, 2);
    addition = Buffer.concat([header, data]);
  }
  const output = Buffer.concat([
    bytes.subarray(0, info.insertionOffset),
    addition,
    bytes.subarray(info.insertionOffset),
  ]);
  inspectAsset(output);
  return output;
}
function decodeAsset(base64) {
  assert(
    typeof base64 === "string" &&
      base64.length <= Math.ceil(MAX_ASSET_BYTES / 3) * 4 &&
      base64.length > 0 &&
      base64.length % 4 === 0 &&
      /^[A-Za-z0-9+/]*={0,2}$/.test(base64),
    400,
    "invalid_file",
    "Supply a base64-encoded PNG or JPEG, up to 3 MB.",
  );
  const bytes = Buffer.from(base64, "base64");
  assert(
    bytes.toString("base64") === base64,
    400,
    "invalid_file",
    "Invalid base64 encoding.",
  );
  return bytes;
}
module.exports = {
  MAX_ASSET_BYTES,
  inspectAsset,
  prepareAsset,
  decodeAsset,
  sha256,
  pngChunk,
};
