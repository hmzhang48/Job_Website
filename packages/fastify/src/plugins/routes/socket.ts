import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
const socket: FastifyPluginCallback = fp(
  (f, _, done) => {
    f.get(
      '/ws',
      { websocket: true },
      (socket) => {
        socket.on(
          'message',
          (message) => {
            if (typeof message === 'string')
              socket.send('message received')
          }
        )
      }
    )
    done()
  }
)
export default socket
