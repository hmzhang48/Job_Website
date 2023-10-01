export interface User {
  email: string
  password: string
  hr: boolean
  uuid: string
}

interface info {
  name: string
  phone: string
  uuid: string
  avatar: string
}

export interface UserInfo extends info {
  id: string
  location: string
  valid: boolean
  cv: string
}

export interface HRInfo extends info {
  hrid: string
  corpid: string
}

export interface CorpInfo {
  corpname: string
  corpid: string
  brief: string
  chiefhr: string
  valid: boolean
  logo: string
}

export interface JobInfo {
  position: string
  brief: string
  type: "full-time" | "part-time"
  salary: string
  location: string
  corpid: string
  no: number
  cvlist: string[]
}

export interface InfoBox {
  uuid: string
  info: string
  read: boolean
  time: string
  no: number
}
