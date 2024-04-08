import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { MultipartFile } from "@fastify/multipart"
import fs from "node:fs/promises"
import stream from "node:stream/promises"
declare module "fastify" {
  interface FastifyInstance {
    saveFile: ( file: MultipartFile, fileName: string ) => Promise<boolean>
    deleteFile: ( fileType: string, fileName: string ) => Promise<void>
  }
}
const file: FastifyPluginAsync = fp( async ( f ) => {
  f.decorate( "saveFile", async ( file: MultipartFile, fileName: string ) => {
    const imageType = /^image\/png$/
    const pdfType = /^application\/pdf$/
    let path = "./public/"
    if ( imageType.test( file.mimetype ) ) {
      path += "image/" + fileName + ".png"
    }
    if ( pdfType.test( file.mimetype ) ) {
      path += "PDF/" + fileName + ".pdf"
    }
    const handle = await fs.open( path, "w" )
    return stream.pipeline( file.file, handle.createWriteStream() )
      .then( () => true )
      .catch( ( error ) => {
        f.log.error( error )
        return false
      } ).finally( async () => await handle.close() )
  } )
  f.decorate( "deleteFile", async ( fileType: string, fileName: string ) => {
    if ( !fileName.startsWith( "." ) ) {
      return fs.rm( "./public/" + fileType + "/" + fileName )
        .catch( ( error ) => f.log.error( error ) )
    }
  } )
} )
export default file
