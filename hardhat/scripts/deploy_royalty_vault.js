/**
 * Deploy RoyaltyVault if run under Hardhat. If Hardhat is unavailable, exit gracefully.
 */
(async () => {
  let hre;
  try { hre = require("hardhat"); } catch (e) {
    console.log("[deploy] Hardhat not installed; module is present but inactive.");
    process.exit(0);
  }
  const [deployer] = await hre.ethers.getSigners();
  console.log("[deploy] deployer:", deployer.address);
  const F = await hre.ethers.getContractFactory("RoyaltyVault");
  const c = await F.deploy();
  await c.waitForDeployment();
  console.log("[deploy] RoyaltyVault:", await c.getAddress());
})();