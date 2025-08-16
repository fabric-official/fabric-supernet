/** Environment check for the Hardhat module. */
(function(){
  const out = (k,v) => console.log(`${k}: ${v ?? ""}`);
  out("node", process.version);
  let hh, toolbox;
  try { hh = require.resolve("hardhat"); } catch {}
  try { toolbox = require.resolve("@nomicfoundation/hardhat-toolbox"); } catch {}
  out("hardhat_module", hh ? "present" : "missing");
  out("toolbox_module", toolbox ? "present" : "missing");
})();