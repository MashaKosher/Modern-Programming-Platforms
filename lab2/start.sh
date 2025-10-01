#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' 

echo -e "${BLUE}Запуск Todo приложения...${NC}"

cleanup() {
    echo -e "\n${RED}Завершение работы...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

if [ ! -f "package.json" ] || [ ! -d "server" ]; then
    echo -e "${RED}Ошибка: Запустите скрипт из папки lab2${NC}"
    exit 1
fi

echo -e "${BLUE}Проверка зависимостей сервера...${NC}"
cd server
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Установка зависимостей сервера...${NC}"
    npm install
fi

echo -e "${GREEN}Запуск сервера на порту 9000...${NC}"
npm run dev > server.log 2>&1 &
SERVER_PID=$!

echo -e "${BLUE}Ожидание запуска сервера...${NC}"
WAIT_TIME=0
MAX_WAIT=30

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${RED}Ошибка запуска сервера. Проверьте server.log${NC}"
        exit 1
    fi
    
    if curl -s http://localhost:9000/v2/ > /dev/null 2>&1; then
        echo -e "${GREEN}Сервер успешно запущен и готов к работе (PID: $SERVER_PID)${NC}"
        break
    fi
    
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
    echo -n "."
done

if [ $WAIT_TIME -eq $MAX_WAIT ]; then
    echo -e "\n${RED}Таймаут ожидания запуска сервера. Проверьте server.log${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi


cd ..


echo -e "${BLUE}Проверка зависимостей фронтенда...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Установка зависимостей фронтенда...${NC}"
    npm install
fi

echo -e "${BLUE}Дополнительная пауза для стабилизации сервера...${NC}"
sleep 2

echo -e "${GREEN}Запуск фронтенда...${NC}"
echo -e "${BLUE}Сервер: http://localhost:9000/v2${NC}"
echo -e "${BLUE}Фронтенд: http://localhost:5173${NC}"
echo -e "${BLUE}Логи сервера: server/server.log${NC}"
echo -e "${BLUE}Для остановки нажмите Ctrl+C${NC}"

npm run dev

cleanup
