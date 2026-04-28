# ISSUE-001 Mobile Sidebar Plan

## Goal

Remove the authenticated shell's mobile width pressure by making the main menu behave like a mobile overlay while keeping the current desktop sidebar sizing and collapse behavior intact.

## Current State

- `src/layouts/Main.tsx` always renders `Menu`, `<main>`, and `Achievements` side by side inside a full-width flex shell.
- `src/layouts/sidebars/Menu.tsx` is a custom animated left rail driven by `useSidebar()` from `LayoutProvider`.
- On desktop it animates between `5rem` collapsed and `12.5rem` expanded width.
- `src/layouts/sidebars/Achievements.tsx` mounts a fixed right rail with animated container width and an inner `min-w-[15.5rem]` panel.
- `LayoutProvider` persists two booleans in local storage: `sidebar` and `achievements`.
- The repo already includes `shadcn` `sheet`, `drawer`, and `sidebar` primitives, plus a `useIsMobile()` hook with a `768px` breakpoint.

## Shell Audit Findings

- `src/layouts/Main.tsx:17` uses `w-screen h-svh ... overflow-clip`. The `h-svh` choice is reasonable for mobile browser chrome, but pairing it with shell-level clipping means any fixed child that is slightly oversized can get visibly cut off instead of naturally extending.
- `src/layouts/Main.tsx:17` only adds shell padding from `sm` upward, so there is no mobile inset to remove in code today. The plan should keep that behavior explicit and avoid introducing any mobile shell inset while preserving the current desktop `sm:*` padding.
- `src/layouts/Main.tsx:43` uses `overflow-y-scroll` on the main content region. This forces a dedicated scrolling container, which is fine for desktop, but on mobile it can combine poorly with full-height overlays if those overlays also manage their own scrolling.
- `src/layouts/sidebars/Achievements.tsx:62-66` pins the rail with `fixed ... right-2 top-2 bottom-2` on mobile and then places an absolutely positioned `min-w-[15.5rem] w-[15.5rem]` panel inside it. This explains the horizontal overflow pressure and also means the visible panel height is constrained by fixed insets instead of natural viewport sizing.
- `src/layouts/sidebars/Achievements.tsx:95` uses `overflow-y-scroll` inside the achievements list, creating a second forced scroll region inside an already fixed overlay.
- The shared `shadcn` `Sheet` implementation uses `fixed inset-y-0 ... h-full` and portals out of layout, which is a better fit for the mobile main menu because it avoids width reservation in the shell entirely.

## Proposed UX

### Desktop

- Keep the current shell behavior and dimensions:
- Left menu remains inline in the layout and collapses/expands from `5rem` to `12.5rem`.
- Right achievements rail keeps its current desktop behavior.
- Existing header trigger continues to toggle the left menu collapse state.

### Mobile

- Default the main content to full width.
- Replace the left rail with a left-side `Sheet`/mobile sidebar overlay.
- Open the mobile menu from the existing header trigger.
- Render the same navigation items inside the sheet, but in a simpler full-width stacked layout instead of the narrow collapsed desktop rail interaction.
- Keep the wordmark/logo block at the top of the mobile menu for continuity.
- Do not reserve horizontal space for the menu while closed.
- Remove the shell's small outer page padding on mobile so the main panel can use the full viewport edge-to-edge.
- Keep the existing shell padding and inset treatment on desktop.

### Achievements on Mobile

- Keep the current mobile achievements pattern where the level button reveals the panel over content rather than reserving layout width.
- Improve the mobile presentation so it better matches the menu changes:
- allow the slide-over panel to use a bit more practical width on small screens,
- make the close affordance clearer than the current edge-mounted level toggle alone,
- verify the panel does not start off-screen or feel clipped at common phone widths.
- Preserve the current desktop achievements rail behavior.

## Why This Is Better

- It solves the actual overflow mechanism: both fixed side rails stop competing for viewport width on phones.
- It preserves established desktop sizing and collapse behavior.
- It reuses existing `shadcn` primitives already present in the repo instead of extending the custom motion-based shell everywhere.
- It reduces mobile complexity by separating desktop collapse behavior from mobile navigation behavior.

## Implementation Approach

1. Add mobile awareness to the menu plumbing.
- Use `useIsMobile()` inside `Menu` and `MenuTrigger`.
- Keep `LayoutProvider` as the source of truth for desktop sidebar collapsed state.
- Add a local mobile open state near the menu component, or extend layout state with a dedicated `mobileMenuOpen` boolean if shared access is cleaner.

2. Split menu rendering into shared content plus two containers.
- Extract the repeated logo and nav items into a shared `MenuContent`/`MenuItems` internal component.
- Desktop container keeps the current `motion.nav` implementation and width animation.
- Mobile container uses `Sheet` with `side="left"` and no inline width reservation.

3. Update the trigger behavior.
- On desktop, the header trigger should keep toggling collapsed/expanded state.
- On mobile, the same trigger should open/close the sheet instead.
- Remove hover-delay assumptions from mobile-only interactions.

4. Prevent the shell from reserving side-rail width on mobile.
- Keep `Main.tsx` structure, but ensure only desktop menu and desktop achievements participate in the outer flex width.
- Mobile menu should portal out of flow via `Sheet`.
- Mobile achievements should continue to overlay content rather than consume layout width.

5. Tighten mobile header/content spacing if needed.
- After the rail removal, verify that `Header` and `Scrollable` paddings do not leave the mobile experience feeling over-indented.
- Only make minimal spacing adjustments if necessary.

6. Apply targeted mobile height adjustments based on the audit.
- Keep `Main.tsx` on `h-svh`; the bigger issue is fixed children and nested scroll containers, not the shell height token itself.
- Leave desktop fixed insets alone, but remove or relax the mobile-only `top-2 bottom-2 right-2` achievements positioning so the overlay can size more naturally within the viewport.
- Prefer a single obvious scroll container per mobile surface: the main content when overlays are closed, and the overlay body when a menu/panel is open.
- Where practical, switch mobile overlay internals from forced `overflow-y-scroll` to `overflow-y-auto` so short content does not show unnecessary scroll behavior.
- Keep desktop height behavior intact unless a shared fix is clearly safer.

## Suggested Component Shape

- `Main.tsx`
  - Continues to render `Menu`, main outlet, and `Achievements`.
  - Drops the shell's mobile-only outer padding while preserving the current desktop inset spacing.
  - `Menu` and `Achievements` each become responsive internally rather than forcing large layout changes here.

- `Menu.tsx`
  - `MenuTrigger`: responsive toggle logic.
  - `Menu`: chooses between `DesktopMenu` and `MobileMenu`.
  - `DesktopMenu`: current motion-based rail preserved.
  - `MobileMenu`: `Sheet` wrapper with shared content.
  - `MenuItems`: shared links, permissions-based items, footer actions.

- `Achievements.tsx`
  - Keep the existing desktop rail behavior.
  - Adjust the mobile overlay version to use more suitable width and a clearer explicit close control.
  - Replace the current mobile-only edge pinning approach with sizing that fits inside the viewport without starting off-screen.
  - Reduce nested forced scrolling on mobile where possible.

## Tradeoffs

- Using `Sheet` instead of the repo's `ui/sidebar` is the smaller change because the app already has custom sidebar state and desktop animation behavior that do not map cleanly onto the `SidebarProvider` contract.
- Replatforming fully onto `ui/sidebar` is possible later, but it is a broader refactor with more state migration risk and less value for this bug fix.
- Keeping achievements available on mobile avoids a behavior change, but it means the plan needs a small UX pass on width, close affordance, and viewport-height behavior.

## Verification Plan

1. Test `/` at widths below `768px`.
2. Confirm main content spans the viewport when menu and achievements are closed.
3. Open the mobile menu and confirm it overlays from the left without shifting content.
4. Confirm all current nav destinations still appear, including permission-gated items.
5. Open the achievements panel on mobile and confirm it slides over content cleanly, is wide enough to use comfortably, and has an obvious close action.
6. Verify no clipped content or bad scrolling with mobile browser chrome visible/hidden.
7. Confirm desktop widths and collapse/expand behavior remain unchanged above `768px`.
8. Confirm achievements rail still behaves as before on desktop.

## Recommendation

Implement the left menu as a mobile `Sheet`, keep the existing custom desktop menu unchanged, remove shell outer padding on mobile, and refine the existing mobile achievements overlay rather than removing it. That is the smallest change that fixes the width squeeze while preserving current desktop behavior.
