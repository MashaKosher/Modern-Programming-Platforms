const config = require('../../config/config');

// Middleware для обработки 404 ошибок
const notFound = (req, res, next) => {
    const error = new Error(`Маршрут ${req.originalUrl} не найден`);
    error.status = 404;
    next(error);
};

// Основной обработчик ошибок
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Логируем ошибку
    console.error(`Ошибка: ${error.message}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: config.isDevelopment() ? err.stack : undefined
    });

    // Определяем статус код
    let statusCode = error.status || error.statusCode || 500;
    let message = error.message || 'Внутренняя ошибка сервера';

    // Обработка специфических ошибок
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Ошибка валидации данных';
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Неверный формат данных';
    }

    if (err.code === 11000) {
        statusCode = 400;
        message = 'Дублирование данных';
    }

    // Формируем ответ
    const response = {
        success: false,
        message: message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    // В режиме разработки добавляем stack trace
    if (config.isDevelopment()) {
        response.stack = err.stack;
        response.error = err;
    }

    // Отправляем ответ
    res.status(statusCode).json(response);
};

// Middleware для логирования запросов
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        if (config.isDevelopment()) {
            console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
        }
    });

    next();
};

// Middleware для обработки async функций
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware для валидации JSON
const validateJSON = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Неверный формат JSON'
        });
    }
    next(err);
};

// Middleware для ограничения размера запроса
const requestSizeLimit = (limit = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length']);
        const maxSize = parseInt(limit.replace(/[^\d]/g, '')) * 1024 * 1024;
        
        if (contentLength && contentLength > maxSize) {
            return res.status(413).json({
                success: false,
                message: `Размер запроса превышает лимит ${limit}`
            });
        }
        
        next();
    };
};

// Middleware для проверки типа контента
const validateContentType = (allowedTypes = ['application/json']) => {
    return (req, res, next) => {
        if (req.method === 'GET' || req.method === 'DELETE') {
            return next();
        }

        const contentType = req.headers['content-type'];
        if (!contentType) {
            return res.status(400).json({
                success: false,
                message: 'Заголовок Content-Type обязателен'
            });
        }

        const isAllowed = allowedTypes.some(type => 
            contentType.toLowerCase().includes(type.toLowerCase())
        );

        if (!isAllowed && !contentType.includes('multipart/form-data')) {
            return res.status(415).json({
                success: false,
                message: `Неподдерживаемый тип контента. Разрешены: ${allowedTypes.join(', ')}`
            });
        }

        next();
    };
};

module.exports = {
    notFound,
    errorHandler,
    requestLogger,
    asyncHandler,
    validateJSON,
    requestSizeLimit,
    validateContentType
};
