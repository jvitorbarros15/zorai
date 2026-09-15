export async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    signal: AbortSignal.timeout(30000),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The service returned an unreadable response. Please retry.",
    );
  }
  if (!response.ok)
    throw new Error(
      data.error?.message ||
        data.message ||
        "The request could not be completed.",
    );
  return data;
}
export async function fileHash(file) {
  if (!file || file.size === 0 || file.size > 3 * 1024 * 1024)
    throw new Error("Choose a non-empty PNG or JPEG no larger than 3 MB.");
  if (!["image/png", "image/jpeg"].includes(file.type))
    throw new Error("Choose a PNG or JPEG file.");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
