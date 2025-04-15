import fp from 'fastify-plugin'
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { JSONSchema } from 'json-schema-to-ts'
import { eq } from 'drizzle-orm'
import type { InferInsertModel } from 'drizzle-orm'
import { hrInfo, corpInfo } from '../../lib/schema.ts'
const regexp = String.raw`^[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{2}\d{6}[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{10}$`
const hrinfo = fp(
  (f, _, done) => {
    const server = f.withTypeProvider<JsonSchemaToTsProvider>()
    server.get(
      '/hrinfo',
      {
        schema: {
          response: {
            200: {
              type: 'object',
              properties: {
                info: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    hrId: { type: 'string' },
                    corpId: {
                      type: 'string',
                      pattern: regexp,
                    },
                    phone: {
                      type: 'string',
                      pattern: String.raw`^\d{11}$`,
                    },
                    avatar: { type: 'string' },
                  },
                  required: ['name', 'hrId', 'corpId', 'phone', 'avatar'],
                  additionalProperties: false,
                },
              },
              required: ['info'],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async (request, reply) => {
        const info = await server.drizzle.query.hrInfo
          .findFirst({
            columns: { uuid: false },
            where: eq(hrInfo.uuid, request.user.uuid),
          })
          .catch(error => server.log.error(error))
        if (info)
          reply.send({ info: info })
        else
          reply.code(404).send()
      },
    )
    server.post(
      '/hrinfo',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              hrId: { type: 'string' },
              corpId: {
                type: 'string',
                pattern: regexp,
              },
              phone: {
                type: 'string',
                pattern: String.raw`^\d{11}$`,
              },
              avatar: { type: 'string' },
            },
            required: ['name', 'hrId', 'corpId', 'phone', 'avatar'],
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
        const info = await server.drizzle.query.corpInfo
          .findFirst({
            columns: { corpId: true },
            where: eq(corpInfo.corpId, request.body.corpId),
          })
          .catch(error => server.log.error(error))
        if (info) {
          const source = Object.create(null) as InferInsertModel<typeof hrInfo>
          source.uuid = request.user.uuid
          Object.assign(source, request.body)
          const result = await server.drizzle
            .insert(hrInfo).values(source)
            .then(() => true)
            .catch(error => server.log.error(error))
          reply.send({ result: !!result })
        }
        else
          reply.code(404).send()
      },
    )
    server.patch(
      '/hrinfo',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              phone: {
                type: 'string',
                pattern: String.raw`^\d{11}$`,
              },
            },
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
        if (request.body.phone) {
          const result = await server.drizzle.update(hrInfo)
            .set({ phone: request.body.phone })
            .where(eq(hrInfo.uuid, request.user.uuid))
            .then(() => true)
            .catch(error => server.log.error(error))
          reply.send({ result: !!result })
        }
        else
          reply.code(400).send()
      },
    )
    done()
  }
)
export default hrinfo