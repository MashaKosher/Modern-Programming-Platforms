const AuthService = require('../services/AuthService');
const { asyncHandler } = require('../middleware/errorHandler');

class AuthController {
    constructor() {
        this.authService = new AuthService();
    }

    // POST /v2/auth/register - Регистрация нового пользователя
    register = asyncHandler(async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Не все обязательные поля заполнены'
                });
            }

            const result = await this.authService.register(username, password);

            res.status(201).json({
                success: true,
                data: result,
                message: 'Пользователь успешно зарегистрирован'
            });
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // POST /v2/auth/login - Авторизация пользователя
    login = asyncHandler(async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Не все обязательные поля заполнены'
                });
            }

            const result = await this.authService.login(username, password);

            res.json({
                success: true,
                data: result,
                message: 'Авторизация успешна'
            });
        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    });

    // GET /v2/auth/me - Получение информации о текущем пользователе
    getCurrentUser = asyncHandler(async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Токен не предоставлен'
                });
            }

            const token = authHeader.substring(7);
            const user = await this.authService.getUserByToken(token);

            res.json({
                success: true,
                data: user,
                message: 'Информация о пользователе получена'
            });
        } catch (error) {
            console.error('Ошибка при получении пользователя:', error);
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    });

    // POST /v2/auth/verify - Проверка токена
    verifyToken = asyncHandler(async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Токен не предоставлен'
                });
            }

            const token = authHeader.substring(7);
            const user = await this.authService.getUserByToken(token);

            res.json({
                success: true,
                data: { valid: true, user },
                message: 'Токен действителен'
            });
        } catch (error) {
            console.error('Ошибка при проверке токена:', error);
            res.status(401).json({
                success: false,
                message: 'Неверный токен'
            });
        }
    });
}

module.exports = AuthController;
