const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../../config/config');

// Создаем папку uploads если её нет
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранения файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const cleanName = name.replace(/[^a-zA-Z0-9а-яёА-ЯЁ]/g, '_');
        cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
    }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
    // Проверяем MIME тип
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Неподдерживаемый тип файла'), false);
    }
};

// Создаем multer instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: 1 // максимум 1 файл за раз
    },
    fileFilter: fileFilter
});

// Middleware для обработки ошибок multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let message = 'Ошибка загрузки файла';
        
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = `Файл слишком большой. Максимальный размер: ${Math.round(config.upload.maxFileSize / 1024 / 1024)}MB`;
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Слишком много файлов';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Неожиданное поле файла';
                break;
            default:
                message = err.message;
        }
        
        return res.status(400).json({
            success: false,
            message: message,
            error: err.code
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Ошибка загрузки файла'
        });
    }
    
    next();
};

// Утилиты для работы с файлами
const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'fas fa-image';
    if (mimetype === 'application/pdf') return 'fas fa-file-pdf';
    if (mimetype.includes('word')) return 'fas fa-file-word';
    if (mimetype.includes('excel')) return 'fas fa-file-excel';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return 'fas fa-file-archive';
    if (mimetype.includes('text')) return 'fas fa-file-alt';
    return 'fas fa-file';
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Middleware для проверки существования файла
const checkFileExists = (req, res, next) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'Файл не найден'
        });
    }
    
    req.filePath = filePath;
    next();
};

// Middleware для безопасной загрузки файлов
const secureUpload = (req, res, next) => {
    // Дополнительные проверки безопасности
    if (req.file) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
        
        if (dangerousExtensions.includes(ext)) {
            // Удаляем загруженный файл
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Загрузка исполняемых файлов запрещена'
            });
        }
    }
    
    next();
};

module.exports = {
    upload,
    handleMulterError,
    getFileIcon,
    formatFileSize,
    checkFileExists,
    secureUpload
};
