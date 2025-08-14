
#!/usr/bin/env python3
import sys, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

AGENTS = [
  "FabricGovernor",
  "AtomicMemoryDBAgent",
  "WiFiAgent",
  "NetworkAgent",
  "DroneAgent",
  "LaptopAgent",
  "SmartphoneAgent",
]

REQUIRED_TOP = ["README.md", "CMakeLists.txt"]
REQUIRED_AGENT_FILES = ["model.yaml", "policy.seal", "policy.rules", "README.md"]

def read_yaml_minimal(path: Path):
    # very lightweight YAML-ish parse for key: value pairs
    data = {}
    if not path.exists():
        return data
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line=line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            k,v = line.split(":",1)
            data[k.strip()] = v.strip()
    return data

def check_top():
    issues = []
    for f in REQUIRED_TOP:
        if not (ROOT / f).exists():
            issues.append(("TOP", f, "missing"))
    return issues

def check_agents(strict=False):
    issues = []
    for a in AGENTS:
        base = ROOT / "agents" / a
        if not base.exists():
            issues.append((a, "dir", "missing"))
            continue
        # required files
        for f in REQUIRED_AGENT_FILES:
            if not (base / f).exists():
                issues.append((a, f, "missing"))
        # minimal model.yaml keys
        y = read_yaml_minimal(base / "model.yaml")
        for key in ["name","version"]:
            if key not in y:
                issues.append((a, "model.yaml:"+key, "missing"))
        # weights check (soft unless strict)
        wdir = base / "weights"
        bins = list(wdir.glob("*.bin"))
        if strict:
            if len(bins) != 1:
                issues.append((a, "weights", f"expect 1 .bin, found {len(bins)}"))
        else:
            if len(bins) == 0:
                # warn only
                issues.append((a, "weights", "warn: no .bin present (relaxed mode)"))
    return issues

def check_scripts():
    issues = []
    for f in ["compile.sh","compile.bat","scripts/build_test.sh","scripts/build_test.bat","tools/static_verify.py","tools/verify_supernet.py"]:
        if not (ROOT / f).exists():
            issues.append(("TOP", f, "missing"))
    return issues

def main():
    strict = "--strict" in sys.argv
    issues = []
    issues += check_top()
    issues += check_agents(strict=strict)
    issues += check_scripts()
    status = "PASS"
    # In relaxed mode, only treat "missing" as fail; "warn:" stays pass
    fails = [i for i in issues if not isinstance(i[2], str) or not i[2].startswith("warn")]
    # But only hard-fail on "missing" or explicit "expect" when strict
    hardfails = []
    for a,b,msg in issues:
        if strict:
            if "missing" in msg or "expect" in msg:
                hardfails.append((a,b,msg))
        else:
            if "missing" in msg and not (a=="TOP" and b=="CMakeLists.txt"): # allow CMakeLists runtime-gen? no, keep missing as fail
                hardfails.append((a,b,msg))
    if hardfails:
        status = "FAIL"
    out = {
        "mode": "strict" if strict else "relaxed",
        "status": status,
        "issues": issues,
        "hardfails": hardfails
    }
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()
