const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../backend/src');

function getImportPath(filePath) {
  const rel = path.relative(path.dirname(filePath), path.join(srcDir, 'infrastructure/logging/logger'));
  return rel.replace(/\\/g, '/');
}

function processFile(fp) {
  let c = fs.readFileSync(fp, 'utf8');

  if (c.includes("console.error") || c.includes("console.log") || c.includes("console.warn") || c.includes("console.debug")) {
    const importPath = getImportPath(fp);
    const importStmt = `import { Logger } from '${importPath}';`;
    if (!c.includes(importStmt)) {
      const m = c.match(/^(import \{[^}]+\} from ['"][^'"]+['"];\r?\n)/m);
      if (m) {
        c = c.replace(m[0], m[0] + importStmt + '\n');
      }
    }
    c = c.replace(/console\.error\(\s*['"](.+?)['"]\s*,\s*error\s*\)/g, "Logger.error('$1', error)");
    c = c.replace(/console\.error\(\s*['"](.+?)['"]\s*,\s*err\s*\)/g, "Logger.error('$1', err)");
    c = c.replace(/console\.error\(\s*['"](.+?)['"]\s*\)/g, "Logger.error('$1')");
    c = c.replace(/console\.warn\(\s*['"](.+?)['"]\s*\)/g, "Logger.warn('$1')");
    c = c.replace(/console\.log\(\s*['"](.+?)['"]\s*\)/g, "Logger.debug('$1')");
    fs.writeFileSync(fp, c);
    console.log('Fixed:', fp);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) {
      walk(fp);
    } else if (f.name.endsWith('.ts')) {
      processFile(fp);
    }
  }
}

walk(srcDir);
console.log('Done');
