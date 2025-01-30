const mongoose = require("mongoose")

const ClientSchema = new mongoose.Schema({

    // Business data
    businessIds: {
        type: [Number],
        ref: 'Business',
        required: true,
    },

    // Contact data
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    cedula: { type: String, required: false },
    birthDate: { type: Date, required: false }

},{ timestamps: true })

module.exports = ClientSchema