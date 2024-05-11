import server from './server.ts'
server.listen({ port: 3000 }, (error) => {
  if (error) {
    server.log.error(error)
  }
})
