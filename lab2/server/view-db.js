#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/tasks.db');

console.log('📊 Просмотр базы данных SQLite');
console.log('Путь к БД:', dbPath);
console.log('');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к базе данных:', err.message);
        process.exit(1);
    }
    
    console.log('✅ Подключено к SQLite базе данных');
    console.log('');
    
    // Показать задачи
    db.all("SELECT * FROM tasks ORDER BY createdAt DESC", (err, rows) => {
        if (err) {
            console.error('Ошибка получения задач:', err.message);
        } else {
            console.log('📋 ЗАДАЧИ:');
            console.table(rows);
        }
        
        // Показать вложения
        db.all("SELECT * FROM attachments ORDER BY uploadedAt DESC", (err, rows) => {
            if (err) {
                console.error('Ошибка получения вложений:', err.message);
            } else {
                console.log('📎 ВЛОЖЕНИЯ:');
                if (rows.length > 0) {
                    console.table(rows);
                } else {
                    console.log('Нет вложений');
                }
            }
            
            // Показать статистику
            db.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN completed = 0 AND dueDate < datetime('now') THEN 1 ELSE 0 END) as overdue
                FROM tasks
            `, (err, row) => {
                if (err) {
                    console.error('Ошибка получения статистики:', err.message);
                } else {
                    console.log('📊 СТАТИСТИКА:');
                    console.table([row]);
                }
                
                db.close((err) => {
                    if (err) {
                        console.error('Ошибка закрытия базы данных:', err.message);
                    } else {
                        console.log('✅ Соединение с базой данных закрыто');
                    }
                });
            });
        });
    });
});
