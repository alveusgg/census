/*
 * Editor cursor sprites keyed by hex color. Lives in a separate module
 * because the bracketed-with-hash keys (e.g. ['editor-#5383E3']) confuse
 * the ts-morph parser used by `pnpm dlx shadcn add`. Keeping them out of
 * tailwind.config.mjs lets the shadcn CLI safely modify the main config.
 */
const editorCursors = ['5383E3', 'CB5DE7', 'E15D5D', 'E79446', '9FB035', '37AD6D', '39A0B6'];

export const cursors = Object.fromEntries(
  editorCursors.map(hex => [`editor-#${hex}`, `url('/editor-cursor-${hex}.svg') 8 6, pointer`])
);
