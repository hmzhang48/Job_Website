import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import mailer from "nodemailer"
declare module "fastify" {
  interface FastifyInstance {
    mail: mailer.Transporter
  }
}
const mail: FastifyPluginAsync = fp( async ( f ) => {
  const testAccount = await mailer.createTestAccount()
  const transporter = mailer.createTransport( {
    host: "smtp.ethereal.email",
    pool: true,
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  } )
  f.decorate( "mail", transporter )
  f.addHook( "onClose", ( f ) => {
    f.mail.close()
  } )
} )
export default mail
