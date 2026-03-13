1. **Add ARIA Labels to Inputs missing it**: I noticed `ChatPage.tsx` and `SessionSidebar.tsx` have `input` elements for renaming chats and sessions that do not have `aria-label`s. This is an accessibility issue because screen readers won't know what these inputs are for.

I'll add `aria-label="Rename conversation"` to `rag-demo/src/components/Chat/ChatPage.tsx` at line 134, and to `rag-demo/src/components/Chat/SessionSidebar.tsx` at line 43.

2. **Verify Changes**: I will run `pnpm lint` and `pnpm test` in `rag-demo` to ensure I didn't break anything. I'll also check `pnpm build` to ensure the project still builds.

3. **Pre-commit Checks**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

4. **Submit PR**: I'll create a PR using the `submit` tool with title "🎨 Palette: Add aria-label to rename inputs for better accessibility".
