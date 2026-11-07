import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hash a plain text password with bcrypt (cost factor 12).
 *
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a plain text password with a bcrypt hash.
 *
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  if (!password || !hash) return false
  return bcrypt.compare(password, hash)
}

export default {
  hashPassword,
  comparePassword,
}
