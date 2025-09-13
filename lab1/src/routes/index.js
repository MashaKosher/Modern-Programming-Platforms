const express = require('express');
const taskRoutes = require('./taskRoutes');

const router = express.Router();

router.use('/', taskRoutes);

router.use('*', (req, res) => {
    res.status(404).render('pages/error', {
        message: 'Страница не найдена',
        error: {
            status: 404,
            stack: `Запрашиваемый URL: ${req.originalUrl}`
        }
    });
});

module.exports = router;
