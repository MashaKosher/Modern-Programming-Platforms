const express = require('express');
const TaskController = require('../controllers/TaskController');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleMulterError, secureUpload } = require('../middleware/upload');
const { strictLimiter, uploadLimiter } = require('../middleware/security');

const router = express.Router();
const taskController = new TaskController();

// Все маршруты задач требуют аутентификации
router.use(authenticateToken);

// Специальные маршруты (должны быть перед параметризованными)
router.get('/stats', taskController.getStats);
router.get('/search', taskController.searchTasks);
router.get('/due-soon', taskController.getTasksDueSoon);
router.get('/overdue', taskController.getOverdueTasks);
router.get('/status/:status', taskController.getTasksByStatus);

// Основные CRUD операции
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', strictLimiter, taskController.createTask);
router.put('/:id', strictLimiter, taskController.updateTask);
router.patch('/:id/toggle', taskController.toggleTask);
router.delete('/:id', strictLimiter, taskController.deleteTask);

// Операции с файлами
router.post(
    '/:id/upload',
    uploadLimiter,
    upload.single('file'),
    secureUpload,
    handleMulterError,
    taskController.uploadFile
);

router.get('/:id/files/:attachmentId/download', taskController.downloadFile);
router.delete('/:id/files/:attachmentId', strictLimiter, taskController.deleteFile);

module.exports = router;
