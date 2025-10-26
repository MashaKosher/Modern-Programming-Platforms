import { useState } from 'react';
import { useTaskContext } from '../hooks/useTaskContext';

function AddTaskForm() {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const { addTask } = useTaskContext();

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

    await addTask(title.trim(), dueDate || null);
    setTitle('');
    setDueDate('');
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="add-task-section">
      <form onSubmit={handleSubmit} className="add-task-form">
        <div className="input-group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Добавить новую задачу..."
            required
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="date-input"
            title="Ожидаемая дата завершения"
            min={getTodayDate()}
          />
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-plus"></i> Добавить
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTaskForm;
