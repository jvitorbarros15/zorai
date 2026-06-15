const { ethers } = require("hardhat");

async function main() {
  const ZorAiRegistry = await ethers.getContractFactory("ZorAiRegistry");
  const contract = await ZorAiRegistry.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("ZorAiRegistry deployed to:", address);

  // Authorize the /register API signer if it differs from the deployer.
  const signerKey = process.env.ZORAI_SIGNER_PRIVATE_KEY;
  if (signerKey) {
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
