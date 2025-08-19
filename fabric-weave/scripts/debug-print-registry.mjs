import fs from 'fs';
const txt = fs.readFileSync('D:/Fabric/fabric-supernet/fabric-weave/plugin.config.ts','utf8');
const m = txt.match(/export\s+default\s+\[([\s\S]*?)\]\s*;?/);
if (!m) { console.log('NO ARRAY FOUND'); process.exit(1); }
const items = m[1].split(',').map(s=>s.trim()).filter(Boolean);
console.log('PLUGIN REGISTRY:', items);
