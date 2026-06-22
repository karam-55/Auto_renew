import os, re

results = []
for root, dirs, files in os.walk('/app/node_modules'):
    for file in files:
        if file.endswith('.js'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                for match in re.finditer(r'\.toUpperCase\(\)', content):
                    # Get some context
                    start = max(0, match.start() - 100)
                    end = min(len(content), match.end() + 50)
                    context = content[start:end]
                    if 'typeof' not in context and '=== ' not in context and 'string' not in context:
                        results.append(f"{path}: ...{context}...")
                        if len(results) >= 20:
                            break
            except:
                pass
        if len(results) >= 20:
            break
    if len(results) >= 20:
        break

for r in results:
    print(r)
