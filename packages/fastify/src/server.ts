import fastify from 'fastify'
import sensible from '@fastify/sensible'
import helmet from '@fastify/helmet'
import autoLoad from '@fastify/autoload'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import staticfile from '@fastify/static'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import { env } from 'node:process'
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
server.register(sensible)
server.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      'default-src': [
        '\'self\'', 'blob:',
        `https://${env['AZURE_STORAGE_ACCOUNT_NAME']}.blob.core.windows.net`,
      ].slice(0, env['AZURE_STORAGE_ACCOUNT_NAME'] ? 3 : 2),
      'img-src': [
        '\'self\'', 'data:', 'blob:',
        `https://${env['AZURE_STORAGE_ACCOUNT_NAME']}.blob.core.windows.net`,
      ].slice(0, env['AZURE_STORAGE_ACCOUNT_NAME'] ? 4 : 3),
      'object-src': [
        '\'self\'', 'blob:',
        `https://${env['AZURE_STORAGE_ACCOUNT_NAME']}.blob.core.windows.net`,
      ].slice(0, env['AZURE_STORAGE_ACCOUNT_NAME'] ? 3 : 2),
    },
  },
})
server.register(autoLoad, {
  dir: path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'plugins'),
  forceESM: true,
})
server.register(jwt, {
  secret: 'secret',
  cookie: {
    cookieName: 'jwt',
    signed: true,
  },
})
server.register(cookie, {
  secret: 'secret',
})
server.register(staticfile, {
  root: path.resolve('./public'),
})
server.register(multipart, {
  limits: { fileSize: 1_048_576 },
})
server.register(websocket, {
  options: { maxPayload: 1_048_576 },
})
server.setNotFoundHandler(
  (_, reply) => reply.redirect('/index.html')
)
export default server
