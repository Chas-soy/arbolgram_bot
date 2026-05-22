// ── Imports (todos al top, sin repeticiones internas) ────────
const getUserLevel            = require('../services/getUserLevel')
const getCommunityRating      = require('../services/getCommunityRating')
const notifyGrowth            = require('../services/notifyGrowth')
const getCommunitiesByCategory = require('../services/getCommunitiesByCategory')
const updateMemberCounts      = require('../services/updateMemberCounts')
const detectFastGrowth        = require('../services/detectFastGrowth')
const getTrendingCommunities  = require('../services/getTrendingCommunities')
const getTopCommunities       = require('../services/getTopCommunities')
const updateCommunityStats    = require('../services/updateCommunityStats')
const addReview               = require('../services/addReview')
const checkUserBadges         = require('../services/checkUserBadges')
const TelegramBot             = require('node-telegram-bot-api')
const Community               = require('../models/Community')
const User                    = require('../models/user')
 
// ── Mapa de categorías (sincronizado con el teclado) ─────────
const categoriesMap = {
  deportes:        '🧗 Deportes',
  musica:          '🎵 Música',
  gaming:          '🎮 Gaming',
  cripto:          '💰 Cripto',
  trading:         '📈 Trading',
  educacion:       '📚 Educación',
  salud:           '🧠 Salud',
  negocios:        '💼 Negocios',
  ofertas:         '🛍 Ofertas',
  agricultura:     '🌱 Agricultura',
  comunidades:     '💬 Comunidades',
  humor:           '😂 Humor',
  tecnologia:      '💻 Tecnología',
  noticias:        '📰 Noticias',
  politica:        '🏛 Política',
  entretenimiento: '🎬 Entretenimiento',
  viajes:          '✈️ Viajes',
  relaciones:      '❤️ Relaciones',
  otros:           '🧩 Otros',
  '+18':           '🔞 +18'
}
 
const CATEGORY_PAGE_SIZE = 5
 
const token = process.env.TELEGRAM_BOT_TOKEN
const bot   = new TelegramBot(token, { polling: true })
 
let botId
bot.getMe().then(me => {
  botId = me.id
  console.log(`🤖 Bot ${me.username} activo...`)
})
 
const userStates = {}
 
function setState(userId, step, data = {}) {
  userStates[userId] = {
    ...(userStates[userId] || {}),
    step,
    ...data
  }
}
 
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}
 
/* =========================
   TECLADOS
========================= */
 
function categoryKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🎵 Música',          callback_data: 'cat_musica' },
       { text: '🎮 Gaming',          callback_data: 'cat_gaming' }],
      [{ text: '💰 Cripto',          callback_data: 'cat_cripto' },
       { text: '📈 Trading',         callback_data: 'cat_trading' }],
      [{ text: '📚 Educación',       callback_data: 'cat_educacion' },
       { text: '🧠 Salud',           callback_data: 'cat_salud' }],
      [{ text: '💼 Negocios',        callback_data: 'cat_negocios' },
       { text: '🛍 Ofertas',         callback_data: 'cat_ofertas' }],
      [{ text: '💻 Tecnología',      callback_data: 'cat_tecnologia' },
       { text: '📰 Noticias',        callback_data: 'cat_noticias' }],
      [{ text: '🏛 Política',        callback_data: 'cat_politica' },
       { text: '🎬 Entretenimiento', callback_data: 'cat_entretenimiento' }],
      [{ text: '🧗 Deportes',        callback_data: 'cat_deportes' },
       { text: '😂 Humor',           callback_data: 'cat_humor' }],
      [{ text: '🛍 Ofertas',         callback_data: 'cat_ofertas' },
       { text: '✈️ Viajes',          callback_data: 'cat_viajes' }],
      [{ text: '❤️ Relaciones',      callback_data: 'cat_relaciones' },
       { text: '🌱 Agricultura',     callback_data: 'cat_agricultura' }],
      [{ text: '🔞 +18',             callback_data: 'cat_+18' },
       { text: '🧩 Otros',           callback_data: 'cat_otros' }],
      [{ text: '👤 Mi perfil',       callback_data: 'perfil' }],
      [{ text: '⬅️ Regresar',        callback_data: 'back_channel' }]
    ]
  }
}
 
function linkKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '⬅️ Regresar', callback_data: 'back_category' }]
    ]
  }
}
 
/* =========================
   /start
========================= */
 
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId     = msg.chat.id
  const userId     = msg.from.id.toString()
  delete userStates[userId]
  const referrerId = match[1]
 
  try {
    let user = await User.findOne({ telegram_id: userId })
    if (!user) {
      user = await User.create({ telegram_id: userId })
    }
 
    if (referrerId && referrerId !== userId && !user.referred_by) {
      await User.updateOne({ telegram_id: userId }, { referred_by: referrerId })
      await User.updateOne({ telegram_id: referrerId }, { $inc: { points: 20 } })
    }
 
    await bot.sendMessage(chatId,
`🌳 Bienvenido a ÁrbolGram
 
El mejor directorio donde crecen las comunidades de Telegram.
 
Para publicar tu comunidad debes cumplir:
 
✅ Suscrito a @BogotaShopping
✅ Ser administrador del canal
✅ Mínimo 10 miembros
✅ Agregar el bot como administrador
 
Cuando estés listo presiona 👇`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏆 Ver ranking',        callback_data: 'ranking' }],
            [{ text: '🚀 Tendencias',          callback_data: 'trending' }],
            [{ text: '📚 Explorar categorías', callback_data: 'categorias' }],
            [{ text: '🚀 Publicar comunidad',  callback_data: 'publicar' }],
            [{ text: '👤 Mi perfil',           callback_data: 'perfil' }],
            [{ text: '🏅 Top usuarios',        callback_data: 'top_users' }],
            [{
              text: '📢 Compartir ArbolGram',
              url: 'https://t.me/share/url?url=https://t.me/arbolgram_bot&text=🌳 Descubre las mejores comunidades en Telegram con ArbolGram 🚀'
            }]
          ]
        }
      }
    )
 
    await bot.sendMessage(chatId, '💡 Tip: Califica comunidades y sube en el ranking de usuarios 🏅')
 
  } catch (error) {
    console.error('Error en /start:', error)
    await bot.sendMessage(chatId, '⚠️ Ocurrió un error al iniciar. Intenta de nuevo.')
  }
})
 
/* =========================
   /top
========================= */
 
bot.onText(/\/top/, async (msg) => {
  const chatId = msg.chat.id
 
  try {
    const communities = await getTopCommunities()
 
    if (!communities.length) {
      return bot.sendMessage(chatId, '🌱 Aún no hay comunidades en el ranking.')
    }
 
    await bot.sendMessage(chatId, '🏆 TOP Comunidades en ArbolGram\n\n')
 
    for (const [index, community] of communities.entries()) {
      const rating = await getCommunityRating(community._id)
 
      let text = `${index + 1}. ${community.title}\n`
      text += `👥 ${community.member_count} miembros\n`
 
      if (rating.count > 0) {
        text += `⭐ ${rating.average} (${rating.count} votos)\n`
      }
 
      if (community.link && community.link !== 'pendiente') {
        text += `🔗 ${community.link}\n`
      }
 
      await bot.sendMessage(chatId, text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '⭐ Calificar', callback_data: `rate_${community._id}` }]
          ]
        }
      })
    }
  } catch (error) {
    console.error('Error en /top:', error)
    await bot.sendMessage(chatId, '⚠️ No pude cargar el ranking. Intenta de nuevo.')
  }
})  // ← cierre correcto (bug #1 solucionado)
 
/* =========================
   /trending
========================= */
 
bot.onText(/\/trending/, async (msg) => {
  const chatId = msg.chat.id
 
  try {
    const communities = await getTrendingCommunities()
 
    if (!communities.length) {
      return bot.sendMessage(chatId, '🌱 Aún no hay datos de crecimiento')
    }
 
    let message = '🚀 Comunidades en tendencia\n\n'
 
    communities.forEach((c, index) => {
      message += `${index + 1}. ${c.title}\n`
      message += `👥 ${c.member_count} miembros\n`
      message += `📈 +${c.growth} nuevos miembros\n`
      if (c.link) message += `🔗 ${c.link}\n`
      message += '\n'
    })
 
    await bot.sendMessage(chatId, message)
  } catch (error) {
    console.error('Error en /trending:', error)
    await bot.sendMessage(chatId, '⚠️ No pude cargar tendencias.')
  }
})
 
/* =========================
   /emergentes
========================= */
 
bot.onText(/\/emergentes/, async (msg) => {
  const chatId = msg.chat.id
 
  try {
    const communities = await detectFastGrowth()
 
    if (!communities.length) {
      return bot.sendMessage(chatId, '🌱 Aún no hay comunidades emergentes')
    }
 
    let message = '🔥 Comunidades emergentes\n\n'
 
    communities.forEach((c, index) => {
      message += `${index + 1}. ${c.title}\n`
      message += `👥 ${c.members} miembros\n`
      message += `🚀 +${c.growth} nuevos miembros\n`
      if (c.link) message += `🔗 ${c.link}\n`
      message += '\n'
    })
 
    await bot.sendMessage(chatId, message)
  } catch (error) {
    console.error('Error en /emergentes:', error)
    await bot.sendMessage(chatId, '⚠️ No pude cargar emergentes.')
  }
})
 
/* =========================
   EVENTO: bot agregado como admin
   (un solo listener — bug #2 solucionado)
========================= */
 
bot.on('my_chat_member', async (update) => {
  try {
    const chat      = update.chat
    const newStatus = update.new_chat_member.status
 
    if (newStatus !== 'administrator') return
 
    const memberCount = await bot.getChatMemberCount(chat.id)
    if (memberCount < 10) return
 
    // Actualizar/crear comunidad con datos reales (bug #7 solucionado)
    const chatInfo = await bot.getChat(chat.id)
 
    await Community.updateOne(
      { telegram_id: chat.id.toString() },
      {
        telegram_id:  chat.id.toString(),
        title:        chatInfo.title,
        type:         chat.type,
        member_count: memberCount,
        createdAt:    new Date()
      },
      { upsert: true }
    )
 
    console.log('Nuevo canal detectado:', chatInfo.title)
 
    await bot.sendMessage(update.from.id,
`🌳 Detecté una nueva comunidad
 
📛 ${chatInfo.title}
👥 ${memberCount} miembros
 
¿Quieres publicarla en ÁrbolGram?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Publicar comunidad', callback_data: `publicar_auto_${chat.id}` }],
            [{ text: '❌ Ignorar',             callback_data: 'cancelar' }]
          ]
        }
      }
    )
  } catch (error) {
    console.error('Error en my_chat_member:', error)
  }
})
 
/* =========================
   HELPER: mostrar comunidades de una categoría con paginación
========================= */
 
async function sendCategoryPage(chatId, category, page = 1) {
  const limit = CATEGORY_PAGE_SIZE
  const skip  = (page - 1) * limit
 
  const communities = await Community.find({
    category:  category,
    status:    'approved',
    is_active: true
  })
    .sort({ score: -1 })
    .skip(skip)
    .limit(limit)
 
  const totalCount = await Community.countDocuments({
    category:  category,
    status:    'approved',
    is_active: true
  })
 
  const categoryLabel = categoriesMap[category] || category
 
  if (!communities.length) {
    await bot.sendMessage(chatId,
`🌱 Aún no hay comunidades en ${categoryLabel}
 
Registra desde el botón "Publicar comunidad"
 
🚀 ¡Sé el primero en publicar aquí!`
    )
    return
  }
 
  const totalPages = Math.ceil(totalCount / limit)
  let message = `🏆 Comunidades en ${categoryLabel} (Página ${page}/${totalPages})\n\n`
 
  communities.forEach((c, i) => {
    const position = skip + i + 1
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`
 
    message += `${medal} ${c.title}\n`
    message += `👥 ${c.member_count || 0} miembros\n`
    message += `⭐ ${c.rating_average?.toFixed(1) || '0.0'} (${c.reviews_count || 0} votos)\n`
    if (c.activity_score > 50) message += '🔥 Activa\n'
    if (c.is_pro)              message += '💎 PRO\n'
    if (c.link && c.link !== 'pendiente') message += `👉 ${c.link}\n`
    message += '\n'
  })
 
  // Botones de calificación + paginación
  const keyboard = []
 
  // Un botón por comunidad para calificar (máx 5)
  communities.forEach(c => {
    keyboard.push([{ text: `⭐ Calificar ${c.title}`, callback_data: `rate_${c._id}` }])
  })
 
  // Navegación
  const navRow = []
  if (page > 1) {
    navRow.push({ text: '⬅️ Anterior', callback_data: `catpage_${category}_${page - 1}` })
  }
  if (page < totalPages) {
    navRow.push({ text: '➡️ Siguiente', callback_data: `catpage_${category}_${page + 1}` })
  }
  if (navRow.length) keyboard.push(navRow)
 
  keyboard.push([{ text: '📚 Ver otras categorías', callback_data: 'categorias' }])
 
  await bot.sendMessage(chatId, message, {
    reply_markup: { inline_keyboard: keyboard }
  })
}
 
/* =========================
   BOTONES (callback_query)
========================= */
 
bot.on('callback_query', async (callbackQuery) => {
  const data   = callbackQuery.data
  const chatId = callbackQuery.message.chat.id
  const userId = callbackQuery.from.id.toString()
 
  // Limpiar estado en acciones de navegación global
  const navigationActions = ['categorias', 'perfil', 'ranking', 'trending', 'top_users']
  if (navigationActions.includes(data)) {
    delete userStates[userId]
  }
 
  console.log('CLICK:', data)
 
  try {
 
    /* ─── PAGINACIÓN DE CATEGORÍA ─── */
    // catpage_<category>_<page>
    if (data.startsWith('catpage_')) {
      const parts    = data.split('_')
      // formato: catpage_<category>_<page>  (category puede tener _ interno como "+18")
      const page     = parseInt(parts[parts.length - 1]) || 1
      const category = parts.slice(1, parts.length - 1).join('_')
 
      await sendCategoryPage(chatId, category, page)
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── SELECCIÓN DE CATEGORÍA (único bloque — bug #3 solucionado) ─── */
    if (data.startsWith('cat_')) {
      const category = normalizarTexto(data.replace('cat_', ''))
      const state    = userStates[userId]
 
      // Modo publicar
      if (state && state.step === 'waiting_category') {
        state.category = category
        state.step     = 'waiting_link'
 
        await bot.sendMessage(chatId,
`✅ Categoría seleccionada: ${categoriesMap[category] || category}
 
🔗 Envía ahora el link público de tu canal o grupo
Ejemplos:
• https://t.me/tu_canal
• https://t.me/tu_grupo
• @tu_usuario`
        )
 
        await bot.answerCallbackQuery(callbackQuery.id)
        return
      }
 
      // Modo explorar — con paginación desde página 1
      await sendCategoryPage(chatId, category, 1)
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── EXPLORAR CATEGORÍAS ─── */
    if (data === 'categorias') {
      await bot.sendMessage(chatId,
`📚 Explora comunidades
 
Elige una categoría y descubre nuevos grupos o canales 🚀`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Gaming',          callback_data: 'cat_gaming' },
               { text: '🎵 Música',          callback_data: 'cat_musica' }],
              [{ text: '💰 Cripto',          callback_data: 'cat_cripto' },
               { text: '📈 Trading',         callback_data: 'cat_trading' }],
              [{ text: '📚 Educación',       callback_data: 'cat_educacion' },
               { text: '🧠 Salud',           callback_data: 'cat_salud' }],
              [{ text: '💼 Negocios',        callback_data: 'cat_negocios' },
               { text: '🛍 Ofertas',         callback_data: 'cat_ofertas' }],
              [{ text: '🌱 Agricultura',     callback_data: 'cat_agricultura' },
               { text: '🧗 Deportes',        callback_data: 'cat_deportes' }],
              [{ text: '💬 Comunidades',     callback_data: 'cat_comunidades' },
               { text: '😂 Humor',           callback_data: 'cat_humor' }],
              [{ text: '🔞 +18',             callback_data: 'cat_+18' },
               { text: '🧩 Otros',           callback_data: 'cat_otros' }]
            ]
          }
        }
      )
 
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── RANKING CON PAGINACIÓN (comunidades) ─── */
    if (data === 'ranking' || data.startsWith('ranking_page_')) {
      const page  = data.startsWith('ranking_page_') ? parseInt(data.replace('ranking_page_', '')) || 1 : 1
      const limit = 5
      const skip  = (page - 1) * limit
 
      const total       = await Community.countDocuments()
      const communities = await Community.find()
        .sort({ score: -1 })
        .skip(skip)
        .limit(limit)
 
      if (!communities.length) {
        await bot.sendMessage(chatId, '🌱 Aún no hay comunidades en el ranking.')
        await bot.answerCallbackQuery(callbackQuery.id)
        return
      }
 
      const totalPages = Math.ceil(total / limit)
      let message = `🏆 Ranking de comunidades (Página ${page}/${totalPages})\n\n`
 
      for (const community of communities) {
        message += `📌 ${community.title}\n`
        message += community.votes > 0
          ? `⭐ ${community.rating} (${community.votes} votos)\n`
          : '⭐ Sin calificaciones\n'
        if (community.link && community.link !== 'pendiente') {
          message += `🔗 ${community.link}\n`
        }
        message += '\n'
      }
 
      const keyboard = []
      const navRow   = []
      if (page > 1)          navRow.push({ text: '⬅️ Anterior', callback_data: `ranking_page_${page - 1}` })
      if (page < totalPages) navRow.push({ text: '➡️ Siguiente', callback_data: `ranking_page_${page + 1}` })
      if (navRow.length) keyboard.push(navRow)
 
      await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: keyboard }
      })
 
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── TOP USUARIOS ─── */
    if (data === 'top_users') {
      const users = await User.find().sort({ points: -1 }).limit(10)
 
      if (!users.length) {
        await bot.sendMessage(chatId, '🌱 Aún no hay usuarios en el ranking.')
        await bot.answerCallbackQuery(callbackQuery.id)
        return
      }
 
      let message = '🏅 Top usuarios en ÁrbolGram\n\n'
 
      users.forEach((user, index) => {
        const name = user.username
          ? `@${user.username}`
          : user.first_name || 'Anon'
        message += `${index + 1}. ${name} — ${user.points || 0} pts\n`
      })
 
      const allUsers = await User.find().sort({ points: -1 })
      const position = allUsers.findIndex(u => u.telegram_id === userId)
      if (position !== -1) message += `\n📍 Tu posición: #${position + 1}`
 
      await bot.sendMessage(chatId, message)
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── TENDENCIAS ─── */
    if (data === 'trending') {
      const trending = await getTrendingCommunities()
 
      if (!trending.length) {
        await bot.sendMessage(chatId, '🌱 Aún no hay tendencias')
        await bot.answerCallbackQuery(callbackQuery.id)
        return
      }
 
      let message = '🚀 Tendencias en ArbolGram\n\n'
 
      for (const [index, item] of trending.entries()) {
        const community = await Community.findById(item._id)
        if (!community) continue
        message += `${index + 1}. ${community.title}\n`
        message += `🔥 ${item.votes} votos recientes\n`
        message += `⭐ ${item.average.toFixed(1)}\n\n`
      }
 
      await bot.sendMessage(chatId, message)
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── PERFIL ─── */
    if (data === 'perfil') {
      const user = await User.findOne({ telegram_id: userId })
 
      if (!user) {
        await bot.sendMessage(chatId, '❌ Usuario no encontrado')
        await bot.answerCallbackQuery(callbackQuery.id)
        return
      }
 
      const level       = getUserLevel(user.points || 0)
      const referralLink = `https://t.me/arbolgram_bot?start=${user.telegram_id}`
 
      let message = '👤 Tu perfil\n\n'
      message += `🏆 Puntos: ${user.points || 0}\n`
      message += `🎖 Nivel: ${level}\n\n`
 
      if (user.badges && user.badges.length > 0) {
        message += `🏅 Logros:\n${user.badges.join('\n')}\n\n`
      }
 
      message += `🔗 Invita y gana puntos:\n${referralLink}\n\n`
      message += '🚀 Entre más participas, más subes en el ranking'
 
      await bot.sendMessage(chatId, message)
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── PUBLICAR ─── */
    if (data === 'publicar') {
      setState(userId, 'waiting_channel')
 
      await bot.sendMessage(chatId,
`Perfecto 👌
 
Envía el @usuario del canal o grupo
 
Ejemplo:
@MiCanal`
      )
 
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── PUBLICAR AUTOMÁTICO (bug #7 solucionado: datos reales) ─── */
    if (data.startsWith('publicar_auto_')) {
      const channelId = data.replace('publicar_auto_', '')
 
      setState(userId, 'waiting_category', { telegram_id: channelId })
 
      await bot.sendMessage(chatId,
`🚀 Vamos a publicar tu comunidad
 
Selecciona una categoría:`,
        { reply_markup: categoryKeyboard() }
      )
 
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── CALIFICAR ─── */
    if (data.startsWith('rate_')) {
      const communityId = data.replace('rate_', '')
      setState(userId, 'waiting_rating', { communityId })
 
      await bot.sendMessage(chatId,
`⭐ Califica esta comunidad
 
Envía un número del 1 al 5`
      )
 
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── VERIFICAR SUSCRIPCIÓN ─── */
    if (data === 'verificar') {
      try {
        const member = await bot.getChatMember('@BogotaShopping', userId)
 
        if (member.status !== 'left' && member.status !== 'kicked') {
          await bot.sendMessage(chatId, '✅ Verificación correcta', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🚀 Publicar comunidad', callback_data: 'publicar' }]
              ]
            }
          })
        } else {
          await bot.sendMessage(chatId, '❌ Debes suscribirte a @BogotaShopping')
        }
      } catch (err) {
        await bot.sendMessage(chatId, '⚠️ No pude verificar la suscripción')
      }
 
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── CANCELAR ─── */
    if (data === 'cancelar') {
      delete userStates[userId]
      await bot.sendMessage(chatId, '❌ Operación cancelada.')
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── EDITAR CATEGORÍA ─── */
    if (data === 'edit_category') {
      setState(userId, 'waiting_category')
      await bot.sendMessage(chatId, 'Selecciona la nueva categoría', {
        reply_markup: categoryKeyboard()
      })
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── EDITAR LINK ─── */
    if (data === 'edit_link') {
      setState(userId, 'waiting_link')
      await bot.sendMessage(chatId, '🔗 Envía el nuevo link', {
        reply_markup: linkKeyboard()
      })
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    /* ─── CONFIRMAR PUBLICACIÓN ─── */
    if (data === 'confirm_post') {
      const state = userStates[userId]
 
      const existente = await Community.findOne({ telegram_id: state.telegram_id })
      if (existente) {
        await bot.sendMessage(chatId, '❌ Esta comunidad ya está registrada')
        await bot.answerCallbackQuery(callbackQuery.id)
        return
      }
 
      await Community.updateOne(
        { telegram_id: state.telegram_id },
        {
          telegram_id:  state.telegram_id,
          userId:       userId,
          title:        state.title,
          type:         state.type,
          member_count: state.member_count,
          link:         state.link,
          category:     normalizarTexto(state.category)
        },
        { upsert: true }
      )
 
      const community = await Community.findOne({ telegram_id: state.telegram_id })
      if (community) {
        community.calculateScore()
        await community.save()
      }
 
      await User.updateOne(
        { telegram_id: userId },
        { $inc: { points: 10 } }
      )
 
      await bot.sendMessage(chatId,
`🎉 Comunidad publicada correctamente en ÁrbolGram
 
🏆 Ganaste +10 puntos`
      )
 
      delete userStates[userId]
      await bot.answerCallbackQuery(callbackQuery.id)
      return
    }
 
    // Responder cualquier callback no manejado para evitar "loading" en Telegram
    await bot.answerCallbackQuery(callbackQuery.id)
 
  } catch (error) {
    console.error('Error en callback_query:', data, error)
    try {
      await bot.sendMessage(chatId, '⚠️ Ocurrió un error. Intenta de nuevo.')
      await bot.answerCallbackQuery(callbackQuery.id)
    } catch (_) {}
  }
})
 
/* =========================
   MENSAJES DE TEXTO
========================= */
 
bot.on('message', async (msg) => {
  const userId = msg.from.id.toString()
  const chatId = msg.chat.id
  const text   = msg.text
 
  if (!userStates[userId]) return
 
  const state = userStates[userId]
 
  try {
 
    /* ── VALIDAR CANAL ── */
    if (state.step === 'waiting_channel') {
      if (!text || !text.startsWith('@')) {
        return bot.sendMessage(chatId, '❌ Debes enviar el @usuario del canal')
      }
 
      try {
        const chat = await bot.getChat(text)
 
        if (chat.type !== 'channel' && chat.type !== 'supergroup') {
          return bot.sendMessage(chatId, '❌ Solo canales o supergrupos')
        }
 
        const botMember = await bot.getChatMember(chat.id, botId)
        if (botMember.status !== 'administrator') {
          return bot.sendMessage(chatId,
`❌ El bot no es administrador
 
👉 Agrégame como admin en el canal para poder verificarlo`)
        }
 
        const userMember = await bot.getChatMember(chat.id, userId)
        if (userMember.status !== 'administrator' && userMember.status !== 'creator') {
          return bot.sendMessage(chatId, '❌ Debes ser admin del canal')
        }
 
        const memberCount = await bot.getChatMemberCount(chat.id)
        if (memberCount < 10) {
          return bot.sendMessage(chatId, '❌ Mínimo 10 miembros')
        }
 
        state.telegram_id  = chat.id.toString()
        state.title        = chat.title
        state.type         = chat.type
        state.member_count = memberCount
        state.step         = 'waiting_category'
 
        await bot.sendMessage(chatId,
`✅ Comunidad validada
 
📛 ${chat.title}
👥 ${memberCount} miembros
 
Selecciona la categoría:`,
          { reply_markup: categoryKeyboard() }
        )
 
      } catch (err) {
        await bot.sendMessage(chatId, '❌ No pude acceder al canal. ¿El @usuario es correcto?')
      }
 
      return
    }
 
    /* ── LINK + PREVIEW ── */
    if (state.step === 'waiting_link') {
      if (!text) return
 
      let link = text.trim()
 
      if (!link.includes('t.me/') && !link.startsWith('@')) {
        return bot.sendMessage(chatId, '❌ Envía un link válido de Telegram')
      }
 
      if (link.startsWith('@')) {
        link = `https://t.me/${link.slice(1)}`
      }
 
      if (!state.category) {
        state.step = 'waiting_category'
        return bot.sendMessage(chatId, '⚠️ Primero debes elegir una categoría')
      }
 
      state.link = link
      state.step = 'confirm_preview'
 
      return bot.sendMessage(chatId,
`🔍 Vista previa:
 
📛 ${state.title}
📂 Categoría: ${categoriesMap[state.category] || state.category}
👥 ${state.member_count} miembros
🔗 Link: ${state.link}
 
¿Confirmas?`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Confirmar',        callback_data: 'confirm_post' }],
              [{ text: '✏️ Editar link',      callback_data: 'edit_link' }],
              [{ text: '📂 Editar categoría', callback_data: 'edit_category' }]
            ]
          }
        }
      )
    }
 
    /* ── RATING ─── */
    if (state.step === 'waiting_rating') {
      if (!text) return
 
      const stars = parseInt(text)
 
      if (isNaN(stars) || stars < 1 || stars > 5) {
        return bot.sendMessage(chatId, '❌ Envía un número del 1 al 5')
      }
 
      const result = await addReview({
        userId,
        communityId: state.communityId,
        stars,
        comment: ''
      })
 
      if (result.created) {
        const updatedUser = await User.findOne({ telegram_id: userId })
        const newBadges   = await checkUserBadges(updatedUser)
 
        if (newBadges.length > 0) {
          await User.updateOne(
            { _id: updatedUser._id },
            { $push: { badges: { $each: newBadges } } }
          )
          for (const badge of newBadges) {
            await bot.sendMessage(chatId,
`🏅 ¡Nuevo logro desbloqueado!
 
${badge} 🎉`)
          }
        }
 
        await User.updateOne(
          { telegram_id: userId },
          { $inc: { points: 5 } }
        )
 
        await bot.sendMessage(chatId,
`🔥 ¡Listo!
 
Tu voto ayuda a que esta comunidad suba en el ranking 🌳
 
🎁 +5 puntos para ti`)
      }
 
      if (result.updated) {
        await bot.sendMessage(chatId,
`🔄 Voto actualizado
 
Tu nueva calificación es: ${stars} ⭐`)
      }
 
      delete userStates[userId]
      return
    }
 
  } catch (error) {
    console.error('Error en message handler:', error)
    await bot.sendMessage(chatId, '⚠️ Ocurrió un error. Intenta de nuevo.')
  }
})
 
/* =========================
   INTERVALOS
========================= */
 
setInterval(() => {
  updateCommunityStats(bot)
}, 1000 * 60 * 60 * 12) // cada 12 horas
 
setInterval(async () => {
  console.log('Actualizando miembros de comunidades...')
  await updateMemberCounts(bot)
}, 60 * 60 * 1000) // cada 1 hora
 
setInterval(async () => {
  console.log('🚀 Enviando tendencias a usuarios...')
  await notifyGrowth(bot)
}, 1000 * 60 * 30) // cada 30 minutos