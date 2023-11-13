import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { MultipartFile } from "@fastify/multipart"
import fs from "fs/promises"
import stream from "stream/promises"
declare module "fastify" {
  interface FastifyInstance {
    saveFile: ( file: MultipartFile, fileName: string ) => Promise<boolean>
    deleteFile: ( fileType: string, fileName: string ) => Promise<void>
  }
}
const filePlugin: FastifyPluginAsync = fp( async ( f ) => {
  f.decorate( 'saveFile', async ( file: MultipartFile, fileName: string ) => {
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
    return stream.finished( file.file.pipe( handle.createWriteStream() ) )
      .then( () => {
        return true
      } )
      .catch( ( reason ) => {
        f.log.error( reason )
        return false
      } )
      .finally( async () => await handle.close() )
  } )
  f.decorate( 'deleteFile', async ( fileType: string, fileName: string ) => {
    return fs.rm( "./public/" + fileType + "/" + fileName )
      .catch( ( reason ) => {
        f.log.error( reason )
      } )
  } )
} )
export default filePlugin
