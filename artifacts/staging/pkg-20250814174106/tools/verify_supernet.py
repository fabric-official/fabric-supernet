#!/usr/bin/env python3
import sys, os, re, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOGS = ROOT / "logs"

REQUIRED_LOG_TOKENS = {
  "Governor": ["PolicyKernel: tick=", "AuditTrail: delta=", "Consensus: quorum="],
  "NetworkAgent": ["Handshake: link_ok", "Directory:update_ok"],
  "WiFiAgent": ["Router:patch_ok", "SwarmBalancer:active"],
  "DroneAgent": ["Uplink:relay_ok", "Beacon:ping_ok", "Audit:bandwidth_delta"],
  "AtomicMemoryDBAgent": ["MemoryPersistor:write_ok", "MemoryExchange:sync_ok", "Royalty:mint_ok"],
  "LaptopAgent": ["OSHook:init_ok", "ExecMultiplex:dispatch_ok", "EnergyMeter:online"],
  "SmartphoneAgent": ["DeviceBrain:init_ok", "BandwidthClient:connected"]
}

def scan_logs():
    if not LOGS.exists():
        print("FAIL: logs/ directory not found", flush=True)
        return False
    ok = True
    for agent, tokens in REQUIRED_LOG_TOKENS.items():
        # find any log file containing agent name
        candidates = list(LOGS.glob(f"*{agent}*.log")) + list(LOGS.glob(f"{agent.lower()}*.log"))
        if not candidates:
            print(f"FAIL: no log file for {agent}", flush=True)
            ok = False
            continue
        content = ""
        for c in candidates:
            try:
                content += c.read_text(encoding="utf-8", errors="ignore") + "\n"
            except Exception:
                pass
        for t in tokens:
            if t not in content:
                print(f"FAIL: {agent} missing token: {t}", flush=True)
                ok = False
    return ok

def check_weights():
    # Ensure one .bin per agent present
    agents = ["FabricGovernor","AtomicMemoryDBAgent","WiFiAgent","NetworkAgent","DroneAgent","LaptopAgent","SmartphoneAgent"]
    ok = True
    for a in agents:
        wdir = ROOT / "agents" / a / "weights"
        bins = list(wdir.glob("*.bin"))
        if len(bins) != 1:
            print(f"FAIL: expected 1 weight in {wdir}, found {len(bins)}", flush=True)
            ok = False
    return ok

def main():
    ok1 = check_weights()
    ok2 = scan_logs()
    if ok1 and ok2:
        print("PASS: SuperNet verified ✅")
        sys.exit(0)
    else:
        print("SuperNet verification FAILED ❌")
        sys.exit(2)

if __name__ == "__main__":
    main()
