import type { User } from '../interface.ts'
export const existMail = async (email: string) =>
  fetch('/email-check?email=' + email, { method: 'GET' })
    .then(response => response.json())
    .then((value: { result: boolean }) => value.result)
export const validMail = async (email: string) =>
  fetch('/email-validate?email=' + email, { method: 'GET' })
    .then(response => response.json())
    .then((value: { result: string }) => value.result)
export const validPhone = async (phone: string) =>
  fetch('/phone-validate?phone=' + phone, { method: 'GET' })
    .then(response => response.json())
    .then((value: { result: string }) => value.result)
export const register = async (user: User) =>
  fetch('/register',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user),
    })
    .then(response => response.json())
    .then((value: { result: boolean }) => value.result)
