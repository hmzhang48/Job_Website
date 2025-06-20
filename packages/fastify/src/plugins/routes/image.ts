import fp from 'fastify-plugin'
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { JSONSchema } from 'json-schema-to-ts'
import random from 'crypto-random-string'
import { eq } from 'drizzle-orm'
import { userInfo, hrInfo } from '../../lib/schema.ts'
const image = fp(
  (f, _, done) => {
    const server = f.withTypeProvider<JsonSchemaToTsProvider>()
    server.post(
      '/api/image',
      {
        schema: {
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
        const file = await request.file()
        if (file) {
          const fileName = random({ length: 10 })
          const result = await server.saveFile(file, fileName)
          reply.send({ result: result ? fileName : '' })
        }
        else
          reply.code(400).send()
      },
    )
    server.patch(
      '/api/image',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: { fileName: { type: 'string' } },
            required: ['fileName'],
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
        const file = await request.file()
        if (file) {
          const fileName = random({ length: 10 })
          let result = await server
            .saveFile(file, fileName)
            .catch(error => server.log.error(error))
          if (result) {
            result = await (request.user.hr
              ? server.drizzle.update(hrInfo)
                .set({ avatar: fileName })
                .where(eq(hrInfo.uuid, request.user.uuid))
              : server.drizzle.update(userInfo)
                .set({ avatar: fileName })
                .where(eq(userInfo.uuid, request.user.uuid)))
              .then(() => true)
              .catch(error => server.log.error(error))
            await (result
              ? server.deleteFile('png', request.query.fileName)
              : server.deleteFile('png', fileName))
          }
          reply.send({ result: result ? fileName : '' })
        }
        else
          reply.code(400).send()
      },
    )
    done()
  }
)
export default image