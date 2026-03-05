/**
 * Wrapper autour du package `mailer` installé sur le VPS.
 * La configuration est lue depuis les variables d'environnement.
 *
 * Variables d'environnement requises :
 *   MAILER_SMTP_HOST     (default: localhost)
 *   MAILER_SMTP_PORT     (default: 25)
 *   MAILER_SMTP_SECURE   (default: false)
 *   MAILER_SMTP_USER     (optionnel)
 *   MAILER_SMTP_PASS     (optionnel)
 *   MAILER_IMAP_HOST     (default: localhost)
 *   MAILER_IMAP_PORT     (default: 143)
 *   MAILER_IMAP_SECURE   (default: false)
 *   MAILER_IMAP_USER
 *   MAILER_IMAP_PASS
 *   MAILER_FROM          (ex: '"GeneaSphere" <contact@example.com>')
 */

// Le package est un module CJS — on utilise createRequire pour l'importer
// depuis un contexte ESM (Nitro/Nuxt 4).
// On ancre la résolution sur process.cwd() car Nitro remplace import.meta.url
// par un chemin virtuel (globalThis._importMeta_.url = "/_entry.js") qui
// empêche la résolution correcte des node_modules.
import { createRequire } from 'module'

const _require = createRequire(process.cwd() + '/package.json')

interface MailerConfig {
  smtp: {
    host: string
    port: number
    secure: boolean
    tls: { rejectUnauthorized: boolean }
    auth?: { user: string, pass: string }
  }
  imap: {
    host: string
    port: number
    secure: boolean
    auth: { user: string, pass: string }
    tls: { rejectUnauthorized: boolean }
  }
  from: string
}

export interface MailerInstance {
  sendMail(opts: SendMailOptions): Promise<SendMailResult>
  fetchInbox(opts?: FetchInboxOptions): Promise<InboxEmail[]>
  deleteEmail(uid: number, mailbox?: string): Promise<DeleteResult>
  testSMTPConnection(): Promise<boolean>
  testIMAPConnection(): Promise<boolean>
}

export interface SendMailOptions {
  to: string
  subject: string
  body: string
  from?: string
  cc?: string
  bcc?: string
  attachments?: { filename: string, path?: string, content?: string }[]
}

export interface SendMailResult {
  success: boolean
  messageId: string
  info: unknown
}

export interface FetchInboxOptions {
  limit?: number
  mailbox?: string
}

export interface InboxEmail {
  uid: number
  from: string
  subject: string
  date: Date
  text: string
  html: string
  cc?: string
  attachments: { filename: string }[]
}

export interface DeleteResult {
  success: boolean
  uid: number
}

/** Retourne la classe MailerAPI (CJS) — exportée pour l'instanciation per-user. */
export function getMailerClass(): new (config: MailerConfig) => MailerInstance {
  return _require('mailer') as new (config: MailerConfig) => MailerInstance
}

function buildConfig(): MailerConfig {
  const smtpUser = process.env.MAILER_SMTP_USER
  const smtpPass = process.env.MAILER_SMTP_PASS

  return {
    smtp: {
      host: process.env.MAILER_SMTP_HOST || 'localhost',
      port: Number(process.env.MAILER_SMTP_PORT) || 25,
      secure: process.env.MAILER_SMTP_SECURE === 'true',
      tls: { rejectUnauthorized: false },
      ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {})
    },
    imap: {
      host: process.env.MAILER_IMAP_HOST || 'localhost',
      port: Number(process.env.MAILER_IMAP_PORT) || 143,
      secure: process.env.MAILER_IMAP_SECURE === 'true',
      auth: {
        user: process.env.MAILER_IMAP_USER || '',
        pass: process.env.MAILER_IMAP_PASS || ''
      },
      tls: { rejectUnauthorized: false }
    },
    from: process.env.MAILER_FROM || '"GeneaSphere" <contact@localhost>'
  }
}

let _instance: MailerInstance | null = null

export async function getMailer(): Promise<MailerInstance> {
  if (_instance) return _instance

  const MailerAPI = getMailerClass()
  _instance = new MailerAPI(buildConfig())
  return _instance
}

/** Réinitialise l'instance (utile après un changement de config) */
export function resetMailer() {
  _instance = null
}
