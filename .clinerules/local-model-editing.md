# Cline Rules — Local Model / LM Studio Editing

## Core Principle

Make the smallest safe change possible.

Local models can lose exact file context and frequently fail when generating large SEARCH/REPLACE blocks. Never compensate for a failed patch by generating an even larger or more detailed SEARCH block.

Prefer:

1. Read the current file.
2. Identify a short, unique anchor.
3. Make a minimal edit.
4. Re-read or inspect the changed area.
5. Verify the result.

---

## 1. ALWAYS READ THE CURRENT FILE

Before modifying an existing file:

* Read the current file from disk.
* Do not rely on code previously shown in conversation.
* Do not assume a file is unchanged since it was last read.
* If an edit fails, re-read the file before attempting another edit.

Never construct a SEARCH block from memory.

---

## 2. NEVER REPEAT A FAILED SEARCH/REPLACE

If a SEARCH/REPLACE operation fails:

DO NOT:

* Repeat the same SEARCH block.
* Make the SEARCH block longer.
* Reconstruct the entire function.
* Guess at whitespace.
* Guess at indentation.
* Assume the previous file contents were accurate.

INSTEAD:

1. Re-read the file.
2. Find the relevant code again.
3. Use a smaller search anchor.
4. Make the smallest possible replacement.
5. Verify the result.

Maximum: 2 attempts at an exact SEARCH/REPLACE operation.

After 2 failures, stop attempting increasingly complicated SEARCH blocks.

---

## 3. USE SHORT SEARCH ANCHORS

Prefer unique anchors such as:

```text
const promises = CATEGORIES.map
```

or:

```text
loader.load(
```

or:

```text
assets[category.id]
```

Do NOT create unnecessarily large SEARCH blocks containing entire functions.

Bad:

```text
const promises = CATEGORIES.map(category => {
    return new Promise((resolve) => {
        loader.load(
            category.planetModel,
            ...
            ...
            ...
        );
    });
});
```

Better:

```text
const promises = CATEGORIES.map
```

The goal is to locate the code, not reproduce the entire file.

---

## 4. DO NOT ASSUME WHITESPACE

Never assume that the file uses:

* a particular number of spaces
* tabs
* LF line endings
* CRLF line endings
* a particular blank-line pattern
* a particular brace style

Do not use whitespace as the primary matching strategy.

If an exact replacement depends on whitespace, re-read the file and choose a more stable anchor.

---

## 5. PREFER TARGETED EDITS

When modifying existing code, change only the lines necessary for the requested task.

Do not rewrite an entire function when one or two lines need changing.

Do not rewrite an entire file to fix a localized problem.

Do not reformat unrelated code.

Do not rename unrelated variables.

Do not "clean up" surrounding code unless explicitly requested.

---

## 6. NEVER RECONSTRUCT LARGE FILES FROM MEMORY

For files larger than approximately 150 lines:

* Do not reproduce the entire file in an edit operation.
* Read the relevant section.
* Modify only that section.
* Preserve everything else exactly.

For files larger than approximately 300 lines:

* Work section-by-section.
* Avoid whole-file replacements.
* Verify each modification before continuing.

---

## 7. USE CODE STRUCTURE AS AN ANCHOR

When possible, identify code using:

* function names
* variable names
* unique strings
* imports
* class names
* object properties
* distinctive comments

Examples:

```text
const promises =
```

```text
setupScene()
```

```text
category.planetModel
```

```text
assets[category.id]
```

These are preferable to matching large blocks of formatted code.

---

## 8. AFTER EVERY EDIT, VERIFY

After making an edit:

1. Re-read the changed section.
2. Confirm the intended change exists.
3. Confirm surrounding code is intact.
4. Check for syntax errors or obvious malformed structures.

For JavaScript/TypeScript projects, pay particular attention to:

* `{}` balance
* `()` balance
* `[]` balance
* commas
* semicolons where required
* imports
* exports
* function closures
* callback closures
* template literals

Do not assume a successful tool response means the code is correct.

---

## 9. DO NOT CHAIN MANY UNVERIFIED EDITS

Use this cycle:

```text
READ
↓
EDIT
↓
VERIFY
↓
NEXT EDIT
```

Do NOT do:

```text
EDIT
EDIT
EDIT
EDIT
EDIT
VERIFY EVERYTHING
```

If an early edit is wrong, subsequent edits can compound the problem.

---

## 10. KEEP EDIT OPERATIONS SMALL

For a normal coding task:

* Prefer 1–10 changed lines.
* Avoid changing more than one logical area at a time.
* Separate unrelated fixes.
* Verify each logical change.

If a change genuinely requires a larger rewrite, explain why before doing it.

---

## 11. DO NOT OVERTHINK PATCH FAILURES

When a patch fails, do not spend multiple attempts theorizing about:

* hidden characters
* indentation
* encoding
* line endings
* trailing spaces

First inspect the actual file.

The file on disk is authoritative.

---

## 12. IF SEARCH/REPLACE FAILS TWICE

Stop.

Do not attempt a third increasingly complicated SEARCH block.

Instead:

1. Read the file again.
2. Identify the smallest unique anchor.
3. Use another available editing method.
4. If no safe targeted editing method is available, report the exact blocker instead of repeatedly guessing.

Never burn tool calls repeatedly attempting the same failed operation.

---

## 13. PRESERVE USER CODE

Unless explicitly requested:

* Do not change unrelated code.
* Do not change formatting globally.
* Do not upgrade dependencies.
* Do not rename files.
* Do not rename variables.
* Do not restructure components.
* Do not change architecture.
* Do not replace working implementations with "cleaner" alternatives.

The requested change takes priority over refactoring.

---

## 14. MINIMIZE CONTEXT

When working with a local model:

* Read only the files necessary for the current task.
* Avoid loading huge unrelated files into context.
* Avoid repeatedly pasting entire files into prompts.
* Prefer focused code sections.
* Keep tool requests precise.

If a file is large, inspect the relevant region rather than repeatedly reading the entire file.

---

## 15. DEBUGGING WORKFLOW

When fixing a bug:

### Step 1 — Identify

Determine the exact file and relevant function.

### Step 2 — Read

Read the current implementation from disk.

### Step 3 — Diagnose

Explain the likely cause briefly.

### Step 4 — Patch

Make the smallest change that addresses the cause.

### Step 5 — Verify

Read the changed code.

### Step 6 — Test

Run the appropriate project command if available.

### Step 7 — Report

State:

* what changed
* what was verified
* whether anything remains unresolved

---

## 16. THREE-FAILURE RULE

If the same operation fails three times:

STOP modifying the code.

Do not continue blindly.

Instead:

* inspect the file again
* inspect the tool error
* determine whether the problem is the edit method, file state, or model output
* explain the blocker

Never enter an infinite retry loop.

---

## 17. JAVASCRIPT / THREE.JS PROJECTS

For Three.js code:

* Preserve existing scene architecture.
* Do not recreate working loaders unnecessarily.
* Do not replace working asset paths without evidence.
* Do not modify camera, renderer, lighting, animation, or asset loading code unless relevant to the task.
* Verify model-loading changes against the actual current implementation.
* Preserve asynchronous behavior unless the requested fix requires changing it.

For asset-loading code, prefer modifying one loader operation at a time.

---

## 18. WHEN THE USER PROVIDES CODE

User-provided code is contextual evidence, not necessarily the current file.

If the task requires modifying the project:

* Inspect the actual project file.
* Compare it with the supplied code.
* Treat the file on disk as authoritative.

Never assume the supplied snippet is byte-for-byte identical to the current file.

---

## 19. LOCAL MODEL SAFETY RULE

When uncertain, inspect instead of guessing.

The preferred behavior is:

```text
I need to verify the current file before editing.
```

not:

```text
I'll try another SEARCH block.
```

Accuracy is more important than minimizing one read operation.

---

## 20. COMPLETION CRITERIA

Do not declare a task complete merely because an edit command succeeded.

A task is complete only when:

* The intended code change exists.
* The surrounding code remains intact.
* No obvious syntax errors were introduced.
* The relevant application behavior has been tested when possible.
* No repeated failed patch attempts remain unresolved.

---

## FINAL RULE

For local models, reliability beats cleverness.

READ → SMALL EDIT → VERIFY.

Never:

READ → GUESS → HUGE SEARCH/REPLACE → FAIL → BIGGER SEARCH/REPLACE → FAIL → REPEAT.
