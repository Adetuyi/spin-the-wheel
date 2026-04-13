// Common personal / consumer email domains to block
export const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.in', 'yahoo.com.ng',
  'ymail.com', 'rocketmail.com',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de',
  'outlook.com', 'outlook.co.uk', 'outlook.ng',
  'live.com', 'live.co.uk', 'live.fr',
  'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'aol.co.uk',
  'protonmail.com', 'proton.me', 'pm.me',
  'mail.com', 'email.com',
  'yandex.com', 'yandex.ru',
  'gmx.com', 'gmx.net', 'gmx.de',
  'zoho.com',
  'tutanota.com', 'tuta.io',
  'fastmail.com', 'fastmail.fm',
])

export function getEmailDomain(email: string): string {
  return email.toLowerCase().split('@')[1] ?? ''
}

export function isPersonalEmail(email: string): boolean {
  return PERSONAL_DOMAINS.has(getEmailDomain(email))
}

export const PERSONAL_EMAIL_ERROR =
  'Please use your business email address. Personal email providers (Gmail, Yahoo, Outlook, etc.) are not allowed.'
