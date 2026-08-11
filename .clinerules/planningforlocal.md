# LOCAL MODEL EDITING RULES

## File Editing

The Act model must NOT use large SEARCH/REPLACE blocks.

Before modifying a file:
1. Read the exact current contents of the relevant section.
2. Make the smallest possible edit.
3. Never reconstruct a large section of a file from memory.
4. Never assume formatting, whitespace, indentation, quotes, commas, or line breaks.
5. Never create a SEARCH block from an earlier version of the file.
6. If exact content cannot be confirmed, read the file again.

## SEARCH/REPLACE Safety

If SEARCH/REPLACE is unavoidable:
- SEARCH must be copied exactly from the currently read file.
- Keep SEARCH blocks extremely small.
- Include only the minimum unique text needed to identify the edit.
- Never include an entire object, function, or file unless absolutely necessary.
- Do not modify whitespace unnecessarily.

If a SEARCH/REPLACE operation fails:
- DO NOT retry the same pattern.
- Re-read the relevant file section.
- Identify the exact current text.
- Use a smaller edit.
- If the tool continues failing, stop and report the exact mismatch.

## Minimal Changes

Only modify files explicitly required by the current task.

Do not:
- refactor unrelated code
- rename variables
- reformat files
- rewrite existing objects
- change working code
- "clean up" surrounding code
- invent missing content

## Plan vs Act

The Plan model is responsible for reasoning and architecture.

The Act model is responsible for execution.

When a plan exists:
- Follow it literally.
- Do not redesign the solution.
- Do not second-guess the architecture.
- Do not expand the scope.
- Do not perform additional improvements.

If the plan conflicts with the actual file:
STOP, inspect the actual file, and report the discrepancy.

## Verification

After every edit:
1. Re-read the changed section.
2. Confirm the requested change exists.
3. Confirm unrelated content was not changed.
4. Confirm syntax remains valid.