import { route, object, hash, assert } from "../../lib/api";
import { authenticate, reserveVerification } from "../../lib/access";
import { refund } from "../../lib/store";
import { decodeAsset, inspectAsset } from "../../lib/assets";
import { verifyImage } from "../../lib/verification";

export const config = {
  api: { bodyParser: { sizeLimit: "4.1mb" } },
  maxDuration: 30,
};
export default route(["GET", "POST"], async (req, res) => {
  const client = await authenticate(req, "verify");
  const payload =
    req.method === "GET" ? { imageHash: req.query.id } : object(req.body);
  assert(
    !payload.watermark && !payload.watermarkHash,
    400,
    "legacy_watermark",
    "Watermark hash comparison is replaced by signed evidence and exact-file verification.",
  );
  const inspection = payload.assetBase64
    ? inspectAsset(decodeAsset(payload.assetBase64))
    : null;
  const imageHash = inspection ? inspection.imageHash : hash(payload.imageHash);
  if (payload.imageHash && inspection)
    assert(
      hash(payload.imageHash) === imageHash,
      400,
      "file_hash_mismatch",
      "The supplied digest does not match the uploaded file.",
    );
  const ticket = await reserveVerification(client);
  try {
    const result = await verifyImage(imageHash);
    if (inspection)
      result.inspection = {
        format: inspection.format,
        bytes: inspection.bytes,
        marker: inspection.marker,
        sourceCredentialsPresent: inspection.hasSourceCredentials,
        note: "Metadata presence alone is not proof of AI origin. Source C2PA credentials are not independently validated by this endpoint yet.",
      };
    res.setHeader("X-Usage-Remaining", ticket.remaining);
    res
      .status(200)
      .json({
        ...result,
        usage: {
          used: ticket.used,
          limit: ticket.limit,
          remaining: ticket.remaining,
          resetsAt: ticket.resetsAt,
        },
      });
  } catch (error) {
    await refund(ticket.key);
    throw error;
  }
});
