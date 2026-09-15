import { route } from "../../lib/api";
import { authenticate, usage } from "../../lib/access";
export default route(["GET"], async (req, res) => {
  const client = await authenticate(req, "verify");
  res
    .status(200)
    .json({
      account: {
        id: client.id,
        name: client.name || client.id,
        scopes: client.scopes,
        expiresAt: client.expiresAt || null,
      },
      usage: await usage(client),
    });
});
