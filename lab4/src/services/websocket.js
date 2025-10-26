class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.messageId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.user = null;
    this.token = localStorage.getItem('authToken') || null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//localhost:3001/ws`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.token) this.authenticate('verify', this.token).catch(() => {});
        resolve();
      };

      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const { type, data, messageId, success, error } = msg;
          if (messageId && this.pending.has(messageId)) {
            const { resolve, reject } = this.pending.get(messageId);
            this.pending.delete(messageId);
            success ? resolve(data) : reject(new Error(error || 'Ошибка'));
          }
          this.notify(type, data ?? { error });
        } catch (_) {}
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notify('disconnected', {});
      };

      this.ws.onerror = (err) => {
        this.isConnected = false;
        reject(err);
      };
    });
  }

  send(type, data) {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.isConnected) return reject(new Error('WebSocket не подключен'));
      const id = ++this.messageId;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ type, data, messageId: id }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Таймаут запроса'));
        }
      }, 10000);
    });
  }

  async authenticate(action, token) {
    const res = await this.send('auth', { action, token });
    this.user = res.user;
    this.token = res.token || token;
    if (this.token) localStorage.setItem('authToken', this.token);
    localStorage.setItem('user', JSON.stringify(this.user));
    return res;
  }
  async login(username, password) {
    const res = await this.send('auth', { action: 'login', username, password });
    this.user = res.user;
    this.token = res.token;
    if (this.token) localStorage.setItem('authToken', this.token);
    localStorage.setItem('user', JSON.stringify(this.user));
    return res;
  }
  async register(username, password) {
    const res = await this.send('auth', { action: 'register', username, password });
    this.user = res.user;
    this.token = res.token;
    if (this.token) localStorage.setItem('authToken', this.token);
    localStorage.setItem('user', JSON.stringify(this.user));
    return res;
  }
  logout() { this.user = null; this.token = null; localStorage.removeItem('authToken'); localStorage.removeItem('user'); this.notify('logout', {}); }

  // Tasks
  getTasks() { return this.send('getTasks'); }
  getTasksByStatus(completed) { return this.send('getTasksByStatus', { completed }); }
  createTask(title, dueDate) { return this.send('createTask', { title, dueDate }); }
  updateTask(id, updates) { return this.send('updateTask', { id, updates }); }
  toggleTask(id) { return this.send('toggleTask', { id }); }
  deleteTask(id) { return this.send('deleteTask', { id }); }
  searchTasks(query) { return this.send('searchTasks', { query }); }
  getStats() { return this.send('getStats'); }

  // listeners
  on(event, cb) { if (!this.listeners.has(event)) this.listeners.set(event, new Set()); this.listeners.get(event).add(cb); }
  off(event, cb) { if (this.listeners.has(event)) this.listeners.get(event).delete(cb); }
  notify(event, data) { if (this.listeners.has(event)) this.listeners.get(event).forEach(cb => { try { cb(data); } catch(_) {} }); }

  getConnectionStatus() { return { connected: this.isConnected, user: this.user }; }
}

const websocketService = new WebSocketService();
websocketService.connect().catch(() => {});

export default websocketService;


