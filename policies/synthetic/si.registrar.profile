kind: policy
name: si.registrar.profile
version: 1.0.0
limits:
  cpu_percent_max: 60
  mem_mb_max: 512
  wall_time_sec_max: 900
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
