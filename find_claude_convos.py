import re, os, json

results = []

# 1. Search Chrome IndexedDB for claude.ai (web conversations)
ldb_dir = r'C:\Users\AJ\AppData\Local\Google\Chrome\User Data\Default\IndexedDB\https_claude.ai_0.indexeddb.leveldb'
if os.path.isdir(ldb_dir):
    for fn in sorted(os.listdir(ldb_dir)):
        fp = os.path.join(ldb_dir, fn)
        if not os.path.isfile(fp):
            continue
        with open(fp, 'rb') as f:
            data = f.read()
        # Extract all printable strings >= 8 chars
        strings = re.findall(rb'[\x20-\x7e]{8,}', data)
        relevant = []
        for s in strings:
            s_dec = s.decode('utf-8', errors='replace')
            low = s_dec.lower()
            if any(kw in low for kw in ['assistant', 'human', 'content', 'role', 'msg_', 'conv_', 'title', 'claude']):
                relevant.append(s_dec[:500])
        if relevant:
            results.append(f"=== Chrome IndexedDB: {fn} ({len(data)} bytes) ===")
            for line in relevant[:20]:
                results.append(f"  {line}")
            results.append("")

# 2. Search Claude Desktop Session Storage
ss_dir = r'C:\Users\AJ\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\Session Storage'
if os.path.isdir(ss_dir):
    for fn in sorted(os.listdir(ss_dir)):
        fp = os.path.join(ss_dir, fn)
        if not os.path.isfile(fp):
            continue
        with open(fp, 'rb') as f:
            data = f.read()
        strings = re.findall(rb'[\x20-\x7e]{8,}', data)
        relevant = []
        for s in strings:
            s_dec = s.decode('utf-8', errors='replace')
            low = s_dec.lower()
            if any(kw in low for kw in ['assistant', 'human', 'content', 'role', 'msg_', 'conv_', 'title', 'claude']):
                relevant.append(s_dec[:500])
        if relevant:
            results.append(f"=== Claude Desktop Session Storage: {fn} ({len(data)} bytes) ===")
            for line in relevant[:20]:
                results.append(f"  {line}")
            results.append("")

# 3. Search Temp\claude UUID directories for conversation files
temp_dirs = [
    r'C:\Users\AJ\AppData\Local\Temp\claude',
    r'C:\Users\AJ\AppData\Local\Temp\claude\C--Users-AJ',
    r'C:\Users\AJ\AppData\Local\Temp\claude\c--Users-AJ-Desktop-SHAKE-IT',
    r'C:\Users\AJ\AppData\Local\Temp\claude\c--Users-AJ-Downloads-3DGridContentPreview-main',
]
for td in temp_dirs:
    if os.path.isdir(td):
        for root, dirs, files in os.walk(td):
            for fn in files:
                fp = os.path.join(root, fn)
                try:
                    sz = os.path.getsize(fp)
                    if sz < 100 or sz > 2000000:
                        continue
                    with open(fp, 'rb') as f:
                        data = f.read()
                    text_ratio = sum(1 for b in data if 32 <= b <= 126 or b in (9, 10, 13)) / len(data)
                    if text_ratio > 0.7:
                        strings = re.findall(rb'[\x20-\x7e]{15,}', data)
                        relevant = [s.decode('utf-8', errors='replace')[:300] for s in strings
                                   if any(kw in s.decode('utf-8', errors='replace').lower()
                                   for kw in ['conversation', 'message', 'content', 'assistant', 'claude', 'title'])]
                        if relevant:
                            results.append(f"=== Temp: {fp} ({sz} bytes) ===")
                            for line in relevant[:5]:
                                results.append(f"  {line}")
                            results.append("")
                except:
                    pass

# 4. Search Claude Code VS Code workspace storage
vscode_storage = r'C:\Users\AJ\AppData\Roaming\Code\User\workspaceStorage'
if os.path.isdir(vscode_storage):
    for root, dirs, files in os.walk(vscode_storage):
        for fn in files:
            if 'claude' in fn.lower() or 'conversation' in fn.lower():
                fp = os.path.join(root, fn)
                try:
                    sz = os.path.getsize(fp)
                    if sz < 100 or sz > 2000000:
                        continue
                    with open(fp, 'rb') as f:
                        data = f.read()
                    strings = re.findall(rb'[\x20-\x7e]{15,}', data)
                    relevant = [s.decode('utf-8', errors='replace')[:300] for s in strings
                               if any(kw in s.decode('utf-8', errors='replace').lower()
                               for kw in ['conversation', 'message', 'content', 'assistant', 'title'])]
                    if relevant:
                        results.append(f"=== VS Code: {fp} ({sz} bytes) ===")
                        for line in relevant[:10]:
                            results.append(f"  {line}")
                        results.append("")
                except:
                    pass

# 5. Search Claude Desktop IndexedDB
claude_db = r'C:\Users\AJ\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\IndexedDB'
if os.path.isdir(claude_db):
    for root, dirs, files in os.walk(claude_db):
        for fn in files:
            if fn.endswith('.ldb'):
                fp = os.path.join(root, fn)
                try:
                    with open(fp, 'rb') as f:
                        data = f.read()
                    strings = re.findall(rb'[\x20-\x7e]{8,}', data)
                    relevant = []
                    for s in strings:
                        s_dec = s.decode('utf-8', errors='replace')
                        low = s_dec.lower()
                        if any(kw in low for kw in ['assistant', 'human', 'content', 'role', 'msg_', 'conv_', 'title']):
                            relevant.append(s_dec[:500])
                    if relevant:
                        results.append(f"=== Claude Desktop IndexedDB: {fn} ({len(data)} bytes) ===")
                        for line in relevant[:15]:
                            results.append(f"  {line}")
                        results.append("")
                except:
                    pass

# 6. Search main.log for conversation IDs or session info
log_path = r'C:\Users\AJ\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\logs\main.log'
if os.path.isfile(log_path):
    with open(log_path, 'r', errors='replace') as f:
        lines = f.readlines()
    conv_lines = [l.strip() for l in lines if any(kw in l.lower() for kw in ['conversation', 'conversation_id', 'chat_id', 'session', 'msg_', 'thread'])]
    if conv_lines:
        results.append(f"=== Claude Desktop main.log ({len(lines)} lines) ===")
        for line in conv_lines[:20]:
            results.append(f"  {line[:300]}")
        results.append("")

# 7. Search claude.ai-web.log for conversation references
web_log = r'C:\Users\AJ\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\logs\claude.ai-web.log'
if os.path.isfile(web_log):
    with open(web_log, 'r', errors='replace') as f:
        content = f.read()
    strings = re.findall(r'[\x20-\x7e]{15,}', content)
    relevant = [s[:300] for s in strings if any(kw in s.lower() for kw in ['conversation', 'message', 'title', 'session', 'thread'])]
    if relevant:
        results.append(f"=== Claude Desktop claude.ai-web.log ===")
        for line in relevant[:20]:
            results.append(f"  {line}")
        results.append("")

# Output results
if results:
    print('\n'.join(results))
else:
    print("No conversation-related content found.")
