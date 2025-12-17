import { SignJWT, jwtVerify as joseVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "your-secret-key"
)

interface JwtPayload {
  [key: string]: unknown
}

export async function jwtSign(payload: JwtPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret)
}

export async function jwtVerify(token: string) {
  try {
    const verified = await joseVerify(token, secret)
    return verified.payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    // Verification failed — return null so callers can handle unauthenticated state
    return null
  }
}
