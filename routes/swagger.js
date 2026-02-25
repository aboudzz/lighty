const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const config = require('config');

// Swagger setup
const swaggerOptions = config.get('swagger.options');
const swaggerDocs = swaggerJsDoc(swaggerOptions);

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocs));

module.exports = router;
