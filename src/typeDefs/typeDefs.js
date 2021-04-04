/**
 * GraphQL schema.
 *
 * @author Per Rawdin
 * @version 1.0.0
 */

import { gql } from 'apollo-server-express'

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
    type Query {
        getUsers: [User]
    }
     type Mutation {
         register(registerInput: RegisterInput): User
         login(username: String!, password: String!): User!
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
         accessToken: String!
         refreshToken: String!
         username: String!
         createdAt: String!
     }
 `
export default typeDefs
