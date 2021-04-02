/**
 * GraphQL posts resolver.
 *
 * @author Per Rawdin
 * @version 1.0.0
 */

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.js'

// Provide resolver functions for your schema fields
const resolvers = {
  Mutation: {
    /**
     * The main function of the application.
     *
     * @param {object} _ Previous
     * @param {object} registerInput Previous
     * @param {object} registerInput.registerInput Previous
     * @param {object} registerInput.registerInput.username The username
     * @param {object} registerInput.registerInput.email The e-mail address
     * @param {object} registerInput.registerInput.password The password
     * @param {object} registerInput.registerInput.confirmPassword Confirm password
     * @returns {object} return
     */
    async register (
      _,
      {
        registerInput: { username, email, password, confirmPassword }
      }
    ) {
      password = await bcrypt.hash(password, 12)

      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString()
      })

      const res = await newUser.save()

      const token = jwt.sign({
        id: res.id
      }, process.env.SECRET, { expiresIn: '1h' })

      return {
        ...res._doc,
        id: res._id,
        token
      }
    }
    // TODO: Validate user data
    // TODO: Make sure user doesnt already exist
    // TODO: Hash password and create access token
  }
}

export default resolvers
