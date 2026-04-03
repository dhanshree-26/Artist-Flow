import { Resend } from 'resend'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const asText = (value) => String(value || '').trim()

const isValidEmail = (value) => emailPattern.test(value)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}

  const fullName = asText(body.fullName)
  const email = asText(body.email)
  const category = asText(body.category)
  const message = asText(body.message)

  if (!fullName || !email || !category || !message) {
    return res.status(400).json({ ok: false, message: 'All feedback fields are required.' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, message: 'Please enter a valid email address.' })
  }

  const apiKey = asText(process.env.RESEND_API_KEY)
  const toEmail = asText(process.env.FEEDBACK_TO_EMAIL) || 'dhanshreepathrabe26@gmail.com'
  const fromEmail = asText(process.env.FEEDBACK_FROM_EMAIL) || 'onboarding@resend.dev'

  if (!apiKey) {
    return res.status(500).json({ ok: false, message: 'Missing RESEND_API_KEY in Vercel environment variables.' })
  }

  if (!isValidEmail(toEmail) || !isValidEmail(fromEmail)) {
    return res.status(500).json({ ok: false, message: 'Feedback email configuration is invalid on server.' })
  }

  try {
    const resend = new Resend(apiKey)

    const ownerResult = await resend.emails.send({
      from: `Artist Flow <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `[Artist Flow] ${category.toUpperCase()} feedback from ${fullName}`,
      text: `New feedback received\n\nName: ${fullName}\nEmail: ${email}\nCategory: ${category}\n\nMessage:\n${message}`,
      html: `<h2>New Artist Flow feedback</h2><p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Category:</strong> ${category}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`,
    })

    if (ownerResult.error) {
      return res.status(500).json({ ok: false, message: ownerResult.error.message || 'Unable to send feedback email.' })
    }

    const userResult = await resend.emails.send({
      from: `Artist Flow <${fromEmail}>`,
      to: email,
      subject: 'Thanks for your feedback to Artist Flow',
      text: `Hi ${fullName},\n\nThank you for sharing your feedback with Artist Flow. Our team has received your message and will review it shortly.\n\nCategory: ${category}\n\nYour message:\n${message}\n\nRegards,\nArtist Flow Team`,
      html: `<h2>Thank you for your feedback</h2><p>Hi ${fullName},</p><p>Thank you for sharing your feedback with Artist Flow. Our team has received your message and will review it shortly.</p><p><strong>Category:</strong> ${category}</p><p><strong>Your message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p><p>Regards,<br/>Artist Flow Team</p>`,
    })

    if (userResult.error) {
      return res.status(500).json({
        ok: false,
        message: userResult.error.message || 'Feedback was received, but thank-you email could not be sent.',
      })
    }

    return res.status(200).json({ ok: true })
  } catch {
    return res.status(500).json({ ok: false, message: 'Unable to send feedback email right now.' })
  }
}