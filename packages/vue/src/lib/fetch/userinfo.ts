import type { userInfo } from '../interface.ts'
export const getUserInfo = async () =>
  fetch(
    '/api/userinfo',
    { method: 'GET', credentials: 'include' }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { info: userInfo } | undefined) => value?.info)
export const postUserInfo = async (userInfo: Omit<userInfo, 'cv' | 'valid'>) =>
  fetch(
    '/api/userinfo',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userInfo),
    }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const patchUserInfo = async (body: { phone?: string, location?: string }) =>
  fetch(
    '/api/userinfo',
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)