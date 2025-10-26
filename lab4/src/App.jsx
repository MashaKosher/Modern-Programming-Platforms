import { useState } from 'react';
import { TaskProvider, useTaskContext } from './hooks/useTaskContext';
import { AuthProvider, useAuthContext } from './hooks/useAuthContext';
import Header from './components/Header';
import AddTaskForm from './components/AddTaskForm';
import Stats from './components/Stats';
import FilterSection from './components/FilterSection';
import TaskList from './components/TaskList';
import EditModal from './components/EditModal';
import UploadModal from './components/UploadModal';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import AuthForm from './components/AuthForm';
import './App.css';

function AppContent() {
  const [editingTask, setEditingTask] = useState(null);
  const [uploadTaskId, setUploadTaskId] = useState(null);
  const { loading, error, loadTasks } = useTaskContext();
  const { isAuthenticated } = useAuthContext();

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

  if (loading && isAuthenticated) {
    return (
      <div className="container">
        <Header />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <LoadingSpinner size="large" />
          <p style={{ marginTop: '20px', color: 'white' }}>Загрузка задач...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не аутентифицирован, показываем форму входа
  if (!isAuthenticated) {
    return (
      <div className="container">
        <Header />
        <AuthForm />
      </div>
    );
  }

  // Определяем, показывать ли кнопку "Попробовать снова"
  const showRetryButton = error && !error.includes('Требуется аутентификация');

  return (
    <div className="container">
      <Header />
      {error && <ErrorMessage error={error} onRetry={showRetryButton ? loadTasks : null} />}
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
    <AuthProvider>
      <TaskProvider>
        <AppContent />
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;