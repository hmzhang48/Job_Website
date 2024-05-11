import { User } from '../interface.ts'
export const login = async (user: Omit<User, 'hr'>) =>
  fetch('/fastify/login',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user),
    })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const logout = async () =>
  fetch('/fastify/logout',
    { method: 'GET', credentials: 'include' })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const guide = async () =>
  fetch('/fastify/guide',
    { method: 'GET', credentials: 'include' })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { hr: boolean, guide: boolean } | undefined) => value)
