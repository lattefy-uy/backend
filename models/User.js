const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({

    businessId: { type: Number, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'employee', 'manager'], default: 'employee' },

}, {
    timestamps: true 
})

module.exports = UserSchema