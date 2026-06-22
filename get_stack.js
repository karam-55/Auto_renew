const { execSync } = require('child_process');

const logs = execSync('docker logs garage_backend --since 5s 2>&1', { encoding: 'utf-8' });
const lines = logs.split('\n');
for (const line of lines) {
  try {
    const entry = JSON.parse(line.trim());
    if (entry.message && entry.message.includes('Unhandled error')) {
      console.log(JSON.stringify(entry, null, 2));
      break;
    }
  } catch (e) {}
}
