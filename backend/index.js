require('dotenv').config()
require('./bot/telegramBot')

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

// 👇 IMPORTANTE: modelo Review para índices
const Review = require('./models/Review')

// Servicios
const { getOrCreateUserFromTelegram } = require('./services/telegramAuth')

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// 🔍 Solo para verificar (luego eliminar en producción)
console.log('URI:', process.env.MONGODB_URI)

// 🔗 Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado')
  })
  .catch(err => {
    console.error('❌ Error Mongo:', err)
  })

// 🧠 AQUÍ VA LO IMPORTANTE (ÍNDICE ÚNICO)
mongoose.connection.once('open', async () => {
  try {
    await Review.syncIndexes()
    console.log('✅ Índices de Review creados correctamente')
  } catch (error) {
    console.error('❌ Error creando índices:', error)
  }
})

// 🌱 Endpoint base
app.get('/', (req, res) => {
  res.json({
    name: 'ARBOLGRAM API',
    status: 'online',
    message: 'La semilla está viva 🌱'
  })
})

// 🔐 Login / registro vía Telegram
app.post('/auth/telegram', async (req, res) => {
  try {
    const telegramUser = req.body

    if (!telegramUser || !telegramUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Datos de Telegram inválidos'
      })
    }

    const result = await getOrCreateUserFromTelegram(telegramUser)

    res.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('❌ Error auth telegram:', error)
    res.status(500).json({
      success: false,
      message: 'Error autenticando usuario'
    })
  }
})

// 🚀 Arranque del servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 ARBOLGRAM backend corriendo en puerto ${PORT}`)
})