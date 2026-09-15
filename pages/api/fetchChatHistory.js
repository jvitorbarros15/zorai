import { route } from "../../lib/api";
export default route(["GET", "POST", "OPTIONS"], async (_req, res) => {
  res
    .status(410)
    .json({
      error: "legacy_endpoint_retired",
      message:
        "This proof-of-concept endpoint has been retired. Use the authenticated provenance and verification APIs documented at /docs.",
    });
});
