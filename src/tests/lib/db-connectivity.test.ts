import { describe, expect, it } from "vitest";
import { isDatabaseConnectivityError } from "@/lib/db-connectivity";

describe("isDatabaseConnectivityError", () => {
  it("treats Prisma pool timeout as connectivity degradation", () => {
    expect(
      isDatabaseConnectivityError({
        code: "P2024",
        message:
          "Timed out fetching a new connection from the connection pool. More info: http://pris.ly/d/connection-pool",
      }),
    ).toBe(true);
  });

  it("treats expired or missing transaction errors as connectivity/runtime degradation", () => {
    expect(
      isDatabaseConnectivityError({
        code: "P2028",
        message: "Transaction not found. Transaction ID is no longer valid.",
      }),
    ).toBe(true);

    expect(
      isDatabaseConnectivityError(
        new Error(
          "Transaction API error: Transaction already closed: A query cannot be executed on an expired transaction.",
        ),
      ),
    ).toBe(true);
  });

  it("treats low-level socket failures as connectivity degradation", () => {
    expect(isDatabaseConnectivityError(new Error("connect ETIMEDOUT 10.0.0.1:6543"))).toBe(
      true,
    );
    expect(isDatabaseConnectivityError(new Error("read ECONNRESET"))).toBe(true);
  });

  it("does not swallow ordinary validation errors", () => {
    expect(
      isDatabaseConnectivityError({
        code: "P2002",
        message: "Unique constraint failed on the fields: (`email`)",
      }),
    ).toBe(false);
  });
});
