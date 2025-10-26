import { useEffect, useState } from 'react';
import { useTaskContext } from '../hooks/useTaskContext';
import TaskItem from './TaskItem';

function TaskList({ onEditTask, onUploadFile }) {
  const { filteredTasks } = useTaskContext();
  const [animatedTasks, setAnimatedTasks] = useState([]);

  useEffect(() => {
    // Анимация появления задач
    setAnimatedTasks([]);
    filteredTasks.forEach((task, index) => {
      setTimeout(() => {
        setAnimatedTasks(prev => [...prev, task.id]);
      }, index * 100);
    });
  }, [filteredTasks]);

  if (filteredTasks.length === 0) {
    return (
      <div className="tasks-section">
        <div className="empty-state">
          <i className="fas fa-clipboard-list"></i>
          <h3>Нет задач</h3>
          <p>Добавьте свою первую задачу выше</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-section">
      <div className="tasks-list">
        {filteredTasks.map((task, index) => (
          <div
            key={task.id}
            style={{
              opacity: animatedTasks.includes(task.id) ? 1 : 0,
              transform: animatedTasks.includes(task.id) ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease'
            }}
          >
            <TaskItem 
              task={task} 
              onEdit={onEditTask}
              onUpload={onUploadFile}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskList;
