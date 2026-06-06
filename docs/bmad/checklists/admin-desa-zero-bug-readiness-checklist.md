# Admin Desa Zero-Bug Readiness Checklist

Date: 2026-04-30
Status: mandatory-checklist-for-admin-desa-related-tasks
Prepared-by: Rangga / BMAD-lite orchestration

## Purpose

This checklist exists because Admin Desa features may be tested by many real village/admin users. These flows must avoid embarrassing bugs, confusing states, stale data, broken email flows, permission leaks, and public-data trust mistakes.

This checklist must be applied to:

- Sprint 04-007A — Admin Claim Core Browser Flow
- Sprint 04-007B — Admin Claim Completion UX, Invite, Hubungi Admin, Guide/FAQ, and Browser QA
- Sprint 04-008 execution subtasks when they are later approved

## Non-negotiable release gate

A task related to Admin Desa must not be marked PASS unless:

1. `npm run lint` passes with no ESLint failure.
2. `npm run test` passes.
3. `npx tsc --noEmit` passes.
4. `npx prisma generate` passes.
5. `npm run build` passes.
6. Changed UI is tested in desktop and mobile viewport.
7. Screenshot evidence/notes are captured and cleaned up locally after handoff.
8. No public data is marked verified unless governance explicitly allows it.
9. No private data, raw token, service key, or secret is exposed.
10. No API action fakes success when backend/email/storage/AI fails.

If any item fails, handoff status must be `BLOCKED` or `REWORK`, not PASS.

---

# A. Flow integrity checklist

## A1 — Authentication and authorization

Every Admin Desa flow must verify:

- unauthenticated users are blocked or redirected safely,
- user identity is resolved server-side before sensitive action,
- authorization is enforced server-side, not only in UI,
- one-user-one-desa rule is enforced server-side,
- user cannot claim, invite, upload, review, or publish for a desa they do not own/manage,
- `User.role = DESA` alone is not treated as proof of verified Admin Desa,
- `LIMITED`, `PENDING`, and `VERIFIED` have clearly separated permissions.

## A2 — Idempotency and duplicate actions

Test and handle:

- double-click submit,
- slow network submit,
- browser back/forward after submit,
- refresh during loading,
- same action in two tabs,
- retry after timeout,
- duplicate form submission,
- duplicate claim for same user/desa,
- duplicate invite for same email/desa,
- accepting invite twice,
- using expired or already used token.

Expected behavior:

- no duplicate records,
- no duplicate admin membership,
- no duplicate invite acceptance,
- no inconsistent status transition,
- user receives clear message.

## A3 — Status transition safety

Status transitions must be explicit and tested.

Admin claim/member statuses must not move silently or ambiguously. Verify at minimum:

- `PENDING` claim after first submit,
- email/website verification success transitions to the intended status,
- invite acceptance creates `LIMITED` membership,
- only `VERIFIED` Admin Desa can invite,
- `LIMITED` admin cannot invite,
- failed verification does not accidentally grant access,
- expired token does not grant access,
- public data status is not upgraded because admin membership is verified.

If a transition is unclear, stop and ask Owner.

## A4 — Multi-tab and stale UI protection

For pages such as `/profil/saya` and `/profil/klaim-admin-desa`, test:

- action in tab A, refresh tab B,
- action then browser refresh,
- action then navigate away/back,
- action then use browser back button,
- stale cached status after verification/invite/contact.

Use appropriate Next.js freshness approach:

- `router.refresh()`,
- no-store fetch,
- dynamic route rendering,
- cache revalidation,
- or project-consistent equivalent.

Do not globally disable caching for unrelated public pages.

---

# B. Claim Admin specific checklist for Sprint 04-007A

## B1 — Eligibility and one-desa rule

Verify:

- logged-out user cannot submit claim,
- logged-in user with no active admin desa can start claim,
- user with active `PENDING`, `LIMITED`, or `VERIFIED` admin relation cannot claim another desa,
- invalid desa ID/name is rejected,
- unauthorized user cannot submit claim by calling API directly,
- blocked state explains the reason clearly.

## B2 — Email magic link

Verify:

- email token generation succeeds with valid env,
- missing/invalid Resend env shows honest error,
- email failure does not fake success,
- callback success and callback error are shown clearly,
- expired/invalid token is handled safely,
- token is not logged or exposed,
- claim remains safe if user clicks link multiple times.

## B3 — Website token

Verify:

- website token generation returns raw token only once in active UI session,
- raw token is not stored in localStorage/sessionStorage,
- raw token is not logged,
- token placement instruction is clear,
- check token success and not-found states are clear,
- unsafe/private URL is rejected safely,
- SSRF guard remains intact,
- refresh after token generation explains regenerate path if raw token is lost,
- 6-month renewal copy is visible and not confused with immediate expiry.

## B4 — Profile/status UX

Verify:

- `/profil/saya` does not show stale admin status,
- status badge says admin status, not public data status,
- `Admin terverifikasi` does not imply desa data is verified,
- next-step CTA after success is clear,
- private email/phone is not exposed.

---

# C. Completion UX checklist for Sprint 04-007B

## C1 — Resume, resend, regenerate

Verify:

- current claim loads from backend after refresh,
- `PENDING`, `LIMITED`, and `VERIFIED` states resume correctly,
- lost raw token shows regenerate guidance,
- resend email works or fails honestly,
- regenerate website token works or fails honestly,
- old token behavior is explained,
- rapid resend/regenerate is blocked or safely handled.

## C2 — Method switch

Verify:

- email-to-website switch is safe,
- website-to-email switch is safe,
- if backend cannot safely switch methods, UI blocks and reports follow-up,
- audit trail is preserved by backend service,
- previous token/method is not left in a confusing active state.

## C3 — Invite admin

Rules:

- only `VERIFIED` Admin Desa can invite,
- invitee email may be any valid email,
- invitee starts as `LIMITED`,
- total admin per desa max 5,
- inviter is responsible for invite.

Verify:

- `VERIFIED` admin can invite,
- `LIMITED` admin cannot invite,
- unauthenticated/non-admin cannot invite,
- invalid email is rejected,
- self-invite is rejected,
- duplicate invite/user already admin is handled,
- invitee already managing another desa is blocked where safely checkable,
- max 5 admins is enforced server-side,
- invite email failure does not fake success,
- invite token is expiry-bound and single-use,
- accepted invite creates or reflects `LIMITED`,
- expired/used invite shows clear error,
- audit event exists for invite and accept.

## C4 — Hubungi Admin

Verify:

- form validates subject and description,
- evidence URL/text is optional or validated according to UI copy,
- too-long payload is rejected,
- duplicate rapid send is blocked or safely handled,
- email sends to `CONTACT_EMAIL`,
- missing/invalid `CONTACT_EMAIL` shows honest error,
- failure does not fake success,
- user email/reply-to is handled safely,
- no fake admin report UI is accidentally reintroduced,
- no auto-suspend/auto-punish behavior exists.

## C5 — Guide and FAQ

Verify guide/FAQ explains:

- what Admin Desa is,
- one-user-one-desa rule,
- email and website verification,
- 6-month website renewal,
- `PENDING`, `LIMITED`, and `VERIFIED`,
- only `VERIFIED` can invite,
- invitee starts `LIMITED`,
- max 5 admins,
- verified admin is not verified public data,
- how to contact support.

Guide/FAQ must not contradict UI or backend rules.

---

# D. Internal admin and 04-008 readiness checklist

## D1 — Internal admin access

For any future 04-008 execution task:

- internal admin routes must not be public,
- permission checks must happen server-side,
- destructive action requires reason,
- internal decision writes audit event,
- no auto-approve, auto-suspend, auto-revoke, or auto-punish without explicit human action.

## D2 — Audit viewer

Audit viewer must:

- redact raw tokens,
- redact private contact data where needed,
- not allow editing audit events,
- support actor/target/status transition context,
- separate info/warning/critical signals,
- show automated flags as hints, not final decisions.

## D3 — Invite management future automation

Automation may:

- mark expired invites,
- send reminder if approved,
- summarize lifecycle,
- audit resend/cancel/expired/accepted.

Automation must not:

- auto-promote invited users to `VERIFIED`,
- auto-remove existing admin to fit max 5,
- auto-cancel without clear policy,
- auto-punish based on invite patterns alone.

## D4 — Document upload and Supabase Storage

Before implementing Admin Desa document upload:

- Supabase bucket is private by default,
- service role key is server-only,
- storage object path is stored in DB, not public URL,
- signed URL TTL is short and configurable,
- file type and size are validated server-side,
- uploads are linked to desa and uploader,
- unauthorized download/access is rejected,
- private document content is not included in screenshots/logs,
- deletion/retention policy is defined.

## D5 — AI-assisted review

AI output must:

- be candidate/draft only,
- never directly overwrite public data,
- never directly mark data as verified,
- show before/after diff,
- require review/approval,
- preserve source document traceability,
- record audit events for extract, review, and publish.

---

# E. Browser and UI QA checklist

For every changed UI surface:

- desktop viewport tested: 1366px or 1440px width,
- mobile viewport tested: 360px, 390px, or 414px width,
- loading state tested,
- success state tested,
- error state tested,
- empty state tested,
- blocked/unauthorized state tested,
- long copy does not break layout,
- buttons are disabled while sending,
- forms are keyboard usable where practical,
- screenshots/notes captured locally,
- screenshots cleaned locally after handoff,
- no private info appears in screenshot notes.

---

# F. Handoff zero-bug report section

Every Admin Desa handoff must include:

```text
Zero-bug readiness:
- duplicate submit/idempotency checked:
- multi-tab/stale cache checked:
- unauthorized direct API checked:
- token expiry/reuse checked:
- email failure behavior checked:
- invite edge cases checked:
- public data verified not activated:
- private data/token/secret leakage checked:
- desktop/mobile QA checked:
- screenshot cleanup done:
- known residual risks:
```

If known residual risks exist, status should be `PARTIAL_PASS`, `BLOCKED`, or `REWORK`, not clean PASS.
