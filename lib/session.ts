import { cookies } from "next/headers"
import { jwtVerify, jwtSign } from "./jwt"

export interface Session {
  userId: string
  role: string
}

export async function setSessionCookie(userId: string, role: string) {
  const token = await jwtSign({
    userId,
    role,
  })

  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
  })
}

export async function getSessionFromCookie(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!token) {
    return null
  }

  try {
    const payload = await jwtVerify(token)
    return payload as unknown as Session
  } catch {
    return null
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
