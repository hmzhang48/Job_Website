/** @format */

export const up = async (knex) => {
  return knex.schema
    .createTable("users", (table) => {
      table.text("email").notNullable().unique()
      table.text("password").notNullable()
      table.boolean("hr").notNullable()
      table.uuid("uuid").notNullable().primary()
    })
    .createTable("userinfo", (table) => {
      table.text("name").notNullable()
      table.text("id").notNullable().unique()
      table.text("avatar").notNullable().unique()
      table.text("phone").notNullable().unique()
      table.text("location").notNullable()
      table.text("cv").defaultTo("").unique().notNullable()
      table.boolean("valid").defaultTo(false).notNullable()
      table
        .uuid("uuid")
        .notNullable()
        .primary()
        .references("uuid")
        .inTable("users")
    })
    .createTable("corpinfo", (table) => {
      table.text("corpname").notNullable()
      table.text("corpid").notNullable().primary()
      table.text("logo").notNullable().unique()
      table.text("brief").notNullable()
      table.text("chiefhr").notNullable()
      table.boolean("valid").defaultTo(false).notNullable()
    })
    .createTable("hrinfo", (table) => {
      table.text("name").notNullable()
      table.text("hrid").notNullable()
      table
        .text("corpid")
        .notNullable()
        .references("corpid")
        .inTable("corpinfo")
      table.text("avatar").notNullable().unique()
      table.text("phone").notNullable().unique()
      table
        .uuid("uuid")
        .notNullable()
        .primary()
        .references("uuid")
        .inTable("users")
    })
    .createTable("jobinfo", (table) => {
      table.text("position").notNullable()
      table
        .enu("type", ["full-time", "part-time"], {
          useNative: true,
          existingType: true,
          enumName: "jobtype"
        })
        .notNullable()
      table.specificType("salary", "numrange").notNullable()
      table.text("brief").notNullable()
      table.text("location").notNullable()
      table
        .text("corpid")
        .notNullable()
        .references("corpid")
        .inTable("corpinfo")
      table.increments("no")
      table.specificType("cvlist", "text[]").defaultTo("{}").notNullable()
    })
    .createTable("infobox", (table) => {
      table.uuid("uuid").notNullable().references("uuid").inTable("users")
      table.text("info").notNullable()
      table.timestamp("time").defaultTo(knex.fn.now()).notNullable()
      table.boolean("read").defaultTo(false).notNullable()
      table.increments("no")
    })
}

export const down = async (knex) => {
  return knex.schema
    .dropTable("infobox")
    .dropTable("jobinfo")
    .dropTable("hrinfo")
    .dropTable("corpinfo")
    .dropTable("userinfo")
    .dropTable("users")
}
