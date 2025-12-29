import { cookies } from "next/headers"
import { jwtVerify, jwtSign } from "./jwt"

export interface Session {
  userId: string
  role: string
}

export async function setSessionCookie(userId: string, role: string) {
  console.log('Creating JWT token...')
  const token = await jwtSign({
    userId,
    role,
  })
  console.log('JWT token created')

  console.log('Getting cookie store...')
  const cookieStore = await cookies()
  console.log('Cookie store obtained')

  console.log('Setting cookie...')
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: false, // Set to false for HTTP in local/production if needed
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/", // Explicitly set path
  })
  console.log('Cookie set successfully')
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
