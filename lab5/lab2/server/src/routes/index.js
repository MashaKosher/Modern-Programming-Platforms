const express = require('express');
const taskRoutes = require('./taskRoutes');
const authRoutes = require('./authRoutes');
const config = require('../../config/config');

const router = express.Router();

// Информация об API
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            name: config.app.name,
            version: config.app.version,
            apiPrefix: config.app.apiPrefix,
            endpoints: {
                auth: {
                    register: `${config.app.apiPrefix}/auth/register`,
                    login: `${config.app.apiPrefix}/auth/login`,
                    me: `${config.app.apiPrefix}/auth/me`,
                    verify: `${config.app.apiPrefix}/auth/verify`
                },
                tasks: `${config.app.apiPrefix}/tasks`,
                stats: `${config.app.apiPrefix}/tasks/stats`,
                search: `${config.app.apiPrefix}/tasks/search`,
                dueSoon: `${config.app.apiPrefix}/tasks/due-soon`,
                overdue: `${config.app.apiPrefix}/tasks/overdue`,
                byStatus: `${config.app.apiPrefix}/tasks/status/:status`
            },
            documentation: 'https://github.com/your-repo/api-docs'
        },
        message: 'Todo API Server работает успешно'
    });
});

// Проверка здоровья API
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: config.app.version,
            environment: config.nodeEnv
        },
        message: 'Сервер работает нормально'
    });
});

// Тестовый эндпоинт без аутентификации
router.get('/test', (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'Тестовый эндпоинт работает',
            timestamp: new Date().toISOString(),
            authHeader: req.headers.authorization ? 'присутствует' : 'отсутствует'
        },
        message: 'Тестовый маршрут доступен'
    });
});

// Подключаем маршруты аутентификации
router.use('/auth', authRoutes);

// Подключаем маршруты задач
router.use('/tasks', taskRoutes);

module.exports = router;
