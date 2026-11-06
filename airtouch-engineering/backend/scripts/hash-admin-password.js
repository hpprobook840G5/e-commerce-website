import bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Usage: node scripts/hash-admin-password.js <password>')
  process.exit(1)
}

const saltRounds = 12
const hash = await bcrypt.hash(password, saltRounds)

console.log('--- AirTouch Engineering Admin Password Hash Generator ---')
console.log('Plaintext password:', password)
console.log('Bcrypt hash (ADMIN_PASSWORD_HASH):')
console.log(hash)
console.log('\nAdd this to your backend/.env as:')
console.log(`ADMIN_PASSWORD_HASH="${hash}"`)

