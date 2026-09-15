import { route, object, assert } from "../../lib/api";
import { authenticate } from "../../lib/access";
import { consume } from "../../lib/store";
import { validateEnvelope } from "../../lib/attestation";
import { decodeAsset, inspectAsset } from "../../lib/assets";
import { registerEvidence } from "../../lib/registration";

export const config = {
  api: { bodyParser: { sizeLimit: "4.1mb" } },
  maxDuration: 60,
};
export default route(["POST"], async (req, res) => {
  const client = await authenticate(req, "register");
  const body = object(req.body);
  const { claim } = validateEnvelope(body.evidence, { fresh: true });
  assert(
    client.issuerId === claim.issuerId,
    403,
    "issuer_mismatch",
    "This key cannot submit for that issuer.",
  );
  const inspection = inspectAsset(decodeAsset(body.assetBase64));
  assert(
    inspection.imageHash === claim.imageHash,
    422,
    "asset_mismatch",
    "The signed digest does not match the final image bytes.",
  );
  assert(
    inspection.marker &&
      inspection.marker.issuerId === claim.issuerId &&
      inspection.marker.nonce === claim.nonce,
    422,
    "marker_mismatch",
    "The metadata marker does not match the signed claim.",
  );
  assert(
    Number.isSafeInteger(client.dailyRegistrationLimit) &&
      client.dailyRegistrationLimit > 0,
    503,
    "plan_unconfigured",
    "An issuer publishing limit must be configured.",
  );
  await consume(
    "zorai:publish:" + client.id + ":" + new Date().toISOString().slice(0, 10),
    client.dailyRegistrationLimit,
    172800,
  );
  const job = await registerEvidence(body.evidence, client);
  res
    .status(
      job.status === "failed" ? 409 : job.status === "confirmed" ? 200 : 202,
    )
    .json(job);
});
