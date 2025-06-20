import type { User } from '../interface.ts'
export const login = async (user: Omit<User, 'hr'>) =>
  fetch(
    '/api/login',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user),
    }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const logout = async () =>
  fetch(
    '/api/logout',
    { method: 'GET', credentials: 'include' }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const guide = async () =>
  fetch(
    '/api/guide',
    { method: 'GET', credentials: 'include' }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { hr: boolean, guide: boolean } | undefined) => value)