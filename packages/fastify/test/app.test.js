import server from '../src/server.js'
import { test } from 'node:test'
test('requests the index page', async t => {
  t.plan(1)
  const response = await server.inject().get("/")
  t.assert.strictEqual(response.statusCode, 200, 'returns a successful status code')
})