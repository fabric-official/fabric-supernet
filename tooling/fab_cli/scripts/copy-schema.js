const fs = require('fs');
const path = require('path');

fs.copyFileSync(
    path.join(__dirname, '..', 'src', 'model.schema.json'),
    path.join(__dirname, '..', 'dist', 'model.schema.json')
);
console.log('✔ model.schema.json copied to dist/');
