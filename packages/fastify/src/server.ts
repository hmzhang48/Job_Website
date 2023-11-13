import { fastify } from "fastify"
import sensible from "@fastify/sensible"
import helmet from "@fastify/helmet"
import autoLoad from '@fastify/autoload'
//import cors from "@fastify/cors"
//import session from "@fastify/secure-session"
//import csrf from "@fastify/csrf-protection"
import jwt from "@fastify/jwt"
//import buildGetJwks from "get-jwks"
import cookie from "@fastify/cookie"
import staticfile from "@fastify/static"
import multipart from "@fastify/multipart"
import websocket from "@fastify/websocket"
//import mongo from "@fastify/mongodb"
//import pg from "@fastify/postgres"
//import fs from "fs/promises"
import path from "path"
import url from 'url'
const server = fastify( {
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
/*
server.register( cors, {
  origin: "http://localhost:5173",
  methods: [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ],
  credentials: true
} )
server.register( session, {
  key: await fs.readFile( path.resolve( "./secret-key" ) ),
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 24
  }
} )
server.register( csrf, {
  sessionPlugin: '@fastify/secure-session'
} )
*/
server.register( jwt, {
  secret: "secret",
  cookie: {
    cookieName: 'jwt',
    signed: true
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
    fileSize: 1048576,
  }
} )
server.register( websocket, {
  options: {
    maxPayload: 1048576
  }
} )
/*
server.register( mongo, {
  forceClose: true,
  url: 'mongodb://mongodb:mongodb@localhost:27017/mongodb'
} )

server.register( pg, {
  connectionString: 'postgresql://postgre:postgre@localhost:5432/postgre'
} )
*/
server.listen( { port: 3000 }, ( err ) => {
  if ( err ) {
    server.log.error( err )
    process.exit( 1 )
  }
} )
