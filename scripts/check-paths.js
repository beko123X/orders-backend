import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📁 PATH DIAGNOSTIC');
console.log('='.repeat(50));
console.log('Script directory:', __dirname);
console.log('Backend directory:', path.join(__dirname, '..'));

// البحث عن ملف Product.js
const possiblePaths = [
  path.join(__dirname, '..', 'models', 'Product.js'),
  path.join(__dirname, '..', 'src', 'models', 'Product.js'),
  path.join(__dirname, '..', 'backend', 'models', 'Product.js'),
  path.join(__dirname, '..', '..', 'models', 'Product.js'),
];

possiblePaths.forEach((p, i) => {
  console.log(`\nPath ${i+1}: ${p}`);
  console.log(`Exists: ${fs.existsSync(p)}`);
});

// البحث عن مجلد uploads
const uploadPaths = [
  path.join(__dirname, '..', 'uploads'),
  path.join(__dirname, '..', 'public', 'uploads'),
  path.join(__dirname, '..', '..', 'uploads'),
];

uploadPaths.forEach((p, i) => {
  console.log(`\nUploads ${i+1}: ${p}`);
  console.log(`Exists: ${fs.existsSync(p)}`);
  if (fs.existsSync(p)) {
    const files = fs.readdirSync(p);
    console.log(`Files: ${files.length}`);
  }
});