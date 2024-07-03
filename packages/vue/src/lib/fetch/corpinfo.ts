import { hrInfo, corpInfo } from '../interface.ts'
export const existCorp = async (corpid: string) =>
  fetch('/corp-check?corpid=' + corpid,
    { method: 'GET', credentials: 'include' })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
export const getCorpInfo = async (logo?: string) =>
  fetch(`/corpinfo${logo ? '?logo=' + logo : ''}`,
    { method: 'GET', credentials: 'include' })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: {
      info: Omit<corpInfo, 'corpId' | 'chiefHR'> &
      { valid?: boolean } &
      { hrList?: Pick<hrInfo, 'name' | 'hrId' | 'avatar'>[] }
    } | undefined) => value)
export const postCorpInfo = async (corpInfo: corpInfo) =>
  fetch('/corpinfo',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(corpInfo),
    })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)
