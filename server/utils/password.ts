export function validatePassword(password: string): { valid: boolean, message?: string } {
  if (password.length < 10) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins 10 caractères' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' }
  }
  return { valid: true }
}
