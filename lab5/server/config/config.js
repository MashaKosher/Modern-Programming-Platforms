require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  app: {
    name: process.env.APP_NAME || 'Todo API Server',
    version: process.env.APP_VERSION || '1.0.0',
    apiPrefix: process.env.API_PREFIX || '/v2'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*', // Разрешить все домены по умолчанию
    credentials: true
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ]
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  isDevelopment: () => config.nodeEnv === 'development',
  isProduction: () => config.nodeEnv === 'production'
};

module.exports = config;
