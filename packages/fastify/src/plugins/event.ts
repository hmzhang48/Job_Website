import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
const eventPlugin: FastifyPluginAsync = fp( async ( f ) => {
  f.get(
    '/event',
    {
      preValidation: async ( request, reply ) => {
        const result = await f.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( _request, reply ) => {
      reply.header( "Content-Type", "text/event-stream" )
      const event = "event: ping\n"
      const data = "data: { 'message' : 'success' }\n\n"
      reply.send( event + data )
    }
  )
} )
export default eventPlugin
