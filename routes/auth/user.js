// Lattefy's user auth route

const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const router = express.Router()

const { 
    generateAccessToken, 
    generateRefreshToken,  
    verifyRefreshToken, 
    verifyAccessToken,
    invalidateRefreshToken 
} = require('../../utils/tokens')

module.exports = (usersConnection) => {

    const UserModel = usersConnection.model('User', require('../../models/User'))

    // Login and generate tokens
    router.post('/login', async (req, res) => {
        const { username, password } = req.body
        try {
            const user = await UserModel.findOne({ username: username })
            if (!user) return res.status(400).json("Cannot find user")

            const isValidPassword = await bcrypt.compare(password, user.password)
            if (!isValidPassword) return res.status(403).json("Invalid password")

            const tokenPayload = {
                username: user.username,
                role: user.role, 
                businessId: user.businessId, 
            }

            // Generate tokens
            const accessToken = generateAccessToken(tokenPayload, process.env.USER_ACCESS_TOKEN_SECRET)
            const refreshToken = generateRefreshToken(tokenPayload, process.env.USER_REFRESH_TOKEN_SECRET)

            res.json({ accessToken, refreshToken })

        } catch (err) {
            console.error("Login (user) error:", err)
            res.status(500).json("Server error")
        }
    })

    // Generate access token using refresh token
    router.post('/token', (req, res) => {
        const refreshToken = req.body.token
        if (!refreshToken) return res.sendStatus(401)

        verifyRefreshToken(refreshToken, process.env.USER_REFRESH_TOKEN_SECRET)
            .then(user => {
                const accessToken = generateAccessToken({ username: user.username })
                res.json({ accessToken })
            })
            .catch(error => {
                console.error("Token verification failed:", error)
                res.sendStatus(403)
            })
    })

    // Logout (invalidate refresh token)
    router.delete('/logout', (req, res) => {
        const refreshToken = req.body.token
        invalidateRefreshToken(refreshToken)
        res.sendStatus(204)
    })

    // Verify token endpoint
    router.get('/verify-token', (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1]
        if (!token) return res.sendStatus(401)

        verifyAccessToken(token, process.env.USER_ACCESS_TOKEN_SECRET)
            .then(payload => res.json(payload))
            .catch(err => res.sendStatus(403)) // Token is invalid
    })

    return router
}
