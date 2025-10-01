#!/bin/bash

echo "🗄️ Проверка SQLite интеграции..."
echo ""

# Проверка файла базы данных
if [ -f "server/data/tasks.db" ]; then
    echo "✅ База данных SQLite найдена"
    echo "📍 Расположение: server/data/tasks.db"
    echo "📊 Размер: $(du -h server/data/tasks.db | cut -f1)"
else
    echo "❌ База данных SQLite не найдена"
fi

echo ""

# Проверка API с данными из SQLite
echo "🔍 Проверка API с SQLite данными:"
if curl -s http://localhost:9000/v2/tasks > /dev/null; then
    echo "✅ API работает"
    
    # Получить статистику
    STATS=$(curl -s http://localhost:9000/v2/tasks | jq -r '.data.stats | "Всего: \(.total), Выполнено: \(.completed), Активных: \(.active), Просрочено: \(.overdue)"')
    echo "📊 Статистика: $STATS"
    
    # Получить количество задач
    TASK_COUNT=$(curl -s http://localhost:9000/v2/tasks | jq '.data.tasks | length')
    echo "📋 Задач в базе: $TASK_COUNT"
else
    echo "❌ API недоступен"
fi

echo ""

# Проверка фронтенда
echo "🌐 Проверка фронтенда:"
if curl -s -I http://localhost:5173 > /dev/null; then
    echo "✅ Фронтенд работает: http://localhost:5173"
else
    echo "❌ Фронтенд недоступен"
fi

echo ""
echo "🚀 Для просмотра базы данных: cd server && node view-db.js"
echo "🌐 Откройте приложение: http://localhost:5173"
