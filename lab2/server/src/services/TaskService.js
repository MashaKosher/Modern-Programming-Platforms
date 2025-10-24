const Task = require('../models/Task');
const Database = require('../database/database');
const fs = require('fs');
const path = require('path');

class TaskService {
    constructor() {
        this.db = new Database();
    }

    // Получить все задачи
    getAllTasks() {
        return new Promise((resolve, reject) => {
            this.db.getAllTasks((err, tasks) => {
                if (err) {
                    reject(new Error('Ошибка получения задач: ' + err.message));
                } else {
                    resolve(tasks);
                }
            });
        });
    }

    // Получить задачу по ID
    getTaskById(id) {
        return new Promise((resolve, reject) => {
            const taskId = typeof id === 'string' ? parseInt(id) : id;
            
            this.db.getTaskById(taskId, (err, task) => {
                if (err) {
                    reject(new Error('Ошибка получения задачи: ' + err.message));
                } else if (!task) {
                    reject(new Error('Задача не найдена'));
                } else {
                    resolve(task);
                }
            });
        });
    }

    // Создать новую задачу
    createTask(title, dueDate = null, userId = null) {
        return new Promise((resolve, reject) => {
            const validation = Task.validate({ title, dueDate });
            if (!validation.isValid) {
                return reject(new Error(validation.errors.join(', ')));
            }

            const taskData = {
                title: title.trim(),
                completed: false,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                userId: userId
            };

            this.db.createTask(taskData, (err, result) => {
                if (err) {
                    reject(new Error('Ошибка создания задачи: ' + err.message));
                } else {
                    // Получить созданную задачу с полными данными
                    this.getTaskById(result.id).then(resolve).catch(reject);
                }
            });
        });
    }

    // Обновить задачу
    updateTask(id, updates) {
        return new Promise((resolve, reject) => {
            const taskId = typeof id === 'string' ? parseInt(id) : id;

            // Сначала получаем текущую задачу для валидации
            this.getTaskById(taskId).then(currentTask => {
                // Валидация обновлений
                const validation = Task.validate({
                    title: updates.title !== undefined ? updates.title : currentTask.title,
                    dueDate: updates.dueDate !== undefined ? updates.dueDate : currentTask.dueDate,
                    completed: updates.completed !== undefined ? updates.completed : currentTask.completed
                });

                if (!validation.isValid) {
                    return reject(new Error(validation.errors.join(', ')));
                }

                // Подготовить данные для обновления
                const updateData = {};
                if (updates.title !== undefined) updateData.title = updates.title.trim();
                if (updates.completed !== undefined) updateData.completed = updates.completed ? 1 : 0;
                if (updates.dueDate !== undefined) {
                    updateData.dueDate = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
                }

                this.db.updateTask(taskId, updateData, (err, result) => {
                    if (err) {
                        reject(new Error('Ошибка обновления задачи: ' + err.message));
                    } else {
                        // Получить обновленную задачу
                        this.getTaskById(taskId).then(resolve).catch(reject);
                    }
                });
            }).catch(reject);
        });
    }

    // Переключить статус задачи
    toggleTask(id) {
        return new Promise((resolve, reject) => {
            const taskId = typeof id === 'string' ? parseInt(id) : id;

            this.getTaskById(taskId).then(task => {
                const newCompleted = !task.completed;
                
                this.db.updateTask(taskId, { completed: newCompleted ? 1 : 0 }, (err, result) => {
                    if (err) {
                        reject(new Error('Ошибка переключения статуса: ' + err.message));
                    } else {
                        // Получить обновленную задачу
                        this.getTaskById(taskId).then(resolve).catch(reject);
                    }
                });
            }).catch(reject);
        });
    }

    // Удалить задачу
    deleteTask(id) {
        return new Promise((resolve, reject) => {
            const taskId = typeof id === 'string' ? parseInt(id) : id;

            // Сначала получаем задачу для удаления связанных файлов
            this.getTaskById(taskId).then(task => {
                // Удаляем связанные файлы
                task.attachments.forEach(attachment => {
                    this.deleteAttachmentFile(attachment.filename);
                });

                this.db.deleteTask(taskId, (err, result) => {
                    if (err) {
                        reject(new Error('Ошибка удаления задачи: ' + err.message));
                    } else {
                        resolve(task);
                    }
                });
            }).catch(reject);
        });
    }

    // Поиск задач
    searchTasks(query) {
        return new Promise((resolve, reject) => {
            if (!query || query.trim().length === 0) {
                return this.getAllTasks().then(resolve).catch(reject);
            }

            this.db.searchTasks(query.trim(), (err, tasks) => {
                if (err) {
                    reject(new Error('Ошибка поиска задач: ' + err.message));
                } else {
                    resolve(tasks);
                }
            });
        });
    }

    // Поиск задач пользователя
    searchTasksByUserId(userId, query) {
        return new Promise((resolve, reject) => {
            if (!query || query.trim().length === 0) {
                return this.getTasksByUserId(userId).then(resolve).catch(reject);
            }

            this.db.searchTasksByUserId(userId, query.trim(), (err, tasks) => {
                if (err) {
                    reject(new Error('Ошибка поиска задач: ' + err.message));
                } else {
                    resolve(tasks);
                }
            });
        });
    }

    // Получить задачи по статусу
    getTasksByStatus(completed, userId = null) {
        return new Promise((resolve, reject) => {
            if (userId) {
                this.db.getTasksByUserId(userId, (err, tasks) => {
                    if (err) {
                        reject(new Error('Ошибка получения задач: ' + err.message));
                    } else {
                        const filteredTasks = tasks.filter(task => task.completed === completed);
                        resolve(filteredTasks);
                    }
                });
            } else {
                this.getAllTasks().then(tasks => {
                    const filteredTasks = tasks.filter(task => task.completed === completed);
                    resolve(filteredTasks);
                }).catch(reject);
            }
        });
    }

    // Получить статистику
    getStats() {
        return new Promise((resolve, reject) => {
            this.db.getStats((err, stats) => {
                if (err) {
                    reject(new Error('Ошибка получения статистики: ' + err.message));
                } else {
                    resolve(stats);
                }
            });
        });
    }

    // Получить все задачи пользователя
    getTasksByUserId(userId) {
        return new Promise((resolve, reject) => {
            this.db.getTasksByUserId(userId, (err, tasks) => {
                if (err) {
                    reject(new Error('Ошибка получения задач: ' + err.message));
                } else {
                    resolve(tasks);
                }
            });
        });
    }

    // Получить статистику пользователя
    getStatsByUserId(userId) {
        return new Promise((resolve, reject) => {
            this.db.getStatsByUserId(userId, (err, stats) => {
                if (err) {
                    reject(new Error('Ошибка получения статистики: ' + err.message));
                } else {
                    resolve(stats);
                }
            });
        });
    }

    // Получить задачи с истекающим сроком
    getTasksDueSoon(days = 3, userId = null) {
        return new Promise((resolve, reject) => {
            if (userId) {
                this.db.getTasksByUserId(userId, (err, tasks) => {
                    if (err) {
                        reject(new Error('Ошибка получения задач: ' + err.message));
                    } else {
                        const dueSoonTasks = tasks.filter(task => {
                            if (!task.dueDate || task.completed) return false;

                            const dueDate = new Date(task.dueDate);
                            const today = new Date();
                            const diffTime = dueDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            return diffDays >= 0 && diffDays <= days;
                        });
                        resolve(dueSoonTasks);
                    }
                });
            } else {
                this.getAllTasks().then(tasks => {
                    const dueSoonTasks = tasks.filter(task => {
                        if (!task.dueDate || task.completed) return false;

                        const dueDate = new Date(task.dueDate);
                        const today = new Date();
                        const diffTime = dueDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        return diffDays >= 0 && diffDays <= days;
                    });
                    resolve(dueSoonTasks);
                }).catch(reject);
            }
        });
    }

    // Получить просроченные задачи
    getOverdueTasks(userId = null) {
        return new Promise((resolve, reject) => {
            if (userId) {
                this.db.getTasksByUserId(userId, (err, tasks) => {
                    if (err) {
                        reject(new Error('Ошибка получения задач: ' + err.message));
                    } else {
                        const overdueTasks = tasks.filter(task => {
                            if (!task.dueDate || task.completed) return false;
                            return new Date() > new Date(task.dueDate);
                        });
                        resolve(overdueTasks);
                    }
                });
            } else {
                this.getAllTasks().then(tasks => {
                    const overdueTasks = tasks.filter(task => {
                        if (!task.dueDate || task.completed) return false;
                        return new Date() > new Date(task.dueDate);
                    });
                    resolve(overdueTasks);
                }).catch(reject);
            }
        });
    }

    // Добавить вложение к задаче
    async addAttachmentToTask(taskId, filename, originalName, mimetype, size) {
        try {
            const id = typeof taskId === 'string' ? parseInt(taskId) : taskId;

            // Проверяем, что задача существует
            const task = await this.getTaskById(id);
            if (!task) {
                throw new Error('Задача не найдена');
            }

            const attachmentData = {
                taskId: id,
                filename: filename,
                originalName: originalName,
                mimetype: mimetype,
                size: size
            };

            return new Promise((resolve, reject) => {
                this.db.addAttachment(attachmentData, (err, attachment) => {
                    if (err) {
                        reject(new Error('Ошибка добавления вложения: ' + err.message));
                    } else {
                        resolve(attachment);
                    }
                });
            });
        } catch (error) {
            throw error;
        }
    }

    // Удалить вложение из задачи
    async removeAttachmentFromTask(taskId, attachmentId) {
        try {
            const id = typeof taskId === 'string' ? parseInt(taskId) : taskId;

            // Сначала получаем задачу и находим вложение
            const task = await this.getTaskById(id);
            if (!task) {
                throw new Error('Задача не найдена');
            }

            const attachment = task.attachments.find(att => att.id == attachmentId);
            if (!attachment) {
                throw new Error('Файл не найден');
            }

            return new Promise((resolve, reject) => {
                this.db.deleteAttachment(attachmentId, (err, result) => {
                    if (err) {
                        reject(new Error('Ошибка удаления вложения: ' + err.message));
                    } else {
                        // Удаляем физический файл
                        this.deleteAttachmentFile(attachment.filename);
                        resolve(attachment);
                    }
                });
            });
        } catch (error) {
            throw error;
        }
    }

    // Получить вложение
    async getAttachment(taskId, attachmentId) {
        try {
            const id = typeof taskId === 'string' ? parseInt(taskId) : taskId;

            const task = await this.getTaskById(id);
            if (!task) {
                throw new Error('Задача не найдена');
            }

            const attachment = task.attachments.find(att => att.id == attachmentId);
            if (!attachment) {
                throw new Error('Файл не найден');
            }

            return attachment;
        } catch (error) {
            throw error;
        }
    }

    // Удалить физический файл
    deleteAttachmentFile(filename) {
        try {
            const filePath = path.join(__dirname, '../../uploads', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Ошибка при удалении файла:', error);
        }
    }

    // Закрыть соединение с базой данных
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = TaskService;