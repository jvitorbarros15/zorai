import { route, hash } from "../../lib/api";
import { authenticate } from "../../lib/access";
import { registrationStatus } from "../../lib/registration";
export default route(["GET"], async (req, res) => {
  const client = await authenticate(req, "register");
  res.status(200).json(await registrationStatus(hash(req.query.id), client));
});
