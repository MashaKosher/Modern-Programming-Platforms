const logger = (req, res, next) => {
    const start = Date.now();
    
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
    
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = logger;
