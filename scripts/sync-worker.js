import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distHtmlPath = path.join(rootDir, 'dist', 'index.html');
const distWorkerPath = path.join(rootDir, 'dist', '_worker.js');
const publicWorkerPath = path.join(rootDir, 'public', '_worker.js');

if (!fs.existsSync(distHtmlPath)) {
  console.log('⚠️ dist/index.html not found, skipping worker sync.');
  process.exit(0);
}

const htmlContent = fs.readFileSync(distHtmlPath, 'utf-8');
const escapedHtml = JSON.stringify(htmlContent);

const placeholderRegex = /const EMBEDDED_INDEX_HTML = [\s\S]*?;\n\n\/\/ In-Memory Edge Cache/m;
const replacement = `const EMBEDDED_INDEX_HTML = ${escapedHtml};\n\n// In-Memory Edge Cache`;

function updateWorkerFile(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (placeholderRegex.test(content)) {
      content = content.replace(placeholderRegex, replacement);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Synced embedded index.html to: ${path.relative(rootDir, filePath)}`);
    } else {
      // If variable doesn't exist yet, insert after CORS_HEADERS
      const corsMarker = "const CORS_HEADERS = {\n  'Access-Control-Allow-Origin': '*',\n  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',\n  'Access-Control-Allow-Headers': 'Content-Type, Authorization',\n  'Content-Type': 'application/json; charset=utf-8',\n};\n";
      if (content.includes(corsMarker)) {
        content = content.replace(corsMarker, corsMarker + `\nconst EMBEDDED_INDEX_HTML = ${escapedHtml};\n`);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Injected EMBEDDED_INDEX_HTML into: ${path.relative(rootDir, filePath)}`);
      }
    }
  }
}

updateWorkerFile(publicWorkerPath);

// Ensure .assetsignore exists in dist so Wrangler never mistakes worker files for static assets
const distAssetsIgnorePath = path.join(rootDir, 'dist', '.assetsignore');
fs.writeFileSync(distAssetsIgnorePath, "_worker.js\n", 'utf-8');
console.log('✅ Created dist/.assetsignore to exclude _worker.js from static assets');

// Clean up dist/_worker.js because the worker entry point is public/_worker.js
if (fs.existsSync(distWorkerPath)) {
  fs.unlinkSync(distWorkerPath);
  console.log('🧹 Removed dist/_worker.js (Worker script is maintained at public/_worker.js)');
}

console.log('🚀 Worker static asset synchronization completed.');
