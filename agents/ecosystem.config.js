module.exports = {
  apps: [{
    name: "si-core-service",
    script: "D:/Fabric/fabric-supernet/src/server.js",
    instances: "max",
    exec_mode: "cluster",
    max_memory_restart: "512M",
    env: { NODE_ENV: "development", PORT: 8080 },
    env_production: { NODE_ENV: "production", PORT: 8080 },
    error_file: "D:/Fabric/fabric-supernet/logs/si-core-error.log",
    out_file:    "D:/Fabric/fabric-supernet/logs/si-core-out.log",
    merge_logs: true,
    time: true,
    watch: false
  }]
};
