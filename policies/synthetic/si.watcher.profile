kind: policy
name: si.watcher.profile
version: 1.0.0
limits:
  cpu_percent_max: 40
  mem_mb_max: 256
  wall_time_sec_max: 86400
  net_egress_allow:
    - github.com:443
    - registry.npmjs.org:443
    - docker.io:443
    - localhost:*
  filesystem_allow:
    - agents/**
    - policies/**
audit:
  capture_stdio: true
  redact_env: ["TOKEN","KEY","SECRET"]
