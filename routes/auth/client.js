// Lattefy's client auth route

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

module.exports = (clientsConnection) => {

    const clientModel = clientsConnection.model('Client', require('../../models/Client'))

    // Login and generate tokens
    router.post('/login', async (req, res) => {
        const { phoneNumber, password } = req.body
        try {
            const client = await clientModel.findOne({ phoneNumber })
            if (!client) return res.status(400).json("Cannot find client")

            const isValidPassword = await bcrypt.compare(password, client.password)
            if (!isValidPassword) return res.status(403).json("Invalid password")

            // Generate tokens
            const accessToken = generateAccessToken({ phoneNumber:  client.phoneNumber }, process.env.CLIENT_ACCESS_TOKEN_SECRET)
            const refreshToken = generateRefreshToken({ phoneNumber: client.phoneNumber }, process.env.CLIENT_REFRESH_TOKEN_SECRET)

            res.json({ accessToken, refreshToken })

        } catch (err) {
            console.error("Login (client) error:", err)
            res.status(500).json("Server error")
        }
    })

    // Generate access token using refresh token
    router.post('/token', (req, res) => {
        const refreshToken = req.body.token
        if (!refreshToken) return res.sendStatus(401)

        verifyRefreshToken(refreshToken, process.env.CLIENT_REFRESH_TOKEN_SECRET)
            .then(client => {
                const accessToken = generateAccessToken({ phoneNumber: client.phoneNumber })
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

        verifyAccessToken(token, process.env.CLIENT_ACCESS_TOKEN_SECRET)
            .then(payload => res.json(payload))
            .catch(err => res.sendStatus(403)) // Token is invalid
    })

    return router
}
