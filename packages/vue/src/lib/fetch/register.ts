import type { User } from '../interface.ts'
export const existMail = async (email: string) =>
  fetch(
    '/api/email-check?email=' + email,
    { method: 'GET' }
  )
    .then(response => response.json())
    .then((value: { result: boolean }) => value.result)
export const validMail = async (email: string) =>
  fetch(
    '/api/email-validate?email=' + email,
    { method: 'GET' }
  )
    .then(response => response.json())
    .then((value: { result: boolean }) => value.result)
export const validPhone = async (phone: string) =>
  fetch(
    '/api/phone-validate?phone=' + phone,
    { method: 'GET' }
  )
    .then(response => response.json())
    .then((value: { result: boolean }) => value.result)

export const validCode = async (key: string, value: string) =>
  fetch(
    '/api/code-validate?key=' + key + '&value=' + value,
    { method: 'GET' }
  )
    .then(response => response.json())
    .then((value: { result: boolean }) => value.result)
export const register = async (user: User) =>
  fetch(
    '/api/register',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user),
    }
  )
    .then(response => response.json())
    .then((value: { result: boolean }) => value.result)