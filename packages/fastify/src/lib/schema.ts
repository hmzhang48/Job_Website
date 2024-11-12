import
{
  pgTable, pgEnum, customType, text, boolean, uuid, serial, timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
export const users = pgTable(
  'users',
  {
    email: text( 'email' ).notNull().unique(),
    password: text( 'password' ).notNull(),
    hr: boolean( 'hr' ).notNull(),
    uuid: uuid( 'uuid' ).notNull().primaryKey(),
  }
)
export const userInfo = pgTable(
  'userinfo',
  {
    name: text( 'name' ).notNull(),
    id: text( 'id' ).notNull().unique(),
    avatar: text( 'avatar' ).notNull().unique(),
    phone: text( 'phone' ).notNull().unique(),
    location: text( 'location' ).notNull().unique(),
    cv: text( 'cv' ).default( '' ).notNull().unique(),
    valid: boolean( 'valid' ).default( false ).notNull(),
    uuid: uuid( 'uuid' ).notNull().primaryKey()
      .references( () => users.uuid ),
  }
)
export const corpInfo = pgTable(
  'corpinfo',
  {
    corpName: text( 'corpname' ).notNull(),
    corpId: text( 'corpid' ).notNull().primaryKey(),
    logo: text( 'logo' ).notNull().unique(),
    brief: text( 'brief' ).notNull(),
    chiefHR: text( 'chiefhr' ).notNull(),
    valid: boolean( 'valid' ).default( false ).notNull(),
  }
)
export const hrInfo = pgTable(
  'hrinfo',
  {
    name: text( 'name' ).notNull(),
    hrId: text( 'hrid' ).notNull(),
    corpId: text( 'corpid' ).notNull()
      .references( () => corpInfo.corpId ),
    avatar: text( 'avatar' ).notNull().unique(),
    phone: text( 'phone' ).notNull().unique(),
    uuid: uuid( 'uuid' ).notNull().primaryKey()
      .references( () => users.uuid ),
  }
)
export const jobType = pgEnum( 'jobtype', [ 'full-time', 'part-time' ] )
const numberRange = customType<{ data: string }>( {
  dataType: () => 'numrange',
} )
const textArray = customType<{ data: string[] | '{}' }>( {
  dataType: () => 'text[]',
} )
export const jobInfo = pgTable(
  'jobinfo',
  {
    position: text( 'position' ).notNull(),
    type: jobType( 'type' ).notNull(),
    salary: numberRange( 'salary' ).notNull(),
    overview: text( 'overview' ).notNull(),
    location: text( 'location' ).notNull(),
    corpId: text( 'corpid' ).notNull()
      .references( () => corpInfo.corpId ),
    no: serial( 'no' ).notNull(),
    cvList: textArray( 'cvlist' ).default( '{}' ).notNull(),
  }
)
export const infoBox = pgTable(
  'infobox',
  {
    uuid: uuid( 'uuid' ).notNull().primaryKey()
      .references( () => users.uuid ),
    info: text( 'info' ).notNull(),
    time: timestamp( 'time' ).defaultNow().notNull(),
    read: boolean( 'read' ).default( false ).notNull(),
    no: serial( 'no' ).notNull(),
  }
)
export const corpRelations = relations(
  corpInfo,
  ( { many } ) => ( {
    hrList: many( hrInfo ),
  } )
)
export const hrRelations = relations(
  hrInfo,
  ( { one } ) => ( {
    corpInfo: one( corpInfo, {
      fields: [ hrInfo.corpId ],
      references: [ corpInfo.corpId ],
    } ),
  } )
)
export const jobRelations = relations(
  jobInfo,
  ( { one } ) => ( {
    corpInfo: one( corpInfo, {
      fields: [ jobInfo.corpId ],
      references: [ corpInfo.corpId ],
    } ),
  } )
)
