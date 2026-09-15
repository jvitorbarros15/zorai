import { route } from "../../lib/api";
import { publicNetwork } from "../../lib/zoraiRegistry";
export default route(["GET"], async (req, res) => {
  let network = null;
  try {
    network = publicNetwork();
  } catch {
    /* a missing configuration is not an online status */
  }
  res
    .status(200)
    .json({
      mode: !network
        ? "unconfigured"
        : network.testnet === false
          ? "production-configuration"
          : "testnet",
      network,
      note: "Configuration information only. This is not an uptime or launch-readiness certification.",
    });
});
