import type { FastifyPluginAsync, FastifyRequest } from "fastify"
import fp from "fastify-plugin"
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: string
    user: {
      uuid: string,
      hr: boolean
    }
  }
}
declare module "fastify" {
  interface FastifyInstance {
    authJWT: ( request: FastifyRequest ) => Promise<boolean>
  }
}
const urlList = new Set(
  [ "/email-check", "/email-validate", "/phone-validate", "/register", "/login" ]
)
const authPlugin: FastifyPluginAsync = fp( async ( f ) => {
  f.decorate( "authJWT", async ( request: FastifyRequest ) => {
    try {
      await request.jwtVerify()
      return true
    } catch ( error ) {
      f.log.error( error )
      return false
    }
  } )
  f.addHook( "preValidation", async ( request, reply ) => {
    if ( !urlList.has( request.url ) ) {
      const result = await f.authJWT( request )
      if ( !result ) {
        reply.code( 401 ).send()
      }
    }
  } )
} )
export default authPlugin
