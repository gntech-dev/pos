import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export async function authenticateUser(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !user.isActive) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return null
    }

    // Update last login (non-blocking)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(() => {})

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      username: user.username,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorSecret: user.twoFactorSecret,
      backupCodes: user.backupCodes,
    }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}
