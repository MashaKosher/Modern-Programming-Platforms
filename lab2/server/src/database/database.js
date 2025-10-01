const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '../../data/tasks.db');
        this.init();
    }

    init() {
        // Создать папку data если не существует
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Подключиться к базе данных
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Ошибка подключения к SQLite:', err.message);
            } else {
                console.log('Подключено к SQLite базе данных');
                this.createTables();
            }
        });
    }

    createTables() {
        // Создать таблицу задач
        const createTasksTable = `
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                completed BOOLEAN DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                dueDate DATETIME,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Создать таблицу вложений
        const createAttachmentsTable = `
            CREATE TABLE IF NOT EXISTS attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                taskId INTEGER NOT NULL,
                filename TEXT NOT NULL,
                originalName TEXT NOT NULL,
                mimetype TEXT NOT NULL,
                size INTEGER NOT NULL,
                uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (taskId) REFERENCES tasks (id) ON DELETE CASCADE
            )
        `;

        this.db.serialize(() => {
            this.db.run(createTasksTable, (err) => {
                if (err) {
                    console.error('Ошибка создания таблицы tasks:', err.message);
                } else {
                    console.log('Таблица tasks создана или уже существует');
                }
            });

            this.db.run(createAttachmentsTable, (err) => {
                if (err) {
                    console.error('Ошибка создания таблицы attachments:', err.message);
                } else {
                    console.log('Таблица attachments создана или уже существует');
                    this.seedInitialData();
                }
            });
        });
    }

    seedInitialData() {
        // Проверить, есть ли уже данные
        this.db.get("SELECT COUNT(*) as count FROM tasks", (err, row) => {
            if (err) {
                console.error('Ошибка проверки данных:', err.message);
                return;
            }

            // Если нет данных, добавить начальные задачи
            if (row.count === 0) {
                console.log('Добавление начальных данных...');
                
                const insertTask = `
                    INSERT INTO tasks (title, completed, createdAt, dueDate)
                    VALUES (?, ?, ?, ?)
                `;

                const tasks = [
                    {
                        title: 'Пример задачи 1',
                        completed: 0,
                        createdAt: new Date('2024-01-15').toISOString(),
                        dueDate: new Date('2024-12-31').toISOString()
                    },
                    {
                        title: 'Пример задачи 2 (выполнена)',
                        completed: 1,
                        createdAt: new Date('2024-01-10').toISOString(),
                        dueDate: null
                    },
                    {
                        title: 'Просроченная задача',
                        completed: 0,
                        createdAt: new Date('2024-01-05').toISOString(),
                        dueDate: new Date('2024-01-10').toISOString()
                    }
                ];

                this.db.serialize(() => {
                    tasks.forEach((task) => {
                        this.db.run(insertTask, [task.title, task.completed, task.createdAt, task.dueDate], (err) => {
                            if (err) {
                                console.error('Ошибка добавления задачи:', err.message);
                            }
                        });
                    });
                });

                console.log('Начальные данные добавлены');
            }
        });
    }

    // Методы для работы с задачами
    getAllTasks(callback) {
        const query = `
            SELECT 
                t.*,
                GROUP_CONCAT(
                    CASE WHEN a.id IS NOT NULL THEN
                        json_object(
                            'id', a.id,
                            'filename', a.filename,
                            'originalName', a.originalName,
                            'mimetype', a.mimetype,
                            'size', a.size,
                            'uploadedAt', a.uploadedAt
                        )
                    END
                ) as attachments_json
            FROM tasks t
            LEFT JOIN attachments a ON t.id = a.taskId
            GROUP BY t.id
            ORDER BY t.createdAt DESC
        `;

        this.db.all(query, (err, rows) => {
            if (err) {
                return callback(err, null);
            }

            // Преобразовать attachments из JSON строки в массив
            const tasks = rows.map(row => ({
                ...row,
                completed: Boolean(row.completed),
                attachments: row.attachments_json 
                    ? (function() {
                        try {
                            return JSON.parse(row.attachments_json);
                        } catch (e) {
                            console.warn('Ошибка парсинга attachments_json:', row.attachments_json, e.message);
                            return [];
                        }
                    })()
                    : []
            }));

            callback(null, tasks);
        });
    }

    getTaskById(id, callback) {
        const query = `
            SELECT 
                t.*,
                GROUP_CONCAT(
                    CASE WHEN a.id IS NOT NULL THEN
                        json_object(
                            'id', a.id,
                            'filename', a.filename,
                            'originalName', a.originalName,
                            'mimetype', a.mimetype,
                            'size', a.size,
                            'uploadedAt', a.uploadedAt
                        )
                    END
                ) as attachments_json
            FROM tasks t
            LEFT JOIN attachments a ON t.id = a.taskId
            WHERE t.id = ?
            GROUP BY t.id
        `;

        this.db.get(query, [id], (err, row) => {
            if (err) {
                return callback(err, null);
            }

            if (!row) {
                return callback(null, null);
            }

            const task = {
                ...row,
                completed: Boolean(row.completed),
                attachments: row.attachments_json 
                    ? (function() {
                        try {
                            return JSON.parse(row.attachments_json);
                        } catch (e) {
                            console.warn('Ошибка парсинга attachments_json:', row.attachments_json, e.message);
                            return [];
                        }
                    })()
                    : []
            };

            callback(null, task);
        });
    }

    createTask(taskData, callback) {
        const query = `
            INSERT INTO tasks (title, completed, dueDate, createdAt, updatedAt)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

        this.db.run(query, [taskData.title, taskData.completed || 0, taskData.dueDate], function(err) {
            if (err) {
                return callback(err, null);
            }

            // Получить созданную задачу
            const newTaskId = this.lastID;
            callback(null, { id: newTaskId, ...taskData });
        });
    }

    updateTask(id, updates, callback) {
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (fields.length === 0) {
            return callback(new Error('Нет полей для обновления'), null);
        }

        fields.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;

        this.db.run(query, values, function(err) {
            if (err) {
                return callback(err, null);
            }

            if (this.changes === 0) {
                return callback(new Error('Задача не найдена'), null);
            }

            callback(null, { id, ...updates });
        });
    }

    deleteTask(id, callback) {
        const query = 'DELETE FROM tasks WHERE id = ?';

        this.db.run(query, [id], function(err) {
            if (err) {
                return callback(err, null);
            }

            if (this.changes === 0) {
                return callback(new Error('Задача не найдена'), null);
            }

            callback(null, { id });
        });
    }

    // Методы для работы с вложениями
    addAttachment(attachmentData, callback) {
        const query = `
            INSERT INTO attachments (taskId, filename, originalName, mimetype, size, uploadedAt)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        this.db.run(query, [
            attachmentData.taskId,
            attachmentData.filename,
            attachmentData.originalName,
            attachmentData.mimetype,
            attachmentData.size
        ], function(err) {
            if (err) {
                return callback(err, null);
            }

            callback(null, { id: this.lastID, ...attachmentData });
        });
    }

    deleteAttachment(id, callback) {
        const query = 'DELETE FROM attachments WHERE id = ?';

        this.db.run(query, [id], function(err) {
            if (err) {
                return callback(err, null);
            }

            if (this.changes === 0) {
                return callback(new Error('Вложение не найдено'), null);
            }

            callback(null, { id });
        });
    }

    // Статистика
    getStats(callback) {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN completed = 0 AND dueDate < datetime('now') THEN 1 ELSE 0 END) as overdue
            FROM tasks
        `;

        this.db.get(query, (err, row) => {
            if (err) {
                return callback(err, null);
            }

            callback(null, row);
        });
    }

    // Поиск задач
    searchTasks(query, callback) {
        const searchQuery = `
            SELECT 
                t.*,
                GROUP_CONCAT(
                    CASE WHEN a.id IS NOT NULL THEN
                        json_object(
                            'id', a.id,
                            'filename', a.filename,
                            'originalName', a.originalName,
                            'mimetype', a.mimetype,
                            'size', a.size,
                            'uploadedAt', a.uploadedAt
                        )
                    END
                ) as attachments_json
            FROM tasks t
            LEFT JOIN attachments a ON t.id = a.taskId
            WHERE t.title LIKE ?
            GROUP BY t.id
            ORDER BY t.createdAt DESC
        `;

        this.db.all(searchQuery, [`%${query}%`], (err, rows) => {
            if (err) {
                return callback(err, null);
            }

            const tasks = rows.map(row => ({
                ...row,
                completed: Boolean(row.completed),
                attachments: row.attachments_json 
                    ? (function() {
                        try {
                            return JSON.parse(row.attachments_json);
                        } catch (e) {
                            console.warn('Ошибка парсинга attachments_json:', row.attachments_json, e.message);
                            return [];
                        }
                    })()
                    : []
            }));

            callback(null, tasks);
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Ошибка закрытия базы данных:', err.message);
                } else {
                    console.log('Соединение с базой данных закрыто');
                }
            });
        }
    }
}

module.exports = Database;
