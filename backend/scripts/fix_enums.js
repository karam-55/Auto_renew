const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const lines = fs.readFileSync(schemaPath, 'utf-8').split('\n');
const newLines = [];

let inEnum = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.match(/^enum \w+ \{/)) {
    inEnum = true;
  }
  
  if (inEnum && line.match(/^\}/)) {
    inEnum = false;
  }
  
  // Skip timestamp lines inside enums
  if (inEnum && (line.includes('createdAt') || line.includes('updatedAt'))) {
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(schemaPath, newLines.join('\n'), 'utf-8');
console.log('Fixed enums!');
