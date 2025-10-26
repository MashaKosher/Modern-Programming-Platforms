# Todo API Server

REST API сервер для React Todo приложения (lab2) с префиксом маршрутов `/v2`.

## Возможности

- CRUD операции с задачами
- Поиск и фильтрация задач
- Загрузка и управление файлами
- Статистика по задачам
- Rate limiting и безопасность
- Валидация данных
- Обработка ошибок
- CORS поддержка
- Graceful shutdown

## Технологии

- **Node.js** - среда выполнения
- **Express.js** - веб-фреймворк
- **Multer** - загрузка файлов
- **Helmet** - безопасность
- **Morgan** - логирование
- **CORS** - кросс-доменные запросы

## Установка и запуск

```bash
# Перейти в папку сервера
cd server

# Установить зависимости
npm install

# Создать файл окружения (скопировать из .env.example)
cp .env.example .env

# Запуск в режиме разработки
npm run dev

# Запуск в продакшене
npm start
```

## Настройка

Создайте файл `.env` в корне папки server:

```env
# Настройки сервера
PORT=3001
NODE_ENV=development

# Настройки приложения
APP_NAME=Todo API Server
APP_VERSION=1.0.0
API_PREFIX=/v2

# Настройки CORS
CORS_ORIGIN=http://localhost:5173

# Настройки файлов
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Настройки безопасности
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Базовые маршруты

```
GET  /                    # Информация о сервере
GET  /v2                  # Информация об API
GET  /v2/health           # Проверка здоровья сервера
```

### Задачи

```
GET    /v2/tasks                    # Получить все задачи
GET    /v2/tasks/:id                # Получить задачу по ID
POST   /v2/tasks                    # Создать новую задачу
PUT    /v2/tasks/:id                # Обновить задачу
PATCH  /v2/tasks/:id/toggle         # Переключить статус задачи
DELETE /v2/tasks/:id                # Удалить задачу
```

### Специальные маршруты

```
GET  /v2/tasks/stats                # Получить статистику
GET  /v2/tasks/search?q=query       # Поиск задач
GET  /v2/tasks/status/:status       # Задачи по статусу (active/completed)
GET  /v2/tasks/due-soon?days=3      # Задачи с истекающим сроком
GET  /v2/tasks/overdue              # Просроченные задачи
```

### Файлы

```
POST   /v2/tasks/:id/upload                    # Загрузить файл к задаче
GET    /v2/tasks/:id/files/:attachmentId/download  # Скачать файл
DELETE /v2/tasks/:id/files/:attachmentId       # Удалить файл
```

## Примеры запросов

### Создание задачи

```bash
curl -X POST http://localhost:3001/v2/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Новая задача",
    "dueDate": "2024-12-31"
  }'
```

### Получение всех задач

```bash
curl http://localhost:3001/v2/tasks
```

### Поиск задач

```bash
curl "http://localhost:3001/v2/tasks/search?q=важная"
```

### Загрузка файла

```bash
curl -X POST http://localhost:3001/v2/tasks/1/upload \
  -F "file=@document.pdf"
```

## Структура ответов

### Успешный ответ

```json
{
  "success": true,
  "data": {
    // данные
  },
  "message": "Операция выполнена успешно"
}
```

### Ошибка

```json
{
  "success": false,
  "message": "Описание ошибки",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/v2/tasks",
  "method": "POST"
}
```

## Структура проекта

```
server/
├── config/
│   └── config.js           # Конфигурация приложения
├── src/
│   ├── controllers/        # Контроллеры
│   │   └── TaskController.js
│   ├── middleware/         # Middleware
│   │   ├── errorHandler.js
│   │   ├── security.js
│   │   └── upload.js
│   ├── models/            # Модели данных
│   │   └── Task.js
│   ├── routes/            # Маршруты
│   │   ├── index.js
│   │   └── taskRoutes.js
│   ├── services/          # Бизнес-логика
│   │   └── TaskService.js
│   └── utils/             # Утилиты
├── uploads/               # Загруженные файлы
├── data/                  # Данные (JSON файлы)
├── logs/                  # Логи
├── server.js              # Точка входа
├── package.json           # Зависимости
└── README.md              # Документация
```

## Безопасность

- **Rate Limiting** - ограничение количества запросов
- **CORS** - контроль кросс-доменных запросов
- **Helmet** - установка заголовков безопасности
- **Валидация** - проверка входящих данных
- **Санитизация** - очистка от вредоносного кода
- **Ограничение размера файлов** - максимум 5MB
- **Фильтрация типов файлов** - только разрешенные форматы

## Мониторинг

### Проверка здоровья сервера

```bash
curl http://localhost:3001/v2/health
```

### Логирование

Сервер логирует:
- Все HTTP запросы
- Ошибки приложения
- Подозрительную активность
- Операции с файлами

## Интеграция с React приложением

1. Обновите файл `lab2/src/services/api.js`
2. Измените `API_BASE_URL` на `http://localhost:3001`
3. Раскомментируйте реальные API вызовы
4. Добавьте обработку ошибок и loading состояний

### Пример интеграции

```javascript
// lab2/src/services/api.js
const API_BASE_URL = 'http://localhost:3001/v2';

async getTasks() {
  const response = await fetch(`${API_BASE_URL}/tasks`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message);
  }
  
  return result.data;
}
```

## Разработка

### Добавление новых маршрутов

1. Создайте новый контроллер в `src/controllers/`
2. Добавьте маршруты в `src/routes/`
3. Подключите в `src/routes/index.js`

### Добавление middleware

1. Создайте middleware в `src/middleware/`
2. Подключите в `server.js` или конкретных маршрутах

## Производительность

- Сжатие ответов (gzip)
- Кэширование статических файлов
- Rate limiting для предотвращения злоупотреблений
- Graceful shutdown для корректного завершения

## Лицензия

MIT


## База данных SQLite

Приложение использует SQLite для постоянного хранения данных.

### Структура базы данных:

**Таблица tasks:**
- id (INTEGER PRIMARY KEY)
- title (TEXT NOT NULL)
- completed (BOOLEAN DEFAULT 0)
- createdAt (DATETIME DEFAULT CURRENT_TIMESTAMP)
- dueDate (DATETIME)
- updatedAt (DATETIME DEFAULT CURRENT_TIMESTAMP)

**Таблица attachments:**
- id (INTEGER PRIMARY KEY)
- taskId (INTEGER, FOREIGN KEY)
- filename (TEXT NOT NULL)
- originalName (TEXT NOT NULL)
- mimetype (TEXT NOT NULL)
- size (INTEGER NOT NULL)
- uploadedAt (DATETIME DEFAULT CURRENT_TIMESTAMP)

### Просмотр базы данных:

```bash
node view-db.js
```

### Расположение базы данных:

`data/tasks.db`

Файл базы данных создается автоматически при первом запуске сервера.

