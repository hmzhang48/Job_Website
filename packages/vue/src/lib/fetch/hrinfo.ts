import { hrInfo } from "../interface.ts"
export const getHRInfo = async () =>
  fetch( "/fastify/hrinfo",
    {
      method: "GET",
      credentials: "include"
    } ).then( ( response ) =>
      ( response.ok ? response.json() : undefined ) )
    .then( ( value: { info: hrInfo } | undefined ) =>
      value?.info )
export const postHRInfo =
  async ( hrInfo: hrInfo ) =>
    fetch( "/fastify/hrinfo",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify( hrInfo )
      } ).then( ( response ) =>
        ( response.ok ? response.json() : undefined ) )
      .then( ( value: { result: boolean } | undefined ) =>
        value?.result )
export const patchHRInfo =
  async ( phone?: string ) =>
    fetch( "/fastify/hrinfo",
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify( { phone: phone } )
      } )
      .then( ( response ) =>
        ( response.ok ? response.json() : undefined ) )
      .then( ( value: { result: boolean } ) =>
        value?.result )
