import server from './server.ts'
import { env } from 'node:process'
server.listen(
  {
    host: '0.0.0.0',
    port: env['PORT'] ? Number.parseInt(env['PORT']) : 3000,
  },
  (error) => {
    if (error) server.log.error(error)
  },
)
