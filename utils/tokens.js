const jwt = require("jsonwebtoken")

let refreshTokens = []

module.exports = {
  // Generate a new access token
  generateAccessToken(payload, secret) {
    return jwt.sign(payload, secret, { expiresIn: "15m" })
  },

  // Generate a new refresh token
  generateRefreshToken(payload, secret) {
    const refreshToken = jwt.sign(payload, secret)
    refreshTokens.push(refreshToken) // Store refresh token
    return refreshToken
  },

  verifyRefreshToken(token, secret) {
    return new Promise((resolve, reject) => {
      if (!refreshTokens.includes(token)) return reject("Invalid refresh token")

      jwt.verify(token, secret, (err, payload) => {
        if (err) return reject(err)
        resolve(payload)
      })
    })
  },

  // Remove a refresh token
  invalidateRefreshToken(token) {
    refreshTokens = refreshTokens.filter(existingToken => existingToken !== token)
  },

  // Verify ciient access token
  verifyAccessToken(token, secret) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, payload) => {
        if (err) return reject(err)
        resolve(payload)
      })
    })
  }

}
