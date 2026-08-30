import { hash, compare } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// Initialize the secret key for Jose (Edge-compatible)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret'
);

/**
 * Hashes a plain text password (useful if you add email/pass login later)
 */
export async function hashPassword(password: string) {
  return await hash(password, 12);
}

/**
 * Verifies a plain text password against a hash
 */
export async function verifyPassword(password: string, hash: string) {
  return await compare(password, hash);
}

/**
 * Creates a signed JWT session token for a user
 */
export async function createSession(userId: string, hasConsent: boolean = false) {
  const token = await new SignJWT({ userId, hasConsent })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Session lasts 7 days
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Verifies a JWT session token and returns the userId
 * Returns null if the token is invalid or expired
 */
export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch (error) {
    // console.error("Session verification failed:", error);
    return null;
  }
}

/**
 * Verifies a JWT session token and returns the payload data
 */
export async function verifySessionData(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string, hasConsent: payload.hasConsent as boolean };
  } catch (error) {
    // console.error("Session verification failed:", error);
    return null;
  }
}