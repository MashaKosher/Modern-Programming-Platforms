import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import GraphQLService from '../services/graphql';
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
      return { ...state, loading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false, error: null };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => task.id === action.payload.id ? { ...task, ...action.payload } : task)
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload.id) };
    case 'ADD_ATTACHMENT':
      return {
        ...state,
        tasks: state.tasks.map(task => task.id === action.payload.taskId ? {
          ...task,
          attachments: [...(task.attachments || []), action.payload.attachment]
        } : task),
        loading: false
      };
    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        tasks: state.tasks.map(task => task.id === action.payload.taskId ? {
          ...task,
          attachments: task.attachments.filter(att => att.id !== action.payload.attachmentId)
        } : task)
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    } else {
      dispatch({ type: 'SET_TASKS', payload: [] });
    }
  }, [isAuthenticated]);

  const loadTasks = async (retryCount = 0) => {
    if (!isAuthenticated) return;
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const list = await GraphQLService.getTasks();
      const tasksWithDates = list.map(task => ({
        ...task,
        createdAt: task.createdAt ? new Date(task.createdAt) : null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null
      }));
      dispatch({ type: 'SET_TASKS', payload: tasksWithDates });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addTask = useCallback(async (title, dueDate) => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const created = await GraphQLService.createTask(title, dueDate);
      const newTask = {
        ...created,
        createdAt: created.createdAt ? new Date(created.createdAt) : new Date(),
        dueDate: created.dueDate ? new Date(created.dueDate) : null
      };
      dispatch({ type: 'ADD_TASK', payload: newTask });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const updateTask = useCallback(async (id, updates) => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updated = await GraphQLService.updateTask(id, updates);
      const mapped = {
        ...updated,
        createdAt: updated.createdAt ? new Date(updated.createdAt) : null,
        dueDate: updated.dueDate ? new Date(updated.dueDate) : null
      };
      dispatch({ type: 'UPDATE_TASK', payload: mapped });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const toggleTask = useCallback(async (id) => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }
    try {
      const updated = await GraphQLService.toggleTask(id);
      const mapped = {
        ...updated,
        createdAt: updated.createdAt ? new Date(updated.createdAt) : null,
        dueDate: updated.dueDate ? new Date(updated.dueDate) : null
      };
      dispatch({ type: 'UPDATE_TASK', payload: mapped });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const deleteTask = useCallback(async (id) => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Требуется аутентификация. Войдите в систему' });
      return;
    }
    try {
      const ok = await GraphQLService.deleteTask(id);
      if (ok) dispatch({ type: 'DELETE_TASK', payload: { id } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  const addAttachment = useCallback(async () => {
    dispatch({ type: 'SET_ERROR', payload: 'Загрузка вложений через GraphQL не реализована' });
  }, []);

  const removeAttachment = useCallback(async () => {
    dispatch({ type: 'SET_ERROR', payload: 'Удаление вложений через GraphQL не реализовано' });
  }, []);

  const setFilter = useCallback((filter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const setSearchQuery = useCallback((query) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const filteredTasks = state.tasks.filter(task => {
    let statusMatch = true;
    if (state.filter === 'active') statusMatch = !task.completed;
    else if (state.filter === 'completed') statusMatch = task.completed;

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
