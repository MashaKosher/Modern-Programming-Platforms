// Тестовый скрипт для проверки аутентификации
// Запустите: node test-auth.js

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/v2';

async function testAuth() {
    console.log('🧪 Тестирование системы аутентификации...\n');

    try {
        // 1. Проверка здоровья сервера
        console.log('1. Проверка здоровья сервера...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Сервер работает:', healthData.data.status);

        // 2. Регистрация нового пользователя
        console.log('\n2. Регистрация нового пользователя...');
        const registerResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testuser2',
                password: 'testpass123'
            })
        });
        const registerData = await registerResponse.json();

        if (registerResponse.ok) {
            console.log('✅ Пользователь зарегистрирован:', registerData.data.user.username);
            const token = registerData.data.token;
            console.log('✅ Токен получен');

            // 3. Авторизация
            console.log('\n3. Авторизация пользователя...');
            const loginResponse = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'testuser2',
                    password: 'testpass123'
                })
            });
            const loginData = await loginResponse.json();

            if (loginResponse.ok) {
                console.log('✅ Авторизация успешна');
                const newToken = loginData.data.token;

                // 4. Получение информации о пользователе
                console.log('\n4. Получение информации о пользователе...');
                const userResponse = await fetch(`${API_BASE}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${newToken}` }
                });
                const userData = await userResponse.json();

                if (userResponse.ok) {
                    console.log('✅ Информация о пользователе получена:');
                    console.log('   - ID:', userData.data.id);
                    console.log('   - Имя:', userData.data.username);
                    console.log('   - Email:', userData.data.email);

                    // 5. Создание задачи
                    console.log('\n5. Создание задачи...');
                    const taskResponse = await fetch(`${API_BASE}/tasks`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${newToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            title: 'Тестовая задача',
                            dueDate: '2024-12-31'
                        })
                    });
                    const taskData = await taskResponse.json();

                    if (taskResponse.ok) {
                        console.log('✅ Задача создана:', taskData.data.title);

                        // 6. Получение задач пользователя
                        console.log('\n6. Получение задач пользователя...');
                        const tasksResponse = await fetch(`${API_BASE}/tasks`, {
                            headers: { 'Authorization': `Bearer ${newToken}` }
                        });
                        const tasksData = await tasksResponse.json();

                        if (tasksResponse.ok) {
                            console.log(`✅ Получено задач: ${tasksData.data.tasks.length}`);
                            console.log('Первая задача:', tasksData.data.tasks[0]?.title);

                            console.log('\n🎉 Все тесты пройдены успешно!');
                        } else {
                            console.log('❌ Ошибка получения задач:', tasksData.message);
                        }
                    } else {
                        console.log('❌ Ошибка создания задачи:', taskData.message);
                    }
                } else {
                    console.log('❌ Ошибка получения пользователя:', userData.message);
                }
            } else {
                console.log('❌ Ошибка авторизации:', loginData.message);
            }
        } else {
            console.log('❌ Ошибка регистрации:', registerData.message);
        }

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
        console.log('\nВозможные причины:');
        console.log('- Сервер не запущен');
        console.log('- Неправильный порт (должен быть 3001)');
        console.log('- Проблемы с сетью');
    }
}

// Запуск теста
testAuth();
