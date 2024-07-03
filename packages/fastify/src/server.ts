import fastify from 'fastify'
import sensible from '@fastify/sensible'
import helmet from '@fastify/helmet'
import autoLoad from '@fastify/autoload'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import staticfile from '@fastify/static'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import path from 'node:path'
import url from 'node:url'
const server = fastify({
  ajv: {
    customOptions: {
      strict: 'log',
      keywords: ['kind', 'modifier'],
    },
  },
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        levelFirst: true,
        translateTime: true,
        colorize: true,
        ignore: 'pid,hostname',
      },
    },
  },
})
void server.register(sensible)
void server.register(helmet)
void server.register(autoLoad, {
  dir: path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'plugins'),
  forceESM: true,
})
void server.register(jwt, {
  secret: 'secret',
  cookie: {
    cookieName: 'jwt',
    signed: true,
  },
})
void server.register(cookie, {
  secret: 'secret',
})
void server.register(staticfile, {
  root: [
    path.resolve('./public'),
    path.resolve('./client')
  ]
})
void server.register(multipart, {
  limits: {
    fileSize: 1_048_576,
  },
})
void server.register(websocket, {
  options: {
    maxPayload: 1_048_576,
  },
})
server.get("/", async (_, reply)=>{
  reply.redirect("/index.html")
})
export default server
