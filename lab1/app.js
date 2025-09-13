require('dotenv').config({ path: './config.env' });

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { getConfig } = require('./config');


const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/middleware/logger');


const config = getConfig();
const app = express();


app.set('view engine', config.viewEngine.engine);
app.set('views', path.join(__dirname, config.viewEngine.viewsPath));


app.use(logger);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, config.static.path), config.static.options));


app.use('/', routes);


app.use(errorHandler);


module.exports = app;
