export const resetMail = async (email: string) =>
  fetch(
    '/email-reset',
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email }),
    }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const resetPassword = async (oldPassword: string, newPassword: string) =>
  fetch(
    '/password-reset',
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ oldPassword: oldPassword, newPassword: newPassword }),
    }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: string } | undefined) => value?.result)
