#!/usr/bin/env python3
import sys, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

EXPECTED = {
  "FabricGovernor": ["PolicyKernel: tick=", "AuditTrail: delta=", "Consensus: quorum="],
  "NetworkAgent": ["Handshake: link_ok", "Directory:update_ok"],
  "WiFiAgent": ["Router:patch_ok", "SwarmBalancer:active"],
  "DroneAgent": ["Uplink:relay_ok", "Beacon:ping_ok", "Audit:bandwidth_delta"],
  "AtomicMemoryDBAgent": ["MemoryPersistor:write_ok", "MemoryExchange:sync_ok", "Royalty:mint_ok"],
  "LaptopAgent": ["OSHook:init_ok", "ExecMultiplex:dispatch_ok", "EnergyMeter:online"],
  "SmartphoneAgent": ["DeviceBrain:init_ok", "BandwidthClient:connected"],
}

def read_sources(base):
    texts = []
    for ext in (".cpp",".cc",".cxx",".h",".hpp",".py",".sh"):
        for p in base.rglob(f"*{ext}"):
            try:
                texts.append(p.read_text(encoding="utf-8", errors="ignore"))
            except Exception:
                pass
    return "\n".join(texts)

def token_supported(token, text):
    if token in text:
        return True
    stem = re.sub(r'[:=_].*$', '', token)
    pats = [
        rf'printf\s*\(.*{re.escape(stem)}.*\)',
        rf'std::cout\s*<<.*{re.escape(stem)}.*;',
        rf'LOG\(\w+\)\s*<<.*{re.escape(stem)}.*;',
        rf'logger\.\w+\(.*{re.escape(stem)}.*\)',
        rf'print\(.+{re.escape(stem)}.+\)',
        rf'echo\s+.*{re.escape(stem)}.*',
    ]
    for pat in pats:
        if re.search(pat, text, re.IGNORECASE|re.DOTALL):
            return True
    return False

def main():
    sources = read_sources(ROOT)
    missing = {}
    for agent, toks in EXPECTED.items():
        # narrow to agent dir
        adir = ROOT / "agents" / agent
        atext = read_sources(adir) if adir.exists() else ""
        miss = [t for t in toks if not token_supported(t, atext)]
        if miss:
            missing[agent] = miss
    if missing:
        print("STATIC VERIFY: FAIL")
        for a, toks in missing.items():
            print(f"- {a}: missing " + ", ".join(toks))
        sys.exit(2)
    print("STATIC VERIFY: PASS")
    sys.exit(0)

if __name__ == "__main__":
    main()
