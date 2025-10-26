const WebSocket = require('ws');
const path = require('path');
const AuthService = require('../services/AuthService');
const TaskService = require('../services/TaskService');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server, path: '/ws', clientTracking: true });
        this.authService = new AuthService();
        this.taskService = new TaskService();
        this.clients = new Map();
        this.setup();
        this.heartbeat();
    }

    setup() {
        this.wss.on('connection', (ws) => {
            ws.isAlive = true;
            ws.user = null;
            ws.userId = null;

            ws.on('message', async (raw) => {
                let msg;
                try {
                    msg = JSON.parse(raw.toString());
                } catch (e) {
                    return this.sendError(ws, 'Неверный формат сообщения');
                }

                const { type, data, messageId } = msg;
                try {
                    switch (type) {
                        case 'auth':
                            await this.handleAuth(ws, data, messageId);
                            break;
                        case 'getTasks':
                            if (!this.requireAuth(ws, messageId)) return;
                            this.respond(ws, 'tasks', {
                                tasks: await this.taskService.getTasksByUserId(ws.userId),
                                stats: await this.taskService.getStatsByUserId(ws.userId)
                            }, messageId);
                            break;
                        case 'getTasksByStatus':
                            if (!this.requireAuth(ws, messageId)) return;
                            this.respond(ws, 'tasksByStatus', {
                                tasks: await this.taskService.getTasksByStatus(Boolean(data.completed), ws.userId),
                                completed: Boolean(data.completed),
                                stats: await this.taskService.getStatsByUserId(ws.userId)
                            }, messageId);
                            break;
                        case 'createTask':
                            if (!this.requireAuth(ws, messageId)) return;
                            {
                                const task = await this.taskService.createTask(data.title, data.dueDate, ws.userId);
                                this.respond(ws, 'task_created', task, messageId);
                                this.broadcastToUser(ws.userId, 'task_updated', { action: 'created', task });
                            }
                            break;
                        case 'updateTask':
                            if (!this.requireAuth(ws, messageId)) return;
                            {
                                const task = await this.taskService.updateTask(data.id, data.updates);
                                this.respond(ws, 'task_updated', task, messageId);
                                this.broadcastToUser(ws.userId, 'task_updated', { action: 'updated', task });
                            }
                            break;
                        case 'toggleTask':
                            if (!this.requireAuth(ws, messageId)) return;
                            {
                                const task = await this.taskService.toggleTask(data.id);
                                this.respond(ws, 'task_updated', task, messageId);
                                this.broadcastToUser(ws.userId, 'task_updated', { action: 'toggled', task });
                            }
                            break;
                        case 'deleteTask':
                            if (!this.requireAuth(ws, messageId)) return;
                            {
                                const task = await this.taskService.deleteTask(data.id);
                                this.respond(ws, 'task_deleted', { id: data.id }, messageId);
                                this.broadcastToUser(ws.userId, 'task_updated', { action: 'deleted', task });
                            }
                            break;
                        case 'searchTasks':
                            if (!this.requireAuth(ws, messageId)) return;
                            this.respond(ws, 'search_results', { tasks: await this.taskService.searchTasksByUserId(ws.userId, data.query), query: data.query }, messageId);
                            break;
                        case 'getStats':
                            if (!this.requireAuth(ws, messageId)) return;
                            this.respond(ws, 'stats', await this.taskService.getStatsByUserId(ws.userId), messageId);
                            break;
                        case 'ping':
                            this.respond(ws, 'pong', null, messageId);
                            break;
                        default:
                            this.sendError(ws, 'Неизвестный тип сообщения', messageId);
                    }
                } catch (error) {
                    this.sendError(ws, error.message, messageId);
                }
            });

            ws.on('pong', () => { ws.isAlive = true; });
            ws.on('close', () => this.removeClient(ws));
            ws.on('error', () => this.removeClient(ws));
        });
    }

    async handleAuth(ws, data, messageId) {
        const { action, username, password, token } = data || {};
        let result;
        if (action === 'login') {
            result = await this.authService.login(username, password);
        } else if (action === 'register') {
            result = await this.authService.register(username, password);
        } else if (action === 'verify') {
            const user = await this.authService.getUserByToken(token);
            result = { user, token };
        } else {
            throw new Error('Неверное действие аутентификации');
        }

        ws.user = result.user;
        ws.userId = result.user.id;
        ws.token = result.token;
        this.addClient(ws);
        this.respond(ws, 'auth_success', result, messageId);
    }

    requireAuth(ws, messageId) {
        if (!ws || !ws.userId) {
            this.sendError(ws, 'Требуется аутентификация', messageId);
            return false;
        }
        return true;
    }

    respond(ws, type, data, messageId) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, data, messageId, success: true }));
        }
    }

    sendError(ws, error, messageId) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'error', error, messageId, success: false }));
        }
    }

    addClient(ws) {
        if (!this.clients.has(ws.userId)) this.clients.set(ws.userId, new Set());
        this.clients.get(ws.userId).add(ws);
    }

    removeClient(ws) {
        if (ws.userId && this.clients.has(ws.userId)) {
            const set = this.clients.get(ws.userId);
            set.delete(ws);
            if (set.size === 0) this.clients.delete(ws.userId);
        }
    }

    broadcastToUser(userId, type, data) {
        const set = this.clients.get(userId);
        if (!set) return;
        const message = JSON.stringify({ type, data, success: true });
        set.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(message);
        });
    }

    heartbeat() {
        setInterval(() => {
            this.wss.clients.forEach(ws => {
                if (!ws.isAlive) return ws.terminate();
                ws.isAlive = false;
                try { ws.ping(); } catch (_) {}
            });
        }, 30000);
    }
}

module.exports = WebSocketServer;


