import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { JSONSchema } from 'json-schema-to-ts'
import { eq, desc, and, not, like, sql } from 'drizzle-orm'
import type { SQL, InferInsertModel } from 'drizzle-orm'
import { userInfo, hrInfo, corpInfo, jobInfo } from '../../lib/schema.ts'
const corpIDPattern
  = String.raw`^[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{2}\d{6}[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{10}$`
const salaryPattern = String.raw`^\[[0-9]+(\.[0-9]{1,3})?,[0-9]+(\.[0-9]{1,3})?\]$`
const jobinfo: FastifyPluginCallback = fp((f, _, done) => {
  const server = f.withTypeProvider<JsonSchemaToTsProvider>()
  server.get(
    '/jobinfo',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            position: { type: 'string' },
            type: { enum: ['part-time', 'full-time'] },
            salary: {
              type: 'string',
              pattern: String.raw`^\d+$`,
            },
            location: {
              type: 'string',
              pattern: String.raw`^\d{4}$`,
            },
            logo: { type: 'string' },
            offset: { type: 'number' },
            limit: { type: 'number' },
          },
          required: ['offset', 'limit'],
          additionalProperties: false,
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              list: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    position: { type: 'string' },
                    overview: { type: 'string' },
                    type: { enum: ['part-time', 'full-time'] },
                    salary: {
                      type: 'string',
                      pattern: salaryPattern,
                    },
                    location: {
                      type: 'string',
                      pattern: String.raw`^\d{6}$`,
                    },
                    no: { type: 'number' },
                    corpInfo: {
                      type: 'object',
                      properties: {
                        corpName: { type: 'string' },
                        logo: { type: 'string' },
                      },
                      required: ['corpName', 'logo'],
                      additionalProperties: false,
                    },
                  },
                  required: [
                    'position', 'overview', 'type', 'salary', 'location', 'no', 'corpInfo',
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ['list'],
            additionalProperties: false,
          } as const satisfies JSONSchema,
        },
      },
    },
    async (request, reply) => {
      const options: SQL[] = []
      if (request.query.position) {
        options.push(like(jobInfo.position, `%${request.query.position}%`))
      }
      if (request.user.hr) {
        const hr_info = await server.drizzle.query.hrInfo
          .findFirst({
            columns: { corpId: true },
            where: eq(hrInfo.uuid, request.user.uuid),
          })
          .catch(error => server.log.error(error))
        if (hr_info) {
          options.push(eq(jobInfo.corpId, hr_info.corpId))
        }
      }
      else {
        const user_info = await server.drizzle.query.userInfo
          .findFirst({
            columns: { location: true, cv: true },
            where: eq(userInfo.uuid, request.user.uuid),
          })
          .catch(error => server.log.error(error))
        if (user_info) {
          if (user_info.cv) {
            options.push(not(sql`${jobInfo.cvList} @> ARRAY[${user_info.cv}]`))
          }
          if (request.query.type) {
            options.push(eq(jobInfo.type, request.query.type))
          }
          if (request.query.salary) {
            options.push(sql`${jobInfo.salary} @> ${request.query.salary}::numeric`)
          }
          if (request.query.location) {
            let location = request.query.location
            if (location === '0000') {
              location = user_info.location.slice(0, 4)
            }
            options.push(sql`starts_with( ${jobInfo.location}, ${location} )`)
          }
          if (request.query.logo) {
            const corp_info = await server.drizzle.query.corpInfo
              .findFirst({
                columns: { corpId: true },
                where: eq(corpInfo.logo, request.query.logo),
              })
              .catch(error => server.log.error(error))
            if (corp_info) {
              options.push(eq(jobInfo.corpId, corp_info.corpId))
            }
          }
        }
      }
      if (options.length > 0 || request.query.offset !== undefined) {
        const jobList = await server.drizzle.query.jobInfo
          .findMany({
            columns: { corpId: false, cvList: false },
            with: {
              corpInfo: {
                columns: { corpName: true, logo: true },
              },
            },
            where: and(...options),
            orderBy: desc(jobInfo.no),
            limit: request.query.limit,
            offset: request.query.offset,
          })
          .then(list => list.map((l) => {
            l.salary = l.salary.slice(1, -1).replace(',', '~')
            return l
          }))
          .catch(error => server.log.error(error))
        void reply.send({ list: jobList ?? [] })
      }
      else {
        void reply.code(400).send()
      }
    },
  )
  server.post(
    '/jobinfo',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            position: { type: 'string' },
            overview: { type: 'string' },
            type: { enum: ['part-time', 'full-time'] },
            salary: {
              type: 'string',
              pattern: salaryPattern,
            },
            location: {
              type: 'string',
              pattern: String.raw`^\d{6}$`,
            },
          },
          required: ['position', 'overview', 'type', 'salary', 'location'],
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
      const info = await server.drizzle.query.hrInfo
        .findFirst({
          columns: { corpId: true },
          where: eq(hrInfo.uuid, request.user.uuid),
        })
        .catch(error => server.log.error(error))
      if (info) {
        const source = Object.create(null) as InferInsertModel<typeof jobInfo>
        Object.assign(source, request.body)
        source.corpId = info.corpId
        const result = await server.drizzle
          .insert(jobInfo).values(source)
          .then(() => true)
          .catch(error => server.log.error(error))
        void reply.send({ result: !!result })
      }
      else {
        void reply.code(401).send()
      }
    },
  )
  server.patch(
    '/jobinfo',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            position: { type: 'string' },
            overview: { type: 'string' },
            type: { enum: ['part-time', 'full-time'] },
            salary: {
              type: 'string',
              pattern: salaryPattern,
            },
            location: {
              type: 'string',
              pattern: String.raw`^\d{6}$`,
            },
            corpId: {
              type: 'string',
              pattern: corpIDPattern,
            },
            no: { type: 'number' },
          },
          required: ['corpId', 'no'],
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
      const info = await server.drizzle.query.hrInfo
        .findFirst({
          columns: { corpId: true },
          where: eq(hrInfo.uuid, request.user.uuid),
        })
        .catch(error => server.log.error(error))
      if (info?.corpId === request.body.corpId) {
        const source = Object.create(null) as Partial<Omit<InferInsertModel<typeof jobInfo>, 'corpId' | 'cvList' | 'no'>>
        if (request.body.position) {
          source.position = request.body.position
        }
        if (request.body.overview) {
          source.overview = request.body.overview
        }
        if (request.body.type) {
          source.type = request.body.type
        }
        if (request.body.salary) {
          source.salary = request.body.salary
        }
        if (request.body.location) {
          source.location = request.body.location
        }
        if (Object.keys(source).length > 0) {
          const result = await server.drizzle
            .update(jobInfo).set(source)
            .where(eq(jobInfo.no, request.body.no))
            .then(() => true)
            .catch(error => server.log.error(error))
          void reply.send({ result: !!result })
        }
        else {
          void reply.code(400).send()
        }
      }
      else {
        void reply.code(401).send()
      }
    },
  )
  server.delete(
    '/jobinfo',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            corpId: {
              type: 'string',
              pattern: corpIDPattern,
            },
            no: { type: 'number' },
          },
          required: ['corpId', 'no'],
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
      const info = await server.drizzle.query.hrInfo
        .findFirst({
          columns: { corpId: true },
          where: eq(hrInfo.uuid, request.user.uuid),
        })
        .catch(error => server.log.error(error))
      if (info?.corpId === request.body.corpId) {
        const result = await server.drizzle.delete(jobInfo)
          .where(eq(jobInfo.no, request.body.no))
          .then(() => true)
          .catch(error => server.log.error(error))
        void reply.send({ result: !!result })
      }
      else {
        void reply.code(401).send()
      }
    },
  )
  done()
})
export default jobinfo
