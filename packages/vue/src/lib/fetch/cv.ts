import { cvItem } from '../interface.ts'
export const uploadCv = async (formData: FormData) =>
  fetch(
    '/cv',
    { method: 'POST', credentials: 'include', body: formData }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: string } | undefined) => value?.result)
export const deliverCv = async (no: number) =>
  fetch(
    `/cv-deliver?no=${no.toString()}`,
    { method: 'GET', credentials: 'include' }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const receiveCv = async (no: number) =>
  fetch(
    `/cv-receive?no=${no.toString()}`,
    { method: 'GET', credentials: 'include' }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { list: cvItem[] } | undefined) => value?.list)
export const removeCv = async (
  action: string, no: number, cv: string, corpName: string, datetime?: string, location?: string,
) => {
  let body
  if (action === 'welcome' && datetime && location)
    body = JSON.stringify({
      no: no,
      cv: cv,
      corpName: corpName,
      datetime: datetime,
      location: location,
    })
  else if (action === 'refuse')
    body = JSON.stringify({ no: no, cv: cv, corpName: corpName })
  else
    return false
  return fetch(
    `/cv-remove/${action}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: body,
    }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
}
