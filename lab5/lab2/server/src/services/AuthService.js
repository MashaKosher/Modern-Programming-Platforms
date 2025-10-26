const User = require('../models/User');
const Database = require('../database/database');
const jwt = require('jsonwebtoken');

class AuthService {
    constructor() {
        this.db = new Database();
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    }

    // Регистрация нового пользователя
    async register(username, password) {
        try {
            // Валидация данных пользователя
            const validation = User.validate({ username, password });
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Проверка существования пользователя
            const existingUser = await this.findUserByUsername(username);
            if (existingUser) {
                throw new Error('Пользователь с таким именем уже существует');
            }

            // Создание пользователя
            const user = await User.create(username, password);

            return new Promise((resolve, reject) => {
                this.db.createUser({
                    username: user.username,
                    passwordHash: user.passwordHash
                }, (err, createdUser) => {
                    if (err) {
                        reject(new Error('Ошибка создания пользователя: ' + err.message));
                    } else {
                        // Генерация токена
                        const token = this.generateToken(createdUser.id);
                        resolve({
                            user: user.toSafeJSON(),
                            token
                        });
                    }
                });
            });
        } catch (error) {
            throw error;
        }
    }

    // Авторизация пользователя
    async login(username, password) {
        try {
            // Поиск пользователя
            const userData = await this.findUserByUsername(username);
            if (!userData) {
                throw new Error('Неверное имя пользователя или пароль');
            }

            // Проверка пароля
            const isValidPassword = await User.verifyPassword(password, userData.passwordHash);
            if (!isValidPassword) {
                throw new Error('Неверное имя пользователя или пароль');
            }

            // Создание объекта пользователя
            const user = User.fromJSON(userData);

            // Генерация токена
            const token = this.generateToken(user.id);

            return {
                user: user.toSafeJSON(),
                token
            };
        } catch (error) {
            throw error;
        }
    }

    // Получение пользователя по токену
    async getUserByToken(token) {
        try {
            // Верификация токена
            const decoded = jwt.verify(token, this.jwtSecret);

            return new Promise((resolve, reject) => {
                this.db.getUserById(decoded.userId, (err, userData) => {
                    if (err) {
                        reject(new Error('Ошибка получения пользователя: ' + err.message));
                    } else if (!userData) {
                        reject(new Error('Пользователь не найден'));
                    } else {
                        resolve(User.fromJSON(userData).toSafeJSON());
                    }
                });
            });
        } catch (error) {
            throw new Error('Неверный токен');
        }
    }

    // Поиск пользователя по имени пользователя
    async findUserByUsername(username) {
        return new Promise((resolve, reject) => {
            this.db.getUserByUsername(username, (err, user) => {
                if (err) {
                    reject(new Error('Ошибка поиска пользователя: ' + err.message));
                } else {
                    resolve(user);
                }
            });
        });
    }

    // Генерация JWT токена
    generateToken(userId) {
        return jwt.sign(
            { userId },
            this.jwtSecret,
            { expiresIn: this.jwtExpiresIn }
        );
    }

}

module.exports = AuthService;
