import { createHmac, timingSafeEqual } from "crypto";

const LOGIN_TICKET_TTL_MS = 2 * 60 * 1000;

type LoginTicketPayload = {
  purpose: "pin-login";
  userId: string;
  email: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET atau NEXTAUTH_SECRET belum diset.");
  }
  return secret;
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
}

export function issueLoginTicket(userId: string, email: string) {
  const payload: LoginTicketPayload = {
    purpose: "pin-login",
    userId,
    email: email.toLowerCase(),
    exp: Date.now() + LOGIN_TICKET_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyLoginTicket(token: string, userId: string, email: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = sign(encodedPayload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return false;
  }

  let payload: LoginTicketPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as LoginTicketPayload;
  } catch {
    return false;
  }

  return (
    payload.purpose === "pin-login" &&
    payload.userId === userId &&
    payload.email === email.toLowerCase() &&
    payload.exp > Date.now()
  );
}
