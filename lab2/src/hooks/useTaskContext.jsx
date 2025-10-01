import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import ApiService from '../services/api';

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

  // Загрузить задачи при инициализации
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async (retryCount = 0) => {
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
      
      const result = await ApiService.getTasks();
      
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
      
      // Повторить попытку до 3 раз
      if (retryCount < 3) {
        setTimeout(() => {
          loadTasks(retryCount + 1);
        }, 1000);
      } else {
        dispatch({ type: 'SET_ERROR', payload: `Не удалось подключиться к серверу. Проверьте, что сервер запущен на http://localhost:3001` });
      }
    }
  };

  const addTask = useCallback(async (title, dueDate) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await ApiService.createTask(title, dueDate);
      
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
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await ApiService.updateTask(id, updates);
      
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
  }, []);

  const toggleTask = useCallback(async (id) => {
    try {
      const result = await ApiService.toggleTask(id);
      
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
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      const result = await ApiService.deleteTask(id);
      
      if (result.success) {
        dispatch({ type: 'DELETE_TASK', payload: { id } });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const addAttachment = useCallback(async (taskId, file) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await ApiService.uploadFile(taskId, file);
      
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
  }, []);

  const removeAttachment = useCallback(async (taskId, attachmentId) => {
    try {
      const result = await ApiService.deleteFile(taskId, attachmentId);
      
      if (result.success) {
        dispatch({
          type: 'REMOVE_ATTACHMENT',
          payload: { taskId, attachmentId }
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const setFilter = useCallback((filter) => {
    dispatch({
      type: 'SET_FILTER',
      payload: filter
    });
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
