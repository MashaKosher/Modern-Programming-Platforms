// Тест истечения JWT токена
console.log('🧪 Тестирование истечения JWT токена...\n');

const jwt = require('jsonwebtoken');
const secret = 'your-secret-key-change-in-production';

console.log('1️⃣ Создаем токен с истечением через 3 секунды...');
const shortToken = jwt.sign({ userId: 2 }, secret, { expiresIn: '3s' });
console.log('Токен:', shortToken.substring(0, 80) + '...');

console.log('\n2️⃣ Декодируем токен (без верификации):');
console.log(JSON.stringify(jwt.decode(shortToken), null, 2));

console.log('\n3️⃣ Верифицируем токен сразу:');
try {
    const decoded = jwt.verify(shortToken, secret);
    console.log('✅ Токен валиден:', decoded);
} catch (error) {
    console.log('❌ Токен истек:', error.message);
}

console.log('\n4️⃣ Ждем 4 секунды и проверяем снова...');
setTimeout(() => {
    try {
        const decoded = jwt.verify(shortToken, secret);
        console.log('✅ Токен все еще валиден:', decoded);
    } catch (error) {
        console.log('❌ Токен истек:', error.message);
        console.log('   Это именно то, что происходит в вашем приложении!');
    }
}, 4000);

console.log('\n📝 Что происходит в реальном приложении:');
console.log('   - Пользователь входит в систему');
console.log('   - Получает токен на 7 дней');
console.log('   - Через 7 дней при попытке выполнить действие:');
console.log('     1. middleware/auth.js -> jwt.verify() -> ошибка');
console.log('     2. Сервер возвращает 401 "Неверный токен"');
console.log('     3. API service -> ловит 401 -> бросает ошибку');
console.log('     4. useAuthContext -> ловит ошибку -> вызывает logout()');
console.log('     5. Пользователь разлогинивается и перенаправляется на форму входа');
