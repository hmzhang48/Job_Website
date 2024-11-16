import test from 'ava'
import server from '../server.ts'
test(
  'test',
  (t) => {
    server.inject()
    t.teardown(() => server.close())
  }
)
