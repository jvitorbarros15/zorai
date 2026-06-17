const { ethers } = require("hardhat");

async function main() {
  const ZorAiRegistry = await ethers.getContractFactory("ZorAiRegistry");
  const contract = await ZorAiRegistry.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("ZorAiRegistry deployed to:", address);

  const signerKey = process.env.ZORAI_SIGNER_PRIVATE_KEY;
  if (!signerKey) {
    console.warn("WARNING: ZORAI_SIGNER_PRIVATE_KEY not set — API signer not authorized. /register will revert at runtime.");
  } else {
    const signerAddress = new ethers.Wallet(signerKey).address;
    const [deployer] = await ethers.getSigners();
    if (signerAddress.toLowerCase() !== deployer.address.toLowerCase()) {
      const tx = await contract.addIssuer(signerAddress);
      await tx.wait();
      console.log("Authorized issuer:", signerAddress);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
