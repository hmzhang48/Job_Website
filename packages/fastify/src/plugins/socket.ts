import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
const socketPlugin: FastifyPluginAsync = fp( async ( f ) => {
  f.get(
    '/ws',
    {
      websocket: true,
      preValidation: async ( request, reply ) => {
        const result = await f.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( connection ) => {
      connection.socket.onmessage = ( message ) => {
        if ( typeof message === 'string' ) {
          connection.socket.send( 'message received' )
        }
      }
    }
  )
} )
export default socketPlugin
