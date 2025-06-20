import fp from 'fastify-plugin'
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { JSONSchema } from 'json-schema-to-ts'
import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { users, userInfo, hrInfo } from '../../lib/schema.ts'
const guide = fp(
  (f, _, done) => {
    const server = f.withTypeProvider<JsonSchemaToTsProvider>()
    server.post(
      '/api/login',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
              password: {
                type: 'string',
                minLength: 8,
                maxLength: 25,
              },
            },
            required: ['email', 'password'],
            additionalProperties: false,
          } as const satisfies JSONSchema,
          response: {
            200: {
              type: 'object',
              properties: {
                result: { type: 'boolean' },
                hr: { type: 'boolean' },
              },
              required: ['result'],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async (request, reply) => {
        const user = await server.drizzle.query.users
          .findFirst({
            columns: { email: false },
            where: eq(users.email, request.body.email),
          })
          .catch(error => server.log.error(error))
        if (user) {
          const hash = crypto.createHash('md5')
          hash.update(request.body.password)
          const password = hash.digest('hex')
          if (password === user.password) {
            const token = await reply.jwtSign(
              { uuid: user.uuid, hr: user.hr },
            )
            reply
              .setCookie('jwt', token, {
                path: '/', httpOnly: true, sameSite: true, signed: true,
              })
              .send({ result: true, hr: user.hr })
          }
          else
            reply.send({ result: false })
        }
        else
          reply.code(401).send()
      },
    )
    server.get(
      '/api/logout',
      {
        schema: {
          response: {
            200: {
              type: 'object',
              properties: { result: { type: 'boolean' } },
              required: ['result'],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async (_request, reply) => {
        reply
          .clearCookie('jwt', { path: '/' })
          .send({ result: true })
      },
    )
    server.get(
      '/api/guide',
      {
        schema: {
          response: {
            200: {
              type: 'object',
              properties: {
                user: { type: 'boolean' },
                hr: { type: 'boolean' },
                guide: { type: 'boolean' },
              },
              required: ['hr', 'guide'],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async (request, reply) => {
        const info = await (request.user.hr
          ? server.drizzle.query.hrInfo.findFirst({
            columns: { uuid: true },
            where: eq(hrInfo.uuid, request.user.uuid),
          })
          : server.drizzle.query.userInfo.findFirst({
            columns: { uuid: true },
            where: eq(userInfo.uuid, request.user.uuid),
          }))
          .catch(error => server.log.error(error))
        reply.send({ hr: request.user.hr, guide: info ? false : true })
      },
    )
    done()
  }
)
export default guide