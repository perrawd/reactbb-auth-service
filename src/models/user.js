/**
 * Mongoose model User.
 *
 * @author Mats Loock
 * @version 1.0.0
 */

import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import validator from 'validator'

const { isEmail } = validator

// Create a schema.
const schema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'User email required.'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [isEmail, '{VALUE} is not an valid email address.']
  },
  username: {
    type: String,
    required: [true, 'Username required.'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    minlength: [10, 'The password must be of minimum length 10 characters.'],
    required: [true, 'User password required.']
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    /**
     * Performs a transformation of the resulting object to remove sensitiveinformation.
     *
     * @param {object} doc - The mongoose document which is being converted.
     * @param {object} ret - The plain object representation which has beenconverted.
     */
    transform: function (doc, ret) {
      delete ret._id
    },
    virtuals: true // ensure virtual fields are serialized
  }
})

schema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Salts and hashes password before save.
schema.pre('save', async function () {
  this.password = await bcrypt.hash(this.password, 10)
})

/**
 * Authenticates a user.
 *
 * @param {string} email - ...
 * @param {string} password - ...
 * @returns {Promise<User>} ...
 */
schema.statics.authenticate = async function (email, password) {
  const user = await this.findOne({ email })

  // If no user found or password is wrong, throw an error.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid username or password.')
  }

  // User found and password correct, return the user.
  return user
}

/**
 * Gets a user by ID.
 *
 * @param {string} id - The value of the id for the user to get.
 * @returns {Promise<User>} The Promise to be fulfilled.
 */
schema.statics.getById = async function (id) {
  return this.findOne({ _id: id })
}

/**
 * Inserts a new user.
 *
 * @param {object} userData - ...
 * @param {string} userData.email - ...
 * @param {string} userData.password - ...
 * @returns {Promise<User>} - ...
 */
schema.statics.insert = async function (userData) {
  const user = new User(userData)
  return user.save()
}

// Create a model using the schema.
export const User = mongoose.model('User', schema)
