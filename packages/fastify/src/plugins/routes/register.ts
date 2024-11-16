import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { JSONSchema } from 'json-schema-to-ts'
import crypto from 'node:crypto'
import random from 'crypto-random-string'
import { eq } from 'drizzle-orm'
import type { InferInsertModel } from 'drizzle-orm'
import { users } from '../../lib/schema.ts'
const register: FastifyPluginCallback = fp(
  (f, _, done) => {
    const server = f.withTypeProvider<JsonSchemaToTsProvider>()
    server.get(
      '/email-check',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
            },
            required: ['email'],
            additionalProperties: false,
          } as const satisfies JSONSchema,
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
      async (request, reply) => {
        const user = await server.drizzle.query.users
          .findFirst({
            columns: { email: true },
            where: eq(users.email, request.query.email),
          })
          .catch(error => server.log.info(error))
        reply.send({ result: !!user })
      },
    )
    server.get(
      '/email-validate',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
            },
            required: ['email'],
            additionalProperties: false,
          } as const satisfies JSONSchema,
          response: {
            200: {
              type: 'object',
              properties: { result: { type: 'string' } },
              required: ['result'],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async (request, reply) => {
        const address = request.query.email
        const code = random({ length: 10 })
        const message = {
          from: 'Haomin Zhang <zhanghaomin@ethereal.email>',
          to: address,
          subject: '验证码',
          html: '<p>' + code + '</p>',
        }
        let result: boolean
        result = await server.mail.verify()
          .then(() => true)
          .catch(
            error => {
              server.log.error(error)
              return false
            }
          )
        if (result && server.mail.isIdle())
          result = await server.mail.sendMail(message)
            .then(() => true)
            .catch(
              error => {
                server.log.error(error)
                return false
              }
            )
        reply.send({ result: result ? code : '' })
      },
    )
    server.get(
      '/phone-validate',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              phone: {
                type: 'string',
                pattern: String.raw`^\d{11}$`,
              },
            },
            required: ['phone'],
            additionalProperties: false,
          } as const satisfies JSONSchema,
          response: {
            200: {
              type: 'object',
              properties: { result: { type: 'string' } },
              required: ['result'],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async (request, reply) => {
        const phone = request.query.phone
        server.log.info(phone)
        const code = random({ length: 10 })
        reply.send({ result: code })
      },
    )
    server.post(
      '/register',
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
              hr: { type: 'boolean' },
            },
            required: ['email', 'password', 'hr'],
            additionalProperties: false,
          } as const satisfies JSONSchema,
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
      async (request, reply) => {
        const uuid = crypto.randomUUID()
        const hash = crypto.createHash('md5')
        hash.update(request.body.password)
        const password = hash.digest('hex')
        const source = Object.create(null) as InferInsertModel<typeof users>
        source.uuid = uuid
        source.email = request.body.email
        source.password = password
        source.hr = request.body.hr
        const result = await server.drizzle
          .insert(users).values(source)
          .then(() => true)
          .catch(error => server.log.error(error))
        if (result) {
          const token = await reply.jwtSign({
            uuid: uuid, hr: request.body.hr,
          })
          reply
            .setCookie('jwt', token, {
              path: '/', httpOnly: true, sameSite: true, signed: true,
            })
            .send({ result: true })
        }
        else
          reply.send({ result: false })
      },
    )
    done()
  }
)
export default register
