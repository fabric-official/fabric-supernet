#!/usr/bin/env python3
import sys, hashlib, yaml
from pathlib import Path
def sha256_hex(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1<<20), b""): h.update(chunk)
    return h.hexdigest()
if __name__=="__main__":
    if len(sys.argv)!=3: print("usage: update_digest.py <model.yaml> <weights_file>", file=sys.stderr); sys.exit(2)
    m, w = Path(sys.argv[1]), Path(sys.argv[2])
    d = yaml.safe_load(m.read_text(encoding="utf-8")) or {}
    d.setdefault("signatures", {}); d["signatures"]["artifact_sig"] = sha256_hex(w)
    m.write_text(yaml.safe_dump(d, sort_keys=False), encoding="utf-8")
    print(d["signatures"]["artifact_sig"])
