const TaskService = require('../services/TaskService');
const { getFileIcon, formatFileSize } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

class TaskController {
    constructor() {
        this.taskService = new TaskService();
    }

    index(req, res) {
        try {
            const tasks = this.taskService.getAllTasks();
            const stats = this.taskService.getStats();
            
            res.render('pages/index', {
                tasks: tasks,
                stats: stats,
                title: process.env.APP_NAME || 'Список задач',
                appConfig: {
                    name: process.env.APP_NAME || 'Todo App',
                    version: process.env.APP_VERSION || '1.0.0'
                }
            });
        } catch (error) {
            console.error('Ошибка при загрузке главной страницы:', error);
            res.status(500).render('pages/error', {
                message: 'Ошибка при загрузке страницы',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    }

    create(req, res) {
        try {
            const { title, dueDate } = req.body;
            
            if (!title || title.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Название задачи обязательно'
                });
            }

            const task = this.taskService.createTask(title, dueDate);
            
            res.status(201).json({
                success: true,
                message: 'Задача успешно создана',
                task: task.toJSON()
            });
        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    createFromForm(req, res) {
        try {
            const { title, dueDate } = req.body;
            
            if (!title || title.trim().length === 0) {
                return res.redirect('/?error=Название задачи обязательно');
            }

            this.taskService.createTask(title, dueDate || null);
            res.redirect('/?success=Задача успешно создана');
        } catch (error) {
            console.error('Ошибка при создании задачи:', error);
            res.redirect(`/?error=${encodeURIComponent(error.message)}`);
        }
    }

    update(req, res) {
        try {
            const { id } = req.params;
            const { title, dueDate } = req.body;

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

            const task = this.taskService.updateTask(id, updates);
            
            res.json({
                success: true,
                message: 'Задача успешно обновлена',
                task: task.toJSON()
            });
        } catch (error) {
            console.error('Ошибка при обновлении задачи:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    toggle(req, res) {
        try {
            const { id } = req.params;
            const task = this.taskService.toggleTask(id);
            
            res.json({
                success: true,
                message: 'Статус задачи обновлен',
                task: task.toJSON()
            });
        } catch (error) {
            console.error('Ошибка при переключении статуса задачи:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    delete(req, res) {
        try {
            const { id } = req.params;
            const task = this.taskService.deleteTask(id);
            
            res.json({
                success: true,
                message: 'Задача успешно удалена',
                task: task.toJSON()
            });
        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    getStats(req, res) {
        try {
            const stats = this.taskService.getStats();
            res.json({
                success: true,
                stats: stats
            });
        } catch (error) {
            console.error('Ошибка при получении статистики:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении статистики'
            });
        }
    }

    search(req, res) {
        try {
            const { q } = req.query;
            const tasks = this.taskService.searchTasks(q);
            
            res.json({
                success: true,
                tasks: tasks.map(task => task.toJSON()),
                query: q
            });
        } catch (error) {
            console.error('Ошибка при поиске задач:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при поиске задач'
            });
        }
    }

    getByStatus(req, res) {
        try {
            const { status } = req.params;
            const completed = status === 'completed';
            const tasks = this.taskService.getTasksByStatus(completed);
            
            res.json({
                success: true,
                tasks: tasks.map(task => task.toJSON()),
                status: status
            });
        } catch (error) {
            console.error('Ошибка при получении задач по статусу:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении задач'
            });
        }
    }

    async uploadFile(req, res) {
        try {
            const { id } = req.params;
            const task = this.taskService.getTaskById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Задача не найдена'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Файл не был загружен'
                });
            }

            const attachment = task.addAttachment(
                req.file.filename,
                req.file.originalname,
                req.file.mimetype,
                req.file.size
            );

            res.json({
                success: true,
                message: 'Файл успешно загружен',
                attachment: {
                    ...attachment,
                    icon: getFileIcon(attachment.mimetype),
                    formattedSize: formatFileSize(attachment.size)
                }
            });
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при загрузке файла'
            });
        }
    }

    async downloadFile(req, res) {
        try {
            const { id, attachmentId } = req.params;
            const task = this.taskService.getTaskById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Задача не найдена'
                });
            }

            const attachment = task.attachments.find(att => att.id == attachmentId);
            if (!attachment) {
                return res.status(404).json({
                    success: false,
                    message: 'Файл не найден'
                });
            }

            const filePath = path.join(__dirname, '../../public/uploads', attachment.filename);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Файл не найден на сервере'
                });
            }

            res.download(filePath, attachment.originalName);
        } catch (error) {
            console.error('Ошибка при скачивании файла:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при скачивании файла'
            });
        }
    }

    async deleteFile(req, res) {
        try {
            const { id, attachmentId } = req.params;
            const task = this.taskService.getTaskById(id);

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Задача не найдена'
                });
            }

            const attachment = task.removeAttachment(parseFloat(attachmentId));
            if (!attachment) {
                return res.status(404).json({
                    success: false,
                    message: 'Файл не найден'
                });
            }

            const filePath = path.join(__dirname, '../../public/uploads', attachment.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.json({
                success: true,
                message: 'Файл успешно удален'
            });
        } catch (error) {
            console.error('Ошибка при удалении файла:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при удалении файла'
            });
        }
    }
}

module.exports = TaskController;
