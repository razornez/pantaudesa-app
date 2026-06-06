# BMAD Standard — Next.js Engineering Standard

Status: **ACTIVE STANDARD**  
Scope: semua development fitur baru, refactor, bugfix besar, dan performance work PantauDesa.  
Goal: kode lebih rapi, mudah dirawat, type-safe, aman, dan cepat.

---

## 1. Why This Standard Exists

PantauDesa akan makin besar: back office user, Admin Desa, Internal Admin, suara warga, dokumen desa, data desa, AI mapping, audit trail, dan public pages. Tanpa standar, fitur baru akan mudah membuat file terlalu besar, logic bercampur, query lambat, copy tercecer, dan bug sulit dilacak.

Target utama:

1. Kode rapi dan konsisten.
2. File kecil dan punya tanggung jawab jelas.
3. Business logic tidak tercecer di UI.
4. Query cepat dan bisa diaudit.
5. Data sensitif aman.
6. UI cepat tampil dengan loading/skeleton yang benar.
7. Fitur baru bisa dikembangkan tanpa menyenggol core flow.

---

## 2. Core Principles

Setiap task wajib mengikuti:

- **SOLID** — setiap module punya tanggung jawab jelas dan mudah diganti.
- **DRY** — jangan ulang logic, copy, constant, query shape, atau permission rule.
- **KISS** — solusi sederhana dulu, jangan over-engineering.
- **YAGNI** — jangan bikin abstraction sebelum dibutuhkan.
- **Type-safe** — jangan pakai `any`; gunakan type/interface/unknown + narrowing.
- **Security-first** — server tetap wajib enforce permission, jangan mengandalkan UI.
- **Performance-aware** — query dan render punya budget performa.
- **Mobile-first** — terutama untuk admin desa yang mungkin memakai HP.
- **Observable** — route/query lambat harus bisa dilacak.
- **Testable** — policy, mapper, service, validator harus mudah dites.

---

## 3. Trusted References

Standar ini disusun dari praktik resmi/tepercaya berikut:

- Next.js App Router project structure, route groups, private folders, `src`, colocation, `page`, `layout`, `loading`, dan `route` conventions.
- Next.js caching model: Request Memoization, Data Cache, Full Route Cache, Router Cache.
- Next.js loading UI / streaming with `loading.tsx`.
- Next.js instrumentation and OpenTelemetry convention.
- React `cache()` for Server Components request-level dedupe.
- Prisma performance guidance: avoid overfetching, missing indexes, repeated queries, full table scans.
- typescript-eslint `no-explicit-any` rule and safer alternatives like `unknown`.

---

## 4. Recommended Project Structure

Gunakan `src` sebagai source utama. `app` fokus untuk routing, bukan tempat menumpuk logic.

```text
src/
  app/
    (public)/
    (auth)/
    profil/
    internal-admin/
    api/

  components/
    ui/
    layout/
    public/
    profil/
    admin-desa/
    internal-admin/

  features/
    admin-desa/
      components/
      server/
      actions/
      api/
      types/
      constants/
      copy/
      validators/
      mappers/
      policies/
      tests/

    internal-admin/
      components/
      server/
      actions/
      api/
      types/
      constants/
      copy/
      validators/
      mappers/
      policies/
      tests/

    village-data/
      components/
      server/
      actions/
      types/
      constants/
      copy/
      validators/
      mappers/
      policies/
      tests/

  server/
    repositories/
    services/
    policies/
    cache/
    audit/

  lib/
    auth/
    db/
    perf/
    storage/
    logger/
    errors/
    utils/
    config/

  types/
    global.ts

  constants/
    app.ts

  copy/
    common.ts
```

Rules:

- `app/` = routing, layout, loading, error boundary, route handler composition.
- `components/` = reusable UI.
- `features/` = fitur spesifik.
- `server/repositories/` = Prisma/database query.
- `server/services/` = business orchestration.
- `server/policies/` = permission and role decision.
- `validators/` = Zod/schema validation.
- `mappers/` = Prisma result → ViewModel/DTO.
- `copy/` = user-facing text.
- `constants/` = limits, keys, static config.

---

## 5. File Responsibility Rules

### `page.tsx`

Allowed:

- auth/session check
- call service/server function
- redirect
- compose UI

Not allowed:

- long business logic
- complex Prisma query directly
- large mapping function
- long copywriting block
- many helper functions

Target:

- ideal: < 150 lines
- hard limit: 300 lines unless justified

### `layout.tsx`

Allowed:

- shell layout
- navigation
- light auth gate

Not allowed:

- heavy list query
- load all tabs data
- expensive DB query that blocks all children unless justified

### `loading.tsx`

Allowed:

- skeleton/shimmer UI

Not allowed:

- dummy data that looks real
- random fake names or fake rows

### Client Components

Use `"use client"` only when needed:

- `useState`, `useEffect`
- browser API
- event handler
- modal/dropdown/form interactivity

Default should be Server Component.

---

## 6. Line Limit

Hard standard:

```text
Hard limit: 500 lines per file
Warning: 300 lines
Ideal: 80–250 lines
```

Jika file mendekati 300 baris, pecah ke:

```text
types.ts
constants.ts
copy.ts
schema.ts
mapper.ts
service.ts
repository.ts
actions.ts
client.tsx
table.tsx
modal.tsx
empty-state.tsx
skeleton.tsx
```

Contoh:

```text
features/admin-desa/list-admin/
  components/
    AdminList.tsx
    AdminRow.tsx
    InviteAdminModal.tsx
    RevokeAdminModal.tsx
    AdminSummaryChips.tsx
  server/
    get-admin-roster.ts
  actions/
    invite-admin.ts
    revoke-admin.ts
  types.ts
  constants.ts
  copy.ts
  schema.ts
  mapper.ts
```

---

## 7. TypeScript Rules

Required:

- No `any`.
- Prefer explicit `type` / `interface`.
- Use `unknown` for unknown external data and narrow it.
- API response type must be explicit.
- Component props must be typed.
- Use union types for known statuses.
- Do not leak raw untyped JSON into UI.

Allowed exception:

- Temporary legacy migration only with comment:

```ts
// TODO(type): replace legacy any with typed DTO in <ticket-id>
```

New feature code must not introduce `any`.

Recommended ESLint rule:

```js
"@typescript-eslint/no-explicit-any": "error"
```

---

## 8. Constants Rules

Put constants in `constants.ts` or feature constants.

Bad:

```ts
if (file.size > 10 * 1024 * 1024) {}
```

Good:

```ts
export const MAX_DOCUMENT_UPLOAD_MB = 10;
export const MAX_DOCUMENT_UPLOAD_BYTES = MAX_DOCUMENT_UPLOAD_MB * 1024 * 1024;
```

Do not scatter:

- max upload size
- pagination size
- role labels
- status maps
- route paths
- bucket names
- date thresholds

---

## 9. Copywriting Rules

All user-facing copy should be in `copy.ts` or centralized copy module.

Required:

- Separate copy for `admin internal`, `admin desa`, and `user biasa` if context differs.
- Do not show raw enum to users.
- Copy must be simple Indonesian.
- Avoid long paragraphs in UI.
- Rejection/failed states must explain next step.

Example:

```ts
export const ADMIN_DESA_COPY = {
  inviteButton: "Undang Admin",
  revokeSuccess: "Akses admin berhasil dicabut.",
  uploadHelper: "Maksimal 10 MB per file.",
} as const;
```

---

## 10. API / Fetch / Server Action Rules

Client fetch logic goes to `api.ts`.
Server action logic goes to `actions.ts`.
Prisma query goes to `repository.ts`.
Business orchestration goes to `service.ts`.
Validation goes to `schema.ts`.

Do not write long `fetch()` blocks in UI components.

Standard response:

```ts
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  code: string;
  message: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

API route checklist:

- method check
- auth check
- permission check
- validation schema
- service call
- standardized response
- standardized error handler

---

## 11. Validation Rules

Use schema validation for all external input.

Recommended:

- Zod for request body/form/action payload.
- Shared schema for form and API where possible.
- Validate file type, size, and count.
- Validate URLs/emails/dates/numbers.

Never trust client payload.

---

## 12. Repository Pattern for Prisma

Prisma queries should not be scattered in pages/components.

Use:

```text
server/repositories/admin-desa-member.repository.ts
server/repositories/admin-desa-document.repository.ts
server/repositories/village-data.repository.ts
```

Rules:

- Query shape must be explicit.
- Use `select`, not broad `include`, unless justified.
- Avoid overfetch.
- Avoid fetching large JSON fields in list views.
- Query functions should be named by intent.

Example:

```ts
export async function findActiveAdminDesaMemberByUserId(userId: string) {
  return db.desaAdminMember.findFirst({
    where: {
      userId,
      status: { in: ["VERIFIED", "LIMITED"] },
    },
    select: adminDesaMemberContextSelect,
  });
}
```

---

## 13. Service Layer Rules

Service layer handles business orchestration.

Example service:

```text
server/services/admin-claim.service.ts
```

Allowed in service:

- call repository
- call policy
- call audit log
- call notification
- call email/storage
- coordinate transaction

Not allowed in UI/page:

- orchestrating multiple domain actions directly
- deciding approval/reject flow
- writing audit trail manually in component

---

## 14. Policy Layer Rules

All permission logic must live in policy files.

Example:

```ts
export function canInviteAdmin(member: AdminDesaMemberContext): boolean {
  return member.status === "VERIFIED" && member.role === "VERIFIED_ADMIN";
}
```

Rules:

- UI may hide button, but server/API must enforce policy.
- Do not copy-paste role logic in many files.
- Every sensitive action must have policy test.

---

## 15. Mapper / ViewModel Rules

Do not send complex raw Prisma result deep into UI.

Use mapper:

```ts
export function toAdminDesaListItem(member: MemberWithUser): AdminDesaListItem {
  return {
    id: member.id,
    displayName: member.user.nama ?? member.user.username ?? member.user.email,
    email: member.user.email,
    status: member.status,
  };
}
```

Rules:

- UI receives render-ready ViewModel.
- Dates serialized before client component.
- Nullable fields handled once in mapper, not repeated in JSX.

---

## 16. Error Handling Standard

Use standard app errors.

Suggested structure:

```text
lib/errors/app-error.ts
lib/errors/api-error.ts
lib/errors/error-response.ts
```

Rules:

- Do not expose raw Prisma errors to user.
- Do not log secrets or PII.
- User-facing errors must be clear.
- Internal errors may include trace ID.
- Failed action should explain next step if possible.

---

## 17. Performance Standard

Budget:

```text
Shell / shimmer visible: < 1 second
Simple query: 100–500ms
Main back office data: target < 1 second
Query > 1 second: investigate
Query > 2 seconds: blocker
Page feels blank/frozen: blocker
```

Required:

- Use `select`.
- Paginate large lists.
- Avoid `take: 100` without reason.
- Avoid large JSON field in list query.
- Add `loading.tsx` for slow routes.
- Use request-level dedupe for repeated context lookup.
- Instrument slow query with dev/staging perf log.
- Use `EXPLAIN ANALYZE` before proposing index migration.

---

## 18. Caching Rules

Classify data before caching.

Safe persistent cache:

- copy/static labels
- constants
- categories
- public config
- field mapping definitions

Request-level cache only:

- session-derived admin context
- internal admin role lookup
- expensive calculation inside one render

Do not persistent-cache without design:

- approval queue
- notification unread
- claim status
- document status
- role/status admin
- user-specific sensitive data

React `cache()` may be used for Server Component request-level dedupe. It is not a replacement for DB cache and must not be treated as cross-user persistent cache.

---

## 19. Loading, Streaming, and RSC Rules

Use `loading.tsx` for route segments that may wait for data.

Rules:

- Skeleton should match page structure.
- Do not render dummy data.
- If layout fetch blocks all children, review whether data can move into child Suspense boundary.
- Avoid making layout load heavy list data.
- If RSC requests repeat unexpectedly, inspect Link prefetch, router.refresh, and page/layout dynamic data.

---

## 20. Observability Rules

Use `lib/perf` or approved instrumentation.

Allowed logs:

- route name
- step name
- durationMs
- query shape keys

Forbidden logs:

- userId value
- desaId value
- email
- token
- document content
- file names if sensitive
- exact private payload

When query > 1000ms:

1. log route/step/duration
2. capture query shape
3. run `EXPLAIN ANALYZE`
4. update BMAD report
5. propose index/refactor based on evidence

Use Next.js `instrumentation.ts` or OpenTelemetry only after manual perf logs are insufficient.

---

## 21. Security Rules

Required:

- server-side auth check
- server-side permission check
- schema validation
- no secret in client
- no sensitive log
- no raw internal error to user
- no hard delete for important domain data
- audit trail for sensitive action

Middleware may protect broad routes, but final permission decision must be in server/service/policy.

---

## 22. Audit Trail Rules

Sensitive actions must write audit trail:

- approve/reject claim
- invite/revoke admin
- upload/approve/reject document
- publish data
- resolve conflict
- renewal approve/reject
- internal admin override

Audit log should include:

- actorId
- actorRole
- action
- targetType
- targetId
- reason
- before/after if relevant
- ip/user agent/location if available
- createdAt

---

## 23. Naming Convention

Files:

```text
kebab-case.ts
kebab-case.tsx
```

Components:

```text
PascalCase
```

Functions:

```text
camelCase
```

Types:

```text
PascalCase
```

Constants:

```text
UPPER_SNAKE_CASE
```

Avoid deep relative imports. Prefer `@/` for shared modules.

---

## 24. Test Standard

New feature minimum:

- lint
- typecheck
- build
- unit tests for pure policy/mapper/validator when possible
- integration test for service when possible
- Playwright for critical flows when available

Critical flows:

- login
- admin claim approve/reject
- invite/revoke admin
- upload document
- document review/publish
- suara warga vote/comment/helpful
- notification
- renewal

Required commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

If failing, report honestly.

---

## 25. Feature Completion Checklist

Before marking a feature done:

```text
[ ] File utama tidak > 500 lines
[ ] Tidak ada new any
[ ] Types dipisah
[ ] Constants dipisah
[ ] Copy dipisah
[ ] Validation schema ada
[ ] Permission policy ada
[ ] Prisma query tidak di UI component
[ ] Repository/service boundary jelas
[ ] Mapper/ViewModel dipakai untuk UI data kompleks
[ ] Select/include tidak overfetch
[ ] Pagination untuk list besar
[ ] Loading state ada
[ ] Empty state ada
[ ] Error state ada
[ ] Mobile iPhone 12 mini dicek
[ ] Performance budget dicek
[ ] Audit log untuk action penting
[ ] No sensitive log
[ ] npm run lint pass
[ ] npx tsc --noEmit pass
[ ] npm run build pass
```

---

## 26. Rules for Existing Legacy Files

If touching old large files:

1. Do not rewrite everything at once unless requested.
2. Extract copy/types/constants first.
3. Extract modal/table/card components.
4. Extract repository/service/policy only after behavior is understood.
5. Keep commits small and reversible.
6. Do not mix UI polish with business logic refactor in the same commit unless unavoidable.

---

## 27. Done Means

A task is not done just because UI works.

Done means:

- correct behavior
- clean structure
- type-safe
- no obvious performance regression
- mobile usable
- no sensitive leak
- no unreviewed migration
- report updated if task affects architecture/performance

---

## Appendix A. Execution Protocol for Large Standardization Tasks

Use this protocol when scope is large enough that ad-hoc refactor progress can become uneven.

### A1. Use the standard as the source of truth

For large cleanup or module-standardization work, do not track progress only by file count or "many changes made".

Required:

1. Build a compliance matrix from items `1` through `27` in this document.
2. For each item, record:
   - interpretation in the current repo/task
   - files/features affected
   - current status: `NOT_STARTED`, `PARTIAL`, `DONE`, or `BLOCKED`
   - evidence or file references
   - remaining gap if not done
3. Progress report must be based on this matrix, not intuition.

### A2. Work by cluster, not random file order

For large refactors, group work into explicit clusters. Example:

- client fetch / api / hooks
- route / page / layout boundaries
- repository / service / policy / validation
- constants / copy / mapper / view-model
- QA / performance / report / done checklist

Rules:

1. Finish one cluster to a stable state before moving to the next.
2. Do not leave the same standard partially implemented across many areas if one cluster can be closed first.
3. Update the compliance matrix after each cluster.

### A3. Do not claim "done" before the matrix is updated

Before saying a task is complete, explicitly review all `27` items again.

Required output:

- which items are `DONE`
- which items are `PARTIAL`
- which items are `BLOCKED`
- exact reason for each blocked item

### A4. Checkpoints for large refactors

Every major checkpoint must include at least:

```text
1. What cluster was worked on
2. Which standard items moved status
3. Which files changed
4. QA result for this checkpoint
5. What remains before the next checkpoint
```

### A5. QA gate per cluster

At minimum, after a meaningful cluster is stabilized:

```bash
npm run lint
npx tsc --noEmit
```

Before final completion claim:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

If `build` is blocked by environment, mark the affected standard items as `BLOCKED` and continue closing the remaining non-blocked items.

### A6. Honest blocker rule

If a standard item cannot be completed, state whether the reason is:

- instruction scope
- missing approval
- environment/tooling blocker
- dependency on another unfinished cluster
- genuine out-of-scope work

Do not describe a partially improved area as fully compliant.

### A7. No hidden "almost done"

Forbidden:

- reporting "sudah rapi" if the matrix still shows many `PARTIAL`
- reporting "sesuai standard" without mapping to the numbered items
- mixing UI polish with structural standardization unless explicitly requested

### A8. Efficiency rule

To avoid wasting tokens and rework:

1. Establish the matrix first.
2. Close clusters in order.
3. Re-check numbered compliance before reporting success.
4. Do not postpone obvious standard violations if they are already inside the active cluster.
