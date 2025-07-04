import fp from 'fastify-plugin'
const socket = fp(
  (f, _, done) => {
    f.get(
      '/api/ws',
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