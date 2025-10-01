// Утилиты для работы с датами
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ru-RU');
};

export const isToday = (date) => {
  const today = new Date();
  const compareDate = new Date(date);
  return compareDate.toDateString() === today.toDateString();
};

export const isTomorrow = (date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const compareDate = new Date(date);
  return compareDate.toDateString() === tomorrow.toDateString();
};

export const isOverdue = (date, isCompleted = false) => {
  if (isCompleted) return false;
  const today = new Date();
  const compareDate = new Date(date);
  return compareDate < today;
};

export const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// Утилиты для работы с файлами
export const getFileIcon = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'fas fa-image';
  if (mimetype === 'application/pdf') return 'fas fa-file-pdf';
  if (mimetype.includes('word')) return 'fas fa-file-word';
  if (mimetype.includes('excel')) return 'fas fa-file-excel';
  if (mimetype.includes('zip') || mimetype.includes('rar')) return 'fas fa-file-archive';
  if (mimetype.includes('text')) return 'fas fa-file-alt';
  return 'fas fa-file';
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFileSize = (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const getAcceptedFileTypes = () => {
  return 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar';
};

// Утилиты для валидации
export const validateTaskTitle = (title) => {
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: 'Название задачи обязательно' };
  }
  
  if (title.trim().length === 0) {
    return { isValid: false, error: 'Название задачи не может быть пустым' };
  }
  
  if (title.length > 255) {
    return { isValid: false, error: 'Название задачи не может быть длиннее 255 символов' };
  }
  
  return { isValid: true };
};

export const validateDueDate = (dateString) => {
  if (!dateString) return { isValid: true }; // Дата необязательна
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Неверный формат даты' };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  
  if (dueDate < today) {
    return { isValid: false, error: 'Дата завершения не может быть раньше сегодняшнего дня' };
  }
  
  return { isValid: true };
};

// Утилиты для анимаций
export const animateTaskAppearance = (element, delay = 0) => {
  if (!element) return;
  
  element.style.opacity = '0';
  element.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    element.style.transition = 'all 0.5s ease';
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  }, delay);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Утилиты для работы с задачами
export const getTaskStatusClass = (task) => {
  if (task.completed) return 'completed';
  if (task.dueDate && isOverdue(task.dueDate, task.completed)) return 'overdue';
  if (task.dueDate && isToday(task.dueDate)) return 'due-today';
  if (task.dueDate && isTomorrow(task.dueDate)) return 'due-tomorrow';
  return '';
};

export const getDueDateText = (dueDate, isCompleted = false) => {
  if (!dueDate || isCompleted) return null;
  
  if (isOverdue(dueDate)) {
    return { class: 'overdue', text: `Просрочено: ${formatDate(dueDate)}` };
  }
  
  if (isToday(dueDate)) {
    return { class: 'today', text: 'Сегодня' };
  }
  
  if (isTomorrow(dueDate)) {
    return { class: 'tomorrow', text: 'Завтра' };
  }
  
  return { class: '', text: `До: ${formatDate(dueDate)}` };
};

export const sortTasks = (tasks, sortBy = 'createdAt', sortOrder = 'desc') => {
  return [...tasks].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Для дат преобразуем в timestamp
    if (sortBy === 'createdAt' || sortBy === 'dueDate') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const filterTasks = (tasks, filter, searchQuery = '') => {
  return tasks.filter(task => {
    // Фильтрация по статусу
    let statusMatch = true;
    if (filter === 'active') {
      statusMatch = !task.completed;
    } else if (filter === 'completed') {
      statusMatch = task.completed;
    }
    
    // Фильтрация по поисковому запросу
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchMatch = task.title.toLowerCase().includes(query);
    }
    
    return statusMatch && searchMatch;
  });
};

// Константы
export const FILTER_TYPES = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

export const SORT_TYPES = {
  CREATED_AT: 'createdAt',
  DUE_DATE: 'dueDate',
  TITLE: 'title',
  COMPLETED: 'completed'
};

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
};
