const { buildSchema } = require('graphql');
const AuthService = require('../services/AuthService');
const TaskService = require('../services/TaskService');

const schema = buildSchema(`
  scalar Date

  type Attachment {
    id: ID!
    filename: String!
    originalName: String!
    mimetype: String!
    size: Int!
    uploadedAt: String
  }

  type Task {
    id: ID!
    title: String!
    completed: Boolean!
    createdAt: String
    updatedAt: String
    dueDate: String
    attachments: [Attachment!]!
  }

  type Stats {
    total: Int!
    completed: Int!
    active: Int!
    overdue: Int!
  }

  type User {
    id: ID!
    username: String!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type Query {
    me(token: String!): User
    tasks(token: String!): [Task!]!
    tasksByStatus(completed: Boolean!, token: String!): [Task!]!
    stats(token: String!): Stats!
    searchTasks(query: String!, token: String!): [Task!]!
  }

  input TaskInput {
    title: String!
    dueDate: String
  }

  input TaskUpdateInput {
    title: String
    completed: Boolean
    dueDate: String
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    createTask(input: TaskInput!, token: String!): Task!
    updateTask(id: ID!, input: TaskUpdateInput!, token: String!): Task!
    toggleTask(id: ID!, token: String!): Task!
    deleteTask(id: ID!, token: String!): Boolean!
  }
`);

function createResolvers() {
  const auth = new AuthService();
  const tasks = new TaskService();

  async function getUserFromToken(token) {
    const user = await auth.getUserByToken(token);
    return user;
  }

  return {
    me: async ({ token }) => {
      return await getUserFromToken(token);
    },
    tasks: async ({ token }) => {
      const user = await getUserFromToken(token);
      return await tasks.getTasksByUserId(user.id);
    },
    tasksByStatus: async ({ completed, token }) => {
      const user = await getUserFromToken(token);
      return await tasks.getTasksByStatus(completed, user.id);
    },
    stats: async ({ token }) => {
      const user = await getUserFromToken(token);
      return await tasks.getStatsByUserId(user.id);
    },
    searchTasks: async ({ query, token }) => {
      const user = await getUserFromToken(token);
      return await tasks.searchTasksByUserId(user.id, query);
    },
    register: async ({ username, password }) => {
      const res = await auth.register(username, password);
      return { user: res.user, token: res.token };
    },
    login: async ({ username, password }) => {
      const res = await auth.login(username, password);
      return { user: res.user, token: res.token };
    },
    createTask: async ({ input, token }) => {
      const user = await getUserFromToken(token);
      return await tasks.createTask(input.title, input.dueDate || null, user.id);
    },
    updateTask: async ({ id, input, token }) => {
      await getUserFromToken(token);
      return await tasks.updateTask(parseInt(id), input);
    },
    toggleTask: async ({ id, token }) => {
      await getUserFromToken(token);
      return await tasks.toggleTask(parseInt(id));
    },
    deleteTask: async ({ id, token }) => {
      await getUserFromToken(token);
      await tasks.deleteTask(parseInt(id));
      return true;
    }
  };
}

module.exports = { schema, createResolvers };


