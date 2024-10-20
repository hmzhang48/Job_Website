import server from './server.ts'
server.listen(
  {
    host: 'localhost',
    port: 3000,
  },
  (error) => {
    if (error) {
      server.log.error(error)
    }
  },
)
