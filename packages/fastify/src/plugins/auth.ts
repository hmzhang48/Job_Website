import type { FastifyPluginAsync, FastifyRequest } from "fastify"
import fp from "fastify-plugin"
/*
declare module '@fastify/secure-session' {
  interface SessionData {
    uuid: string,
    hr: boolean,
  }
}
*/
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      uuid: string,
      hr: boolean,
    }
    user: {
      uuid: string,
      hr: boolean
    }
  }
}
declare module "fastify" {
  interface FastifyInstance {
    //authSession: ( request: FastifyRequest ) => Promise<boolean>
    authJWT: ( request: FastifyRequest ) => Promise<boolean>
  }
}

const authPlugin: FastifyPluginAsync = fp( async ( f ) => {
  /*
    f.decorate( "authSession", async ( request: FastifyRequest ) => {
      let result: boolean
      const session = request.session
      if ( session.uuid ) {
        result = true
      } else {
        result = false
      }
      return result
    } )
  */
  f.decorate( "authJWT", async ( request: FastifyRequest ) => {
    let result: boolean
    try {
      await request.jwtVerify()
      result = true
    } catch ( error ) {
      f.log.error( error )
      result = false
    }
    return result
  } )
} )

export default authPlugin
