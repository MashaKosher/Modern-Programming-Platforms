const errorHandler = (err, req, res, next) => {
    console.error('Ошибка:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Ошибка валидации данных',
            errors: err.errors
        });
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Неверный формат JSON'
        });
    }

    if (err.status === 404) {
        return res.status(404).render('pages/error', {
            message: 'Страница не найдена',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }

    res.status(err.status || 500).render('pages/error', {
        message: 'Внутренняя ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
};

module.exports = errorHandler;
