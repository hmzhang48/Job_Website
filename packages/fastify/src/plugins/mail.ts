import fp from 'fastify-plugin'
import mailer from 'nodemailer'
declare module 'fastify' {
  interface FastifyInstance {
    mail: typeof transporter
  }
}
const testAccount = await mailer.createTestAccount()
const transporter = mailer.createTransport({
  host: 'smtp.ethereal.email',
  pool: true,
  port: 587,
  secure: false,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
})
const mail = fp(
  async (f) => {
    await transporter.verify().catch((error) => f.log.error(error))
    f.decorate('mail', transporter)
    f.addHook(
      'onClose',
      (f) => f.mail.close()
    )
  }
)
export default mail