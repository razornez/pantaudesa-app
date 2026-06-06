---
Date: 2026-05-10
Status: mandatory-reference-for-back-office-ui
Prepared-by: Iwan / BMAD
Supersedes: —
Related:
- docs/bmad/checklists/back-office-quiet-luxury-design-standard.md
---

# Back-Office UI Design Guidelines

> **Read this before touching any back-office UI.** This is the build reference, not the QA checklist.
> For pre-handoff QA, see `docs/bmad/checklists/back-office-quiet-luxury-design-standard.md`.

---

## Design Direction

All back-office pages follow **Intake V2** as the canonical reference implementation.

The style is: **quiet luxury** — clean, calm, premium, decision-oriented.

Key principles:
- Technical detail is **collapsed by default** (behind a drawer, accordion, or "Lihat detail" toggle).
- The **primary action** is always the most visually obvious element on screen.
- Every section has a clear **eyebrow label** above its heading.
- Status is shown first — user understands the situation before reading explanation.
- Mobile-first: single column by default, expand to multi-column at `sm:` (640px).

---

## Reference Implementation

**Intake V2 result step is the canonical reference.** Study these files before adding anything new.

| Component | What it shows |
|---|---|
| `src/components/internal-admin/IntakeWorkbench.tsx` | Sticky action header, layout orchestration |
| `src/components/internal-admin/intake/IntakeSourceRibbon.tsx` | 3-col source/target info ribbon |
| `src/components/internal-admin/intake/IntakeDiffTheatre.tsx` | Filter tabs, section-grouped diff rows, responsive grid vs card |
| `src/components/internal-admin/intake/IntakeCoverageLens.tsx` | Donut chart, section bars, responsive flex layout |
| `src/components/internal-admin/intake/IntakeValidationPanel.tsx` | Inline validation, 2×2 mini cards, reviewer hint |
| `src/components/internal-admin/intake/IntakeInspectorDrawer.tsx` | Technical detail collapsed behind slide-up drawer |

---

## Before Creating a New Component

1. `grep -r "ComponentPurpose" src/components/internal-admin/` — search for existing implementations first.
2. If something similar exists, **extend it** — do not create a parallel duplicate.
3. If an old component is superseded by a new one, **delete the old one immediately** — do not leave it dormant.

---

## Required Design System Classes

Use these existing utilities from `src/app/globals.css`. Never re-implement them with inline styles or ad-hoc Tailwind.

```
Surfaces:     .lux-card  .lux-panel  .glass  .ring-hair  .shadow-lux-1  .shadow-lux-2  .shadow-lux-hover
Typography:   .eyebrow  .section-title  (eyebrow always above h2/h3)
Buttons:      .btn-lux-primary  .btn-lux-secondary  .btn-lux-ghost  .btn-lux-success  .btn-lux-danger
Forms:        .field-lux  .select-lux  .textarea-lux  .field-label
Status pills: .pill-ok  .pill-warn  .pill-danger  .pill-info
Notices:      .notice-card  .notice-info  .notice-warn  .notice-danger  .notice-ok
Metrics:      .metric-card  .metric-label  .metric-value  .metric-note
Motion:       .t-spring  (all hover/focus/active transitions)
Status bg:    .lux-status-good  .lux-status-warn  .lux-status-danger
```

---

## Anti-Patterns — Never Do These

| Anti-pattern | Correct approach |
|---|---|
| `border border-slate-100` on a card | `.lux-card` or `.ring-hair` + `.shadow-lux-1` |
| `style={{ boxShadow: "0 1px …" }}` inline | Use `.shadow-lux-1` / `.shadow-lux-2` class |
| Raw enum status as label (`"PROCESSING"`) | Paraphrase in Indonesian (see checklist §A4) |
| Fixed-width grid columns in a card (`180px 1fr`) | Responsive: `sm:grid sm:grid-cols-[180px_1fr]` with mobile fallback |
| Multiple full-width primary buttons stacked vertically | One `.btn-lux-primary`, rest as ghost or secondary |
| Showing all technical detail by default | Collapse behind drawer/accordion; see `IntakeInspectorDrawer` |
| Creating a new component without searching first | Always grep before creating |
| Leaving superseded v1 components in the codebase | Delete immediately; update index.ts and parent re-exports |

---

## Page Layout Hierarchy

Every back-office page must follow this top-to-bottom order:

```
1. Sticky header      — breadcrumb · workflow step indicator · primary CTA
2. Status/summary     — what is the current verdict? (eyebrow + h2 + status pill)
3. Primary content    — the main decision surface (diff, coverage, review queue)
4. Supporting detail  — collapsed by default or below the fold
5. Submit/action block — scroll target for the primary CTA in the sticky header
```

Do not put long explanatory copy before the user sees status and next action.

---

## Color Semantics

| Color | Meaning |
|---|---|
| Indigo / `#1E1B4B` | Brand, admin workspace, updated/changed field values |
| Emerald | Success, published, approved, new/added |
| Amber | Pending, review needed, detected-not-safe, warning |
| Rose | Error, rejected, destructive, removed/deleted |
| Slate | Neutral content, unchanged values, secondary labels |
| Sky | Soft informational, AI/model labels (non-critical) |

---

## Mobile Rules (iPhone 12 mini class = 375px)

- **Default single-column.** Use `sm:grid` / `sm:flex-row` to widen at ≥ 640px.
- **Sticky header labels:** shorten with `sm:hidden` / `hidden sm:inline`. Example: "Kirim ke review" → "Review" on mobile.
- **Fixed-column grids** (e.g. diff row `4px 180px 1fr 24px 1fr`): must render as a stacked card on `< sm` (see `IntakeDiffTheatre` DiffRow implementation).
- **Column headers** in tables/grids: `hidden sm:grid` — hide on mobile.
- **Inspector/drawer panels:** fixed bottom; still reachable and toggleable at 375px.
- Accordion/progressive disclosure preferred over all-visible long lists on mobile.

---

## Component Cleanup Rule

When a v2 component supersedes a v1 component:

1. **Delete the v1 file** — do not rename, comment out, or leave it "just in case."
2. Remove from `index.ts` exports.
3. Remove any backward-compat re-exports from parent components (`IntakeWorkbench.tsx`, etc.).
4. Run `grep` to confirm zero remaining imports before committing.
5. Run `npx tsc --noEmit` — must be clean.

---

## Mandatory QA Reference

Before marking any back-office UI task done, verify against:

```
docs/bmad/checklists/back-office-quiet-luxury-design-standard.md
```

That checklist is the ship gate. These guidelines are the build reference.
