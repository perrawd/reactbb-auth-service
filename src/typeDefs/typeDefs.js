/**
 * GraphQL schema.
 *
 * @author Per Rawdin
 * @version 1.0.0
 */

import { gql } from 'apollo-server-express'

const typeDefs = gql`
    extend type Query {
        getUsers: [User]
    }

     type UpdateResponse {
         success: Boolean!
         message: String!
     }

     type Mutation {
         register(registerInput: RegisterInput): User
         login(username: String!, password: String!): User!
         deleteUser(id: ID!): UpdateResponse
     }
 
     input RegisterInput {
         username: String!
         password: String!
         confirmPassword: String!
         email: String!
     }

     type User @key(fields: "id") {
         id: ID!
         email: String!
         accessToken: String!
         refreshToken: String!
         username: String!
         createdAt: String!
         role: String!
     }
 `
export default typeDefs
