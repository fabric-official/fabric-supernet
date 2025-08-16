const assert = require("assert");
const path   = require("path");

describe("Red path – IPC registry", function () {
  it("device enrollment IPCs exist", async function () {
    let reg;
    try {
      reg = require(path.resolve("dist-electron/main_ipc_registry.js")) || {};
    } catch (e) {
      assert.fail("Could not require dist-electron/main_ipc_registry.js: " + e.message);
    }
    const h = reg.ipcHandlers || reg.default || {};
    assert.strictEqual(typeof h["device.enroll.challenge"], "function", "device.enroll.challenge missing");
    assert.strictEqual(typeof h["device.enroll.proof"],     "function", "device.enroll.proof missing");
  });
});
