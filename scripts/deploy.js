const { ethers } = require("hardhat");

async function main() {
  const ZorAiRegistry = await ethers.getContractFactory("ZorAiRegistry");
  const contract = await ZorAiRegistry.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("ZorAiRegistry deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
