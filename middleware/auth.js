// Lattefy's token auth middleware

const jwt = require('jsonwebtoken')

// auth: USER
const authenticateUserToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] // Bearer token format
    if (!token) return res.sendStatus(401)

    try {

        // User token validation
        jwt.verify(token, process.env.USER_ACCESS_TOKEN_SECRET, (error, user) => {
            if (error) {
                return res.sendStatus(403)
            }
            req.user = user 
            next()
        })

    } catch (userError) {
        return res.sendStatus(403)
    }
}

// auth: USER || CLIENT
const authenticateToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] // Bearer token format
    if (!token) return res.status(401).json({ message: 'No token provided' })

    try {
        // User token validation
        const user = jwt.verify(token, process.env.USER_ACCESS_TOKEN_SECRET)
        if (user) {
            req.user = user 
            return next()
        }
    } catch (userError) {
        // Client token validation
        try {
            const client = jwt.verify(token, process.env.CLIENT_ACCESS_TOKEN_SECRET)
            if (client) {
                req.client = client 
                return next() 
            }
        } catch (clientError) {
            return res.status(403).json({ message: 'Invalid or expired token' })
        }
    }
}


// Role-based auth
const authorizeRole = (allowedRoles) => (req, res, next) => {
    const { role } = req.user || {}
    if (!role) {
        return res.status(403).json({ message: "Access denied: No role provided" })
    }
    if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: `Access denied for role: ${role}` })
    }
    next() 
}

module.exports = { 
    authenticateToken, 
    authenticateUserToken,
    authorizeRole
}