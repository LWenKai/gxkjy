const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src', 'print', 'vendor');
const target = path.join(root, 'dist', 'build', 'mp-weixin', 'print', 'vendor');

if (!fs.existsSync(source)) {
  process.exit(0);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.cpSync(source, target, { recursive: true });

console.log(`Copied print vendor files to ${path.relative(root, target)}`);
