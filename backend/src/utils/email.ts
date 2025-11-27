import nodemailer, { Transporter } from 'nodemailer'

interface SendEmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
}

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, MAIL_FROM } = process.env

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
    throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM.')
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  return transporter
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  const { MAIL_FROM } = process.env
  const t = getTransporter()

  await t.sendMail({
    from: MAIL_FROM!,
    to,
    subject,
    text: text || html?.replace(/<[^>]+>/g, ' ') || undefined,
    html,
  })
}
