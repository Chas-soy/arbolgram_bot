const mongoose = require('mongoose')

const CommunityStatsSchema = new mongoose.Schema({

  telegram_id:{
    type:String,
    required:true
  },

  member_count:{
    type:Number,
    required:true
  },

  recorded_at:{
    type:Date,
    default:Date.now
  }

})

module.exports = mongoose.model('CommunityStats',CommunityStatsSchema)