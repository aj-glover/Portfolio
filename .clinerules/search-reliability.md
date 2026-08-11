# Search Reliability

When working with the codebase, the current workspace files are the source of truth.

## Search
- Never assume a function, variable, class, selector, component, or code pattern exists.
- Prefer exact literal searches over regex.
- Keep search patterns short and distinctive.
- Never search for an entire code block.
- Do not construct a search pattern from previously remembered code.

## If a Search Returns 0 Results
- Do not immediately retry with another guessed pattern.
- Read the relevant file and inspect its actual contents.
- Find the target by reading the current implementation.
- If another search is necessary, use exact text copied from the current file.
- Do not repeatedly retry failed searches.

## Before Editing
- Read the current file before modifying it.
- Base edits only on code that actually exists in the workspace.
- Never recreate an older version of the code from memory.
- Make the smallest change necessary.
- Do not modify unrelated working code.

## Verification
- After making an edit, inspect the changed section.
- Confirm the requested change actually exists before continuing.

## Failure Handling
If two searches fail to locate the target:
1. Stop searching.
2. Inspect the relevant file directly.
3. Explain what was found.
4. Only then continue with the task.