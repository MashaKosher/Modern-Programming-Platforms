const config = {
    server: {
        port: process.env.PORT || 3001,
        host: process.env.HOST || '0.0.0.0',
    },

    app: {
        name: process.env.APP_NAME || 'Todo App',
        version: process.env.APP_VERSION || '1.0.0'
    },


    viewEngine: {
        engine: process.env.VIEW_ENGINE || 'ejs',
        viewsPath: process.env.VIEWS_PATH || './src/views'
    },


    static: {
        path: process.env.STATIC_PATH || './public',
        options: {
            maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
        }
    },

    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: process.env.CORS_CREDENTIALS === 'true'
    },


    defaultTasks: [
        { id: 1, title: process.env.DEFAULT_TASK_1 || 'Изучить Node.js', completed: false, createdAt: new Date() },
        { id: 2, title: process.env.DEFAULT_TASK_2 || 'Создать веб-приложение', completed: true, createdAt: new Date() },
        { id: 3, title: process.env.DEFAULT_TASK_3 || 'Настроить EJS шаблоны', completed: false, createdAt: new Date() }
    ]
};

function getConfig() {
    return config;
}


module.exports = {
    getConfig
};
