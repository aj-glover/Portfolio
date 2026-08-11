import os, json

results = []

# Search all .claude directories for .jsonl files
search_dirs = [
    r'C:\Users\AJ\.claude',
    r'C:\Users\AJ\AppData\Local\Temp\claude',
    r'C:\Users\AJ\AppData\Local\claude-cli-nodejs',
    r'C:\Users\AJ\AppData\Roaming\Code\User\workspaceStorage',
]

for search_dir in search_dirs:
    if not os.path.isdir(search_dir):
        continue
    for root, dirs, files in os.walk(search_dir):
        for fn in files:
            if fn.endswith('.jsonl'):
                fp = os.path.join(root, fn)
                sz = os.path.getsize(fp)
                results.append(f"  {sz:>10} bytes  {fp}")

# Also look for any .json files that might contain conversation data
# (like settings with saved conversations)
print("=== JSONL files found ===")
if results:
    for r in results:
        print(r)
else:
    print("  No .jsonl files found")

# Now parse each JSONL file and extract conversation summaries
print("\n=== Conversation summaries ===")
for search_dir in search_dirs:
    if not os.path.isdir(search_dir):
        continue
    for root, dirs, files in os.walk(search_dir):
        for fn in files:
            if fn.endswith('.jsonl'):
                fp = os.path.join(root, fn)
                lines_data = []
                try:
                    with open(fp, 'r', errors='replace') as f:
                        for line in f:
                            line = line.strip()
                            if not line:
                                continue
                            try:
                                obj = json.loads(line)
                                lines_data.append(obj)
                            except:
                                pass
                    if lines_data:
                        # Extract conversation info
                        cwd = None
                        entrypoint = None
                        version = None
                        user_msgs = []
                        assistant_msgs = []
                        errors = []
                        timestamps = []
                        for obj in lines_data:
                            if 'cwd' in obj:
                                cwd = obj['cwd']
                            if 'entrypoint' in obj:
                                entrypoint = obj['entrypoint']
                            if 'version' in obj:
                                version = obj['version']
                            if 'timestamp' in obj:
                                timestamps.append(obj['timestamp'])
                            if obj.get('type') == 'user':
                                content = obj.get('message', {}).get('content', [])
                                if isinstance(content, list):
                                    for c in content:
                                        if c.get('type') == 'text':
                                            user_msgs.append(c['text'])
                                elif isinstance(content, str):
                                    user_msgs.append(content)
                            if obj.get('type') == 'assistant':
                                content = obj.get('message', {}).get('content', [])
                                if isinstance(content, list):
                                    for c in content:
                                        if c.get('type') == 'text':
                                            assistant_msgs.append(c['text'])
                                elif isinstance(content, str):
                                    assistant_msgs.append(content)
                            if obj.get('error'):
                                errors.append(obj.get('error'))

                        print(f"\n--- {fp} ---")
                        print(f"  Size: {os.path.getsize(fp)} bytes, Lines: {len(lines_data)}")
                        if cwd: print(f"  Project: {cwd}")
                        if entrypoint: print(f"  Entrypoint: {entrypoint}")
                        if version: print(f"  Version: {version}")
                        if timestamps: print(f"  First: {timestamps[0]}, Last: {timestamps[-1]}")
                        print(f"  User messages ({len(user_msgs)}):")
                        for msg in user_msgs:
                            print(f"    -> {msg[:200]}")
                        print(f"  Assistant messages ({len(assistant_msgs)}):")
                        for msg in assistant_msgs:
                            print(f"    -> {msg[:200]}")
                        if errors:
                            print(f"  Errors ({len(errors)}):")
                            for err in errors:
                                print(f"    -> {str(err)[:200]}")
                except Exception as e:
                    print(f"  Error reading {fp}: {e}")
