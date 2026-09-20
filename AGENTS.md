<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
## File Editing Rule

Before modifying, creating, deleting, renaming, or moving any file:

1. Inspect the relevant existing files first.
2. Explain which files will be affected.
3. For each file, explain:
   - whether it will be created or modified
   - what will change
   - why the change is necessary
4. Explain any routing or component relationship changes.
5. Do not modify any file yet.
6. Wait for explicit user confirmation such as:
   "ยืนยัน"
   before making any file changes.

Preserve existing pages and components whenever possible.
Prefer extending and reusing existing code rather than recreating pages.
Do not perform large refactors unless explicitly requested.