import { randomBytes } from "node:crypto";

export function buildSourceBackedReviewTitle() {
  const suffix = randomBytes(5).toString("hex");
  return `source-backed${suffix}`;
}
