import sys, json

data = sys.stdin.read()
lines = data.split('\n')
for line in lines:
    line = line.strip()
    if not line:
        continue
    try:
        entry = json.loads(line)
        if entry.get('requestId') == 'req_1782096698811_61099834' and 'Unhandled error' in entry.get('message', ''):
            print(json.dumps(entry, indent=2))
            break
    except:
        pass
