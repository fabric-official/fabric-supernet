/** Minimal Hardhat config. Safe defaults; no networks configured by default. */
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  }
  // networks can be added via env at runtime; none are enabled here.
};