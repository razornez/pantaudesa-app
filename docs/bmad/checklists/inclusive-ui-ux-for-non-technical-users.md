# Inclusive UI/UX Checklist for Non-Technical Users

Date: 2026-05-04
Status: mandatory-checklist-for-user-facing-ui
Prepared-by: Rangga / BMAD-lite orchestration
Related:
- `docs/bmad/checklists/admin-desa-zero-bug-readiness-checklist.md`
- `docs/bmad/checklists/playwright-screenshot-readiness-gate.md`
- `docs/bmad/checklists/mobile-information-density-checklist.md`

## Purpose

PantauDesa is not only for users who understand technology. Some Admin Desa, village officers, and public users may be older, busy, less technical, or unfamiliar with modern web app patterns.

Therefore, every user-facing flow must be easy to understand, comfortable to use, visually calm, and written in simple Indonesian.

Good UI/UX is not cosmetic. It directly affects adoption, trust, comfort, and whether users want to keep using the platform.

## Non-negotiable principle

A feature must not be considered clean `PASS` if it technically works but:

- feels confusing,
- uses overly technical wording,
- requires too much guessing,
- hides the next step,
- creates fear or uncertainty,
- overloads the user with too much information,
- is hard to use on a small phone,
- makes older/non-technical users uncomfortable,
- makes users feel they might make a mistake without understanding the consequence.

If a UI issue could make users avoid using the platform, mark it as `REWORK_REQUIRED` or `PASS_WITH_UX_NOTES`, not clean `PASS`.

---

# A. User empathy rules

## A1 — Assume the user is not technical

Do not assume users understand:

- token,
- OTP,
- signed URL,
- verification lifecycle,
- internal review,
- mapping,
- storage,
- publish state,
- audit,
- source conflict,
- renewal,
- role permission,
- admin membership.

If these concepts must appear, explain them in simple language.

Bad:

```text
Token website berhasil, claim masuk IN_REVIEW.
```

Better:

```text
Kode verifikasi website berhasil ditemukan. Pengajuan kamu sekarang akan diperiksa oleh tim PantauDesa sebelum akun admin diaktifkan.
```

## A2 — Explain what happens next

Every sensitive or multi-step flow must answer:

```text
Apa yang sedang terjadi?
Apa yang harus saya lakukan?
Apa yang akan dilakukan PantauDesa?
Berapa lama kira-kira prosesnya?
Apa yang terjadi jika ditolak/gagal?
```

## A3 — Reduce anxiety

Avoid copy that sounds accusatory unless necessary.

Bad:

```text
Dokumen gagal karena data tidak valid.
```

Better:

```text
Dokumen belum bisa diproses karena ada informasi yang belum sesuai dengan sumber terpercaya. Silakan unggah dokumen pendukung yang lebih jelas atau hubungi admin jika perlu bantuan.
```

## A4 — Use calm and respectful tone

Admin Desa may be older or less familiar with web apps. Avoid making users feel blamed.

Use tone:

- helpful,
- polite,
- calm,
- direct,
- not robotic,
- not judgmental.

---

# B. Plain Indonesian copy rules

## B1 — Prefer simple Indonesian

Avoid unnecessary English/technical terms in user-facing UI.

Prefer:

```text
Sedang diperiksa
Menunggu persetujuan
Berhasil diproses
Gagal diproses
Alasan penolakan
Yang perlu diperbaiki
Hubungi Admin PantauDesa
```

Instead of:

```text
In review
Processing
Mapping failed
Rejected reason
Verification lifecycle
```

## B2 — If technical terms are unavoidable, add explanation

Example:

```text
OTP adalah kode angka yang dikirim ke email kamu untuk memastikan email tersebut benar milikmu.
```

```text
Status PROCESSING berarti dokumen sedang diperiksa oleh tim PantauDesa. Data belum otomatis tampil di halaman publik.
```

## B3 — Use action-oriented labels

Buttons should be clear.

Good:

```text
Unggah dokumen
Kirim pengajuan
Lihat alasan penolakan
Perbaiki pengajuan
Undang admin
Hapus akses admin
Lihat dokumen
```

Avoid vague labels:

```text
Submit
Proceed
Action
Process
Update
```

## B4 — Paraphrase for clarity

If a BMAD or API status is technical, paraphrase it in UI.

Example mapping:

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

Do not expose raw enum names as primary user-facing labels unless accompanied by explanation.

---

# C. Layout clarity rules

## C1 — The first screen must answer the user's question

On mobile and desktop, the top area should quickly explain:

- current status,
- next step,
- primary action,
- important warning if any.

Do not make users scroll through decorative cards before finding the next action.

## C2 — Reduce visual fatigue

Avoid:

- too many full cards stacked vertically,
- repeated labels,
- long paragraphs without hierarchy,
- too many badges/chips at once,
- too many buttons with equal weight,
- large empty spacing on mobile,
- cramped small text,
- dense information with no grouping.

Use:

- compact summaries,
- clear headings,
- progressive disclosure,
- accordions,
- short helper text,
- calm spacing,
- strong hierarchy.

## C3 — Important flows need guidance text

Flows that require extra explanation:

- claim Admin Desa,
- website verification,
- email OTP,
- rejected claim,
- renewal,
- invite Admin Desa,
- revoke Admin Desa,
- upload document,
- document failed,
- data source conflict,
- publish/update data,
- internal admin review.

Guidance must be short by default, with optional expanded details.

## C4 — Avoid hidden consequences

Before sensitive actions, tell user what will happen.

Examples:

```text
Setelah dokumen dikirim, Admin Desa utama akan memeriksa dulu sebelum PantauDesa memprosesnya.
```

```text
Menghapus admin tidak menghapus riwayat dokumen yang pernah diunggah. Akses admin tersebut hanya akan dicabut.
```

```text
Jika pengajuan ditolak, kamu bisa menghubungi Admin PantauDesa dan mengirim bukti tambahan.
```

---

# D. Older and low-tech user accessibility

## D1 — Readability

Use:

- clear font size,
- enough line height,
- high contrast,
- short paragraphs,
- clear labels,
- simple words.

Avoid:

- tiny text for important information,
- low contrast gray text for critical warnings,
- overly decorative text that harms readability,
- placing important info only in tooltip.

## D2 — Tappable targets

Mobile buttons and tab items should be easy to tap.

Minimum practical rule:

```text
Important tap target should be around 44px height or equivalent comfortable area.
```

## D3 — Error messages must help, not only report failure

Every error should explain:

- what failed,
- why it may have failed,
- what user can do next,
- whether they should retry or contact admin.

Bad:

```text
Error 500
```

Better:

```text
Dokumen belum berhasil diunggah. Coba ulangi beberapa saat lagi. Jika tetap gagal, hubungi Admin PantauDesa.
```

## D4 — Do not depend only on color

Status must use text and icon/shape, not color alone.

Good:

```text
✓ Disetujui
! Perlu diperbaiki
× Gagal diproses
```

---

# E. Admin Desa-specific UX rules

## E1 — Admin Desa is a helper, not the sole source of truth

UI must explain that Admin Desa helps update data, but PantauDesa may still review against trusted sources.

Suggested copy:

```text
Admin Desa membantu memperbarui informasi desa. Data yang dikirim tetap dapat diperiksa oleh PantauDesa dengan membandingkan sumber terpercaya.
```

## E2 — Rejection must be constructive

Rejected flow must show:

- reason,
- what needs fixing,
- whether user can reapply,
- how to contact admin if they disagree.

## E3 — Document upload must be reassuring

For document upload:

- explain accepted file types,
- explain max size,
- explain what happens after upload,
- explain that upload does not instantly update public page,
- show status clearly.

## E4 — Limited vs Verified must be easy to understand

Do not only show `LIMITED`/`VERIFIED` labels.

Explain:

```text
Admin Terverifikasi: dapat mengundang admin lain dan mengirim dokumen untuk diproses.
Admin Terbatas: dapat membantu mengunggah dokumen, tetapi perlu persetujuan Admin Terverifikasi.
```

---

# F. Required QA checks

Every user-facing BMAD handoff must include:

```text
Inclusive UI/UX:
- plain Indonesian copy checked: yes/no
- technical enum/status paraphrased: yes/no
- next-step guidance visible: yes/no
- error messages are actionable: yes/no
- older/non-technical user readability checked: yes/no
- mobile density checked: yes/no
- primary action easy to find: yes/no
- sensitive action consequences explained: yes/no
- remaining UX concerns:
```

If any answer is `no`, the task cannot be clean `PASS`.

---

# G. Fix-before-handoff rule

If QA finds a UI/UX issue that may make non-technical users confused or uncomfortable, fix it before handoff if it is within scope.

Examples that must be fixed:

- unclear next step,
- raw enum shown without explanation,
- vague error message,
- long technical paragraph,
- cramped mobile layout,
- primary action hidden,
- too many stacked cards,
- confusing role labels,
- success message that does not explain what happens next.

Only defer if:

- the fix requires broad product redesign,
- Owner explicitly accepts the limitation,
- issue is outside the touched scope.

Deferred UX concerns must be listed clearly in the handoff report.

---

# H. Final rule

A feature is not done just because it works technically.

It is done only when:

```text
1. it works correctly,
2. it is secure,
3. it is understandable,
4. it is comfortable on mobile,
5. a non-technical user can complete the flow without guessing.
```
