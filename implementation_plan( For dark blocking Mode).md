# Stabilizing Dashboard UI and Fixing "Unclickable" Overlays

## Problem Analysis
The user reported that after logging in, the system sometimes becomes completely unclickable and "greyed out." This is caused by two overlapping issues:
1. **Stacking Context Traps**: The `DashboardPage` has a CSS animation (`animate-in`) on its root element, which creates a new CSS stacking context. When the user opens the "New Broadcast" modal (or any other modal inside the page), its `fixed inset-0` backdrop is trapped inside this context. If the page is scrolled, the modal form may render off-screen while the grey backdrop covers the scrollable area, making the system unclickable and giving the illusion of a frozen app.
2. **Theme Conflicts**: The `SettingsPage` allows toggling Dark Mode, which adds `.dark` to the HTML tag. However, `DashboardPage` and `Header` use hardcoded light-theme colors (e.g., `bg-white`, `text-[#1e293b]`). When dark mode is active, the layout backgrounds turn dark while the components stay bright, resulting in a broken, greyed-out appearance that persists across logins because it is saved in `localStorage`.

## Proposed Changes

### 1. Fix Modal Stacking Contexts (Portals)
We will update `DashboardPage.tsx` to render its modals using React's `createPortal`. This ensures the modal backdrop and content are mounted directly to `document.body`, breaking them out of any local stacking contexts and ensuring they are always centered in the viewport and properly overlay the entire application (including the Header and Sidebar).

#### [MODIFY] `d:\Suraksha - Web App\frontend\src\pages\DashboardPage.tsx`
- Import `createPortal` from `react-dom`.
- Wrap the `isAlertModalOpen` overlay and form inside `createPortal(..., document.body)`.
- Ensure `z-[9999]` is used for the portal to sit on top of everything.

### 2. Enforce Theme Consistency
To prevent the application from looking broken when a user accidentally triggers dark mode, we will remove the dark mode toggle and enforce light mode.

#### [MODIFY] `d:\Suraksha - Web App\frontend\src\pages\SettingsPage.tsx`
- Remove the Dark Mode toggle logic from Settings.
- On mount of the app, ensure the `dark` class is stripped if it exists from previous sessions, guaranteeing a consistent Command-Room aesthetic.

#### [MODIFY] `d:\Suraksha - Web App\frontend\src\App.tsx`
- Add a `useEffect` to the root `App` component to remove the `dark` class from `document.documentElement`, fixing the persistent state bug.

## Verification Plan
1. Check that the UI is no longer "greyed out" by verifying the CSS classes.
2. Click "New Broadcast" to verify the modal appears perfectly in the center of the screen, covering the Header and Sidebar, and is fully clickable.
