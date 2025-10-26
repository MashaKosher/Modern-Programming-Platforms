class Task {
    constructor(id, title, completed = false, createdAt = new Date(), updatedAt = new Date(), dueDate = null, attachments = [], userId = null) {
        this.id = id;
        this.title = title;
        this.completed = completed;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.dueDate = dueDate;
        this.attachments = attachments;
        this.userId = userId;
    }

    static create(title, dueDate = null, userId = null) {
        const id = Date.now();
        const now = new Date();
        return new Task(id, title, false, now, now, dueDate, [], userId);
    }

    static validate(taskData) {
        const errors = [];

        // Валидация названия
        if (!taskData.title || typeof taskData.title !== 'string') {
            errors.push('Название задачи обязательно');
        } else if (taskData.title.trim().length === 0) {
            errors.push('Название задачи не может быть пустым');
        } else if (taskData.title.length > 255) {
            errors.push('Название задачи не может быть длиннее 255 символов');
        }

        // Валидация статуса
        if (taskData.completed !== undefined && typeof taskData.completed !== 'boolean') {
            errors.push('Статус выполнения должен быть булевым значением');
        }

        // Валидация даты завершения
        if (taskData.dueDate !== undefined && taskData.dueDate !== null) {
            const dueDate = new Date(taskData.dueDate);
            if (isNaN(dueDate.getTime())) {
                errors.push('Неверный формат даты завершения');
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDateStart = new Date(dueDate);
                dueDateStart.setHours(0, 0, 0, 0);
                
                if (dueDateStart < today) {
                    errors.push('Дата завершения не может быть раньше сегодняшнего дня');
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            completed: this.completed,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            dueDate: this.dueDate,
            attachments: this.attachments
        };
    }

    static fromJSON(data) {
        return new Task(
            data.id,
            data.title,
            data.completed,
            new Date(data.createdAt),
            data.updatedAt ? new Date(data.updatedAt) : new Date(data.createdAt),
            data.dueDate ? new Date(data.dueDate) : null,
            data.attachments || [],
            data.userId || null
        );
    }

    update(updates) {
        if (updates.title !== undefined) {
            this.title = updates.title;
        }
        if (updates.completed !== undefined) {
            this.completed = updates.completed;
        }
        if (updates.dueDate !== undefined) {
            this.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
        }
        this.updatedAt = new Date();
        return this;
    }

    toggle() {
        this.completed = !this.completed;
        this.updatedAt = new Date();
        return this;
    }

    isOverdue() {
        if (!this.dueDate || this.completed) {
            return false;
        }
        return new Date() > this.dueDate;
    }

    getDaysUntilDue() {
        if (!this.dueDate) {
            return null;
        }
        const today = new Date().setHours(0, 0, 0, 0);
        const dueDay = new Date(this.dueDate).setHours(0, 0, 0, 0);
        const diffTime = dueDay - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    addAttachment(filename, originalName, mimetype, size) {
        const attachment = {
            id: Date.now() + Math.random(),
            filename: filename,
            originalName: originalName,
            mimetype: mimetype,
            size: size,
            uploadedAt: new Date()
        };
        this.attachments.push(attachment);
        return attachment;
    }

    removeAttachment(attachmentId) {
        const index = this.attachments.findIndex(att => att.id === attachmentId);
        if (index !== -1) {
            const removed = this.attachments.splice(index, 1)[0];
            return removed;
        }
        return null;
    }

    getAttachment(attachmentId) {
        return this.attachments.find(att => att.id === attachmentId);
    }
}

module.exports = Task;
