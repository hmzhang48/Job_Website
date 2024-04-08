import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
const event: FastifyPluginAsync = fp( async ( f ) => {
  f.get( "/infobox-push", async ( request, reply ) => {
    await f.postgres.listen( "infobox", ( payload ) => {
      if ( JSON.parse( payload ).uuid === request.user.uuid ) {
        const payload = "event:newInfo\nretry:10000\n\n"
        reply.headers( {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache"
        } )
        reply.send( { event: payload } )
      }
    } )
  } )
} )
export default event
