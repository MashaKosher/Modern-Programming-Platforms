#!/bin/bash

echo "🔍 Проверка статуса приложения..."
echo ""

# Проверка сервера
echo "📡 Проверка сервера (порт 9000):"
if curl -s http://localhost:9000/v2/ > /dev/null; then
    echo "✅ Сервер работает"
    echo "📊 API ответ:"
    curl -s http://localhost:9000/v2/tasks | head -100
else
    echo "❌ Сервер недоступен"
fi

echo ""
echo ""

# Проверка фронтенда
echo "🌐 Проверка фронтенда (порт 5173):"
if curl -s -I http://localhost:5173 > /dev/null; then
    echo "✅ Фронтенд работает"
else
    echo "❌ Фронтенд недоступен"
fi

echo ""
echo ""

# Проверка процессов
echo "🔧 Запущенные процессы:"
ps aux | grep -E "(node.*server|vite)" | grep -v grep | head -5

echo ""
echo ""

# Проверка портов
echo "🔌 Занятые порты:"
echo "Порт 9000 (сервер):"
lsof -i :9000 | head -2
echo "Порт 5173 (фронтенд):"
lsof -i :5173 | head -2

echo ""
echo "🚀 Для запуска приложения выполните: ./start.sh"
echo "🌐 Откройте в браузере: http://localhost:5173"

