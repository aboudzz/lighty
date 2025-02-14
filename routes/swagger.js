const fs = require('fs');
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
    apis: ['./swagger/*.yml', './routes/*.js', './models/*.js'],
}
const swaggerDocs = swaggerJsDoc(swaggerOptions);
fs.writeFileSync('./lighty-openapi.yml', JSON.stringify(swaggerDocs));

router.use('/', swaggerUi.serve);

router.get('/', swaggerUi.setup(swaggerDocs));

module.exports = router;
