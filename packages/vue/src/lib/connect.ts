import { domain } from "./help.js"
import type { province, city, area } from "./help.js"

interface User {
  email: string
  password: string
  hr: boolean
}
export const register = async ( user: User ) => {
  return fetch( domain + "/fastify/", {
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
    .then( ( response ) => response.json() )
    .then( ( value: { result: string } ) => value.result )
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
  return fetch( domain + "/fastify/", {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { user: boolean, guide: boolean, hr: boolean } ) => value )
}
export const existMail = async ( email: string ) => {
  return fetch( domain + "/fastify/email-check?email=" + email, { method: "GET" } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
export const validMail = async ( email: string ) => {
  return fetch( domain + "/fastify/email-validate?email=" + email, { method: "GET" } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: string | null } ) => value.result )
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
    .then( ( value: { result: string | null } ) => value.result )
}

export const areas: area[] = await fetch( domain + "/fastify/JSON/areas.json" )
  .then( ( response ) => response.json() )
export const cities: city[] = await fetch( domain + "/fastify/JSON/cities.json" )
  .then( ( response ) => response.json() )
export const provinces: province[] = await fetch( domain + "/fastify/JSON/provinces.json" )
  .then( ( response ) => response.json() )

export const uploadImage = async ( formData: FormData ) => {
  return fetch( domain + "/fastify/image-upload", {
    method: "POST",
    credentials: 'include',
    body: formData,
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: string } ) => value.result )
}

export const resetAvatar = async ( formData: FormData, fileName: string | undefined ) => {
  if ( fileName ) {
    return fetch( domain + "/fastify/avatar-reset?fileName=" + fileName, {
      method: "PATCH",
      credentials: 'include',
      body: formData,
    } )
      .then( ( response ) => response.json() )
      .then( ( value: { result: string } ) => value.result )
  } else {
    return ''
  }
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
    .then( ( value: { result: userInfo | undefined } ) => value.result )
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
  hrid: string
  corpid: string
}
export const getHRInfo = async () => {
  return fetch( domain + "/fastify/hrinfo", {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: hrInfo | undefined } ) => value.result )
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
interface corpInfo1 {
  corpname: string
  logo: string
  corpid: string
  brief: string
  chiefhr: string
}
type hr = Pick<hrInfo, "name" | "hrid">
interface corpInfo2 extends Omit<corpInfo1, "corpid" | "chiefhr"> {
  valid?: boolean
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
    .then( ( value: { result: corpInfo2, addition?: hr[] } ) => value )
}
export const postCorpInfo = async ( corpInfo: corpInfo1 ) => {
  return fetch( domain + "/fastify/corpinfo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify( corpInfo ),
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
interface shared {
  position: string
  type: string
  salary: string
  location: string
  logo: string
}
export interface condition extends shared {
  offset: string
}
export interface jobItem extends shared {
  overview: string
  no: number
  corpname: string
}
export const getJobList = async ( c: Partial<condition> ) => {
  let url = domain + "/fastify/jobinfo?"
  for ( const [ key, value ] of Object.entries( c ) ) {
    url = url + `${ key }=${ value }` + "&"
  }
  return fetch( url, {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: jobItem[] } ) => {
      value.result.forEach( ( item ) => {
        if ( item.type === "full-time" ) {
          item.salary += "千元/月"
        }
        if ( item.type === "part-time" ) {
          item.salary += "元/小时"
        }
      } )
      return value.result
    } )
}
export interface jobInfo extends Omit<shared, "corp"> {
  overview: string
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
interface newJobInfo extends Partial<jobInfo> {
  no: number,
  corpID: string
}
export const patchJob = async ( jobInfo: newJobInfo ) => {
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
  const src = `${ domain }/fastify/${ target }`
  const body = Object.create( null )
  if ( target === "userinfo" ) {
    body.phone = phone
    body.location = location
  } else if ( target === "hrinfo" ) {
    body.phone = phone
  }
  return fetch( src, {
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
  return fetch( domain + "/fastify/cv-upload", {
    method: "POST",
    credentials: 'include',
    body: formData
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean, cv?: string } ) => {
      if ( value.result ) {
        return value.cv as string
      } else {
        return ""
      }
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
    .then( ( value: { result: cvItem[] } ) => value.result )
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
    .then( ( value: { result: infoItem[] } ) => value.result )
}

export const changeInfoBox = async ( no: number, action: string ) => {
  return fetch( `${ domain }/fastify/infobox/${ action }?no=${ no.toString() }`, {
    method: "GET",
    credentials: 'include',
  } )
    .then( ( response ) => response.json() )
    .then( ( value: { result: boolean } ) => value.result )
}
