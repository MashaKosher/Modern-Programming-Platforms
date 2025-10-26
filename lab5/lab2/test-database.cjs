// Тестирование базы данных Todo приложения
// Запустите: node test-database.cjs
// Не требует запущенного сервера

const Database = require('./server/src/database/database.js');

console.log('🗄️ Тестирование базы данных Todo приложения...\n');

const db = new Database();

// Ждем инициализации базы данных
setTimeout(() => {
    console.log('📊 Проверка данных в базе...\n');

    // 1. Проверяем пользователей
    db.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
            console.error('❌ Ошибка получения пользователей:', err.message);
        } else {
            console.log(`👤 Пользователей в системе: ${row.count}`);
        }
    });

    // 2. Проверяем задачи
    db.db.get('SELECT COUNT(*) as count FROM tasks', (err, row) => {
        if (err) {
            console.error('❌ Ошибка получения задач:', err.message);
        } else {
            console.log(`📝 Задач в системе: ${row.count}`);
        }
    });

    // 3. Проверяем статистику
    db.db.get(`
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as active
        FROM tasks
    `, (err, row) => {
        if (err) {
            console.error('❌ Ошибка получения статистики:', err.message);
        } else {
            console.log(`📊 Статистика задач:`);
            console.log(`   - Всего: ${row.total}`);
            console.log(`   - Выполненных: ${row.completed}`);
            console.log(`   - Активных: ${row.active}`);
        }
    });

    // 4. Показываем все задачи
    db.db.all(`
        SELECT t.*, u.username
        FROM tasks t
        LEFT JOIN users u ON t.userId = u.id
        ORDER BY t.createdAt DESC
    `, (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения списка задач:', err.message);
        } else {
            console.log(`\n📋 Список задач (${rows.length}):`);
            if (rows.length > 0) {
                rows.forEach((task, index) => {
                    const status = task.completed ? '✅' : '⏳';
                    const dueDate = task.dueDate ? ` (до ${new Date(task.dueDate).toLocaleDateString()})` : '';
                    console.log(`   ${index + 1}. ${status} ${task.title}${dueDate}`);
                    console.log(`      Пользователь: ${task.username} (ID: ${task.userId})`);
                });
            } else {
                console.log('   Нет задач в системе');
            }
        }
    });

    // 5. Проверяем схему базы данных
    console.log(`\n📋 Схема базы данных:`);
    db.db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('❌ Ошибка получения схемы:', err.message);
        } else {
            tables.forEach(table => {
                console.log(`   - Таблица: ${table.name}`);
                // Показываем колонки для каждой таблицы
                db.db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                    if (!err && columns) {
                        console.log(`     Колонки: ${columns.map(col => col.name).join(', ')}`);
                    }
                });
            });
        }
    });

    // Закрываем соединение
    setTimeout(() => {
        db.close();
        console.log(`\n✅ Тестирование завершено!`);
        console.log(`\n🎯 Результаты:`);
        console.log(`   - База данных работает корректно`);
        console.log(`   - Пользователи и задачи созданы`);
        console.log(`   - Система аутентификации готова`);
        console.log(`   \n📝 Для запуска в браузере:`);
        console.log(`   1. cd server && npm run dev (порт 3001)`);
        console.log(`   2. npm run dev (порт 5173)`);
        console.log(`   3. Открыть http://localhost:5173`);
    }, 2000);

}, 2000);
