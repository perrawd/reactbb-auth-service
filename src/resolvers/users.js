/**
 * GraphQL posts resolver.
 *
 * @author Per Rawdin
 * @version 1.0.0
 */

// import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.js'
import fs from 'fs'
import redis from 'redis'
import { AuthenticationError, UserInputError } from 'apollo-server-express'

// Provide resolver functions for your schema fields
const resolvers = {
  Mutation: {
    /**
     * The main function of the application.
     *
     * @param {object} _ Previous
     * @param {object} args Arguments
     * @param {object} args.username The username
     * @param {object} args.password The password.
     * @returns {object} return
     */
    async login (_, { username, password }) {
      try {
        // Authenticate the user.
        const user = await User.authenticate(username, password)

        // Create the access and refresh token.
        const { accessToken, refreshToken } = _signTokenPairs(user)

        console.log(user)
        console.log(accessToken)

        return {
          id: user._id,
          email: user.email,
          accessToken,
          refreshToken,
          username: user.email
        }
      } catch (error) {
        // Authentication failed.
        console.error(error)
        throw new AuthenticationError(error)
      }
    },

    /**
     * The main function of the application.
     *
     * @param {object} _ Previous
     * @param {object} args Arguments
     * @param {object} args.registerInput registerInput schema
     * @param {object} args.registerInput.username The username
     * @param {object} args.registerInput.email The e-mail address
     * @param {object} args.registerInput.password The password
     * @param {object} args.registerInput.confirmPassword Confirm password
     * @returns {object} return
     */
    async register (
      _,
      {
        registerInput: { username, email, password, confirmPassword }
      }
    ) {
      try {
        const res = await User.insert({
          email,
          username,
          password
        })

        console.log(res.id)

        const { accessToken, refreshToken } = _signTokenPairs(res)
        // console.log(token)

        return {
          ...res._doc,
          id: res._id,
          accessToken,
          refreshToken
        }
      } catch (error) {
        if (error._message === 'User validation failed') {
          const validationMessages = []
          for (const err in error.errors) {
            validationMessages.push(error.errors[err].message)
          }
          throw new UserInputError(error, { validationMessages })
        }
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
    const accessToken = jwt.sign({ sub: user.id }, privateKey, {
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
