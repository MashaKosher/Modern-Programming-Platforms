import { useState } from 'react';
import { TaskProvider, useTaskContext } from './hooks/useTaskContext';
import Header from './components/Header';
import AddTaskForm from './components/AddTaskForm';
import Stats from './components/Stats';
import FilterSection from './components/FilterSection';
import TaskList from './components/TaskList';
import EditModal from './components/EditModal';
import UploadModal from './components/UploadModal';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import './App.css';

function AppContent() {
  const [editingTask, setEditingTask] = useState(null);
  const [uploadTaskId, setUploadTaskId] = useState(null);
  const { loading, error, loadTasks } = useTaskContext();

  const handleEditTask = (task) => {
    setEditingTask(task);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
  };

  const handleUploadFile = (taskId) => {
    setUploadTaskId(taskId);
  };

  const handleCloseUploadModal = () => {
    setUploadTaskId(null);
  };

  if (loading) {
    return (
      <div className="container">
        <Header />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <LoadingSpinner size="large" />
          <p style={{ marginTop: '20px', color: 'white' }}>Подключение к серверу...</p>
          <p style={{ marginTop: '10px', color: '#ccc', fontSize: '0.9em' }}>
            Ожидание ответа от http://localhost:3001
          </p>
          <p style={{ marginTop: '5px', color: '#999', fontSize: '0.8em' }}>
            Если загрузка не завершается, проверьте консоль браузера (F12)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      {error && <ErrorMessage error={error} onRetry={loadTasks} />}
      <AddTaskForm />
      <Stats />
      <FilterSection />
      <TaskList 
        onEditTask={handleEditTask}
        onUploadFile={handleUploadFile}
      />
      
      <EditModal
        isOpen={!!editingTask}
        onClose={handleCloseEditModal}
        task={editingTask}
      />
      
      <UploadModal
        isOpen={!!uploadTaskId}
        onClose={handleCloseUploadModal}
        taskId={uploadTaskId}
      />
    </div>
  );
}

function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}

export default App;