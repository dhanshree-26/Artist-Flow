export const mapAuthError = (code: string) => {
  switch (code) {
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/email-already-in-use':
      return 'This email is already in use. Try logging in instead.'
    case 'auth/weak-password':
      return 'Password is too weak. Please make it stronger.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your internet and retry.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export const passwordChecks = (password: string) => ({
  minLength: password.length >= 8,
  upperCase: /[A-Z]/.test(password),
  lowerCase: /[a-z]/.test(password),
  number: /\d/.test(password),
  symbol: /[^A-Za-z0-9]/.test(password),
})

export const isStrongPassword = (password: string) => {
  const checks = passwordChecks(password)
  return Object.values(checks).every(Boolean)
}
