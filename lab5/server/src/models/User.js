const bcrypt = require('bcryptjs');

class User {
    constructor(id, username, passwordHash, createdAt = new Date()) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
    }

    static async create(username, password) {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        return new User(null, username, passwordHash, new Date());
    }

    static validate(userData) {
        const errors = [];

        // Валидация имени пользователя
        if (!userData.username || typeof userData.username !== 'string') {
            errors.push('Имя пользователя обязательно');
        } else if (userData.username.length < 3) {
            errors.push('Имя пользователя должно быть не менее 3 символов');
        } else if (userData.username.length > 50) {
            errors.push('Имя пользователя не может быть длиннее 50 символов');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(userData.username)) {
            errors.push('Имя пользователя может содержать только буквы, цифры, дефис и подчеркивание');
        }

        // Валидация пароля
        if (!userData.password) {
            errors.push('Пароль обязателен');
        } else if (userData.password.length < 6) {
            errors.push('Пароль должен быть не менее 6 символов');
        } else if (userData.password.length > 128) {
            errors.push('Пароль не может быть длиннее 128 символов');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            createdAt: this.createdAt
        };
    }

    static fromJSON(data) {
        return new User(
            data.id,
            data.username,
            data.passwordHash,
            new Date(data.createdAt)
        );
    }

    // Метод для безопасного создания объекта без пароля
    toSafeJSON() {
        return {
            id: this.id,
            username: this.username,
            createdAt: this.createdAt
        };
    }
}

module.exports = User;
