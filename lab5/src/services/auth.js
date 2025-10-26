// Сервис аутентификации для фронтенда
const API_BASE_URL = 'http://localhost:3001/v2';

class AuthService {
    // Регистрация нового пользователя
    async register(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            if (result.success && result.data.token) {
                // Сохраняем токен в localStorage
                localStorage.setItem('authToken', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
            }

            return result;
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            throw error;
        }
    }

    // Авторизация пользователя
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            if (result.success && result.data.token) {
                // Сохраняем токен в localStorage
                localStorage.setItem('authToken', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
            }

            return result;
        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            throw error;
        }
    }

    // Получение текущего пользователя
    async getCurrentUser() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Токен не найден');
            }

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('Ошибка при получении пользователя:', error);
            throw error;
        }
    }

    // Проверка токена
    async verifyToken() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Токен не найден');
            }

            const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('Ошибка при проверке токена:', error);
            throw error;
        }
    }

    // Выход из системы
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    // Получение токена из localStorage
    getToken() {
        return localStorage.getItem('authToken');
    }

    // Получение текущего пользователя из localStorage
    getCurrentUserFromStorage() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Проверка аутентификации
    isAuthenticated() {
        return !!this.getToken();
    }

    // Получение заголовков с токеном для API запросов
    getAuthHeaders() {
        const token = this.getToken();
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        } : {
            'Content-Type': 'application/json',
        };
    }
}

export default new AuthService();
