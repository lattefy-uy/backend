// Lattefy's Template Schema

const mongoose = require("mongoose")

const TemplateSchema = new mongoose.Schema({

    templateId: { type: Number, required: true, unique: true }, // 1.0
    businessId: { type: Number, ref: "Business", required: true }, // 1
    name: { type: String, required: true }, // Billy Burgers Fidelity Template
    type: { type: String, enum: ["FIDELITY", "DISCOUNT", "GIFT"], required: true },

    // Card content
    header: { type: String, required: false }, // TARJETA BILLY
    footer: { type: String, required: false }, // Suma billies con tu celular en nuestro local.
    imageUrl: { type: String, required: false }, // https://cloudinary...

    // Points data
    pointName: { type: String, required: false }, // Billies
    pointCost: { type: Number, required: false, min: 0 }, // 500
    pointsNeeded: { type: Number, required: false, min: 0 }, // 8 billies

    discountAmount: { type: Number, required: false, min: 0 }, // 15 % OFF
    reward: { type: String, required: false }, // burger gratis

    expiryTime: { type: Number, required: false, min: 0 }, // 30 dias

    // Color Palette (hexadecimal)
    bgColor: { type: String, required: false, match: /^#([0-9A-F]{3}){1,2}$/i },
    lightColor: { type: String, required: false, match: /^#([0-9A-F]{3}){1,2}$/i },
    headerColor: { type: String, required: false, match: /^#([0-9A-F]{3}){1,2}$/i },
    nameColor: { type: String, required: false, match: /^#([0-9A-F]{3}){1,2}$/i },
    primaryColor: { type: String, required: false, match: /^#([0-9A-F]{3}){1,2}$/i },
    rewardBgColor: { type: String, required: false, match: /^#([0-9A-F]{3}){1,2}$/i },
    rewardTextColor: { type: String, required: false, match: /^#([0-9A-F]{3}){1,2}$/i },
    footerColor: { type: String, required: false, match: /^#([0-9A-F]{3}){1,2}$/i }

}, { timestamps: true })

module.exports = TemplateSchema