import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { verify2FAToken, verifyBackupCode, removeUsedBackupCode } from "./2fa"
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_ENTITIES } from "./audit"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }
  
  interface User {
    id: string
    name: string
    email: string
    role: string
  }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        twoFactorToken: { label: "2FA Token", type: "text" },
        backupCode: { label: "Backup Code", type: "text" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const clientIP = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                        req?.headers?.['x-real-ip'] ||
                        'unknown'

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          })

          if (!user || !user.isActive) {
            // Log failed login attempt
            await logAuditEvent({
              userId: 'unknown',
              action: AUDIT_ACTIONS.LOGIN_FAILED,
              entity: AUDIT_ENTITIES.AUTH,
              entityId: credentials.username,
              oldValue: { reason: 'User not found or inactive' },
              ipAddress: clientIP,
            })
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            // Log failed login attempt
            await logAuditEvent({
              userId: user.id,
              action: AUDIT_ACTIONS.LOGIN_FAILED,
              entity: AUDIT_ENTITIES.AUTH,
              entityId: user.username,
              oldValue: { reason: 'Invalid password' },
              ipAddress: clientIP,
            })
            return null
          }

          // Check 2FA if enabled
          if (user.twoFactorEnabled && user.twoFactorSecret) {
            const token = credentials.twoFactorToken
            const backupCode = credentials.backupCode

            let is2FAValid = false

            if (token) {
              is2FAValid = verify2FAToken(user.twoFactorSecret, token)
            } else if (backupCode && user.backupCodes) {
              const storedCodes = JSON.parse(user.backupCodes)
              is2FAValid = verifyBackupCode(storedCodes, backupCode)

              if (is2FAValid) {
                // Remove used backup code
                const updatedCodes = removeUsedBackupCode(storedCodes, backupCode)
                await prisma.user.update({
                  where: { id: user.id },
                  data: { backupCodes: JSON.stringify(updatedCodes) }
                })
              }
            }

            if (!is2FAValid) {
              // Log failed 2FA attempt
              await logAuditEvent({
                userId: user.id,
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                entity: AUDIT_ENTITIES.AUTH,
                entityId: user.username,
                oldValue: { reason: 'Invalid 2FA token or backup code' },
                ipAddress: clientIP,
              })
              return null
            }
          }

          // Update last login (non-blocking)
          prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          }).catch(() => {})

          // Log successful login
          await logAuditEvent({
            userId: user.id,
            action: AUDIT_ACTIONS.LOGIN_SUCCESS,
            entity: AUDIT_ENTITIES.AUTH,
            entityId: user.username,
            newValue: { role: user.role },
            ipAddress: clientIP,
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  }
}
