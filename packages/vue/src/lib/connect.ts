import { domain } from "./help.ts"
interface User {
  email: string
  password: string
  hr: boolean
}
export const register = async ( user: User ) => {
  return fetch( domain + "/fastify/register", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    credentials: 'include',
    body: JSON.stringify( user ),
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const login = async ( user: Omit<User, "hr"> ) => {
  return fetch( domain + "/fastify/login", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    credentials: 'include',
    body: JSON.stringify( user ),
  } )
    .then( ( response ) =>
      response.status === 200 ? response.json() : undefined
    )
    .then( ( value: { result: boolean } | undefined ) =>
      value?.result
    )
}
export const logout = async () => {
  return fetch( domain + "/fastify/logout", {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const guide = async () => {
  return fetch( domain + "/fastify/guide", {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) =>
      response.status === 200 ? response.json() : undefined
    )
    .then( ( value: { hr: boolean, guide: boolean } | undefined ) =>
      value ? [ true, value.hr, value.guide ] : [ false, false, true ]
    )
}
export const existMail = async ( email: string ) => {
  return fetch( domain + "/fastify/email-check?email=" + email, { method: "GET" } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const validMail = async ( email: string ) => {
  return fetch( domain + "/fastify/email-validate?email=" + email, { method: "GET" } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: string } ) => value.result )
}
export const resetMail = async ( email: string ) => {
  return fetch( domain + "/fastify/email-reset", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( { email: email } ),
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const resetPassword = async ( oldPassword: string, newPassword: string ) => {
  return fetch( domain + "/fastify/password-reset", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( { oldPassword: oldPassword, newPassword: newPassword } ),
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: string } ) => value.result )
}
export const validPhone = async ( phone: string ) => {
  return fetch( domain + "/fastify/phone-validate?phone=" + phone, { method: "GET" } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: string } ) => value.result )
}
export const uploadImage = async ( formData: FormData ) => {
  return fetch( domain + "/fastify/image", {
    method: "POST",
    credentials: 'include',
    body: formData,
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: string } ) => value.result )
}
export const resetAvatar = async ( formData: FormData, fileName: string | undefined ) => {
  return fileName ? fetch( domain + "/fastify/image?fileName=" + fileName, {
    method: "PATCH",
    credentials: 'include',
    body: formData,
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: string } ) => value.result ) : ''
}
interface info {
  name: string
  avatar: string
  phone: string
}
interface userInfo extends info {
  id: string
  location: string
  cv: string
  valid: boolean
}
export const getUserInfo = async () => {
  return fetch( domain + "/fastify/userinfo", {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { info: userInfo } ) => value.info )
}
export const postUserInfo = async ( userInfo: Omit<userInfo, "cv" | "valid"> ) => {
  return fetch( domain + "/fastify/userinfo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( userInfo ),
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const existCorp = async ( corpid: string ) => {
  return fetch( domain + "/fastify/corp-check?corpid=" + corpid, {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
interface hrInfo extends info {
  hrID: string
  corpID: string
}
export const getHRInfo = async () => {
  return fetch( domain + "/fastify/hrinfo", {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { info: hrInfo } ) => value.info )
}
export const postHRInfo = async ( hrInfo: hrInfo ) => {
  return fetch( domain + "/fastify/hrinfo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( hrInfo ),
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
interface corpInfo {
  corpName: string
  logo: string
  corpID: string
  brief: string
  chiefHR: string
}
export const getCorpInfo = async ( logo?: string ) => {
  let url = domain + "/fastify/corpinfo"
  if ( logo ) {
    url += `?logo=${ logo }`
  }
  return fetch( url, {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: {
      info: Omit<corpInfo, "corpID" | "chiefHR"> & { valid?: boolean },
      list?: Pick<hrInfo, "name" | "hrID">[]
    } ) => value )
}
export const postCorpInfo = async ( corpInfo: corpInfo ) => {
  return fetch( domain + "/fastify/corpinfo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( corpInfo ),
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export interface jobInfo {
  position: string
  overview: string
  type: string
  salary: string
  location: string
}
export interface jobItem extends jobInfo {
  no: number
  corpInfo: {
    corpName: string
    logo: string
  }
}
export const getJobList = async (
  c: Partial<Omit<jobInfo, "overview">> & { logo?: string, offset?: number } ) => {
  let url = domain + "/fastify/jobinfo?"
  for ( const [ key, value ] of Object.entries( c ) ) {
    url = url + `${ key }=${ value }` + "&"
  }
  return fetch( url, {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { list: jobItem[] } ) => {
      for ( const item of value.list ) {
        if ( item.type === "full-time" ) {
          item.salary += "千元/月"
        }
        if ( item.type === "part-time" ) {
          item.salary += "元/小时"
        }
      }
      return value.list
    } )
}
export const finishJob = async ( jobInfo: jobInfo ) => {
  return fetch( domain + "/fastify/jobinfo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( jobInfo )
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const patchJob = async (
  jobInfo: Partial<jobInfo> & { no: number, corpID: string } ) => {
  return fetch( domain + "/fastify/jobinfo", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( jobInfo )
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const deleteJob = async ( no: number, corpid: string ) => {
  return fetch( domain + "/fastify/jobinfo", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( { no: no, corpid: corpid } )
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const patchInfo = async ( target: "userinfo" | "hrinfo", phone?: string, location?: string ) => {
  const source = `${ domain }/fastify/${ target }`
  const body = Object.create( null )
  if ( target === "userinfo" ) {
    body.phone = phone
    body.location = location
  } else if ( target === "hrinfo" ) {
    body.phone = phone
  }
  return fetch( source, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( body )
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const uploadCV = async ( file: File ) => {
  const formData = new FormData()
  formData.append( "cv", file )
  return fetch( domain + "/fastify/cv", {
    method: "POST",
    credentials: 'include',
    body: formData
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean, cv?: string } ) => {
      return value.result ? value.cv as string : ""
    } )
}
export const deliverCV = async ( no: number ) => {
  return fetch( `${ domain }/fastify/cv-deliver?no=${ no.toString() }`, {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export interface cvItem {
  name: string
  cv: string
}
export const receiveCV = async ( no: number ) => {
  return fetch( `${ domain }/fastify/cv-receive?no=${ no.toString() }`, {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { list: cvItem[] } ) => value.list )
}
export const removeCV = async ( action: string, no: number, cv: string, corpname: string, datetime?: string, location?: string ) => {
  let body = ""
  if ( action === "welcome" && datetime && location ) {
    body = JSON.stringify( { no: no, cv: cv, corpname: corpname, datetime: datetime, location: location } )
  } else if ( action === "refuse" ) {
    body = JSON.stringify( { no: no, cv: cv, corpname: corpname } )
  } else {
    return false
  }
  return fetch( `${ domain }/fastify/cv-remove/${ action }`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    credentials: 'include',
    body: body
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export interface infoItem {
  info: string
  read: boolean
  time: string
  no: number
}
export const getInfoBox = async ( offset: number ) => {
  return fetch( `${ domain }/fastify/infobox?offset=${ offset.toString() }`, {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { list: infoItem[] } ) => value.list )
}
export const changeInfoBox = async ( no: number, action: string ) => {
  return fetch( `${ domain }/fastify/infobox/${ action }?no=${ no.toString() }`, {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
