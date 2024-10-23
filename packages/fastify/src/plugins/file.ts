import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import type { MultipartFile } from '@fastify/multipart'
import { BlobServiceClient } from '@azure/storage-blob'
import { DefaultAzureCredential } from '@azure/identity'
import { env } from 'node:process'
import fs from 'node:fs/promises'
import stream from 'node:stream/promises'
declare module 'fastify' {
  interface FastifyInstance {
    saveFile: (file: MultipartFile, fileName: string) => Promise<boolean>
    deleteFile: (fileType: string, fileName: string) => Promise<void>
  }
}
const file: FastifyPluginCallback = fp((f, _, done) => {
  if (env['AZURE_STORAGE_ACCOUNT_NAME']) {
    const blobServiceClient = new BlobServiceClient(
      `https://${env['AZURE_STORAGE_ACCOUNT_NAME']}.blob.core.windows.net`,
      new DefaultAzureCredential(),
    )
    f.decorate('saveFile', async (file: MultipartFile, fileName: string) => {
      const imageType = /^image\/png$/
      const pdfType = /^application\/pdf$/
      let containerName = ''
      let blobName = ''
      if (imageType.test(file.mimetype)) {
        containerName = 'png'
        blobName = `${fileName}.png`
      }
      if (pdfType.test(file.mimetype)) {
        containerName = 'pdf'
        blobName = `${fileName}.pdf`
      }
      const containerClient = blobServiceClient.getContainerClient(containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      return await blockBlobClient.uploadStream(file.file)
        .then(() => true)
        .catch((error) => {
          f.log.error(error)
          return false
        })
    })
    f.decorate('deleteFile', async (fileType: string, fileName: string) => {
      if (fileName !== '') {
        const containerClient = blobServiceClient.getContainerClient(fileType)
        const blockBlobClient = containerClient.getBlockBlobClient(`${fileName}.${fileType}`)
        await blockBlobClient.deleteIfExists({ deleteSnapshots: 'include' })
          .catch(error => f.log.error(error))
      }
    })
  }
  else {
    f.decorate('saveFile', async (file: MultipartFile, fileName: string) => {
      const imageType = /^image\/png$/
      const pdfType = /^application\/pdf$/
      let path = './public/'
      if (imageType.test(file.mimetype)) {
        path += `png/${fileName}.png`
      }
      if (pdfType.test(file.mimetype)) {
        path += `pdf/${fileName}.pdf`
      }
      const handle = await fs.open(path, 'w')
      return stream.pipeline(file.file, handle.createWriteStream())
        .then(() => true)
        .catch((error) => {
          f.log.error(error)
          return false
        })
        .finally(() => void handle.close())
    })
    f.decorate('deleteFile', async (fileType: string, fileName: string) => {
      if (fileName !== '') {
        return fs.rm(`./public/${fileType}/${fileName}.${fileType}`)
          .catch(error => f.log.error(error))
      }
    })
  }
  done()
})
export default file
