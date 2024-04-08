export interface User {
  email: string
  password: string
  hr: boolean
}
interface info {
  name: string
  avatar: string
  phone: string
}
export interface userInfo extends info {
  id: string
  location: string
  cv: string
  valid: boolean
}
export interface hrInfo extends info {
  hrID: string
  corpID: string
}
export interface corpInfo {
  corpName: string
  logo: string
  corpID: string
  brief: string
  chiefHR: string
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
export interface cvItem {
  name: string
  cv: string
}
export interface infoItem {
  info: string
  read: boolean
  time: string
  no: number
}
