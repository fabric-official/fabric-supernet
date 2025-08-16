# Hardhat Module (Contracts & Scripts)

This module ships ready for activation but is not enabled automatically.
- Contracts live in `hardhat/contracts/` and compile with Solidity ^0.8.20.
- Scripts live in `hardhat/scripts/` and exit safely if Hardhat is not installed.
- No networks are configured by default.

## Optional use
1) `cd hardhat`
2) `npm i`
3) `npx hardhat compile`
4) `npx hardhat run scripts/deploy_royalty_vault.js --network <yourNetwork>`

This code is production-safe: it includes owner-controlled payout logic and reverts on failed transfers.