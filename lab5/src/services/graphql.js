export const GRAPHQL_URL = 'http://localhost:3001/graphql';

function getToken() {
  return localStorage.getItem('authToken');
}

async function gqlRequest(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'GraphQL error');
  }
  return json.data;
}

const GraphQLService = {
  async register(username, password) {
    const query = `mutation($username:String!,$password:String!){
      register(username:$username,password:$password){ token user{ id username } }
    }`;
    const data = await gqlRequest(query, { username, password });
    const { token, user } = data.register;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  },
  async login(username, password) {
    const query = `mutation($username:String!,$password:String!){
      login(username:$username,password:$password){ token user{ id username } }
    }`;
    const data = await gqlRequest(query, { username, password });
    const { token, user } = data.login;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  },
  async me() {
    const token = getToken();
    const query = `query($token:String!){ me(token:$token){ id username } }`;
    const data = await gqlRequest(query, { token });
    return data.me;
  },
  async getTasks() {
    const token = getToken();
    const query = `query($token:String!){ tasks(token:$token){ id title completed createdAt dueDate attachments{ id filename originalName mimetype size uploadedAt } } }`;
    const data = await gqlRequest(query, { token });
    return data.tasks;
  },
  async getTasksByStatus(completed) {
    const token = getToken();
    const query = `query($completed:Boolean!,$token:String!){ tasksByStatus(completed:$completed, token:$token){ id title completed createdAt dueDate attachments{ id } } }`;
    const data = await gqlRequest(query, { completed, token });
    return data.tasksByStatus;
  },
  async getStats() {
    const token = getToken();
    const query = `query($token:String!){ stats(token:$token){ total completed active overdue } }`;
    const data = await gqlRequest(query, { token });
    return data.stats;
  },
  async searchTasks(queryText) {
    const token = getToken();
    const query = `query($q:String!,$token:String!){ searchTasks(query:$q, token:$token){ id title completed createdAt dueDate } }`;
    const data = await gqlRequest(query, { q: queryText, token });
    return data.searchTasks;
  },
  async createTask(title, dueDate) {
    const token = getToken();
    const query = `mutation($input:TaskInput!,$token:String!){ createTask(input:$input, token:$token){ id title completed createdAt dueDate attachments{ id } } }`;
    const data = await gqlRequest(query, { input: { title, dueDate }, token });
    return data.createTask;
  },
  async updateTask(id, input) {
    const token = getToken();
    const query = `mutation($id:ID!,$input:TaskUpdateInput!,$token:String!){ updateTask(id:$id,input:$input, token:$token){ id title completed createdAt dueDate } }`;
    const data = await gqlRequest(query, { id, input, token });
    return data.updateTask;
  },
  async toggleTask(id) {
    const token = getToken();
    const query = `mutation($id:ID!,$token:String!){ toggleTask(id:$id, token:$token){ id title completed createdAt dueDate } }`;
    const data = await gqlRequest(query, { id, token });
    return data.toggleTask;
  },
  async deleteTask(id) {
    const token = getToken();
    const query = `mutation($id:ID!,$token:String!){ deleteTask(id:$id, token:$token) }`;
    const data = await gqlRequest(query, { id, token });
    return data.deleteTask;
  }
};

export default GraphQLService;
