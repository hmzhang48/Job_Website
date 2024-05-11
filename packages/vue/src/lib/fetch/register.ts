import type { User } from '../interface.ts'
export const existMail = async (email: string) =>
  fetch('/fastify/email-check?email=' + email, { method: 'GET' })
    .then(response => response.json())
    .then((value: { result: boolean }) => value.result)
export const validMail = async (email: string) =>
  fetch('/fastify/email-validate?email=' + email, { method: 'GET' })
    .then(response => response.json())
    .then((value: { result: string }) => value.result)
export const validPhone = async (phone: string) =>
  fetch('/fastify/phone-validate?phone=' + phone, { method: 'GET' })
    .then(response => response.json())
    .then((value: { result: string }) => value.result)
export const register = async (user: User) =>
  fetch('/fastify/register',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user),
    })
    .then(response => response.json())
    .then((value: { result: boolean }) => value.result)
