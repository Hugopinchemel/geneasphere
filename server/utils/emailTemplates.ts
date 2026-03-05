/**
 * Email templates for GeneaSphere notifications
 */

interface EmailTemplate {
  subject: string
  body: string
}

export function createPasswordResetEmail(userName: string, resetToken: string, resetUrl: string): EmailTemplate {
  return {
    subject: 'Réinitialisation de votre mot de passe - GeneaSphere',
    body: `Bonjour ${userName},

Vous avez demandé à réinitialiser votre mot de passe GeneaSphere.

Pour créer un nouveau mot de passe, veuillez cliquer sur le lien ci-dessous :
${resetUrl}?token=${resetToken}

Ce lien expirera dans 1 heure pour des raisons de sécurité.

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.

Cordialement,
L'équipe GeneaSphere`
  }
}

export function createLoginNotificationEmail(userName: string, loginTime: Date, ipAddress?: string): EmailTemplate {
  const timeStr = loginTime.toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short'
  })

  return {
    subject: 'Nouvelle connexion à votre compte GeneaSphere',
    body: `Bonjour ${userName},

Une nouvelle connexion à votre compte GeneaSphere a été détectée.

Date et heure : ${timeStr}${ipAddress ? `\nAdresse IP : ${ipAddress}` : ''}

Si vous êtes à l'origine de cette connexion, vous pouvez ignorer cet email.

Si vous ne reconnaissez pas cette activité, nous vous recommandons de changer votre mot de passe immédiatement.

Cordialement,
L'équipe GeneaSphere`
  }
}

export function createTreeConnectionRequestEmail(
  userName: string,
  requesterName: string,
  matchedPersonName: string,
  acceptUrl: string
): EmailTemplate {
  return {
    subject: `${requesterName} souhaite se connecter à votre arbre généalogique`,
    body: `Bonjour ${userName},

${requesterName} a ajouté une personne similaire à votre profil dans son arbre généalogique et souhaiterait se connecter avec vous.

Personne concernée : ${matchedPersonName}

En vous connectant, vous pourrez :
• Partager vos recherches généalogiques
• Découvrir des branches communes de votre famille
• Collaborer sur votre histoire familiale

Pour accepter cette demande de connexion, cliquez ici :
${acceptUrl}

Vous pouvez également consulter cette demande dans votre tableau de bord GeneaSphere.

Cordialement,
L'équipe GeneaSphere`
  }
}
