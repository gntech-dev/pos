import { prisma } from "../../lib/prisma"
import bcrypt from "bcryptjs"
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_ENTITIES } from "../../lib/audit"

export class AuthService {
  static async validateCredentials(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        lastLogin: true
      }
    })

    if (!user || !user.isActive) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return null
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Log successful login
    await logAuditEvent({
      userId: user.id,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      newValue: { email: user.email },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  }

  static async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })
  }

  static async updateUserLastActivity(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() }
    })
  }
}