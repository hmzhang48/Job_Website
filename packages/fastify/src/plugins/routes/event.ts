import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
const event: FastifyPluginCallback = fp(
  ( f, _, done ) =>
  {
    f.get(
      '/sse',
      async ( request, reply ) =>
      {
        reply.raw.writeHead( 200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
        } )
        reply.raw.write( 'retry:10000\n\n' )
        request.raw.on( 'end', () => reply.raw.end() )
        await f.postgres.listen(
          'infobox',
          ( payload ) =>
          {
            if ( payload === request.user.uuid )
              reply.raw.write( 'event:newInfo\n\n' )
          }
        )
      }
    )
    done()
  }
)
export default event
