const fs = require('fs');
const path = require('path');

const results = [];

function walk(dir) {
  if (results.length >= 20) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (results.length >= 20) return;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (item.endsWith('.js')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const matches = content.match(/\.(toUpperCase)\(\)/g);
        if (matches) {
          for (const match of matches) {
            const idx = content.indexOf(match);
            const context = content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 50));
            if (!context.includes('typeof') && !context.includes('=== ') && !context.includes('string')) {
              results.push(`${fullPath}: ...${context}...`);
              if (results.length >= 20) return;
            }
          }
        }
      } catch (e) {}
    }
  }
}

walk('/app/node_modules');
for (const r of results) {
  console.log(r);
}
