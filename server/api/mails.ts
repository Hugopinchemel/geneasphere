import { sub } from 'date-fns'

const mails = [{

  id: 20,
  from: {
    name: 'Contact',
    email: 'contact@geneasphere.com'
  },
  subject: 'Création de compte',
  body: `
  Bonjour,
  Merci de votre inscription sur Geneasphere.
  Nous sommes ravis de vous accueillir dans notre communauté de passionnés de généalogie.

  `,
  date: sub(new Date(), { months: 0 }).toISOString()
}]

export default eventHandler(async () => {
  return mails
})
