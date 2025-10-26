import { useTaskContext } from '../hooks/useTaskContext';

function TaskItem({ task, onEdit, onUpload }) {
  const { toggleTask, deleteTask, removeAttachment } = useTaskContext();

  const handleToggle = async () => {
    await toggleTask(task.id);
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      await deleteTask(task.id);
    }
  };

  const handleEdit = () => {
    onEdit(task);
  };

  const handleUpload = () => {
    onUpload(task.id);
  };

  const handleDeleteFile = async (attachmentId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      await removeAttachment(task.id, attachmentId);
    }
  };

  const handleDownloadFile = async (attachment) => {
    try {
      const ApiService = await import('../services/api');
      await ApiService.default.downloadFile(task.id, attachment.id);
    } catch (error) {
      alert('Ошибка скачивания файла: ' + error.message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'fas fa-image';
    if (mimetype === 'application/pdf') return 'fas fa-file-pdf';
    if (mimetype.includes('word')) return 'fas fa-file-word';
    if (mimetype.includes('excel')) return 'fas fa-file-excel';
    if (mimetype.includes('zip')) return 'fas fa-file-archive';
    return 'fas fa-file';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDueDateStatus = () => {
    if (!task.dueDate || task.completed) return null;
    
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < today;
    const isToday = dueDate.toDateString() === today.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isOverdue) return { class: 'overdue', text: `Просрочено: ${formatDate(dueDate)}` };
    if (isToday) return { class: 'today', text: 'Сегодня' };
    if (isTomorrow) return { class: 'tomorrow', text: 'Завтра' };
    return { class: '', text: `До: ${formatDate(dueDate)}` };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-content">
        <div className="task-checkbox">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            className="checkbox"
          />
        </div>
        <div className="task-text">
          <span className="task-title">{task.title}</span>
          <div className="task-dates">
            <span className="task-created">
              <i className="fas fa-calendar-plus"></i>
              Создано: {formatDate(task.createdAt)}
            </span>
            {dueDateStatus && (
              <span className={`task-due ${dueDateStatus.class}`}>
                <i className="fas fa-clock"></i>
                {dueDateStatus.text}
              </span>
            )}
          </div>
          {task.attachments && task.attachments.length > 0 && (
            <div className="task-attachments">
              <span className="attachments-label">
                <i className="fas fa-paperclip"></i>
                {task.attachments.length} файл{task.attachments.length === 1 ? '' : (task.attachments.length < 5 ? 'а' : 'ов')}
              </span>
              <div className="attachments-list">
                {task.attachments.map((attachment) => (
                  <div key={attachment.id} className="attachment-item">
                    <i className={getFileIcon(attachment.mimetype)}></i>
                    <span 
                      className="attachment-name" 
                      title={attachment.originalName}
                    >
                      {attachment.originalName.length > 20 
                        ? attachment.originalName.substring(0, 17) + '...' 
                        : attachment.originalName}
                    </span>
                    <span className="attachment-size">({formatFileSize(attachment.size)})</span>
                    <div className="attachment-actions">
                      <button 
                        onClick={() => handleDownloadFile(attachment)} 
                        className="btn-download" 
                        title="Скачать"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteFile(attachment.id)} 
                        className="btn-delete-file" 
                        title="Удалить"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="task-actions">
        <button 
          className="btn btn-upload" 
          onClick={handleUpload} 
          title="Прикрепить файл"
        >
          <i className="fas fa-paperclip"></i>
        </button>
        <button className="btn btn-edit" onClick={handleEdit}>
          <i className="fas fa-edit"></i>
        </button>
        <button className="btn btn-delete" onClick={handleDelete}>
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
}

export default TaskItem;
