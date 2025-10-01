const rateLimit = require('express-rate-limit');
const config = require('../../config/config');

// Базовый rate limiter
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: {
            success: false,
            message: message || 'Слишком много запросов, попробуйте позже'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message: message || 'Слишком много запросов, попробуйте позже',
                retryAfter: Math.round(windowMs / 1000)
            });
        }
    });
};

// Общий rate limiter
const generalLimiter = createRateLimit(
    config.rateLimit.windowMs, // 15 минут
    config.rateLimit.max, // 100 запросов
    'Слишком много запросов с этого IP, попробуйте позже'
);

// Строгий rate limiter для операций создания/изменения
const strictLimiter = createRateLimit(
    15 * 60 * 1000, // 15 минут
    20, // 20 запросов
    'Слишком много операций создания/изменения, попробуйте позже'
);

// Rate limiter для загрузки файлов
const uploadLimiter = createRateLimit(
    60 * 60 * 1000, // 1 час
    10, // 10 загрузок
    'Слишком много загрузок файлов, попробуйте позже'
);

// Middleware для проверки заголовков безопасности
const securityHeaders = (req, res, next) => {
    // Удаляем информацию о сервере
    res.removeHeader('X-Powered-By');
    
    // Устанавливаем заголовки безопасности
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CSP для API
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'"
    );
    
    next();
};

// Middleware для валидации входящих данных
const sanitizeInput = (req, res, next) => {
    // Рекурсивная функция для очистки объекта
    const sanitize = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Удаляем потенциально опасные символы
                sanitized[key] = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .trim();
            } else {
                sanitized[key] = sanitize(value);
            }
        }
        return sanitized;
    };
    
    if (req.body) {
        req.body = sanitize(req.body);
    }
    
    if (req.query) {
        req.query = sanitize(req.query);
    }
    
    next();
};

// Middleware для проверки API ключа (если нужно)
const validateApiKey = (req, res, next) => {
    // В данном случае пропускаем, но можно добавить проверку API ключа
    next();
};

// Middleware для логирования подозрительной активности
const logSuspiciousActivity = (req, res, next) => {
    const suspiciousPatterns = [
        /\.\./,  // Path traversal
        /<script/i,  // XSS attempts
        /union.*select/i,  // SQL injection
        /javascript:/i,  // JavaScript injection
        /eval\(/i,  // Code execution attempts
    ];
    
    const checkString = `${req.originalUrl} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(checkString));
    
    if (isSuspicious) {
        console.warn('Подозрительная активность обнаружена:', {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl,
            userAgent: req.get('User-Agent'),
            body: req.body,
            query: req.query,
            timestamp: new Date().toISOString()
        });
    }
    
    next();
};

// Middleware для проверки размера загружаемых данных
const validateRequestSize = (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (contentLength > maxSize) {
        return res.status(413).json({
            success: false,
            message: 'Размер запроса слишком большой'
        });
    }
    
    next();
};

// Middleware для CORS с открытым доступом
const corsWithValidation = (req, res, next) => {
    const origin = req.headers.origin;
    
    // Разрешаем доступ с любых доменов
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*'); // Разрешить все заголовки
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 часа
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
};

module.exports = {
    generalLimiter,
    strictLimiter,
    uploadLimiter,
    securityHeaders,
    sanitizeInput,
    validateApiKey,
    logSuspiciousActivity,
    validateRequestSize,
    corsWithValidation
};
