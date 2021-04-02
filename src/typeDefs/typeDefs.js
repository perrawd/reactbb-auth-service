/**
 * GraphQL schema.
 *
 * @author Per Rawdin
 * @version 1.0.0
 */

import { gql } from 'apollo-server-express'

// Construct a schema, using GraphQL schema language
const typeDefs = gql` 
     type Mutation {
         register(registerInput: RegisterInput): User
     }
 
     input RegisterInput {
         username: String!
         password: String!
         confirmPassword: String!
         email: String!
     }

     type User {
         id: ID!
         email: String!
         token: String!
         username: String!
         createdAt: String!
     }
 `
export default typeDefs
