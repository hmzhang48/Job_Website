import { jobInfo, jobItem } from '../interface.ts'
export const getJobList = async (c: Record<string, string | number>) => {
  let url = '/fastify/jobinfo?'
  for (const [key, value] of Object.entries(c)) {
    url += `${key}=${value}&`
  }
  url = url.slice(0, -1)
  return fetch(url, { method: 'GET', credentials: 'include' })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { list: jobItem[] } | undefined) => {
      if (!value) {
        return value
      }
      for (const item of value.list) {
        if (item.type === 'full-time') {
          item.salary += '千元/月'
        }
        else if (item.type === 'part-time') {
          item.salary += '元/小时'
        }
      }
      return value.list
    })
}
export const finishJob = async (jobInfo: jobInfo) =>
  fetch('/fastify/jobinfo',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(jobInfo),
    })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const patchJob = async (jobInfo: Partial<jobInfo>, no: number, corpId: string) =>
  fetch('/fastify/jobinfo',
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ no: no, corpId: corpId, ...jobInfo }),
    })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const deleteJob = async (no: number, corpId: string) =>
  fetch('/fastify/jobinfo',
    {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ no: no, corpId: corpId }),
    })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
