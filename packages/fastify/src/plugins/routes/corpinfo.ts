import fp from 'fastify-plugin'
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { JSONSchema } from 'json-schema-to-ts'
import { eq } from 'drizzle-orm'
import type { InferInsertModel } from 'drizzle-orm'
import { hrInfo, corpInfo } from '../../lib/schema.ts'
const corpIDpattern = String.raw`^[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{2}\d{6}[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{10}$`
const corpinfo = fp(
  (f, _, done) => {
    const server = f.withTypeProvider<JsonSchemaToTsProvider>()
    server.get(
      '/api/corp-check',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              corpid: {
                type: 'string',
                pattern: corpIDpattern,
              },
            },
            required: ['corpid'],
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
            where: eq(corpInfo.corpId, request.query.corpid),
          })
          .catch(error => server.log.error(error))
        reply.send({ result: info ? true : false })
      },
    )
    server.get(
      '/api/corpinfo',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              logo: { type: 'string' },
            },
            additionalProperties: false,
          } as const satisfies JSONSchema,
          response: {
            200: {
              type: 'object',
              properties: {
                info: {
                  type: 'object',
                  properties: {
                    corpName: { type: 'string' },
                    brief: { type: 'string' },
                    logo: { type: 'string' },
                    chiefHR: { type: 'string' },
                    valid: { type: 'boolean' },
                    hrList: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          hrId: { type: 'string' },
                          avatar: { type: 'string' },
                        },
                        required: ['name', 'hrId', 'avatar'],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['corpName', 'brief', 'logo'],
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
        if (request.query.logo) {
          const info = await server.drizzle.query.corpInfo
            .findFirst({
              columns: { corpName: true, brief: true, logo: true },
              where: eq(corpInfo.logo, request.query.logo),
            })
            .catch(error => server.log.error(error))
          if (info)
            reply.send({ info: info })
          else
            reply.code(404).send()
        }
        else {
          const hr_info = await server.drizzle.query.hrInfo
            .findFirst({
              columns: { hrId: true, corpId: true },
              where: eq(hrInfo.uuid, request.user.uuid),
            })
            .catch(error => server.log.error(error))
          if (hr_info) {
            const corp_info = await server.drizzle.query.corpInfo
              .findFirst({
                columns: { corpId: false },
                with: {
                  hrList: {
                    columns: { name: true, hrId: true, avatar: true },
                  },
                },
                where: eq(corpInfo.corpId, hr_info.corpId),
              })
              .catch(error => server.log.error(error))
            if (corp_info) {
              corp_info.hrList = corp_info.chiefHR === hr_info.hrId
                ? corp_info.hrList.filter(
                  info => info.hrId !== hr_info.hrId,
                )
                : []
              reply.send({ info: corp_info })
            }
            else
              reply.code(404).send()
          }
          else
            reply.code(401).send()
        }
      },
    )
    server.post(
      '/api/corpinfo',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              corpName: { type: 'string' },
              corpId: {
                type: 'string',
                pattern: corpIDpattern,
              },
              brief: { type: 'string' },
              chiefHR: { type: 'string' },
              logo: { type: 'string' },
            },
            required: ['corpName', 'corpId', 'brief', 'chiefHR', 'logo'],
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
        const source = Object.create(null) as InferInsertModel<typeof corpInfo>
        Object.assign(source, request.body)
        const result = await server.drizzle
          .insert(corpInfo).values(source)
          .then(() => true)
          .catch(error => server.log.error(error))
        reply.send({ result: !!result })
      },
    )
    done()
  }
)
export default corpinfo