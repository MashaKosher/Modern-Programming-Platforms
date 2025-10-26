import { useState, useEffect } from 'react';
import { useTaskContext } from '../hooks/useTaskContext';

function EditModal({ isOpen, onClose, task }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const { updateTask } = useTaskContext();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Название задачи не может быть пустым');
      return;
    }

    // Проверка даты
    if (dueDate) {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        alert('Дата завершения не может быть раньше сегодняшнего дня');
        return;
      }
    }

    await updateTask(task.id, {
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate) : null
    });

    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const handleClearDate = () => {
    setDueDate('');
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="modal show" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Редактировать задачу</h3>
          <button className="close" onClick={handleClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="modal-form-group">
              <label htmlFor="editTaskInput">Название задачи:</label>
              <input
                type="text"
                id="editTaskInput"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название задачи..."
                autoFocus
              />
            </div>
            <div className="modal-form-group">
              <label htmlFor="editTaskDueDate">Ожидаемая дата завершения:</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="editTaskDueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="date-input"
                  min={getTodayDate()}
                />
                {dueDate && (
                  <button
                    type="button"
                    className="btn-clear-date"
                    onClick={handleClearDate}
                    title="Очистить дату"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary">
                Сохранить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
