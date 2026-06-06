# Back Office Quiet Luxury Design Standard

Date: 2026-05-04
Status: mandatory-checklist-for-back-office-ui
Prepared-by: Rangga / BMAD-lite orchestration
Related:
- `docs/bmad/checklists/playwright-screenshot-readiness-gate.md`
- `docs/bmad/checklists/mobile-information-density-checklist.md`
- `docs/bmad/checklists/inclusive-ui-ux-for-non-technical-users.md`
- `docs/bmad/checklists/admin-desa-zero-bug-readiness-checklist.md`
- `docs/bmad/reports/sprint-04-008-quiet-luxury-design-report.md`

## Purpose

Standardize PantauDesa back-office UI using the Quiet Luxury design language so Admin Desa, internal admin, and claim-related operational screens feel consistent, premium, calm, readable, and usable for non-technical users.

This checklist is mandatory for every BMAD task that changes back-office UI.

Back office includes:

- Admin Desa workspace,
- internal admin workspace,
- claim/admin application flow,
- document upload/review flow,
- notifications,
- support/admin-contact flow,
- loading/error/empty states related to those areas.

Public pages are intentionally out of scope unless the task explicitly says otherwise.

## Non-negotiable design rule

A back-office UI task must not be marked clean `PASS` if:

- Admin Desa and internal admin surfaces look visually inconsistent,
- internal admin still looks like an unstyled/default table or form,
- buttons/forms/cards/status pills use mixed design language,
- error/empty/loading states are left unstyled,
- mobile Quiet Luxury styling creates excessive scroll or cramped UI,
- styling makes the UI harder for older/non-technical users,
- visual hierarchy does not clearly show primary status and next action.

If any of these are found, mark as `REWORK_REQUIRED` or `PASS_WITH_UX_NOTES`, not clean `PASS`.

---

# A. Required Quiet Luxury language

Use the existing Quiet Luxury utilities when practical instead of creating duplicate ad-hoc styles.

Recommended existing utilities/classes:

```text
lux-panel
lux-card
glass
ring-hair
shadow-lux-1
shadow-lux-2
shadow-lux-hover
t-spring
lift
eyebrow
display
btn-lux
btn-lux-primary
btn-lux-secondary
btn-lux-ghost
btn-lux-success
btn-lux-danger
field-lux
select-lux
textarea-lux
notice-card
notice-info
notice-warn
notice-danger
notice-ok
metric-card
metric-label
metric-value
metric-note
pill-ok
pill-warn
pill-danger
pill-info
lux-status-good
lux-status-warn
lux-status-danger
progress-track
progress-fill
```

Use calm status colors:

- indigo for primary/admin workspace,
- emerald for success/approved/published,
- amber for pending/waiting/review needed,
- rose for rejected/failed/destructive,
- neutral slate/ink for secondary content.

## A1 — Component hierarchy

Back-office surfaces should use a consistent hierarchy:

1. page shell/header,
2. status or summary block,
3. primary action area,
4. list/queue/content area,
5. secondary detail/progressive disclosure.

Avoid putting long explanatory copy before the user understands the current status and next action.

## A2 — Button standards

Use consistent button intent:

```text
Primary action: btn-lux-primary
Positive/approve/publish: btn-lux-success
Secondary action: btn-lux-secondary
Low-emphasis action: btn-lux-ghost
Destructive/reject/revoke/failed: btn-lux-danger
```

Buttons must have clear Indonesian labels. Avoid vague labels such as `Action`, `Process`, or `Submit`.

## A3 — Form standards

Back-office forms should use:

```text
field-lux
select-lux
textarea-lux
field-label
notice-card
```

Forms must include:

- clear label,
- short helper text where needed,
- actionable error message,
- disabled/sending state,
- success state that explains next step.

## A4 — Status standards

Status should use text + color/icon/shape, not color alone.

Recommended paraphrased labels:

```text
PENDING -> Pengajuan dibuat
IN_REVIEW -> Sedang diperiksa
REJECTED -> Pengajuan ditolak
APPROVED -> Pengajuan disetujui
LIMITED -> Admin terbatas
VERIFIED -> Admin terverifikasi
WAITING_VERIFIED_APPROVAL -> Menunggu persetujuan admin utama
PROCESSING -> Sedang diproses PantauDesa
PUBLISHED -> Sudah dipublikasikan
FAILED -> Gagal diproses
```

Avoid raw enum names as primary user-facing labels.

## A5 — Card and panel standards

Use cards/panels to group related information, not to inflate every small fact.

Good uses:

- page summary,
- important status,
- document item,
- review queue item,
- notification item,
- destructive confirmation.

Avoid:

- one full card per tiny metric on mobile,
- repeated full cards with the same label pattern,
- excessive padding on iPhone 12 mini,
- long walls of text inside cards.

---

# B. Back-office surfaces that must be standardized

## B1 — Admin Desa workspace

Must follow Quiet Luxury design:

- `/profil/admin-desa/profil`,
- `/profil/admin-desa/list-admin`,
- `/profil/admin-desa/dokumen`,
- `/profil/admin-desa/suara`,
- `/profil/admin-desa/notifikasi`,
- badge and popover,
- tab navigation,
- invite modal,
- revoke modal,
- upload form,
- document cards,
- document status/error states,
- notification cards,
- empty/loading states.

## B2 — Internal admin workspace

Must follow Quiet Luxury design:

- internal admin shell/layout,
- Admin Desa review queue,
- claim detail/review,
- approve claim flow,
- reject claim flow,
- renewal queue,
- renewal approve/reject,
- Dokumen Desa review queue,
- document preview,
- manual mapping draft,
- publish document modal/form,
- mark failed modal/form,
- audit/status summaries,
- empty/loading/error states.

Internal admin must not look like unfinished developer tooling. It should be clear, calm, organized, and safe for operational review.

## B3 — Claim/admin application surfaces

Must follow Quiet Luxury design where back-office-adjacent:

- claim status cards,
- pending/in-review/rejected state,
- Hubungi Admin Pengajuan Admin Desa,
- OTP/email verification UI if visible,
- website verification UI if visible,
- rejection reason/fix instruction,
- support submission success/error state.

---

# C. Mobile Quiet Luxury rules

Quiet Luxury must remain compact on mobile.

For mobile baseline and iPhone 12 mini class:

- reduce card padding,
- compact repeated metrics,
- use chips/summary rows for small facts,
- use accordion/progressive disclosure for long details,
- keep primary action near the first screen,
- avoid oversized hero/header blocks,
- avoid one full-width card per tiny metric,
- avoid too many full-width buttons stacked vertically,
- ensure modals/popovers fit the viewport.

If Quiet Luxury styling makes mobile longer, heavier, or harder to scan, it must be simplified before handoff.

---

# D. Inclusive copy requirement

Quiet Luxury is not only visual. It must be paired with clear Indonesian copy.

For every back-office flow, verify:

- status is paraphrased for non-technical users,
- next step is visible,
- error message explains what user can do,
- destructive action explains consequence,
- helper text is short and calm,
- long technical explanation is collapsed or moved behind detail/help.

Use the checklist:

```text
docs/bmad/checklists/inclusive-ui-ux-for-non-technical-users.md
```

---

# E. Required QA and screenshot coverage

Back-office Quiet Luxury QA must capture:

```text
Desktop: 1440 x 900
Mobile baseline: 390 x 844
Small mobile / iPhone 12 mini class: 360 x 780 or 375 x 812
```

Screenshots must use the readiness gate:

```text
docs/bmad/checklists/playwright-screenshot-readiness-gate.md
```

Mobile density must use:

```text
docs/bmad/checklists/mobile-information-density-checklist.md
```

Screenshots showing login page, shimmer, wrong route, wrong role, broken layout, or overly dense mobile UI are not valid PASS evidence.

---

# F. Required report section

Every back-office UI handoff must include:

```text
Quiet Luxury Design System:
- Admin Desa surfaces standardized: yes/no
- Internal Admin surfaces standardized: yes/no
- Claim/support surfaces standardized: yes/no
- buttons standardized: yes/no
- forms standardized: yes/no
- cards/panels standardized: yes/no
- status pills standardized: yes/no
- error/empty/loading states standardized: yes/no
- mobile density preserved after styling: yes/no
- iPhone 12 mini checked: yes/no
- non-technical copy checked: yes/no
- remaining non-standard surfaces:
```

If any answer is `no`, the task cannot be clean `PASS` without explanation.

---

# G. Fix-before-handoff rule

If back-office UI is inconsistent, visually unfinished, hard to scan, too dense on mobile, or confusing for non-technical users, fix it before handoff if it is within scope.

Examples that must be fixed:

- internal admin table/card still looks default/unfinished,
- Admin Desa and internal admin use different button/card language,
- status labels use raw enum without explanation,
- mobile card stack is too long and repetitive,
- important action is hidden below excessive details,
- error/empty states look like unstyled plain text,
- approve/reject/publish/revoke modal does not explain consequence.

Only defer if:

- it requires broad product redesign,
- Owner explicitly accepts the limitation,
- the issue is outside the touched scope.

Deferred design issues must be listed clearly in the handoff report.

---

# H. Final rule

Back-office UI is done only when it is:

```text
1. functionally correct,
2. secure and role-safe,
3. visually consistent with Quiet Luxury,
4. compact and comfortable on mobile,
5. understandable for non-technical users,
6. verified with valid screenshots.
```
