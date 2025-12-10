// API сервис для загрузки файлов через REST API
// Используется только для операций с файлами, остальное через GraphQL

const API_BASE_URL = 'http://localhost:3001/v2';

// Функция для получения заголовков с аутентификацией
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Требуется аутентификация. Войдите в систему');
  }
  return {
    'Authorization': `Bearer ${token}`
  };
}

class ApiService {
  // Загрузка файла к задаче
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
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

      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        throw new Error('Сервер недоступен. Проверьте, что сервер запущен на http://localhost:3001');
      }

      throw error;
    }
  }

  // Скачивание файла
  async downloadFile(taskId, attachmentId) {
    try {
      const token = localStorage.getItem('authToken');
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

  // Удаление файла
  async deleteFile(taskId, attachmentId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/files/${attachmentId}`, {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);

      if (error.name === 'AbortError') {
        throw new Error('Таймаут запроса. Сервер не отвечает');
      }

      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        throw new Error('Сервер недоступен. Проверьте, что сервер запущен на http://localhost:3001');
      }

      throw error;
    }
  }
}

export default new ApiService();

