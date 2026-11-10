require('dotenv').config()

fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'api-key': process.env.BREVO_API_KEY,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    sender: { name: 'LegacyVault', email: process.env.MAIL_FROM },
    to: [{ email: 'an_inbox_you_can_check@gmail.com' }],
    subject: 'Brevo test',
    textContent: 'If you can read this, Brevo works.',
  }),
}).then(async (r) => console.log(r.status, await r.text()))