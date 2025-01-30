// Lattefy's cards route

const express = require("express")
const router = express.Router()

const { authenticateToken, authenticateUserToken, authorizeRole } = require('../middleware/auth')

module.exports = (cardsConnection) => {

    const CardModel = cardsConnection.model('Card', require('../models/Card'))

    // Create card (USER || CLIENT)
    router.post('/', authenticateToken, async (req, res) => {
        const { clientPhoneNumber, businessId, templateId } = req.body

        const cardExists = await CardModel.findOne({ clientPhoneNumber, templateId })
        if (cardExists) {
            return res.status(400).json({ message: "Card already exists" })
        }

        try {

            let card

            if (req.user) {

                const userRole = req.user.role
                const userBusinessId = req.user.businessId

                // Admins can create cards for any business
                if (userRole === 'admin') {
                    card = await CardModel.create({ clientPhoneNumber, businessId, templateId })
                } else if (userRole  === 'manager' || userRole === 'employee') {
                    if (businessId === userBusinessId) {
                        card = await CardModel.create({ clientPhoneNumber, businessId, templateId })
                    } else {
                        return res.status(403).json({ message: "Business Id is not valid" })
                    }
                } else {
                    return res.status(403).json({ message: "Access denied" })
                }
            }

            else if (req.client) {

                const phoneNumber = req.client.phoneNumber
                if (clientPhoneNumber === phoneNumber) {
                    card = await CardModel.create({ clientPhoneNumber, businessId, templateId })
                } else {
                    return res.status(403).json({ message: "Phone number is not valid" })
                }

            }

            if (card) {
                return res.status(201).json(card)
            }
            

        } catch (error) {
            console.log(error)
            res.status(500).json(error)
        }

    })

    // Get cards by businessId (USER)
    router.get('/by-business', authenticateUserToken, authorizeRole(['admin', 'manager', 'employee']),
    async (req, res) => {
        try {

            const userBusinessId = req.user.businessId
            if (!userBusinessId) {
                return res.status(400).json({ message: "User does not have a valid businessId" })
            }

            const cards = await CardModel.find({ businessId: userBusinessId })
            res.json(cards)

        } catch (error) {
            console.error(error)
            res.status(500).json(error)
        }

    })

    // Update card (USER || CLIENT)
    router.put('/', authenticateToken, async (req, res) => {

        const { businessId, phoneNumber, templateId } = req.body
        if (!businessId || !phoneNumber || !templateId) {
            return res.status(400).send('Missing required body parameters')
        }

        try {

            let updatedCard

            if (req.user) {

                const userRole = req.user.role
                const userBusinessId = req.user.businessId

                // Admins can update any card
                if (userRole === 'admin') {

                    updatedCard = await CardModel.findOneAndUpdate({ 
                        clientPhoneNumber: clientPhoneNumber,
                        businessId: businessId,
                        templateId: templateId
                    }, updates, { new: true })

                // Managers & employees can only update their business's cards
                } else if (userRole === 'manager' || userRole === 'employee') {

                    if (businessId === userBusinessId) {

                        updatedCard = await CardModel.findOneAndUpdate({ 
                            clientPhoneNumber: clientPhoneNumber,
                            businessId: businessId,
                            templateId: templateId
                        }, updates, { new: true })

                    } else {
                        return res.status(403).json({ message: "Business Id is not valid" })
                    }
                }
            }

            if (req.client) {

                // Clients can only update their own cards
                const clientPhoneNumber = req.client.phoneNumber
                if (clientPhoneNumber === phoneNumber) {

                    updatedCard = await CardModel.findOneAndUpdate({ 
                        clientPhoneNumber: clientPhoneNumber,
                        businessId: businessId,
                        templateId: templateId
                    }, updates, { new: true })

                } else {
                    return res.status(403).json({ message: "Client phone number is not valid" })
                } 

            }

            res.json(updatedCard)

        } catch (error) {
            res.status(500).json(error)
        }

    })

    // Get cards by phone number (USER & CLIENT: themselves)
    router.get('/:phoneNumber', authenticateToken, async (req, res) => {
        const phoneNumber = req.params.phoneNumber
    
        try {

            let card
    
            // user verification
            if (req.user) {
                
                const userRole = req.user.role
                const userBusinessId = req.user.businessId

                // Admins can get all cards
                if (userRole === 'admin') {
                    card = await CardModel.find({ clientPhoneNumber: phoneNumber })
                // Managers & employees can only get their business's cards
                } else if (userRole === 'manager' || userRole === 'employee') {
                    if (!userBusinessId) {
                        return res.status(400).json({ message: "User does not have a valid businessId" })
                    }
                    card = await CardModel.find({ clientPhoneNumber: phoneNumber, businessId: { $in: [userBusinessId] }  })
                } else {
                    return res.status(403).json({ message: "Access denied" })
                }

            }
    
            // client verification (only themselves)
            else if (req.client) {
                if (req.client.phoneNumber === phoneNumber) {
                    card = await CardModel.find({ clientPhoneNumber: phoneNumber })
                } else {
                    return res.status(403).json("Access denied: clients can only access themselves")
                }
            }
    
            if (!card || card.length === 0) return res.status(404).json("Card not found")
            return res.json(card)

        } catch (err) {
            console.error(err)
            res.status(500).json(err)
        }

    })

    // Get cards based on role (USER || CLIENTS)
    router.get('/', authenticateToken, async (req, res) => {

        try {

            let cards

            if (req.user) {

                const userRole = req.user.role 
                const userBusinessId = req.user.businessId
        
                // Admins can get all cards
                if (userRole === 'admin') {
                    cards = await CardModel.find()
                // Managers & employees can only get their business's cards
                } else if (userRole === 'manager' || userRole === 'employee') {
                    if (!userBusinessId) {
                        return res.status(400).json({ message: "User does not have a valid businessId" })
                    }
                    cards = await CardModel.find({ businessId: { $in: [userBusinessId] }})
                } else {
                    return res.status(403).json({ message: "Access denied" })
                }

            }

            else if (req.client) {
                // Clients can only get their cards
                const clientPhoneNumber = req.client.phoneNumber
                cards = await CardModel.find({ clientPhoneNumber: clientPhoneNumber })
            }

            if (!cards) {
                return res.status(404).json({ message: "Cards not found" })
            }
            res.json(cards)

        } catch (error) {
            res.status(500).json({ message: "Internal server error", error: error.message })
        }
    })


    return router

}