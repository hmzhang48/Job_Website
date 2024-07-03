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
  '/register', '/login'
])
const fileList = new Set([
  ".html", ".css", ".js", ".json", ".png", ".svg", ".ico", ".pdf"
])
const urlCheck = (url: string) => {
  if (url === "/") {
    return false
  }
  for (const u of urlList) {
    if (url.startsWith(u)) {
      return false
    }
  }
  for (const f of fileList) {
    if (url.endsWith(f)) {
      return false
    }
  }
  return true
}
const auth: FastifyPluginCallback = fp((f, _, done) => {
  f.addHook('preValidation', async (request, reply) => {
    if (urlCheck(request.url)) {
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
