import { and, eq, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/db/client";
import { deviceTokens } from "@/db/schema";

const ACCESS_TTL_MS = 60 * 60 * 1000; // 1h
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d

function secretKey(): Uint8Array {
  const raw =
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "dev-insecure-secret-change-me";
  return new TextEncoder().encode(raw);
}

/** Random URL-safe token (for refresh tokens — access tokens are JWTs). */
function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Mint an access JWT carrying the userId (and device token id for audit). */
async function mintAccessToken(userId: string, deviceId: string) {
  const expiresAt = Date.now() + ACCESS_TTL_MS;
  const jwt = await new SignJWT({ userId, deviceId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(secretKey());
  return { token: jwt, expiresAt };
}

export interface DeviceTokenBundle {
  accessToken: string;
  accessExpiresAt: number;
  refreshToken: string;
  refreshExpiresAt: number;
  deviceId: string;
}

/**
 * Issue a fresh pair of tokens for `userId`. Called once after online login
 * from the client via `POST /api/auth/device-tokens`.
 */
export async function issueDeviceTokens(
  userId: string,
  deviceName: string
): Promise<DeviceTokenBundle> {
  const id = crypto.randomUUID();
  const refreshToken = randomToken();
  const refreshTokenHash = await sha256Hex(refreshToken);
  const now = Date.now();
  const accessExpiresAt = now + ACCESS_TTL_MS;
  const refreshExpiresAt = now + REFRESH_TTL_MS;

  await db.insert(deviceTokens).values({
    id,
    userId,
    deviceName,
    refreshTokenHash,
    accessExpiresAt: new Date(accessExpiresAt),
    refreshExpiresAt: new Date(refreshExpiresAt),
    lastSeenAt: new Date(now),
  });

  const access = await mintAccessToken(userId, id);
  return {
    accessToken: access.token,
    accessExpiresAt: access.expiresAt,
    refreshToken,
    refreshExpiresAt,
    deviceId: id,
  };
}

/**
 * Rotate a refresh token. The old refresh token hash is invalidated on every
 * successful rotation so a leaked refresh token becomes single-use.
 */
export async function rotateRefreshToken(
  refreshToken: string
): Promise<DeviceTokenBundle | null> {
  const hash = await sha256Hex(refreshToken);
  const [row] = await db
    .select()
    .from(deviceTokens)
    .where(and(eq(deviceTokens.refreshTokenHash, hash), isNull(deviceTokens.revokedAt)))
    .limit(1);
  if (!row) return null;
  if (row.refreshExpiresAt.getTime() < Date.now()) return null;

  const nextRefresh = randomToken();
  const nextHash = await sha256Hex(nextRefresh);
  const now = Date.now();
  const accessExpiresAt = now + ACCESS_TTL_MS;
  const refreshExpiresAt = now + REFRESH_TTL_MS;

  await db
    .update(deviceTokens)
    .set({
      refreshTokenHash: nextHash,
      accessExpiresAt: new Date(accessExpiresAt),
      refreshExpiresAt: new Date(refreshExpiresAt),
      lastSeenAt: new Date(now),
    })
    .where(eq(deviceTokens.id, row.id));

  const access = await mintAccessToken(row.userId, row.id);
  return {
    accessToken: access.token,
    accessExpiresAt: access.expiresAt,
    refreshToken: nextRefresh,
    refreshExpiresAt,
    deviceId: row.id,
  };
}

export async function revokeDeviceToken(deviceId: string) {
  await db
    .update(deviceTokens)
    .set({ revokedAt: new Date() })
    .where(eq(deviceTokens.id, deviceId));
}

export interface AccessTokenClaims {
  userId: string;
  deviceId: string;
}

/**
 * Verify a Bearer access JWT. Returns `null` on any failure (expired,
 * malformed, wrong signature) so callers can respond 401 uniformly.
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    const userId = payload.userId;
    const deviceId = payload.deviceId;
    if (typeof userId !== "string" || typeof deviceId !== "string") {
      return null;
    }
    return { userId, deviceId };
  } catch {
    return null;
  }
}

/** Extract the Bearer token from a request and verify it. */
export async function authenticateBearer(
  req: Request
): Promise<AccessTokenClaims | null> {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return verifyAccessToken(token);
}
