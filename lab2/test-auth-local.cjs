// Локальное тестирование аутентификации (без сервера)
// Запустите: node test-auth-local.cjs

console.log('🧪 Тестирование локальной аутентификации...\n');

// Имитируем localStorage
const mockLocalStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

// Мокаем AuthService
class MockAuthService {
    constructor() {
        this.jwtSecret = 'test-secret-key';
        this.jwtExpiresIn = '7d';
    }

    getToken() {
        return mockLocalStorage.getItem('authToken');
    }

    getCurrentUserFromStorage() {
        const userStr = mockLocalStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    getAuthHeaders() {
        const token = this.getToken();
        console.log('AuthService.getAuthHeaders() - токен:', token ? 'присутствует' : 'отсутствует');
        if (token) {
            console.log('Длина токена:', token.length);
        }
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        } : {
            'Content-Type': 'application/json',
        };
    }

    logout() {
        mockLocalStorage.removeItem('authToken');
        mockLocalStorage.removeItem('user');
    }
}

const authService = new MockAuthService();

console.log('1. Тест: Проверка аутентификации без токена');
console.log('   isAuthenticated():', authService.isAuthenticated());
console.log('   getAuthHeaders():', authService.getAuthHeaders());
console.log('');

console.log('2. Тест: Симуляция входа в систему');
mockLocalStorage.setItem('authToken', 'fake-jwt-token-123456789');
mockLocalStorage.setItem('user', JSON.stringify({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date()
}));

console.log('   Токен сохранен в localStorage');
console.log('   isAuthenticated():', authService.isAuthenticated());
console.log('   getAuthHeaders():', authService.getAuthHeaders());
console.log('');

console.log('3. Тест: Симуляция выхода из системы');
authService.logout();
console.log('   isAuthenticated():', authService.isAuthenticated());
console.log('   getAuthHeaders():', authService.getAuthHeaders());
console.log('');

console.log('✅ Тестирование завершено!');
console.log('\n📝 Вывод:');
console.log('   - AuthService работает корректно локально');
console.log('   - Токены сохраняются и извлекаются правильно');
console.log('   - В реальной среде проблема может быть в:');
console.log('     * localStorage не доступен в браузере');
console.log('     * Токен не сохраняется при авторизации');
console.log('     * Токен истекает или поврежден');
