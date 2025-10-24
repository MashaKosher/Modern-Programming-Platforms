require('dotenv').config({ path: './config.env' });

const app = require('./app');
const { getConfig } = require('./config');
const { log } = require('./src/utils/helpers');


const config = getConfig();

function gracefulShutdown(signal) {
    log('info', `Получен сигнал ${signal}. Завершение работы сервера...`);
    
    server.close(() => {
        log('info', 'Сервер успешно завершил работу');
        process.exit(0);
    });


    setTimeout(() => {
        log('error', 'Принудительное завершение работы сервера');
        process.exit(1);
    }, 10000);
}


process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    log('error', 'Необработанное исключение:', error);
    process.exit(1);
});


process.on('unhandledRejection', (reason, promise) => {
    log('error', 'Необработанное отклонение промиса:', { reason, promise });
    process.exit(1);
});

const server = app.listen(config.server.port, config.server.host, () => {
    log('info', `${config.app.name} v${config.app.version}`);
    log('info', `Сервер запущен на порту ${config.server.port}`);
    log('info', `Локальный доступ: http://localhost:${config.server.port}`);
    log('info', `Сетевой доступ: http://${config.server.host}:${config.server.port}`);
    log('info', `CORS: разрешены запросы с ${config.cors.origin}`);
});

module.exports = server;
