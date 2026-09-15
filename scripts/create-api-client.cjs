// Run locally in a trusted terminal. Output includes a new secret; never commit or paste it into logs.
const crypto = require("crypto");
const [id, allowance] = process.argv.slice(2);
const monthlyLimit = Number(allowance);
if (
  !/^[a-zA-Z0-9_-]{1,64}$/.test(id || "") ||
  !Number.isSafeInteger(monthlyLimit) ||
  monthlyLimit <= 0
) {
  console.error(
    "Usage: node scripts/create-api-client.cjs ACCOUNT_ID MONTHLY_LIMIT",
  );
  process.exit(1);
}
const apiKey = "zorai_" + crypto.randomBytes(32).toString("base64url");
console.log(
  JSON.stringify(
    {
      apiKey,
      configuration: {
        id,
        keyHash: crypto.createHash("sha256").update(apiKey).digest("hex"),
        scopes: ["verify"],
        monthlyLimit,
        active: false,
      },
    },
    null,
    2,
  ),
);
console.error(
  "Deliver the key through a secure channel. Add configuration to ZORAI_CLIENTS_JSON; activate only after onboarding and commercial approval.",
);
