import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import websocketService from '../services/websocket';
import { useAuthContext } from './useAuthContext';

const TaskContext = createContext();

const initialState = {
  tasks: [],
  filter: 'all', // 'all', 'active', 'completed'
  searchQuery: '',
  loading: false,
  error: null
};

function taskReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: null
      };

    case 'SET_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
        loading: false,
        error: null
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload }
            : task
        )
      };

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, completed: !task.completed }
            : task
        )
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload.id)
      };

    case 'ADD_ATTACHMENT':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                attachments: [...(task.attachments || []), action.payload.attachment]
              }
            : task
        ),
        loading: false
      };

    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                attachments: task.attachments.filter(
                  att => att.id !== action.payload.attachmentId
                )
              }
            : task
        )
      };

    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload
      };

    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { isAuthenticated } = useAuthContext();

  // Загрузить задачи при инициализации, только если пользователь аутентифицирован
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    } else {
      // Если пользователь не аутентифицирован, очищаем задачи
      dispatch({ type: 'SET_TASKS', payload: [] });
    }
  }, [isAuthenticated]);

  const loadTasks = async (retryCount = 0) => {
    // Не загружать задачи, если пользователь не аутентифицирован
    if (!isAuthenticated) {
      console.log('Пользователь не аутентифицирован, пропускаем загрузку задач');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Увеличенная задержка для первого запроса, чтобы дать серверу время запуститься
      if (retryCount === 0) {
        console.log('Ожидание запуска сервера...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        const delay = retryCount * 2000; // 2s, 4s, 6s, 8s
        console.log(`Повторная попытка ${retryCount}/3 через ${delay/1000}с...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const result = await websocketService.getTasks();
      
      if (result && result.tasks) {
        // Преобразовать данные с сервера в формат фронтенда
        const tasksWithDates = result.tasks.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : null
        }));
        dispatch({ type: 'SET_TASKS', payload: tasksWithDates });
        console.log(`Успешно загружено ${tasksWithDates.length} задач`);
      } else {
        dispatch({ type: 'SET_TASKS', payload: [] });
      }
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);

      // Проверяем тип ошибки
      if (error.message.includes('Требуется аутентификация')) {
        // Ошибка аутентификации - не повторять попытки
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return;
      }

      // Повторить попытку до 3 раз
      if (retryCount < 3) {
        setTimeout(() => {
          loadTasks(retryCount + 1);
        }, 1000);
      } else {
        // Проверяем тип ошибки
        if (error.message.includes('Требуется аутентификация')) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
        } else {
          dispatch({ type: 'SET_ERROR', payload: `Не удалось подключиться к серверу. Проверьте, что сервер запущен на http://localhost:3001` });
        }
      }
    }
  };

  const addTask = useCallback(async (title, dueDate) => {
    // Не создавать задачи, если пользователь не аутентифицирован
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await websocketService.createTask(title, dueDate);

      if (result.success) {
        const newTask = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null
        };
        dispatch({ type: 'ADD_TASK', payload: newTask });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const updateTask = useCallback(async (id, updates) => {
    // Не обновлять задачи, если пользователь не аутентифицирован
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await websocketService.updateTask(id, updates);

      if (result.success) {
        const updatedTask = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null
        };
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const toggleTask = useCallback(async (id) => {
    // Не переключать задачи, если пользователь не аутентифицирован
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }

    try {
      const result = await websocketService.toggleTask(id);

      if (result.success) {
        const updatedTask = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null
        };
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const deleteTask = useCallback(async (id) => {
    // Не удалять задачи, если пользователь не аутентифицирован
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }

    try {
      const result = await websocketService.deleteTask(id);

      if (result.success) {
        dispatch({ type: 'DELETE_TASK', payload: { id } });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const addAttachment = useCallback(async (taskId, file) => {
    // Не загружать файлы, если пользователь не аутентифицирован
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // Convert file to base64 and send via ws
      const reader = new FileReader();
      const fileData = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve({ name: file.name, size: file.size, mimetype: file.type, data: base64 });
        };
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsDataURL(file);
      });
      const result = await websocketService.send('uploadFile', { taskId, file: fileData });

      if (result.success && result.data && result.data.attachment) {
        dispatch({
          type: 'ADD_ATTACHMENT',
          payload: {
            taskId: parseInt(taskId),
            attachment: {
              ...result.data.attachment,
              uploadedAt: new Date()
            }
          }
        });
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        throw new Error('Неверный формат ответа сервера');
      }
    } catch (error) {
      console.error('Ошибка добавления вложения:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const removeAttachment = useCallback(async (taskId, attachmentId) => {
    // Не удалять файлы, если пользователь не аутентифицирован
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }

    try {
      const result = await websocketService.send('deleteFile', { taskId, attachmentId });

      if (result.success) {
        dispatch({
          type: 'REMOVE_ATTACHMENT',
          payload: { taskId, attachmentId }
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const setFilter = useCallback((filter) => {
    dispatch({
      type: 'SET_FILTER',
      payload: filter
    });
  }, []);

  // subscribe to server push updates
  useEffect(() => {
    const onTaskUpdated = (data) => {
      const { action, task, taskId, attachment, attachmentId } = data || {};
      switch (action) {
        case 'created':
          dispatch({ type: 'ADD_TASK', payload: task });
          break;
        case 'updated':
        case 'toggled':
          dispatch({ type: 'UPDATE_TASK', payload: task });
          break;
        case 'deleted':
          dispatch({ type: 'DELETE_TASK', payload: { id: task?.id ?? taskId } });
          break;
        case 'file_uploaded':
          dispatch({ type: 'ADD_ATTACHMENT', payload: { taskId, attachment } });
          break;
        case 'file_deleted':
          dispatch({ type: 'REMOVE_ATTACHMENT', payload: { taskId, attachmentId } });
          break;
        default:
          break;
      }
    };
    websocketService.on('task_updated', onTaskUpdated);
    return () => {
      websocketService.off('task_updated', onTaskUpdated);
    };
  }, []);

  const setSearchQuery = useCallback((query) => {
    dispatch({
      type: 'SET_SEARCH_QUERY',
      payload: query
    });
  }, []);

  // Вычисляемые значения
  const filteredTasks = state.tasks.filter(task => {
    // Фильтрация по статусу
    let statusMatch = true;
    if (state.filter === 'active') {
      statusMatch = !task.completed;
    } else if (state.filter === 'completed') {
      statusMatch = task.completed;
    }

    // Фильтрация по поисковому запросу
    let searchMatch = true;
    if (state.searchQuery.trim()) {
      searchMatch = task.title.toLowerCase().includes(state.searchQuery.toLowerCase());
    }

    return statusMatch && searchMatch;
  });

  const stats = {
    total: state.tasks.length,
    completed: state.tasks.filter(task => task.completed).length,
    active: state.tasks.filter(task => !task.completed).length
  };

  const value = {
    tasks: state.tasks,
    filteredTasks,
    filter: state.filter,
    searchQuery: state.searchQuery,
    loading: state.loading,
    error: state.error,
    stats,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addAttachment,
    removeAttachment,
    setFilter,
    setSearchQuery,
    loadTasks
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
