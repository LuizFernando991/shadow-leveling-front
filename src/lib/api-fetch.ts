const TOKEN_KEY = 'auth_token'

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY)

  const res = await fetch(path, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (res.status === 401 && token) {
    localStorage.removeItem(TOKEN_KEY)
    window.location.assign('/login')
  }

  return res
}
