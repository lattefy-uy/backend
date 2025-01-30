// Lattefy's templates route

const express = require("express")
const router = express.Router()

const { authenticateToken, authenticateUserToken, authorizeRole } = require('../middleware/auth')

module.exports = (templatesConnection) => {

    const TemplateModel = templatesConnection.model('Template', require('../models/Template'))

    // Create template (USER)
    router.post('/', authenticateUserToken, async (req, res) => {
        const templateId = req.body.templateId
        const businessId = req.body.businessId

        const templateExists = await TemplateModel.findOne({ templateId })
        if (templateExists) {
            return res.status(400).json({ message: "Template already exists" })
        }

        try {

            let template

            if (req.user) {

                const userRole = req.user.role
                const userBusinessId = req.user.businessId

                // Admins can create templates for any business
                if (userRole === 'admin') {
                    template = await TemplateModel.create({ ...req.body })
                // Managers can create templates only for their business
                } else if (userRole  === 'manager') {
                    if (businessId === userBusinessId) {
                        template = await TemplateModel.create({ ...req.body, businessId: userBusinessId })
                    } else {
                        return res.status(403).json({ message: "Business Id is not valid" })
                    }
                } else {
                    return res.status(403).json({ message: "Access denied" })
                }
            }

            if (template) {
                return res.status(201).json(template)
            }
            

        } catch (error) {
            console.log(error)
            res.status(500).json(error)
        }

    })

    // Update template (USER)
    router.put('/', authenticateUserToken, async (req, res) => {

        const templateId = req.body
        if (!templateId) {
            return res.status(400).send('Missing Template Id')
        }

        try {

            let updatedtemplate

            if (req.user) {

                const userRole = req.user.role
                const userBusinessId = req.user.businessId

                // Admins can update any template
                if (userRole === 'admin') {
                    updatedtemplate = await TemplateModel.findOneAndUpdate({ 
                        templateId: templateId
                    }, updates, { new: true })

                // Managers can only update their business's templates
                } else if (userRole === 'manager') {

                    if (businessId === userBusinessId) {
                        updatedtemplate = await TemplateModel.findOneAndUpdate({ 
                            templateId: templateId
                        }, updates, { new: true })
                    } else {
                        return res.status(403).json({ message: "Business Id is not valid" })
                    }

                } else {
                    return res.status(403).json({ message: "Access denied" })
                }
            }

            if (updatedtemplate) {
                return res.json(updatedtemplate)
            }

        } catch (error) {
            res.status(500).json(error)
        }

    })

    // Get templates by id (USER || CLIENT)
    router.get('/:templateId', authenticateToken, async (req, res) => {
        const templateId = req.params.templateId
    
        try {

            let template
    
            // user verification
            if (req.user) {
                console.log('User token (template)')
                
                const userRole = req.user.role
                const userBusinessId = req.user.businessId

                // Admins can get all templates
                if (userRole === 'admin') {
                    template = await TemplateModel.find({ templateId: templateId })
                // Managers & employees can only get their business's templates
                } else if (userRole === 'manager' || userRole === 'employee') {
                    if (!userBusinessId) {
                        return res.status(400).json({ message: "User does not have a valid businessId" })
                    }
                    template = await TemplateModel.find({ businessId: { $in: [userBusinessId] }, templateId: templateId })
                } else {
                    return res.status(403).json({ message: "Access denied" })
                }

            }
    
            // client verification (any template)
            else if (req.client) {
                template = await TemplateModel.find({ templateId: templateId })
            }
    
            if (!template || template.length === 0) return res.status(404).json("template not found")
            return res.json(template)

        } catch (error) {
            console.error(error)
            res.status(500).json(error)
        }

    })

    // Get templates based on role (USER || CLIENTS)
    router.get('/', authenticateToken, async (req, res) => {

        try {

            let templates

            if (req.user) {

                const userRole = req.user.role 
                const userBusinessId = req.user.businessId
        
                // Admins can get all templates
                if (userRole === 'admin') {
                    templates = await TemplateModel.find()
                // Managers & employees can only get their business's templates
                } else if (userRole === 'manager' || userRole === 'employee') {
                    if (!userBusinessId) {
                        return res.status(400).json({ message: "User does not have a valid businessId" })
                    }
                    templates = await TemplateModel.find({ businessId: { $in: [userBusinessId] }})
                } 

            } else {
                return res.status(403).json({ message: "Access denied" })
            }

            if (!templates) {
                return res.status(404).json({ message: "Templates not found" })
            }
            res.json(templates)

        } catch (error) {
            res.status(500).json({ message: "Internal server error", error: error.message })
        }
    })

    return router

}