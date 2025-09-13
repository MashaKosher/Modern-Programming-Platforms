const Task = require('../models/Task');

class TaskService {
    constructor() {
        this.tasks = new Map();
        this.initializeDefaultTasks();
    }

    initializeDefaultTasks() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const defaultTasks = [
            { id: 1, title: 'Изучить Node.js', completed: false, createdAt: new Date(), dueDate: nextWeek },
            { id: 2, title: 'Создать веб-приложение', completed: true, createdAt: new Date(), dueDate: null },
            { id: 3, title: 'Настроить EJS шаблоны', completed: false, createdAt: new Date(), dueDate: tomorrow }
        ];

        defaultTasks.forEach(taskData => {
            const task = Task.fromJSON(taskData);
            this.tasks.set(task.id, task);
        });
    }

    getAllTasks() {
        return Array.from(this.tasks.values()).sort((a, b) => a.createdAt - b.createdAt);
    }

    getTaskById(id) {
        return this.tasks.get(parseInt(id));
    }

    createTask(title, dueDate = null) {
        const validation = Task.validate({ title, dueDate });
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const task = Task.create(title.trim(), dueDate);
        this.tasks.set(task.id, task);
        return task;
    }

    updateTask(id, updates) {
        const task = this.getTaskById(id);
        if (!task) {
            throw new Error('Задача не найдена');
        }

        const validation = Task.validate(updates);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        task.update(updates);
        return task;
    }

    toggleTask(id) {
        const task = this.getTaskById(id);
        if (!task) {
            throw new Error('Задача не найдена');
        }

        task.toggle();
        return task;
    }

    deleteTask(id) {
        const task = this.getTaskById(id);
        if (!task) {
            throw new Error('Задача не найдена');
        }

        this.tasks.delete(parseInt(id));
        return task;
    }

    getStats() {
        const allTasks = this.getAllTasks();
        const completed = allTasks.filter(task => task.completed).length;
        const active = allTasks.filter(task => !task.completed).length;

        return {
            total: allTasks.length,
            completed: completed,
            active: active,
            completionRate: allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0
        };
    }

    searchTasks(query) {
        const allTasks = this.getAllTasks();
        if (!query || query.trim().length === 0) {
            return allTasks;
        }

        const searchTerm = query.toLowerCase().trim();
        return allTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm)
        );
    }

    getTasksByStatus(completed) {
        const allTasks = this.getAllTasks();
        return allTasks.filter(task => task.completed === completed);
    }

    getOverdueTasks() {
        const allTasks = this.getAllTasks();
        return allTasks.filter(task => task.isOverdue());
    }

    getTodayTasks() {
        const allTasks = this.getAllTasks();
        const today = new Date().setHours(0, 0, 0, 0);
        
        return allTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDueDay = new Date(task.dueDate).setHours(0, 0, 0, 0);
            return taskDueDay === today;
        });
    }

    getThisWeekTasks() {
        const allTasks = this.getAllTasks();
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        
        return allTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= weekStart && dueDate <= weekEnd;
        });
    }
}

module.exports = TaskService;
