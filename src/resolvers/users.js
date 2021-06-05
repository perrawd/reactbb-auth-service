/**
 * GraphQL posts resolver.
 *
 * @author Per Rawdin
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken'
import { User } from '../models/user.js'
import fs from 'fs'
import redis from 'redis'
import { AuthenticationError, UserInputError } from 'apollo-server-express'

const resolvers = {
  Query: {
    /**
     * Get all users.
     *
     * @returns {object} The server app.
     */
    async getUsers () {
      try {
        const users = User.find()

        return users
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    /**
     * Login function.
     *
     * @param {object} _ Previous
     * @param {object} args Arguments
     * @param {object} args.username The username
     * @param {object} args.password The password
     * @returns {object} User object.
     */
    async login (_, { username, password }) {
      try {
        // Authenticate the user.
        const user = await User.authenticate(username, password)

        // Create the access and refresh token.
        const { accessToken, refreshToken } = _signTokenPairs(user)

        return {
          id: user._id,
          username: user.email,
          email: user.email,
          role: user.role,
          accessToken,
          refreshToken
        }
      } catch (error) {
        // Authentication failed.
        throw new AuthenticationError(error)
      }
    },
    /**
     * Register function.
     *
     * @param {object} _ Previous
     * @param {object} args Arguments
     * @param {object} args.registerInput registerInput schema
     * @param {object} args.registerInput.username The username
     * @param {object} args.registerInput.email The e-mail address
     * @param {object} args.registerInput.password The password
     * @param {object} args.registerInput.confirmPassword Confirm password
     * @returns {object} User object
     */
    async register (
      _,
      {
        registerInput: { username, email, password, confirmPassword }
      }
    ) {
      try {
        if (password !== confirmPassword) {
          throw new UserInputError('Password must match')
        }

        const res = await User.insert({
          email,
          username,
          password
        })

        const { accessToken, refreshToken } = _signTokenPairs(res)

        return {
          ...res._doc,
          id: res._id,
          accessToken,
          refreshToken
        }
      } catch (error) {
        const validationMessages = []

        if (error.name === 'ValidationError') {
          for (const err in error.errors) {
            validationMessages.push(error.errors[err].message)
          }
        } else {
          if (error.code === 11000) {
            for (const key in error.keyValue) {
              validationMessages.push(`The ${key} '${error.keyValue[key]}' already exists.`)
            }
          } else {
            validationMessages.push(error.message)
          }
        }

        throw new UserInputError(error, { validationMessages })
      }
    },
    /**
     * Delete user account.
     *
     * @param {object} _ parent.
     * @param {object} args arguments.
     * @param {object} context context.
     * @returns {object} The object.
     */
    deleteUser: async (_, args, context) => {
      try {
        const user = await User.findOne({ _id: args.id })

        user.remove()

        return {
          success: true,
          message: 'User deleted'
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}

/**
 * Signs a token pair of JWT access and refresh tokens.
 *
 * @param {object} user - User object.
 * @returns {object} A object including the tokens.
 */
const _signTokenPairs = (user) => {
  try {
    const privateKey = fs.readFileSync(process.env.KEY_PATH, 'utf8')

    // Create the access token with the shorter lifespan.
    const accessToken = jwt.sign({
      sub: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: process.env.ACCESS_TOKEN_LIFE
    })

    // Create the refresh token with the longer lifespan.
    const refreshToken = jwt.sign({ sub: user.id }, process.env.REFRESH_TOKEN_SECRET, {
      algorithm: 'HS256',
      expiresIn: process.env.REFRESH_TOKEN_LIFE
    })

    // Save the refresh token in Redis.
    const redisClient = redis.createClient({
      password: process.env.REDIS_SECRET
    })

    redisClient.set(user.id, refreshToken)
    redisClient.expire(user.id, process.env.REDIS_TOKEN_LIFE)

    redisClient.quit()

    return {
      accessToken: accessToken,
      refreshToken: refreshToken
    }
  } catch (error) {
    throw new Error('Token signing error')
  }
}

export default resolvers
