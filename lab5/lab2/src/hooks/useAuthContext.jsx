import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AuthService from '../services/auth';

const AuthContext = createContext();

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
};

function authReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload,
                error: null
            };

        case 'SET_ERROR':
            return {
                ...state,
                loading: false,
                error: action.payload,
                user: null,
                isAuthenticated: false
            };

        case 'LOGIN_SUCCESS':
            return {
                ...state,
                loading: false,
                error: null,
                user: action.payload.user,
                isAuthenticated: true
            };

        case 'LOGOUT':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                error: null
            };

        case 'SET_USER':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: !!action.payload
            };

        default:
            return state;
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Проверка аутентификации при загрузке приложения
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = AuthService.getToken();
                const user = AuthService.getCurrentUserFromStorage();

                if (token && user) {
                    // Проверяем токен на сервере
                    await AuthService.verifyToken();
                    dispatch({ type: 'SET_USER', payload: user });
                } else {
                    dispatch({ type: 'SET_USER', payload: null });
                }
            } catch (error) {
                console.warn('Ошибка проверки аутентификации:', error.message);
                // Если токен недействителен, очищаем хранилище
                AuthService.logout();
                dispatch({ type: 'SET_USER', payload: null });
            }
        };

        initAuth();
    }, []);

    // Регистрация пользователя
    const register = useCallback(async (username, password) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const result = await AuthService.register(username, password);

            if (result.success) {
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: {
                        user: result.data.user,
                        token: result.data.token
                    }
                });
            }

            return result;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    }, []);

    // Авторизация пользователя
    const login = useCallback(async (username, password) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const result = await AuthService.login(username, password);

            if (result.success) {
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: {
                        user: result.data.user,
                        token: result.data.token
                    }
                });
            }

            return result;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    }, []);

    // Выход из системы
    const logout = useCallback(() => {
        AuthService.logout();
        dispatch({ type: 'LOGOUT' });
    }, []);

    // Получение текущего пользователя
    const getCurrentUser = useCallback(async () => {
        try {
            const result = await AuthService.getCurrentUser();
            if (result.success) {
                dispatch({ type: 'SET_USER', payload: result.data });
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            logout();
            return null;
        }
    }, [logout]);

    const value = {
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        error: state.error,
        register,
        login,
        logout,
        getCurrentUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
