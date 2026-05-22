const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  telegram_id: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String
  },
  first_name: {
    type: String
  },
  last_name: {
    type: String
  },
  is_bogotashopping_member: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0
  },

  // 🔥 AQUÍ VA (dentro del objeto)
  badges: {
    type: [String],
    default: []
  },

  referred_by: {
    type: String
  }

}, { timestamps: true })

module.exports = mongoose.models.User || mongoose.model('User', userSchema)