import server from "./server.js"
server.listen( { port: 3000 }, ( error ) => {
  if ( error ) {
    server.log.error( error )
  }
} )
