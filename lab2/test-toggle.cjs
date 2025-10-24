// Тест переключения статуса задачи
console.log('🧪 Тестирование переключения статуса задачи...\n');

// Имитируем токен пользователя 2 (masha)
const jwt = require('jsonwebtoken');
const AuthService = require('./server/src/services/AuthService');
const TaskController = require('./server/src/controllers/TaskController');

async function testToggle() {
    try {
        console.log('🔐 Создание тестового токена...');

        // Создаем AuthService для генерации токена
        const authService = new AuthService();

        // Получаем пользователя masha (ID: 2)
        const user = { id: 2, username: 'masha' };
        const token = jwt.sign({ userId: user.id }, authService.jwtSecret, { expiresIn: '7d' });

        console.log('✅ Токен создан:', token.substring(0, 50) + '...');
        console.log('👤 Пользователь:', user.username, '(ID:', user.id, ')');

        // Создаем TaskController
        const taskController = new TaskController();

        // Имитируем Express request object
        const mockReq = {
            params: { id: '4' },
            userId: user.id,
            user: user,
            headers: { authorization: `Bearer ${token}` }
        };

        // Имитируем Express response object
        const mockRes = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                console.log(`📤 Response (${this.statusCode || 200}):`, JSON.stringify(data, null, 2));
                return this;
            }
        };

        console.log('\n🔄 Тестируем переключение задачи 4...');

        // Вызываем метод toggleTask напрямую
        await taskController.toggleTask(mockReq, mockRes);

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Запуск теста
testToggle();
