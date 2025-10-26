const jwt = require('jsonwebtoken');
const AuthService = require('../services/AuthService');

// Middleware для проверки аутентификации
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Токен не предоставлен'
            });
        }

        const token = authHeader.substring(7);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Токен не предоставлен'
            });
        }

        // Верификация токена
        const authService = new AuthService();
        let decoded;
        try {
            decoded = jwt.verify(token, authService.jwtSecret);
        } catch (jwtError) {
            console.error('Ошибка верификации JWT:', jwtError.message);
            return res.status(401).json({
                success: false,
                message: 'Неверный токен'
            });
        }

        // Получение пользователя из токена
        let user;
        try {
            user = await authService.getUserByToken(token);
        } catch (userError) {
            console.error('Ошибка получения пользователя:', userError.message);
            return res.status(401).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        // Добавление пользователя в запрос
        req.user = user;
        req.userId = user.id;

        console.log('Аутентификация успешна для пользователя:', user.username);
        next();
    } catch (error) {
        console.error('Неожиданная ошибка аутентификации:', error);
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
};

// Middleware для проверки аутентификации с дополнительными опциями
const authenticateTokenOptional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Если токен не предоставлен, просто продолжаем без пользователя
            return next();
        }

        const token = authHeader.substring(7);
        if (!token) {
            return next();
        }

        // Верификация токена
        const authService = new AuthService();
        let decoded;
        try {
            decoded = jwt.verify(token, authService.jwtSecret);
        } catch (jwtError) {
            console.log('Неверный JWT токен в optional middleware, продолжаем без аутентификации');
            return next();
        }

        // Получение пользователя из токена
        let user;
        try {
            user = await authService.getUserByToken(token);
        } catch (userError) {
            console.log('Ошибка получения пользователя в optional middleware, продолжаем без аутентификации');
            return next();
        }

        // Добавление пользователя в запрос
        req.user = user;
        req.userId = user.id;

        next();
    } catch (error) {
        console.log('Неожиданная ошибка в optional middleware, продолжаем без аутентификации');
        next();
    }
};


module.exports = {
    authenticateToken,
    authenticateTokenOptional
};
