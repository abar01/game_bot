const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  right: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
})

const User = mongoose.model('User', userSchema)

module.exports = User
