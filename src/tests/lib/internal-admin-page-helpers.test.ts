import { describe, expect, it } from "vitest";
import {
  parseClaimsPageInput,
  parseClaimStatuses,
  parseDocumentStatusFilter,
  parseFocusDocumentId,
  parseRenewalStateFilter,
} from "@/lib/internal-admin/page-params";

describe("internal admin page helpers", () => {
  it("parses a valid document status filter", () => {
    expect(parseDocumentStatusFilter("PROCESSING")).toBe("PROCESSING");
    expect(parseDocumentStatusFilter("REJECTED")).toBe("REJECTED");
    expect(parseDocumentStatusFilter("INVALID")).toBeNull();
    expect(parseDocumentStatusFilter(undefined)).toBeNull();
  });

  it("parses focus document id safely", () => {
    expect(parseFocusDocumentId("doc_123")).toBe("doc_123");
    expect(parseFocusDocumentId(undefined)).toBe("");
  });

  it("parses claims page input with defaults", () => {
    expect(parseClaimsPageInput({})).toEqual({
      page: 1,
      statusFilter: "",
      desaId: "",
    });

    expect(
      parseClaimsPageInput({ page: "3", status: "PENDING", desaId: "desa_1" }),
    ).toEqual({
      page: 3,
      statusFilter: "PENDING",
      desaId: "desa_1",
    });
  });

  it("resolves claim status filters against allowed values", () => {
    expect(parseClaimStatuses("REJECTED")).toEqual(["REJECTED"]);
    expect(parseClaimStatuses("UNKNOWN")).toEqual([
      "PENDING",
      "IN_REVIEW",
      "REJECTED",
      "APPROVED",
    ]);
  });

  it("parses renewal state filter safely", () => {
    expect(parseRenewalStateFilter("OVERDUE")).toBe("OVERDUE");
    expect(parseRenewalStateFilter("DUE_SOON")).toBe("DUE_SOON");
    expect(parseRenewalStateFilter("other")).toBe("ALL");
    expect(parseRenewalStateFilter(undefined)).toBe("ALL");
  });
});
