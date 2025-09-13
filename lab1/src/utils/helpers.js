function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (Object.keys(data).length > 0) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
}

module.exports = {
    log
};
