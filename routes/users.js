// Lattefy's user route

const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const { authenticateUserToken } = require("../middleware/auth")

// Users Route Function
module.exports = (usersConnection) => {

    const UserModel = usersConnection.model('User', require('../models/User')) 

    // Create User (*)
    router.post('/', async (req, res) => {
        const { username, password } = req.body
        try {
            // Check if the user already exists
            const existingUser = await UserModel.findOne({ username })
            if (existingUser) return res.status(400).json("User already exists")

            // Hash password before saving
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            
            // Save new user with hashed password
            const newUser = await UserModel.create({ ...req.body, password: hashedPassword })
            res.status(201).json(newUser)
        } catch (err) {
            res.status(500).json(err.message)
        }
    })

    // Update User (USER)
    router.put('/:username', authenticateUserToken, async (req, res) => {
        const username = req.params.username
        const updates = req.body

        try {
            // Update user and return updated document
            const updatedUser = await UserModel.findOneAndUpdate({ username }, updates, { new: true })
            if (!updatedUser) return res.status(404).json("User not found")
            res.json(updatedUser)
        } catch (err) {
            res.status(500).json(err.message)
        }
    })

    // Get All Users (USER) * admin only
    router.get('/', authenticateUserToken, async (req, res) => {
        try {

            const userRole = req.user.role
            const userBusinessId = req.user.businessId

            let users

            if (userRole === 'admin') {
                users = await UserModel.find()
            } else if (userRole === 'manager') {
                users = await UserModel.find({ role: { $in: ['manager', 'employee'] }, businessId: userBusinessId })
            } else {
                return res.status(403).json({ message: "Access denied" })
            }

            res.json(users)
        } catch (err) {
            res.status(500).json(err.message)
        }
    })

    // Get User by Username (Protected)
    router.get('/:username', authenticateUserToken, async (req, res) => {
        const username = req.params.username
        try {

            const userRole = req.user.role
            const userBusinessId = req.user.businessId

            let user

            if (userRole === 'admin') {
                user = await UserModel.findOne({ username })
            } else if (userRole === 'manager') {
                user = await UserModel.findOne({ username, role: { $in: ['manager', 'employee'] }, businessId: userBusinessId })
            } else if (userRole === 'employee') {
                user = await UserModel.findOne({ username, role: 'employee', businessId: userBusinessId })
            }

            if (!user) return res.status(403).json("Access denie")
            res.json(user)

        } catch (err) {
            res.status(500).json(err.message)
        }
    })

    return router
}
