import { route, object, hash } from "../../../lib/api";
import { publicLimit } from "../../../lib/access";
import { verifyImage } from "../../../lib/verification";

export const config = {
  api: { bodyParser: { sizeLimit: "2kb" } },
  maxDuration: 30,
};
export default route(["POST"], async (req, res) => {
  const imageHash = hash(object(req.body).imageHash);
  await publicLimit(req);
  const result = await verifyImage(imageHash);
  if (result.evidence)
    result.evidence = {
      kind: result.evidence.kind,
      signatureValid: true,
      assetBinding: result.evidence.assetBinding,
    };
  res.status(200).json(result);
});
