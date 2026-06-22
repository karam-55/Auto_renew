import sys, json

data = sys.stdin.read()
lines = data.split('\n')
for line in lines:
    line = line.strip()
    if not line:
        continue
    try:
        entry = json.loads(line)
        if 'Unhandled error' in entry.get('message', ''):
            print(json.dumps(entry, indent=2))
            break
    except:
        pass
