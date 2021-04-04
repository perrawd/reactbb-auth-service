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

// Provide resolver functions for your schema fields
const resolvers = {
  Mutation: {
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
    }
    // TODO: Validate user data
    // TODO: Make sure user doesnt already exist
    // TODO: Hash password and create access token
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
