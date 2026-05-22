const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  community: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Community', 
    required: true 
  },

  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  stars: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500 },

  createdAt: { type: Date, default: Date.now }
})

// 🔥 CLAVE TOTAL (ANTI DUPLICADOS)
reviewSchema.index({ user: 1, community: 1 }, { unique: true })

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema)