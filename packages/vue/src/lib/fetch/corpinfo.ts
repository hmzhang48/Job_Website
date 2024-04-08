import { hrInfo, corpInfo } from "../interface.ts"
export const existCorp =
  async ( corpid: string ) =>
    fetch( "/fastify/corp-check?corpid=" + corpid,
      {
        method: "GET",
        credentials: "include"
      } ).then( ( response ) =>
        ( response.ok ? response.json() : undefined ) )
      .then( ( value: { result: boolean } | undefined ) =>
        value?.result )
export const getCorpInfo =
  async ( logo?: string ) =>
    fetch( `/fastify/corpinfo${ logo ? "?logo=" + logo : "" }`,
      {
        method: "GET",
        credentials: "include"
      } ).then( ( response ) =>
        ( response.ok ? response.json() : undefined ) )
      .then( ( value: {
        info: Omit<corpInfo, "corpID" | "chiefHR"> & { valid?: boolean }
        list?: Pick<hrInfo, "name" | "hrID">[]
      } | undefined ) => value )
export const postCorpInfo =
  async ( corpInfo: corpInfo ) =>
    fetch( "/fastify/corpinfo",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify( corpInfo )
      } ).then( ( response ) =>
        ( response.ok ? response.json() : undefined ) )
      .then( ( value: { result: boolean } | undefined ) =>
        value?.result )
