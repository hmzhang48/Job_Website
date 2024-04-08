import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      data: string
    }
    user: {
      uuid: string
      hr: boolean
    }
  }
}
const urlList = new Set( [
  "/email-check", "/email-validate", "/phone-validate",
  "/register", "/login"
] )
const fileList = new Set( [ "png", "pdf" ] )
const auth: FastifyPluginAsync = fp( async ( f ) => {
  f.addHook( "preValidation", async ( request, reply ) => {
    if (
      !urlList.has( request.url.split( "?" )[ 0 ] ) &&
      !fileList.has( request.url.slice( -3 ) )
    ) {
      try {
        await request.jwtVerify()
      } catch ( error ) {
        f.log.error( error )
        reply.code( 401 ).send()
      }
    }
  } )
} )
export default auth
