const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Импорт конфигурации
const config = require('./config/config');

// Импорт middleware
const {
    notFound,
    errorHandler,
    requestLogger,
    validateJSON
} = require('./src/middleware/errorHandler');

const {
    generalLimiter,
    securityHeaders,
    sanitizeInput,
    logSuspiciousActivity,
    validateRequestSize,
    corsWithValidation
} = require('./src/middleware/security');

// Импорт маршрутов
const routes = require('./src/routes/index');

// Создание Express приложения
const app = express();
const server = http.createServer(app);

// Инициализация WebSocket сервера
const WebSocketServer = require('./src/services/WebSocketServer');
const wsServer = new WebSocketServer(server);

// Создание необходимых директорий
const createDirectories = () => {
    const directories = [
        path.join(__dirname, 'uploads'),
        path.join(__dirname, 'data'),
        path.join(__dirname, 'logs')
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Создана директория: ${dir}`);
        }
    });
};

// Инициализация директорий
createDirectories();

// Базовые middleware
app.use(requestLogger);
app.use(securityHeaders);
app.use(corsWithValidation);

// Middleware для парсинга запросов
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(validateJSON);

// Middleware безопасности
app.use(validateRequestSize);
app.use(sanitizeInput);
app.use(logSuspiciousActivity);

// Rate limiting
if (config.isProduction()) {
    app.use(generalLimiter);
}

// Статические файлы (для загруженных файлов)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Основной маршрут API с префиксом
app.use(config.app.apiPrefix, routes);

// Корневой маршрут
app.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'Todo API Server',
            version: config.app.version,
            apiPrefix: config.app.apiPrefix,
            documentation: `${req.protocol}://${req.get('host')}${config.app.apiPrefix}`,
            health: `${req.protocol}://${req.get('host')}${config.app.apiPrefix}/health`
        }
    });
});

// Middleware для обработки ошибок
app.use(notFound);
app.use(errorHandler);

// Функция для graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\nПолучен сигнал ${signal}. Завершение работы сервера...`);
    
    server.close(() => {
        console.log('HTTP сервер закрыт');
        
        // Здесь можно добавить закрытие соединений с БД, очистку ресурсов и т.д.
        
        console.log('Сервер успешно завершил работу');
        process.exit(0);
    });
    
    // Принудительное завершение через 30 секунд
    setTimeout(() => {
        console.error('Принудительное завершение работы сервера');
        process.exit(1);
    }, 30000);
};

// Обработчики сигналов для graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Обработчик необработанных ошибок
process.on('uncaughtException', (error) => {
    console.error('🚨 Необработанная ошибка:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Необработанное отклонение Promise:', reason);
    console.error('Promise:', promise);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// Запуск сервера
server.listen(config.port, () => {
    console.log('\n===================================');
    console.log(`📱 ${config.app.name} v${config.app.version}`);
    console.log(`Сервер запущен на http://localhost:${config.port}`);
    console.log(`API доступно по адресу: http://localhost:${config.port}${config.app.apiPrefix}`);
    console.log(`WebSocket: ws://localhost:${config.port}/ws`);
    console.log(`💚 Проверка здоровья: http://localhost:${config.port}${config.app.apiPrefix}/health`);
    console.log(`Режим: ${config.nodeEnv}`);
    console.log(`Загрузки: ${path.join(__dirname, 'uploads')}`);
    console.log('Для остановки нажмите Ctrl+C');
    console.log('===================================\n');
});

// Экспорт для тестирования
module.exports = app;
