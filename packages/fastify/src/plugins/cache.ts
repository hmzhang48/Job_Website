import fp from 'fastify-plugin'
import { createClient } from "redis"
import { DefaultAzureCredential } from '@azure/identity'
import { env } from 'node:process'
declare module 'fastify' {
  interface FastifyInstance {
    redis: typeof client
  }
}
let password = ''
if (!env['CACHE_URL']) {
  const credential = new DefaultAzureCredential()
  const accessToken = await credential.getToken("https://redis.azure.com/.default")
  password = accessToken.token
}
const client = env['CACHE_URL']
  ? createClient({ url: env['CACHE_URL'] })
  : createClient({
    username: env['REDIS_SERVICE_PRINCIPAL_ID']!,
    password: password,
    pingInterval: 100_000,
    socket: {
      host: env['AZURE_CACHE_FOR_REDIS_HOST_NAME']!,
      port: 6380,
      tls: true
    },
  })
const cache = fp(
  async (f) => {
    client.on("error", (error) => f.log.error(error))
    await client.connect()
    f.decorate('redis', client)
    f.addHook('onClose', () => client.destroy())
  }
)
export default cache