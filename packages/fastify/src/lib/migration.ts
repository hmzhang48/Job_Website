import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { env } from "node:process"
const client = postgres( <string> env[ "database" ], { max: 1 } )
const database = drizzle( client, { logger: true } )
await migrate( database, { migrationsFolder: "./migrations" } )
await client.end()
