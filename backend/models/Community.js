const mongoose = require('mongoose') 

const communitySchema = new mongoose.Schema({
  telegram_id: {
    type: String,
    required: true,
    unique: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  type: {
    type: String,
    enum: ['channel', 'group', 'bot'],
    required: true
  },

  category: {
    type: String,
    default: null,
    lowercase: true,   // 🔥 normaliza automáticamente
    trim: true
  },

  description: {
    type: String,
    maxlength: 200,
    default: '',
    trim: true
  },

  link: {
    type: String,
    default: null,
    unique: true, // 🔥 evita duplicados por link
    sparse: true  // permite null sin conflicto
  },

  member_count: {
    type: Number,
    default: 0
  },

  growth_score: { // 🔥 NUEVO (crecimiento)
    type: Number,
    default: 0
  },

  is_pro: {
    type: Boolean,
    default: false
  },

  is_active: {
    type: Boolean,
    default: true
  },

  activity_score: {
    type: Number,
    default: 0
  },

  reviews_count: {
    type: Number,
    default: 0
  },

  rating_average: {
    type: Number,
    default: 0
  },

  score: { // 🔥 ranking final
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  }

}, { timestamps: true })

// 🚀 ÍNDICES PRO (para escalar)
communitySchema.index({ category: 1 })
communitySchema.index({ score: -1 })
communitySchema.index({ member_count: -1 })

// 🧠 CALCULAR SCORE AUTOMÁTICO
communitySchema.methods.calculateScore = function () {
  this.score =
    (this.member_count * 0.4) +
    (this.rating_average * 20 * 0.3) + // multiplicamos para equilibrar
    (this.activity_score * 0.2) +
    (this.growth_score * 0.1)
}

module.exports = mongoose.model('Community', communitySchema)