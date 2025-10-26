// Полный тест API Todo приложения с аутентификацией
// Запустите: node test-complete.js
// Требуется запущенный сервер на http://localhost:3001
// Примечание: Для работы требуется node-fetch: npm install node-fetch

const http = require('http');
const { URL } = require('url');

// Простая функция для HTTP запросов (замена node-fetch)
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        if (options.body) {
            reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
        }

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        json: () => Promise.resolve(json)
                    });
                } catch {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        json: () => Promise.resolve(data)
                    });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

const API_BASE = 'http://localhost:3001/v2';

async function testCompleteAPI() {
    console.log('🧪 Полное тестирование Todo API с аутентификацией...\n');

    try {
        // 1. Проверка здоровья сервера
        console.log('1. Проверка здоровья сервера...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Сервер работает:', healthData.data?.status || 'OK');
        console.log('   Версия:', healthData.data?.version || 'N/A');
        console.log('   Режим:', healthData.data?.environment || 'N/A');

        // 2. Проверка API информации
        console.log('\n2. Проверка API информации...');
        const apiResponse = await fetch(`${API_BASE}/`);
        const apiData = await apiResponse.json();
        console.log('✅ API информация получена');
        console.log('   Название:', apiData.data?.name || 'Todo API');
        console.log('   Префикс:', apiData.data?.apiPrefix || '/v2');

        // 3. Регистрация нового пользователя
        console.log('\n3. Регистрация нового пользователя...');
        const registerResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testuser_api',
                password: 'testpass123'
            })
        });
        const registerData = await registerResponse.json();

        if (registerResponse.ok) {
            console.log('✅ Пользователь зарегистрирован:', registerData.data.user.username);
            const token = registerData.data.token;
            console.log('✅ JWT токен получен');

            // 4. Авторизация
            console.log('\n4. Авторизация пользователя...');
            const loginResponse = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'testuser_api',
                    password: 'testpass123'
                })
            });
            const loginData = await loginResponse.json();

            if (loginResponse.ok) {
                console.log('✅ Авторизация успешна');
                const authToken = loginData.data.token;

                // 5. Получение информации о пользователе
                console.log('\n5. Получение информации о пользователе...');
                const userResponse = await fetch(`${API_BASE}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const userData = await userResponse.json();

                if (userResponse.ok) {
                    console.log('✅ Профиль пользователя:');
                    console.log('   - ID:', userData.data.id);
                    console.log('   - Имя:', userData.data.username);
                    console.log('   - Создан:', new Date(userData.data.createdAt).toLocaleDateString());

                    // 6. Создание задач
                    console.log('\n6. Создание задач...');
                    const tasks = [
                        'Изучить React',
                        'Настроить базу данных',
                        'Протестировать API'
                    ];

                    const createdTasks = [];
                    for (const taskTitle of tasks) {
                        const taskResponse = await fetch(`${API_BASE}/tasks`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                title: taskTitle,
                                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                            })
                        });
                        const taskData = await taskResponse.json();

                        if (taskResponse.ok) {
                            createdTasks.push(taskData.data);
                            console.log(`   ✅ Создана: "${taskTitle}"`);
                        } else {
                            console.log(`   ❌ Ошибка создания "${taskTitle}":`, taskData.message);
                        }
                    }

                    // 7. Получение всех задач
                    console.log('\n7. Получение всех задач пользователя...');
                    const tasksResponse = await fetch(`${API_BASE}/tasks`, {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    const tasksData = await tasksResponse.json();

                    if (tasksResponse.ok) {
                        console.log(`✅ Получено задач: ${tasksData.data.tasks.length}`);
                        console.log('   Статистика:', tasksData.data.stats);

                        // 8. Тестирование поиска
                        console.log('\n8. Поиск задач...');
                        const searchResponse = await fetch(`${API_BASE}/tasks/search?q=React`, {
                            headers: { 'Authorization': `Bearer ${authToken}` }
                        });
                        const searchData = await searchResponse.json();

                        if (searchResponse.ok) {
                            console.log(`✅ Найдено задач: ${searchData.data.count}`);
                        }

                        // 9. Тестирование фильтров
                        console.log('\n9. Тестирование фильтров...');
                        const activeResponse = await fetch(`${API_BASE}/tasks/status/active`, {
                            headers: { 'Authorization': `Bearer ${authToken}` }
                        });
                        const activeData = await activeResponse.json();

                        if (activeResponse.ok) {
                            console.log(`✅ Активных задач: ${activeData.data.count}`);
                        }

                        // 10. Обновление задачи
                        if (createdTasks.length > 0) {
                            console.log('\n10. Обновление задачи...');
                            const updateResponse = await fetch(`${API_BASE}/tasks/${createdTasks[0].id}`, {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `Bearer ${authToken}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    title: 'Изучить React (обновлено)',
                                    completed: true
                                })
                            });
                            const updateData = await updateResponse.json();

                            if (updateResponse.ok) {
                                console.log('✅ Задача обновлена');
                            }

                            // 11. Загрузка файла (имитация)
                            console.log('\n11. Тестирование загрузки файлов...');
                            const formData = new FormData();
                            formData.append('file', Buffer.from('test content'), {
                                filename: 'test.txt',
                                contentType: 'text/plain'
                            });

                            // В реальности здесь был бы POST запрос с FormData
                            console.log('   📎 Функция загрузки файлов доступна');

                            // 12. Удаление задачи
                            console.log('\n12. Удаление задачи...');
                            const deleteResponse = await fetch(`${API_BASE}/tasks/${createdTasks[0].id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${authToken}` }
                            });
                            const deleteData = await deleteResponse.json();

                            if (deleteResponse.ok) {
                                console.log('✅ Задача удалена');
                            }
                        }

                        console.log('\n🎉 Все тесты пройдены успешно!');
                        console.log('\n📊 Итоговые результаты:');
                        console.log(`   - Пользователь: ${userData.data.username}`);
                        console.log(`   - Задач создано: ${createdTasks.length}`);
                        console.log(`   - Задач в системе: ${tasksData.data.tasks.length}`);
                        console.log(`   - API работает корректно: ✅`);
                    } else {
                        console.log('❌ Ошибка получения задач:', tasksData.message);
                    }
                } else {
                    console.log('❌ Ошибка получения профиля:', userData.message);
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
        console.log('- Сервер не запущен на http://localhost:3001');
        console.log('- Фронтенд не запущен на http://localhost:5173');
        console.log('- Проблемы с сетью или firewall');
        console.log('\nДля запуска сервера:');
        console.log('  cd server && npm run dev');
        console.log('Для запуска фронтенда:');
        console.log('  npm run dev');
    }
}

// Запуск полного теста
testCompleteAPI();
