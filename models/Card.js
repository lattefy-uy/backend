// Lattefy's Card Schema

const mongoose = require("mongoose")

const CardSchema = new mongoose.Schema({
    businessId: { type: Number, ref: "Business", required: true },
    clientPhoneNumber: { type: String, required: true, index: true },
    templateId: { type: Number, required: true },

    // Card data
    status: { type: String, required: false, enum: ["ACTIVE", "SUSPENDED", "EXPIRED"], default: "ACTIVE" },
    totalSpent: { type: Number, required: false, min: 0 },
    averageExpenditure: { type: Number, required: false, min: 0 },
    expiresAt: { type: Date, required: false },

    // Fidelity Card
    rewardAvailable: { type: Boolean, required: false },
    currentPoints: { type: Number, required: false, min: 0 },
    totalPoints: { type: Number, required: false, min: 0 },
    rewardsClaimed: { type: Number, required: false, min: 0 },

    // Discount Card
    discountAvailable: { type: Boolean, required: false },
    discountsClaimed: { type: Number, required: false, min: 0 }

  },
  { timestamps: true } 
)

// Compound index
CardSchema.index({ businessId: 1, clientPhoneNumber: 1, templateId: 1 }, { unique: true })

module.exports = CardSchema
