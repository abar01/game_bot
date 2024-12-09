const TelegramApi = require('node-telegram-bot-api')
const { gameOptions, againOptions } = require('./options')
require('dotenv').config()
const mongoose = require('mongoose')
const http = require('http')
const User = require('./models/User')

const token = process.env.TOKEN
const mongoURI = process.env.MONGO_URI

const bot = new TelegramApi(token, { polling: true })

const chats = {}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
  })

const startGame = async (chatId) => {
  await bot.sendMessage(
    chatId,
    'I will think of a number from 0 to 9. Try to guess!'
  )
  const randomNumber = Math.floor(Math.random() * 10)
  chats[chatId] = randomNumber
  await bot.sendMessage(chatId, 'Guess:', gameOptions)
}

const start = async () => {
  bot.setMyCommands([
    { command: '/start', description: 'Initial greeting' },
    { command: '/info', description: 'Get user information' },
    { command: '/game', description: 'Guess the number' },
  ])

  bot.on('message', async (msg) => {
    const text = msg.text
    const chatId = msg.chat.id

    try {
      if (text === '/start') {
        await bot.sendSticker(
          chatId,
          'https://tlgrm.ru/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/7.webp'
        )
        return bot.sendMessage(chatId, 'Welcome to Telegram GameBot!')
      }
      if (text === '/info') {
        return bot.sendMessage(
          chatId,
          `Your name is ${msg.from.first_name} ${msg.from.last_name}`
        )
      }
      if (text === '/game') {
        return startGame(chatId)
      }
      return bot.sendMessage(chatId, "I don't understand you, try again!")
    } catch (e) {
      console.error(e)
      return bot.sendMessage(chatId, 'An error occurred!')
    }
  })

  bot.on('callback_query', async (msg) => {
    const data = msg.data
    const chatId = msg.message.chat.id

    if (data === '/again') {
      return startGame(chatId)
    }

    if (!chats[chatId] && chats[chatId] !== 0) {
      return bot.sendMessage(chatId, 'Game not started! Use /game to start.')
    }

    let user = await User.findOne({ chatId })
    if (!user) {
      user = new User({
        chatId,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name || '',
      })
    }

    if (data == chats[chatId]) {
      user.right += 1
      await bot.sendMessage(
        chatId,
        `Congratulations, you guessed the number ${chats[chatId]}!`,
        againOptions
      )
    } else {
      user.wrong += 1
      await bot.sendMessage(
        chatId,
        `Unfortunately, you didn't guess. The number was ${chats[chatId]}.`,
        againOptions
      )
    }
    await user.save()
  })
}

start()

const PORT = process.env.PORT || 3000
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Telegram bot is running.\n')
  })
  .listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
  })
