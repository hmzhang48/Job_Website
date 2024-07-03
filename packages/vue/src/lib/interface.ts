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
  hrId: string
  corpId: string
}
export interface corpInfo {
  corpName: string
  logo: string
  corpId: string
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
export interface province {
  code: string,
  name: string,
}
export interface city extends province {
  provinceCode: string
}

export interface area extends city{
  cityCode: string,
}
