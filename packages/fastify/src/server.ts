import fastify from "fastify"
import sensible from "@fastify/sensible"
import helmet from "@fastify/helmet"
import autoLoad from '@fastify/autoload'
import jwt from "@fastify/jwt"
import cookie from "@fastify/cookie"
import staticfile from "@fastify/static"
import multipart from "@fastify/multipart"
import websocket from "@fastify/websocket"
import path from "node:path"
import url from 'node:url'
const server = fastify( {
  http2: true,
  ajv: {
    customOptions: {
      strict: "log",
      keywords: [ "kind", "modifier" ],
    },
  },
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        levelFirst: true,
        translateTime: true,
        colorize: true,
        ignore: "pid,hostname",
      },
    },
  },
} )
server.register( sensible )
server.register( helmet )
server.register( autoLoad, {
  dir: path.join( path.dirname( url.fileURLToPath( import.meta.url ) ), 'plugins' ),
  forceESM: true
} )
server.register( jwt, {
  secret: "secret",
  cookie: {
    cookieName: 'jwt',
    signed: true
  },
  formatUser: ( payload ) => {
    return JSON.parse( payload )
  }
} )
server.register( cookie, {
  secret: "secret",
} )
server.register( staticfile, {
  root: path.resolve( "./public" ),
} )
server.register( multipart, {
  limits: {
    fileSize: 1_048_576,
  }
} )
server.register( websocket, {
  options: {
    maxPayload: 1_048_576
  }
} )
export default server
