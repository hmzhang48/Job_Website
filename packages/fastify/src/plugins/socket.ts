import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
const socketPlugin: FastifyPluginAsync = fp( async ( f ) => {
  f.get( '/ws',
    { websocket: true },
    async ( connection ) => {
      connection.socket.addEventListener( "message", ( message ) => {
        if ( typeof message === 'string' ) {
          connection.socket.send( 'message received' )
        }
      } )
    }
  )
} )
export default socketPlugin
