const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZorAiRegistry access control", function () {
  let registry, owner, issuer, outsider;

  const sample = {
    imageId: "0xhash",
    modelUsed: "DALL-E",
    ipfsHash: "Qm123",
    riskLevel: 0,
    riskReasons: [],
  };

  function register(signer, id = sample.imageId) {
    return registry
      .connect(signer)
      .registerImage(id, sample.modelUsed, sample.ipfsHash, sample.riskLevel, sample.riskReasons);
  }

  beforeEach(async function () {
    [owner, issuer, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ZorAiRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  it("makes the deployer the owner", async function () {
    expect(await registry.owner()).to.equal(owner.address);
  });

  it("authorizes the deployer as an issuer", async function () {
    expect(await registry.authorizedIssuers(owner.address)).to.equal(true);
  });

  it("lets the owner add an issuer", async function () {
    await registry.addIssuer(issuer.address);
    expect(await registry.authorizedIssuers(issuer.address)).to.equal(true);
  });

  it("lets the owner remove an issuer", async function () {
    await registry.addIssuer(issuer.address);
    await registry.removeIssuer(issuer.address);
    expect(await registry.authorizedIssuers(issuer.address)).to.equal(false);
  });

  it("blocks non-owner from adding an issuer", async function () {
    await expect(registry.connect(outsider).addIssuer(outsider.address)).to.be.revertedWith(
      "Not owner"
    );
  });

  it("lets an authorized issuer register", async function () {
    await registry.addIssuer(issuer.address);
    await expect(register(issuer)).to.not.be.reverted;
    expect(await registry.isImageRegistered(sample.imageId)).to.equal(true);
  });

  it("blocks an unauthorized address from registering", async function () {
    await expect(register(outsider)).to.be.revertedWith("Not authorized issuer");
  });

  it("blocks a removed issuer from registering", async function () {
    await registry.addIssuer(issuer.address);
    await registry.removeIssuer(issuer.address);
    await expect(register(issuer)).to.be.revertedWith("Not authorized issuer");
  });

  it("lets an authorized issuer update verification", async function () {
    await register(owner);
    await registry.addIssuer(issuer.address);
    await expect(
      registry.connect(issuer).updateVerification(sample.imageId, true, 0, [])
    ).to.not.be.reverted;
    const [,,,, isVerified] = await registry.getImageData(sample.imageId);
    expect(isVerified).to.equal(true);
  });

  it("blocks a non-issuer from updating verification", async function () {
    await register(owner);
    await expect(
      registry.connect(outsider).updateVerification(sample.imageId, true, 0, [])
    ).to.be.revertedWith("Not authorized issuer");
  });

  it("blocks adding the zero address as issuer", async function () {
    await expect(registry.addIssuer(ethers.ZeroAddress)).to.be.revertedWith("Zero address");
  });

  it("blocks removing the owner from issuers", async function () {
    await expect(registry.removeIssuer(owner.address)).to.be.revertedWith("Cannot remove owner");
  });
});
