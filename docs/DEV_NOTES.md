# Dev Notes

## One-shot refactor workflow

```bash
# 1. Create a test file
cat > file.txt << 'EOF'
int main(){int x=1;int y=2;return x+y;}
EOF

# 2. Ask the refactor API and save a patch
curl -s -X POST http://localhost:3000/api/refactor \
  -H "Content-Type: application/json" \
  -d '{
    "code": "int main(){int x=1;int y=2;return x+y;}",
    "instructions": "format and improve readability"
  }' \
| node -e '
process.stdin.on("data", d => {
  const j = JSON.parse(d);
  process.stdout.write(j.diff);
});
' > refactor.patch

# 3. Apply the patch
git apply refactor.patch
```

