import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  createdAt: String
})

export const User = mongoose.model('User', userSchema)
