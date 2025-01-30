// Lattefy's clients route

const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()

const { authenticateToken, authenticateUserToken, authorizeRole } = require('../middleware/auth')

module.exports = (clientsConnection) => {

    const ClientModel = clientsConnection.model('Client', require('../models/Client'))

    // Create client (*)
    router.post('/', async (req, res) => {
        const { phoneNumber, password } = req.body

        try {
            const client = await ClientModel.findOne({ phoneNumber: phoneNumber })
            if (client) {
                return res.status(400).json({ message: "Client already exists" })
            }

            // Hash password before saving
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            const newClient = await ClientModel.create({ ...req.body, password: hashedPassword })
            res.status(201).json(newClient)
        } catch (error) {
            console.log(error)
            res.status(500).json(error)
        }

    })

    // Get clients by businessId (USER)
    router.get('/by-business', authenticateUserToken, async (req, res) => {
        try {

            const userBusinessId = req.user.businessId
            if (!userBusinessId) {
                return res.status(400).json({ message: "User does not have a valid businessId" })
            }

            const clients = await ClientModel.find({ businessIds: userBusinessId })
            res.json(clients)

        } catch (err) {
            console.error(err)
            res.status(500).json(err)
        }

    })

    // Update client (USER || CLIENT)
    router.put('/:phoneNumber', authenticateToken, async (req, res) => {

        const phoneNumber = req.params.phoneNumber
        const updates = req.body  

        try {

            let updatedClient

            if (!updates || Object.keys(updates).length === 0) {
                return res.status(400).json({ message: "No updates provided" })
            }

            // Add new businessId
            if (updates.newBusinessId) {
                updates.newBusinessId = Number(updates.newBusinessId)
                const addToSetUpdate = { $addToSet: { businessIds: updates.newBusinessId } }
                Object.assign(updates, addToSetUpdate)
                delete updates.newBusinessId  
            }

            // Remove businessId
            if (updates.removeBusinessId) {
                updates.removeBusinessId = Number(updates.removeBusinessId)
                const pullUpdate = { $pull: { businessIds: updates.removeBusinessId } }
                Object.assign(updates, pullUpdate)
                delete updates.removeBusinessId
            }

            if (req.user) {
                const userRole = req.user.role

                if (userRole === 'admin') {
                    updatedClient = await ClientModel.findOneAndUpdate(
                        { phoneNumber: phoneNumber },
                        updates, 
                        { new: true }
                    )
                } else {
                    return res.status(403).json({ message: "Access denied" })
                }
            }

            else if (req.client) {
                const clientPhoneNumber = req.client.phoneNumber
                if (clientPhoneNumber === phoneNumber) {
                    updatedClient = await ClientModel.findOneAndUpdate(
                        { phoneNumber: phoneNumber },
                        updates, 
                        { new: true }
                    )
                } else {
                    return res.status(403).json({ message: "Access denied" })
                }
            }

            return res.json(updatedClient)

        } catch (error) {
            res.status(500).json(error) // Internal server error
        }

    })



    // Get client by phone number (USER || CLIENT: themselves
    router.get('/:phoneNumber', authenticateToken, async (req, res) => {
        const phoneNumber = req.params.phoneNumber
    
        try {
            let client
    
            // User verification
            if (req.user) {
    
                const userRole = req.user.role
                const userBusinessId = req.user.businessId
    
                if (userRole === 'admin') {
                    client = await ClientModel.findOne({ phoneNumber })
                } else if (userRole === 'manager' || userRole === 'employee') {
                    if (!userBusinessId) {
                        return res.status(400).json({ message: "User does not have a valid businessId" })
                    }
    
                    client = await ClientModel.findOne({ phoneNumber, businessIds: userBusinessId })
                } else {
                    return res.status(403).json({ message: "Access denied" })
                }
            }
    
            // Client verification
            else if (req.client) {
                const clientPhoneNumber = req.client.phoneNumber
                if (clientPhoneNumber === phoneNumber) {
                    client = await ClientModel.findOne({ phoneNumber })
                } else {
                    return res.status(403).json({ message: "Access denied: clients can only access themselves" })
                }
            }
    
            if (!client) {
                return res.status(404).json({ message: "Client not found" })
            }
            return res.json(client)
    
        } catch (err) {
            return res.status(500).json({ message: "Internal server error", error: err.message })
        }
    })

    // Get clients based on role (USER)
    router.get('/', authenticateUserToken, authorizeRole(['admin', 'manager', 'employee']),
    async (req, res) => {

        try {

            const userRole = req.user.role
            const userBusinessId= req.user.businessId 

            let clients

            if (userRole === 'admin') {
                clients = await ClientModel.find()
            } else if (userRole === 'manager' || userRole === 'employee') {
                if (!userBusinessId) {
                    return res.status(400).json({ message: "User does not have a valid businessId" })
                }
                clients = await ClientModel.find({ businessIds: userBusinessId })
            }
            res.json(clients)

        } catch (err) {
            console.error(err)
            res.status(500).json({ message: "Internal server error", error: err.message })
        }
    })


    return router

}