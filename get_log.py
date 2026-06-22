import sys, json

data = sys.stdin.read()
entries = data.strip().split('\n')
for entry in entries:
    if 'req_1782096245599_8d3c5a55' in entry and 'Unhandled error' in entry:
        print(entry)
        break
