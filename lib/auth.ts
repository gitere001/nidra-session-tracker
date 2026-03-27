import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signToken(payload: { id: number; name: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { id: number; name: string; email: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const token = cookies().get('token')?.value
  if (!token) return null
  return verifyToken(token)
}