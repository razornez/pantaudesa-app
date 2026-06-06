# Playwright Screenshot Readiness Gate

Date: 2026-05-04
Status: mandatory-checklist-for-ui-qa-and-screenshot-evidence
Prepared-by: Rangga / BMAD-lite orchestration
Related:
- `docs/bmad/checklists/admin-desa-zero-bug-readiness-checklist.md`
- `docs/bmad/reports/sprint-04-008-regression-fix-report.md`
- `docs/bmad/reports/sprint-04-008-final-visual-qa-report.md`

## Purpose

Prevent invalid QA screenshots where the captured page is still loading, stuck on shimmer/skeleton, redirected to login, or showing the wrong role/page.

This checklist is mandatory for every BMAD task that requires browser QA, Playwright screenshots, visual QA, or desktop/mobile screenshot evidence.

Screenshots are not valid proof unless the page is authenticated, on the correct route, fully loaded, and showing role-specific content.

## Non-negotiable rule

A screenshot must not be counted as valid QA evidence if it shows:

- login page after authenticated role is expected,
- loading shimmer/skeleton,
- `aria-busy="true"`,
- generic loading text such as `Memuat`,
- wrong route,
- wrong role state,
- missing role-specific content,
- blank page,
- error fallback without being explicitly marked as an error-state screenshot,
- mobile layout that is visually broken, cramped, overlapping, clipped, or difficult to use.

If any of these appear, the screenshot must be marked as `FAILED_READINESS`, `FAILED_LAYOUT`, or `SKIPPED`, not `PASS`.

If visual QA finds a layout issue that is clearly fixable within the task scope, the developer must fix it before handoff instead of only documenting it as a note.

---

# A. Required Playwright helper behavior

Every Playwright visual QA flow should use a shared helper such as:

```ts
await assertAuthenticated(page);
await waitForNoLoadingState(page);
await waitForRouteReady(page, /\/profil/);
await waitForRoleContent(page, "ADMIN_VERIFIED");
await safeScreenshot(page, "verified-admin-profile-desktop.png");
```

Recommended helper functions:

- `loginAsQaUser(roleOrEmail)`
- `assertAuthenticated(page)`
- `waitForNoLoadingState(page)`
- `waitForRouteReady(page, expectedUrlPattern)`
- `waitForRoleContent(page, roleOrPage)`
- `assertLayoutUsable(page, viewportName)`
- `safeScreenshot(page, screenshotPath, options)`

## A1 — `assertAuthenticated(page)`

Must verify:

- current URL is not `/login`,
- navbar account link exists,
- account link text/name/avatar is visible,
- page does not show primary unauthenticated CTA such as `Masuk`,
- authenticated route does not bounce back to login after a short wait.

Recommended stable marker:

```html
<a data-testid="navbar-account-link" href="/profil">...</a>
```

## A2 — `waitForNoLoadingState(page)`

Must wait until there is no:

- `[aria-busy="true"]`,
- skeleton class/element,
- shimmer class/element,
- `data-loading="true"`,
- visible text `Memuat`,
- visible text `Loading`,
- global loading overlay.

Suggested check:

```ts
await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
await expect(page.getByText(/Memuat|Loading/i)).toHaveCount(0);
```

If loading does not disappear within timeout, capture debug screenshot only.

## A3 — `waitForRouteReady(page, expectedUrlPattern)`

Must verify:

- final URL matches expected route,
- there is no redirect loop,
- route is not a legacy route unless the test intentionally checks redirect,
- route is not `/login` for authenticated scenarios.

Example:

```ts
await expect(page).toHaveURL(/\/profil\/admin-desa/);
await expect(page).not.toHaveURL(/\/login/);
```

## A4 — `waitForRoleContent(page, roleOrPage)`

Must wait for content unique to that role/page.

Recommended markers:

```html
<div data-testid="admin-desa-shell">...</div>
<div data-testid="internal-admin-shell">...</div>
<div data-testid="claim-status-card">...</div>
<form data-testid="document-upload-form">...</form>
<div data-testid="document-list">...</div>
<div data-testid="notification-tab">...</div>
<div data-testid="source-indicator">...</div>
```

Role-specific readiness examples:

### User biasa

Must verify:

- profile page visible,
- account navbar visible,
- Admin Desa tabs are not visible,
- internal admin links are not visible.

### Applicant `PENDING`

Must verify:

- claim status card visible,
- `PENDING` state visible,
- next-step copy visible.

### Applicant `IN_REVIEW`

Must verify:

- claim status card visible,
- `IN_REVIEW` or waiting-review copy visible,
- user is not redirected to login.

### Applicant `REJECTED`

Must verify:

- rejection reason visible,
- fix instruction visible,
- Hubungi Admin Pengajuan Admin Desa route/form visible where applicable.

### Admin Desa `VERIFIED`

Must verify:

- Admin Desa shell visible,
- badge `VERIFIED` visible,
- tabs visible:
  - Profil,
  - List Admin,
  - Dokumen,
  - Suara,
  - Notifikasi.

### Admin Desa `LIMITED`

Must verify:

- badge `LIMITED` visible,
- only allowed tabs/actions visible,
- invite/revoke/publish actions are hidden or blocked.

### Internal admin

Must verify:

- internal admin shell visible,
- Admin Desa review area visible,
- Dokumen Desa review area visible,
- renewal area visible where implemented,
- user is not redirected to login.

### Public desa page

Must verify:

- desa name visible,
- main detail content visible,
- source indicator visible only when expected,
- source indicator absent when no published source exists.

## A5 — `assertLayoutUsable(page, viewportName)`

Must verify the layout is not only loaded, but also usable.

At minimum, check:

- no horizontal overflow on the page/body,
- no important button or tab is clipped off-screen,
- no card/header/action row overlaps another element,
- critical CTAs remain tappable on mobile,
- tab navigation can scroll horizontally when needed,
- forms have enough spacing between fields,
- long Indonesian copy wraps cleanly,
- modals/popovers fit inside the viewport,
- sticky/fixed elements do not cover primary content,
- text is readable without zooming,
- safe tap target size is respected where practical.

Suggested horizontal overflow check:

```ts
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
expect(overflow).toBe(false);
```

If a layout issue is found, classify the screenshot as `FAILED_LAYOUT`, fix the UI, then rerun the screenshot.

---

# B. `safeScreenshot` contract

`safeScreenshot` must not silently save a misleading screenshot.

Before saving a final screenshot, it must verify:

1. authenticated state is correct,
2. route is correct,
3. loading state is gone,
4. role/page marker is visible,
5. layout is usable for the current viewport,
6. no blocking error is visible unless the screenshot is explicitly for an error state.

If readiness fails:

- do not save the screenshot as final evidence,
- save a debug screenshot instead using prefix `debug-failed-readiness-`,
- record current URL,
- record page title,
- record role/email used,
- record visible error/loading text,
- mark the case as `FAILED_READINESS` or `SKIPPED` in the QA report.

If layout usability fails:

- do not mark the screenshot as valid,
- save a debug screenshot using prefix `debug-failed-layout-`,
- fix the layout if the issue is within the task scope,
- rerun the desktop/mobile screenshot after the fix,
- mark the case as `FAILED_LAYOUT` until fixed.

Example debug filename:

```text
debug-failed-readiness-verified-admin-profile-desktop.png
debug-failed-layout-verified-admin-profile-iphone12mini.png
```

Final screenshot filename examples:

```text
verified-admin-profile-desktop.png
verified-admin-profile-mobile.png
verified-admin-profile-iphone12mini.png
internal-admin-dokumen-desa-desktop.png
notification-tab-mobile.png
```

---

# C. Screenshot evidence classification

Every screenshot in the QA report must be classified as one of:

```text
VALID
DEBUG_FAILED_READINESS
FAILED_LAYOUT
SKIPPED_ENV_MISSING
SKIPPED_DATA_MISSING
SKIPPED_NOT_IMPLEMENTED
FAILED_BUG
```

Meaning:

- `VALID`: correct role, route, page, loaded content, and usable layout.
- `DEBUG_FAILED_READINESS`: captured only for debugging readiness failure.
- `FAILED_LAYOUT`: content loaded, but layout is cramped, clipped, overlapping, or not usable.
- `SKIPPED_ENV_MISSING`: required env/storage/email/API not configured.
- `SKIPPED_DATA_MISSING`: required seed/test data unavailable.
- `SKIPPED_NOT_IMPLEMENTED`: feature intentionally not implemented yet.
- `FAILED_BUG`: real product bug found.

A task cannot be marked clean `PASS` if core screenshots are `DEBUG_FAILED_READINESS`, `FAILED_LAYOUT`, or `FAILED_BUG`.

---

# D. Required viewport coverage

For every changed UI surface, capture and verify at least these viewports:

```text
Desktop: 1440 x 900 or close
Mobile baseline: 390 x 844 or close
Small mobile / iPhone 12 mini class: 360 x 780 or 375 x 812
```

The iPhone 12 mini / small-mobile viewport is mandatory for Admin Desa, internal admin, form-heavy pages, tab navigation, cards, modals, upload UI, and notification screens.

If the layout is cramped on iPhone 12 mini class screens, the developer must fix it before marking the task PASS. Do not downgrade it to a cosmetic note unless Owner explicitly accepts the limitation.

Recommended Playwright projects:

```ts
{
  name: "desktop-chrome",
  use: { viewport: { width: 1440, height: 900 } },
},
{
  name: "mobile-390",
  use: { viewport: { width: 390, height: 844 }, isMobile: true },
},
{
  name: "iphone-12-mini",
  use: { viewport: { width: 360, height: 780 }, isMobile: true },
}
```

---

# E. Required screenshot inventory for Admin Desa / internal admin UI

For every Sprint 04-008 or Admin Desa-related UI change, capture desktop, mobile baseline, and iPhone 12 mini/small-mobile screenshots where applicable.

Minimum inventory:

## E1 — Navbar and routing

- navbar after login as internal admin,
- navbar after login as applicant pending,
- navbar after login as admin verified,
- navbar after login as admin limited,
- `/desa-admin` legacy redirect result,
- `/desa-admin/profil` legacy redirect result.

## E2 — Claim/applicant flow

- claim status `PENDING`,
- claim status `IN_REVIEW`,
- claim status `REJECTED` with reason,
- Hubungi Admin Pengajuan Admin Desa form,
- support submission success/error state.

## E3 — Admin Desa profile

- Admin Desa `VERIFIED` profile shell,
- Admin Desa `LIMITED` profile shell,
- badge popover `VERIFIED`,
- badge popover `LIMITED`,
- tab navigation desktop/mobile/small-mobile.

## E4 — List Admin

- List Admin verified view,
- invite modal,
- duplicate invite validation,
- revoke limited modal,
- revoked/history state where available.

## E5 — Dokumen Admin Desa

- Dokumen tab as `LIMITED`,
- Dokumen tab as `VERIFIED`,
- upload form,
- multi-file upload state,
- invalid MIME error,
- too-large error,
- too-many-files error,
- waiting verified approval state,
- processing state,
- published state,
- failed state with reason,
- preview signed URL flow,
- storage not configured error if applicable.

## E6 — Internal admin

- internal admin shell,
- Admin Desa review queue,
- claim detail/review,
- approve claim,
- reject claim,
- renewal queue,
- renewal approve/reject,
- Dokumen Desa queue,
- document preview,
- manual mapping draft,
- publish document,
- mark failed.

## E7 — Suara and notifications

- Admin Desa Suara tab,
- Admin Desa Notifikasi tab,
- notification mark-read state,
- notification empty state.

## E8 — Public page

- public desa page with source indicator,
- public desa page without source indicator.

---

# F. Required report section

Every visual QA handoff must include this section:

```text
Screenshot readiness:
- shared readiness helper used: yes/no
- auth state checked before screenshot: yes/no
- no-loading gate checked before screenshot: yes/no
- route readiness checked before screenshot: yes/no
- role/page marker checked before screenshot: yes/no
- layout usability checked before screenshot: yes/no
- desktop viewport checked: yes/no
- mobile 390 viewport checked: yes/no
- iPhone 12 mini / small-mobile viewport checked: yes/no
- screenshots showing login page counted as valid: no
- screenshots showing shimmer/loading counted as valid: no
- screenshots with cramped/overlapping layout counted as valid: no
- debug failed-readiness screenshots captured: yes/no
- debug failed-layout screenshots captured: yes/no
- layout issues fixed before handoff: yes/no
- skipped screenshots and reasons:
- known screenshot gaps:
```

If any answer is `no`, the report must explain why and mark the QA status as `PASS WITH NOTES`, `PARTIAL_PASS`, or `REWORK REQUIRED`.

---

# G. Recommended Playwright storage state

To avoid screenshotting login pages, prefer authenticated storage state per role:

```text
playwright/.auth/internal-admin.json
playwright/.auth/admin-verified.json
playwright/.auth/admin-limited.json
playwright/.auth/pending-user.json
playwright/.auth/warga.json
```

Each role storage state must be validated before reuse:

- visit `/profil`,
- assert not login,
- assert navbar account link visible,
- assert expected role marker or profile state visible.

If storage state is expired, recreate it before screenshot tests.

---

# H. Final rule

A screenshot is evidence only when it proves all three:

```text
1. the correct user is authenticated,
2. the correct route/page is loaded,
3. the correct role-specific content is visible.
```

For visual QA, it must also prove:

```text
4. the layout is usable on desktop, mobile baseline, and iPhone 12 mini / small-mobile viewport.
```

If it does not prove those things, it is only a debug artifact, not QA evidence.
