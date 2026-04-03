const { onRequest } = require('firebase-functions/v2/https')
const { defineString } = require('firebase-functions/params')
const logger = require('firebase-functions/logger')
const { Resend } = require('resend')

const RESEND_API_KEY = defineString('RESEND_API_KEY')
const FEEDBACK_TO_EMAIL = defineString('FEEDBACK_TO_EMAIL')
const FEEDBACK_FROM_EMAIL = defineString('FEEDBACK_FROM_EMAIL')
const DEFAULT_FEEDBACK_TO_EMAIL = 'dhanshreepathrabe26@gmail.com'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const extractEmail = (value) => {
  const raw = String(value || '').trim()

  if (!raw) {
    return ''
  }

  const angleMatch = raw.match(/<([^>]+)>/)
  if (angleMatch && angleMatch[1]) {
    return angleMatch[1].trim()
  }

  return raw
}

const isValidEmail = (value) => emailPattern.test(value)

const parseBody = (rawBody) => {
  if (!rawBody) {
    return {}
  }

  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody)
    } catch {
      return {}
    }
  }

  return rawBody
}

exports.sendFeedback = onRequest({ cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  const body = parseBody(req.body)
  const fullName = String(body.fullName || '').trim()
  const email = String(body.email || '').trim()
  const category = String(body.category || '').trim()
  const message = String(body.message || '').trim()

  if (!fullName || !email || !category || !message) {
    return res.status(400).json({ ok: false, message: 'All feedback fields are required.' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, message: 'Please enter a valid email address.' })
  }

  if (message.length > 3000) {
    return res.status(400).json({ ok: false, message: 'Message is too long. Keep it under 3000 characters.' })
  }

  try {
    const resend = new Resend(RESEND_API_KEY.value())
    const toEmail = extractEmail(FEEDBACK_TO_EMAIL.value()) || DEFAULT_FEEDBACK_TO_EMAIL
    const fromRaw = String(FEEDBACK_FROM_EMAIL.value() || '').trim()
    const fromEmail = extractEmail(fromRaw)

    if (!isValidEmail(toEmail)) {
      return res.status(500).json({
        ok: false,
        message: 'Feedback recipient is misconfigured. Set FEEDBACK_TO_EMAIL in Firebase params.',
      })
    }

    if (!isValidEmail(fromEmail)) {
      return res.status(500).json({
        ok: false,
        message:
          'Feedback sender is misconfigured. Set FEEDBACK_FROM_EMAIL to a valid sender address in Firebase params.',
      })
    }

    const fromHeader = fromRaw.includes('<') ? fromRaw : `Artist Flow <${fromEmail}>`

    const sendResult = await resend.emails.send({
      from: fromHeader,
      to: toEmail,
      subject: `[Artist Flow] ${category.toUpperCase()} feedback from ${fullName}`,
      replyTo: email,
      text: `New feedback received\n\nName: ${fullName}\nEmail: ${email}\nCategory: ${category}\n\nMessage:\n${message}`,
      html: `<h2>New Artist Flow feedback</h2><p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Category:</strong> ${category}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`,
    })

    if (sendResult.error) {
      logger.error('Resend rejected feedback email', sendResult.error)
      return res.status(500).json({
        ok: false,
        message: sendResult.error.message || 'Unable to send feedback email right now.',
      })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    logger.error('Feedback email failed', error)

    const errorMessage = String(error?.message || '')
    if (errorMessage.toLowerCase().includes('did not match the expected pattern')) {
      return res.status(500).json({
        ok: false,
        message:
          'Sender email format is invalid. Update FEEDBACK_FROM_EMAIL in Firebase params (for example: onboarding@resend.dev).',
      })
    }

    return res.status(500).json({ ok: false, message: 'Unable to send feedback email right now.' })
  }
})
