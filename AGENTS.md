<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Codebase Conventions

- **Stripping sensitive fields from API responses**: Use `{ ...obj, field: undefined }` spread with `undefined` override — `JSON.stringify` drops `undefined` keys, and it avoids `@typescript-eslint/no-unused-vars` lint errors.
- **Blocked user filtering**: Use `getUserBlockedIds(user.id)` from `src/lib/blocks.ts`.
- **Touch targets**: Icon-only buttons must use `p-2.5` minimum (10px padding + ~24px icon = 44px min per Apple HIG). Button variants: `sm: py-2.5`, `md: py-3`.
- **Mobile modals**: Every BottomSheet must support Escape key dismissal, backdrop tap, and swipe-down.
- **Lint pre-existing warnings** (6 total, do not touch): missing deps in useEffect/useCallback (haptic, loadVenues, stopMedia) and missing alt-text on DM media image.
<!-- END:nextjs-agent-rules -->
