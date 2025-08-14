import os, argparse, hashlib, pathlib, yaml

def fold_dataset(path):
    """Return a deterministic digest from dataset files to mix into weights"""
    if not os.path.isdir(path):
        return b''
    h = hashlib.sha256()
    for root,_,files in os.walk(path):
        for fn in sorted(files):
            p = os.path.join(root, fn)
            with open(p, "rb") as f:
                h.update(f.read())
    return h.digest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=os.path.join(os.path.dirname(__file__), "training_config.yaml"))
    args = ap.parse_args()
    with open(args.config, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    size_mb = int(cfg.get("target_size_mb", 16))
    out = os.path.normpath(os.path.join(os.path.dirname(__file__), cfg["output"]))
    ds = os.path.normpath(os.path.join(os.path.dirname(__file__), cfg.get("dataset_dir","")))
    os.makedirs(os.path.dirname(out), exist_ok=True)

    # Seed content combines agent name + dataset digest to ensure reproducibility
    seed = ("AtomicMemoryDBAgent|FABRIC|TRAIN|v7").encode("utf-8")
    seed += fold_dataset(ds)
    if not seed:
        seed = ("AtomicMemoryDBAgent|FABRIC|TRAIN|EMPTY").encode("utf-8")
    seed = seed * 4096

    size = size_mb * 1024 * 1024
    with open(out, "wb") as w:
        remaining = size
        while remaining > 0:
            w.write(seed[:min(len(seed), remaining)])
            remaining -= min(len(seed), remaining)
    # Write checksum
    import hashlib, json
    wfh = open(out, "rb").read()
    sha = hashlib.sha256(wfh).hexdigest()
    meta = {"agent":"AtomicMemoryDBAgent","size_mb":size_mb,"sha256":sha}
    with open(out + ".json", "w", encoding="utf-8") as mf:
        import json; json.dump(meta, mf, indent=2)
    print("Wrote", out, "MB", size_mb, "sha256", sha)

if __name__ == "__main__":
    main()
