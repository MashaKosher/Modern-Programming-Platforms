const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads');
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Неподдерживаемый тип файла'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB максимум
        files: 5 // Максимум 5 файлов за раз
    }
});

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Файл слишком большой. Максимальный размер: 5MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Слишком много файлов. Максимум: 5 файлов'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Неожиданное поле файла'
            });
        }
    }
    
    if (err.message === 'Неподдерживаемый тип файла') {
        return res.status(400).json({
            success: false,
            message: 'Неподдерживаемый тип файла. Разрешены: изображения, PDF, документы, архивы'
        });
    }
    
    next(err);
};

const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'fas fa-image';
    if (mimetype === 'application/pdf') return 'fas fa-file-pdf';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'fas fa-file-word';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'fas fa-file-excel';
    if (mimetype.includes('zip')) return 'fas fa-file-archive';
    if (mimetype.startsWith('text/')) return 'fas fa-file-alt';
    return 'fas fa-file';
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
    upload,
    handleMulterError,
    getFileIcon,
    formatFileSize
};
