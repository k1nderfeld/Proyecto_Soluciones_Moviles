const jwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production.')
  return 'dev-secret-change-me'
}
module.exports = { jwtSecret }
