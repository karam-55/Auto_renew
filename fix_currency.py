import re

with open('/opt/auto-renew/backend/src/modules/dealers/service.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "// currency: data.currency || 'SYP', // TODO: uncomment after DB migration",
    "currency: data.currency || 'SYP',"
)
content = content.replace(
    "// currency: data.currency ?? existing.currency, // TODO: uncomment after DB migration",
    "currency: data.currency ?? existing.currency,"
)

with open('/opt/auto-renew/backend/src/modules/dealers/service.ts', 'w') as f:
    f.write(content)

print('Done')
