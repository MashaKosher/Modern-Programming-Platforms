// API сервис для подключения к серверу из папки server
// Сервер запущен на порту 3001 с префиксом /v2

const API_BASE_URL = 'http://localhost:3001/v2'; // URL нашего API сервера

// Импорт сервиса аутентификации
import AuthService from './auth';

// Функция для получения заголовков с аутентификацией
function getAuthHeaders() {
  return AuthService.getAuthHeaders();
}

class ApiService {
  // Задачи
  async getTasks() {
    try {
      console.log('Запрос к серверу:', `${API_BASE_URL}/tasks`);

      // Создаем контроллер для отмены запроса по таймауту
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: getAuthHeaders(),
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется аутентификация. Войдите в систему');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Ответ сервера получен успешно, задач:', result.data?.tasks?.length || 0);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Ошибка при получении задач:', error);

      // Подробная диагностика ошибки
      if (error.name === 'AbortError') {
        throw new Error('Таймаут запроса. Сервер не отвечает');
      }

      if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NS_ERROR_NET_RESET')) {
        throw new Error('Сервер недоступен. Проверьте, что сервер запущен на http://localhost:3001');
      }

      if (error.message.includes('CORS')) {
        throw new Error('Ошибка CORS. Проверьте настройки сервера');
      }

      throw error;
    }
  }

  async createTask(title, dueDate) {
    try {
      console.log('Создание задачи:', { title, dueDate });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
        body: JSON.stringify({ title, dueDate })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется аутентификация. Войдите в систему');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Задача создана:', result);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при создании задачи:', error);

      if (error.name === 'AbortError') {
        throw new Error('Таймаут запроса. Сервер не отвечает');
      }

      if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NS_ERROR_NET_RESET')) {
        throw new Error('Сервер недоступен. Проверьте, что сервер запущен на http://localhost:3001');
      }

      throw error;
    }
  }

  async updateTask(id, updates) {
    try {
      console.log('Обновление задачи:', { id, updates });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
        body: JSON.stringify(updates)
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется аутентификация. Войдите в систему');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Задача обновлена:', result);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error);

      if (error.name === 'AbortError') {
        throw new Error('Таймаут запроса. Сервер не отвечает');
      }

      if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NS_ERROR_NET_RESET')) {
        throw new Error('Сервер недоступен. Проверьте, что сервер запущен на http://localhost:3001');
      }

      throw error;
    }
  }

  async toggleTask(id) {
    try {
      console.log('Переключение статуса задачи:', id);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/tasks/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется аутентификация. Войдите в систему');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Статус задачи изменен:', result);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при переключении статуса задачи:', error);

      if (error.name === 'AbortError') {
        throw new Error('Таймаут запроса. Сервер не отвечает');
      }

      if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NS_ERROR_NET_RESET')) {
        throw new Error('Сервер недоступен. Проверьте, что сервер запущен на http://localhost:3001');
      }

      throw error;
    }
  }

  async deleteTask(id) {
    try {
      console.log('Удаление задачи:', id);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется аутентификация. Войдите в систему');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Задача удалена:', result);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);

      if (error.name === 'AbortError') {
        throw new Error('Таймаут запроса. Сервер не отвечает');
      }

      if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NS_ERROR_NET_RESET')) {
        throw new Error('Сервер недоступен. Проверьте, что сервер запущен на http://localhost:3001');
      }

      throw error;
    }
  }

  // Файлы
  async uploadFile(taskId, file) {
    try {
      console.log('Загрузка файла:', { taskId, fileName: file.name, fileSize: file.size });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд для загрузки файлов

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
        body: formData
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется аутентификация. Войдите в систему');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Файл загружен:', result);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);

      if (error.name === 'AbortError') {
        throw new Error('Таймаут загрузки файла');
      }

      if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NS_ERROR_NET_RESET')) {
        throw new Error('Сервер недоступен. Проверьте, что сервер запущен на http://localhost:3001');
      }

      throw error;
    }
  }

  async downloadFile(taskId, attachmentId) {
    try {
      // Для скачивания файлов добавляем токен в URL
      const token = AuthService.getToken();
      const url = token
        ? `${API_BASE_URL}/tasks/${taskId}/files/${attachmentId}/download?token=${token}`
        : `${API_BASE_URL}/tasks/${taskId}/files/${attachmentId}/download`;

      window.open(url, '_blank');
      return { success: true };
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      throw error;
    }
  }

  async deleteFile(taskId, attachmentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/files/${attachmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется аутентификация. Войдите в систему');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
      throw error;
    }
  }

  // Статистика
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/stats`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется аутентификация. Войдите в систему');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при получении статистики:', error);
      throw error;
    }
  }

  // Поиск
  async searchTasks(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/search?q=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется аутентификация. Войдите в систему');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при поиске задач:', error);
      throw error;
    }
  }
}

export default new ApiService();

