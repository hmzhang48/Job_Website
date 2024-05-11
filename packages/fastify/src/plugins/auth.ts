import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      uuid: string
      hr: boolean
    }
    user: {
      uuid: string
      hr: boolean
    }
  }
}
const urlList = new Set([
  '/email-check', '/email-validate', '/phone-validate',
  '/register', '/login',
])
const fileList = new Set(['png', 'pdf'])
const auth: FastifyPluginCallback = fp((f, _, done) => {
  f.addHook('preValidation', async (request, reply) => {
    if (!urlList.has(request.url.split('?')[0]) && !fileList.has(request.url.slice(-3))) {
      try {
        await request.jwtVerify()
      }
      catch (error) {
        f.log.error(error)
        void reply.code(401).send()
      }
    }
  })
  done()
})
export default auth
