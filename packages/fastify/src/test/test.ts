import test from 'ava'
import server from '../server.js'
test( 'test', t => {
  server.inject()
  t.teardown( () => server.close() )
} )
