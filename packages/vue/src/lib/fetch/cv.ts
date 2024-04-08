import { cvItem } from "../interface.ts"
export const uploadCV =
  async ( formData: FormData ) =>
    fetch( "/fastify/cv",
      {
        method: "POST",
        credentials: "include",
        body: formData
      } ).then( ( response ) =>
        ( response.ok ? response.json() : undefined ) )
      .then( ( value: { result: string } | undefined ) =>
        value?.result )
export const deliverCV =
  async ( no: number ) =>
    fetch( `/fastify/cv-deliver?no=${ no.toString() }`,
      {
        method: "GET",
        credentials: "include"
      } ).then( ( response ) =>
        ( response.ok ? response.json() : undefined ) )
      .then( ( value: { result: boolean } | undefined ) =>
        value?.result )
export const receiveCV =
  async ( no: number ) =>
    fetch( `/fastify/cv-receive?no=${ no.toString() }`,
      {
        method: "GET",
        credentials: "include"
      } ).then( ( response ) =>
        ( response.ok ? response.json() : undefined ) )
      .then( ( value: { list: cvItem[] } | undefined ) =>
        value?.list )
export const removeCV =
  async ( action: string, no: number, cv: string, corpname: string,
    datetime?: string, location?: string ) => {
    let body
    if ( action === "welcome" && datetime && location ) {
      body = JSON.stringify( {
        no: no,
        cv: cv,
        corpname: corpname,
        datetime: datetime,
        location: location
      } )
    } else if ( action === "refuse" ) {
      body = JSON.stringify( { no: no, cv: cv, corpname: corpname } )
    } else {
      return false
    }
    return fetch( `/fastify/cv-remove/${ action }`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: body
      } ).then( ( response ) =>
        ( response.ok ? response.json() : undefined ) )
      .then( ( value: { result: boolean } | undefined ) =>
        value?.result )
  }
