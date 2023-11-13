import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
const client = postgres(
  "postgres://postgre:postgre@localhost:5432/postgre",
  { max: 1 }
)
const database = drizzle( client )
await migrate( database, { migrationsFolder: "../../migrations" } )
client.end()
