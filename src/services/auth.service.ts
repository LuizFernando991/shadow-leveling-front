import { apiFetch } from '@/lib/api-fetch'
import type { LoginInput, RegisterInput } from '@/schemas/auth.schema'
import type { AuthResponse } from '@/types/auth'
import type { User } from '@/types/user'

export class EmailTakenError extends Error {
  constructor() {
    super('Este email já está cadastrado')
  }
}

export class EmailNotVerifiedError extends Error {
  constructor() {
    super('Email ainda não verificado')
  }
}

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}))
  throw new Error((body as { error?: string }).error ?? 'Erro inesperado')
}

export async function requestLogin(data: LoginInput): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (res.status === 403) throw new EmailNotVerifiedError()
  if (!res.ok) return parseError(res)
  return res.json()
}

export async function verifyLogin(data: { email: string; code: string }): Promise<AuthResponse> {
  const res = await apiFetch('/api/auth/login/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) return parseError(res)
  return res.json()
}

export async function requestRegister(data: Pick<RegisterInput, 'email' | 'password'>): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (res.status === 409) throw new EmailTakenError()
  if (!res.ok) return parseError(res)
  return res.json()
}

export async function verifyRegister(data: { email: string; code: string }): Promise<AuthResponse> {
  const res = await apiFetch('/api/auth/register/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) return parseError(res)
  return res.json()
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return parseError(res)
  return res.json()
}
