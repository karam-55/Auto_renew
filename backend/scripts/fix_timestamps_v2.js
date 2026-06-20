const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const lines = fs.readFileSync(schemaPath, 'utf-8').split('\n');
const newLines = [];

let inModel = false;
let inEnum = false;
let hasCreatedAt = false;
let hasUpdatedAt = false;
let hasDeletedAt = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  const modelMatch = line.match(/^model (\w+) \{/);
  const enumMatch = line.match(/^enum (\w+) \{/);
  
  if (modelMatch) {
    inModel = true;
    inEnum = false;
    hasCreatedAt = false;
    hasUpdatedAt = false;
    hasDeletedAt = false;
  } else if (enumMatch) {
    inEnum = true;
    inModel = false;
  }
  
  if (inModel) {
    if (line.includes('createdAt')) hasCreatedAt = true;
    if (line.includes('updatedAt')) hasUpdatedAt = true;
    if (line.includes('deletedAt')) hasDeletedAt = true;
    
    // Before closing brace of a model, add missing timestamps (only if model has deletedAt)
    if (line.match(/^\}/) && hasDeletedAt && !inEnum) {
      const indent = '  ';
      if (!hasCreatedAt) {
        newLines.push(`${indent}createdAt   DateTime  @default(now())`);
      }
      if (!hasUpdatedAt) {
        newLines.push(`${indent}updatedAt   DateTime  @updatedAt`);
      }
    }
  }
  
  if (inEnum && line.match(/^\}/)) {
    inEnum = false;
  }
  
  newLines.push(line);
}

fs.writeFileSync(schemaPath, newLines.join('\n'), 'utf-8');
console.log('Timestamp fixes v2 applied!');
