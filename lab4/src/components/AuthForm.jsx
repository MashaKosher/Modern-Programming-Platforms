import { useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';

function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });

    const { register, login, loading, error } = useAuthContext();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLogin && formData.password !== formData.confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        try {
            if (isLogin) {
                await login(formData.username, formData.password);
            } else {
                await register(formData.username, formData.password);
            }
        } catch (error) {
            console.error('Ошибка аутентификации:', error);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setFormData({
            username: '',
            password: '',
            confirmPassword: ''
        });
    };

    return (
        <div className="auth-form-container">
            <div className="auth-form-card">
                <div className="auth-form-header">
                    <h2>{isLogin ? 'Вход в систему' : 'Регистрация'}</h2>
                    <p>{isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Имя пользователя</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            placeholder="Введите имя пользователя"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            placeholder={isLogin ? 'Введите пароль' : 'Введите пароль (мин. 6 символов)'}
                            disabled={loading}
                            minLength={isLogin ? undefined : 6}
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Подтверждение пароля</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                                placeholder="Повторите пароль"
                                disabled={loading}
                                minLength={6}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-triangle"></i>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Загрузка...
                            </>
                        ) : (
                            isLogin ? 'Войти' : 'Зарегистрироваться'
                        )}
                    </button>

                    <div className="auth-toggle">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="toggle-button"
                            disabled={loading}
                        >
                            {isLogin ? 'Нужен аккаунт? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AuthForm;
