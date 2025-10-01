// Тест API для вставки в консоль браузера
console.log('🔍 Тестирование API подключения...');

const API_BASE_URL = 'http://localhost:9000/v2';

async function testAPI() {
  try {
    console.log('📡 Отправляем запрос к:', `${API_BASE_URL}/tasks`);
    
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'include',
    });
    
    console.log('📊 Статус ответа:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Успешный ответ:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    console.error('🔍 Тип ошибки:', error.constructor.name);
    console.error('📝 Сообщение:', error.message);
    throw error;
  }
}

// Автоматический запуск
testAPI();

console.log('💡 Скопируйте и вставьте этот код в консоль браузера на странице http://localhost:5173');

