import type { infoItem } from '../interface.ts'
export const getInfoBox = async (offset: number, limit: number) =>
  fetch(
    `/api/infobox?offset=${offset.toString()}&limit=${limit.toString()}`,
    { method: 'GET', credentials: 'include' }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { list: infoItem[] } | undefined) => value?.list)
export const changeInfoBox = async (no: number, action: string) =>
  fetch(
    `/api/infobox/${action}?no=${no.toString()}`,
    { method: 'GET', credentials: 'include' }
  )
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: boolean } | undefined) => value?.result)