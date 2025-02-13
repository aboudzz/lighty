const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// Swagger setup
const swaggerOptions = {
    failOnErrors: true,
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'lighty',
            version: '0.0.1',
            description: 'lighty RESTful Stateless API boilerplate documentation',
        },
    },
    apis: ['./routes/*.js'],
}
const swaggerDocs = swaggerJsDoc(swaggerOptions);

router.use('/', swaggerUi.serve);

router.get('/', swaggerUi.setup(swaggerDocs));

module.exports = router;
