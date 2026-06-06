# Mobile Information Density & Compact Layout Checklist

Date: 2026-05-04
Status: mandatory-checklist-for-mobile-ui-qa
Prepared-by: Rangga / BMAD-lite orchestration
Related:
- `docs/bmad/checklists/playwright-screenshot-readiness-gate.md`
- `docs/bmad/checklists/admin-desa-zero-bug-readiness-checklist.md`

## Purpose

Prevent mobile UI from becoming too long, too repetitive, too card-heavy, or visually exhausting.

This checklist is mandatory for every BMAD task that changes mobile UI, especially Admin Desa, internal admin, profile, forms, list/table, document, notification, and dashboard-like pages.

The goal is not only to avoid broken layout, but also to make mobile pages efficient, scannable, and comfortable to use.

## Non-negotiable mobile rule

A mobile screenshot must not be marked `PASS` if the page is technically loaded but:

- content is too dense without hierarchy,
- too many cards are stacked one-per-row when compact layout is possible,
- user must scroll excessively before seeing primary action/status,
- important actions are buried far below the fold,
- repeated labels consume too much vertical space,
- card padding is too large for small screens,
- long explanatory copy appears in full when a summary/accordion would be better,
- layout causes visual fatigue or eye strain,
- mobile view has no clear scan path.

If any of these are found, classify it as:

```text
FAILED_DENSITY
```

The developer must simplify or compact the layout before handoff unless Owner explicitly accepts the tradeoff.

---

# A. Mobile density principles

## A1 — Prioritize above-the-fold clarity

On mobile, the first screen should show:

- page title/status,
- key role/status indicator,
- primary action or next step,
- concise summary of what matters now.

Avoid pushing the primary action far below long copy or large decorative cards.

## A2 — Use compact summaries before full detail

For mobile, prefer:

- summary rows,
- compact chips,
- inline metadata,
- collapsible details,
- accordions,
- progressive disclosure,
- horizontal scroll tabs where useful.

Avoid showing every detail at full card size by default.

## A3 — Avoid one-card-per-line when compact grouping is better

If multiple small metrics/statuses exist, do not always stack them vertically.

Examples:

- 2 compact metric cards can sit in one row on 360px if each is short.
- 3–4 small chips can wrap in compact rows.
- Status counts can be shown as compact pills instead of separate full cards.
- Repeated metadata can be shown in a small grid or definition list.

Bad mobile pattern:

```text
[Full card: Status]
[Full card: Role]
[Full card: Renewal]
[Full card: Desa]
```

Better mobile pattern:

```text
[Status chip] [Role chip]
[Renewal mini stat] [Desa mini stat]
```

## A4 — Keep card padding responsive

Desktop cards may use generous spacing. Mobile cards should use tighter padding.

Recommended guideline:

```text
Desktop card padding: 24–32px
Mobile card padding: 14–18px
Small mobile / iPhone 12 mini: 12–16px
```

Do not use large `p-7`, `p-8`, or oversized vertical gaps on iPhone 12 mini unless the content truly needs it.

## A5 — Reduce repeated labels

On mobile, avoid repeating long labels in every card when context is already clear.

Instead of:

```text
Status keanggotaan: VERIFIED
Status dokumen: PROCESSING
Status approval: Menunggu
```

Prefer:

```text
VERIFIED · PROCESSING · Menunggu approval
```

Only expand labels when needed for clarity or accessibility.

## A6 — Long copy should be summarized

If helper text is long, use:

- short summary visible by default,
- “Lihat detail” accordion,
- info popover,
- tooltip/help panel,
- expandable FAQ.

Do not put long paragraphs above primary forms or actions on small mobile screens.

## A7 — Tables/lists need mobile-specific layout

Desktop tables should not simply become giant stacked cards by default.

For mobile lists, prefer:

- most important fields first,
- secondary metadata in one compact line,
- actions in compact row or overflow menu,
- details behind expand/collapse,
- status chips instead of full status blocks.

## A8 — Actions must remain easy but compact

Primary action should be visible and tappable.

Secondary actions may be:

- icon buttons with labels when needed,
- overflow menu,
- collapsed under “Lainnya”,
- placed under detail expansion.

Do not show 4 full-width buttons stacked if 1 primary + compact secondary row is sufficient.

---

# B. Mandatory mobile viewport checks

Every changed UI surface must be checked on:

```text
390 x 844 mobile baseline
360 x 780 or 375 x 812 iPhone 12 mini / small-mobile class
```

For each page, check:

- is primary status visible quickly?
- is the main action above or near the first fold?
- are cards too tall?
- are too many full cards stacked?
- can repeated information be compacted?
- can long helper text be collapsed?
- are tabs/buttons cramped?
- does the user need excessive scrolling to understand the page?

If answer suggests poor density, fix before handoff.

---

# C. Recommended compact patterns

## C1 — Compact role/status header

For profile/admin pages:

- show avatar/badge,
- status chip,
- desa name,
- one primary CTA,
- renewal/status mini info.

Avoid huge hero blocks that consume the entire first mobile screen.

## C2 — Compact metric cluster

Use 2-column mini cards only for short values.

Example:

```text
[Status: VERIFIED] [Renewal: 28 hari]
[Dokumen: 3]       [Notifikasi: 2]
```

If values are long, use rows instead.

## C3 — Collapsible detail sections

Good candidates for accordion/collapse:

- permissions explanation,
- renewal explanation,
- rejection instructions,
- upload policy details,
- audit metadata,
- long document reason/history.

## C4 — Compact document card

Mobile document card should show by default:

- title,
- status chip,
- uploaded date,
- uploader or role,
- primary action.

Move these to expanded details:

- long file name,
- full storage metadata,
- long failed reason,
- audit notes,
- secondary metadata.

## C5 — Compact notification item

Notification item should show:

- title,
- short body preview,
- timestamp,
- read/unread state.

Avoid large cards for every notification unless content is critical.

## C6 — Compact internal admin queue

Internal admin queues on mobile should use:

- filters as scrollable chips,
- compact row/card hybrid,
- status and priority chips,
- expandable details,
- primary action visible,
- secondary actions collapsed.

Do not render desktop-like full detail cards for every queue item on mobile.

---

# D. Visual QA classification

Add this classification to visual QA reports:

```text
VALID
FAILED_READINESS
FAILED_LAYOUT
FAILED_DENSITY
FAILED_BUG
SKIPPED_ENV_MISSING
SKIPPED_DATA_MISSING
SKIPPED_NOT_IMPLEMENTED
```

`FAILED_DENSITY` means:

- layout is not broken technically,
- but mobile UX is inefficient, too long, too dense, too repetitive, or visually tiring.

A task cannot be marked clean `PASS` if core mobile screenshots are `FAILED_DENSITY`.

---

# E. Required report section

Every visual QA report must include:

```text
Mobile information density:
- mobile baseline checked: yes/no
- iPhone 12 mini / small-mobile checked: yes/no
- first-screen primary status/action visible: yes/no
- excessive scroll detected: yes/no
- cards too tall or too repetitive: yes/no
- compact grouping considered: yes/no
- accordions/progressive disclosure considered: yes/no
- cramped/overloaded areas fixed before handoff: yes/no
- remaining density issues:
```

If any key answer is negative, mark status as `PASS WITH NOTES`, `PARTIAL_PASS`, or `REWORK REQUIRED`.

---

# F. Fix-before-handoff rule

If QA finds a mobile density issue that is clearly fixable within current task scope, the developer must fix it before marking the task as PASS.

Examples that must be fixed immediately:

- large cards stacked one-per-line when compact grouping is obvious,
- excessive vertical padding causing long scroll,
- primary action hidden below repeated info,
- action buttons stacked too tall,
- long helper text blocking the form,
- mobile tabs consuming too much height,
- notification/document list visually exhausting.

Only defer if:

- the fix requires a larger product redesign,
- owner explicitly accepts the limitation,
- the issue is outside the touched scope.

Deferred density issues must be listed clearly in the handoff report.

---

# G. Final rule

Mobile UI must be judged by both:

```text
1. correctness: does it work?
2. density: is it efficient and comfortable to use on a small phone?
```

A mobile page that technically works but feels exhausting, overly long, or unnecessarily repetitive is not a clean PASS.
