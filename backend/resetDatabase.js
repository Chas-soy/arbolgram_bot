const mongoose = require('mongoose')

const MONGO_URI = 'mongodb://127.0.0.1:27017/arbolgram' // ⚠️ revisa este nombre

async function resetDB() {
  try {
    await mongoose.connect(MONGO_URI)

    console.log('🟢 Conectado a:', MONGO_URI)

    await mongoose.connection.dropDatabase()

    console.log('💣 BASE COMPLETAMENTE BORRADA')

    const collections = await mongoose.connection.db.collections()
    console.log('📂 Colecciones restantes:', collections.length)

    await mongoose.disconnect()

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

resetDB()