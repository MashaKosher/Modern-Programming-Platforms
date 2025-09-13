const express = require('express');
const TaskController = require('../controllers/TaskController');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();
const taskController = new TaskController();

router.get('/', taskController.index.bind(taskController));

router.post('/api/tasks', taskController.create.bind(taskController));
router.put('/api/tasks/:id', taskController.update.bind(taskController));
router.patch('/api/tasks/:id/toggle', taskController.toggle.bind(taskController));
router.delete('/api/tasks/:id', taskController.delete.bind(taskController));

router.get('/api/tasks/stats', taskController.getStats.bind(taskController));
router.get('/api/tasks/search', taskController.search.bind(taskController));
router.get('/api/tasks/status/:status', taskController.getByStatus.bind(taskController));

router.post('/tasks', taskController.createFromForm.bind(taskController));

router.put('/tasks/:id', taskController.update.bind(taskController));
router.patch('/tasks/:id/toggle', taskController.toggle.bind(taskController));
router.delete('/tasks/:id', taskController.delete.bind(taskController));

router.post('/tasks/:id/upload', upload.single('file'), taskController.uploadFile.bind(taskController));
router.get('/tasks/:id/files/:attachmentId/download', taskController.downloadFile.bind(taskController));
router.delete('/tasks/:id/files/:attachmentId', taskController.deleteFile.bind(taskController));

router.post('/api/tasks/:id/upload', upload.single('file'), taskController.uploadFile.bind(taskController));
router.get('/api/tasks/:id/files/:attachmentId/download', taskController.downloadFile.bind(taskController));
router.delete('/api/tasks/:id/files/:attachmentId', taskController.deleteFile.bind(taskController));

router.use(handleMulterError);

module.exports = router;
