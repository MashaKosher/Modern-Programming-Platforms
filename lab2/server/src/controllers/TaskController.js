const TaskService = require('../services/TaskService');
const { getFileIcon, formatFileSize } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

class TaskController {
    constructor() {
        this.taskService = new TaskService();
    }

    // Проверка владения задачей
    async checkTaskOwnership(taskId, userId) {
        const task = await this.taskService.getTaskById(taskId);
        if (!task) {
            throw new Error('Задача не найдена');
        }
        if (task.userId !== userId) {
            throw new Error('Доступ запрещен');
        }
        return task;
    }

    // GET /v2/tasks - Получить все задачи пользователя
    getAllTasks = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const tasks = await this.taskService.getTasksByUserId(req.userId);
            const stats = await this.taskService.getStatsByUserId(req.userId);

            res.json({
                success: true,
                data: {
                    tasks: tasks,
                    stats: stats
                },
                message: 'Задачи успешно получены'
            });
        } catch (error) {
            console.error('Ошибка при получении задач:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении задач'
            });
        }
    });

    // GET /v2/tasks/:id - Получить задачу по ID
    getTaskById = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { id } = req.params;
            await this.checkTaskOwnership(id, req.userId);

            const task = await this.taskService.getTaskById(id);

            res.json({
                success: true,
                data: task,
                message: 'Задача успешно получена'
            });
        } catch (error) {
            console.error('Ошибка при получении задачи:', error);
            if (error.message === 'Задача не найдена' || error.message === 'Доступ запрещен') {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Ошибка при получении задачи'
                });
            }
        }
    });

    // POST /v2/tasks - Создать новую задачу
    createTask = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { title, dueDate } = req.body;

            if (!title || title.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Название задачи обязательно'
                });
            }

            const task = await this.taskService.createTask(title, dueDate, req.userId);

            res.status(201).json({
                success: true,
                data: task,
                message: 'Задача успешно создана'
            });
        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // PUT /v2/tasks/:id - Обновить задачу
    updateTask = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { id } = req.params;
            const { title, dueDate, completed } = req.body;

            // Проверка владения задачей
            await this.checkTaskOwnership(id, req.userId);

            const updates = {};
            if (title !== undefined) {
                if (!title || title.trim().length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Название задачи обязательно'
                    });
                }
                updates.title = title.trim();
            }
            if (dueDate !== undefined) {
                updates.dueDate = dueDate || null;
            }
            if (completed !== undefined) {
                updates.completed = completed;
            }

            const task = await this.taskService.updateTask(id, updates);

            res.json({
                success: true,
                data: task,
                message: 'Задача успешно обновлена'
            });
        } catch (error) {
            console.error('Ошибка при обновлении задачи:', error);
            if (error.message === 'Задача не найдена' || error.message === 'Доступ запрещен') {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    // PATCH /v2/tasks/:id/toggle - Переключить статус задачи
    toggleTask = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { id } = req.params;

            // Проверка владения задачей
            await this.checkTaskOwnership(id, req.userId);

            const task = await this.taskService.toggleTask(id);

            res.json({
                success: true,
                data: task,
                message: 'Статус задачи обновлен'
            });
        } catch (error) {
            console.error('Ошибка при переключении статуса задачи:', error);
            if (error.message === 'Задача не найдена' || error.message === 'Доступ запрещен') {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    // DELETE /v2/tasks/:id - Удалить задачу
    deleteTask = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { id } = req.params;

            // Проверка владения задачей
            await this.checkTaskOwnership(id, req.userId);

            const task = await this.taskService.deleteTask(id);

            res.json({
                success: true,
                data: task,
                message: 'Задача успешно удалена'
            });
        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
            if (error.message === 'Задача не найдена' || error.message === 'Доступ запрещен') {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    // GET /v2/tasks/stats - Получить статистику пользователя
    getStats = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const stats = await this.taskService.getStatsByUserId(req.userId);
            res.json({
                success: true,
                data: stats,
                message: 'Статистика успешно получена'
            });
        } catch (error) {
            console.error('Ошибка при получении статистики:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении статистики'
            });
        }
    });

    // GET /v2/tasks/search - Поиск задач пользователя
    searchTasks = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { q } = req.query;
            const tasks = await this.taskService.searchTasksByUserId(req.userId, q);

            res.json({
                success: true,
                data: {
                    tasks: tasks,
                    query: q || '',
                    count: tasks.length
                },
                message: 'Поиск выполнен успешно'
            });
        } catch (error) {
            console.error('Ошибка при поиске задач:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при поиске задач'
            });
        }
    });

    // GET /v2/tasks/status/:status - Получить задачи по статусу пользователя
    getTasksByStatus = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { status } = req.params;

            if (!['active', 'completed'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Неверный статус. Используйте: active или completed'
                });
            }

            const completed = status === 'completed';
            const tasks = await this.taskService.getTasksByStatus(completed, req.userId);

            res.json({
                success: true,
                data: {
                    tasks: tasks,
                    status: status,
                    count: tasks.length
                },
                message: 'Задачи получены успешно'
            });
        } catch (error) {
            console.error('Ошибка при получении задач по статусу:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении задач'
            });
        }
    });

    // GET /v2/tasks/due-soon - Получить задачи с истекающим сроком пользователя
    getTasksDueSoon = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { days = 3 } = req.query;
            const tasks = await this.taskService.getTasksDueSoon(parseInt(days), req.userId);

            res.json({
                success: true,
                data: {
                    tasks: tasks,
                    days: parseInt(days),
                    count: tasks.length
                },
                message: 'Задачи с истекающим сроком получены'
            });
        } catch (error) {
            console.error('Ошибка при получении задач с истекающим сроком:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении задач'
            });
        }
    });

    // GET /v2/tasks/overdue - Получить просроченные задачи пользователя
    getOverdueTasks = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const tasks = await this.taskService.getOverdueTasks(req.userId);

            res.json({
                success: true,
                data: {
                    tasks: tasks,
                    count: tasks.length
                },
                message: 'Просроченные задачи получены'
            });
        } catch (error) {
            console.error('Ошибка при получении просроченных задач:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении задач'
            });
        }
    });

    // POST /v2/tasks/:id/upload - Загрузить файл к задаче
    uploadFile = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { id } = req.params;
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Файл не был загружен'
                });
            }

            // Проверка владения задачей
            await this.checkTaskOwnership(id, req.userId);

            const attachment = await this.taskService.addAttachmentToTask(
                id,
                req.file.filename,
                req.file.originalname,
                req.file.mimetype,
                req.file.size
            );

            res.json({
                success: true,
                data: {
                    attachment: {
                        ...attachment,
                        icon: getFileIcon(attachment.mimetype),
                        formattedSize: formatFileSize(attachment.size)
                    }
                },
                message: 'Файл успешно загружен'
            });
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            if (error.message === 'Задача не найдена' || error.message === 'Доступ запрещен') {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Ошибка при загрузке файла'
                });
            }
        }
    });

    // GET /v2/tasks/:id/files/:attachmentId/download - Скачать файл
    downloadFile = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { id, attachmentId } = req.params;

            // Проверка владения задачей
            await this.checkTaskOwnership(id, req.userId);

            const attachment = await this.taskService.getAttachment(id, parseFloat(attachmentId));

            const filePath = path.join(__dirname, '../../uploads', attachment.filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Файл не найден на сервере'
                });
            }

            res.download(filePath, attachment.originalName);
        } catch (error) {
            console.error('Ошибка при скачивании файла:', error);
            if (error.message === 'Задача не найдена' || error.message === 'Доступ запрещен') {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Ошибка при скачивании файла'
                });
            }
        }
    });

    // DELETE /v2/tasks/:id/files/:attachmentId - Удалить файл
    deleteFile = asyncHandler(async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Требуется аутентификация'
                });
            }

            const { id, attachmentId } = req.params;

            // Проверка владения задачей
            await this.checkTaskOwnership(id, req.userId);

            const attachment = await this.taskService.removeAttachmentFromTask(id, parseFloat(attachmentId));

            res.json({
                success: true,
                data: attachment,
                message: 'Файл успешно удален'
            });
        } catch (error) {
            console.error('Ошибка при удалении файла:', error);
            if (error.message === 'Задача не найдена' || error.message === 'Доступ запрещен') {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Ошибка при удалении файла'
                });
            }
        }
    });
}

module.exports = TaskController;
