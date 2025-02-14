const fs = require('fs');
const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const yaml = require('js-yaml');
const config = require('config');

// Swagger setup
const swaggerOptions = config.get('swagger.options');
const swaggerDocs = swaggerJsDoc(swaggerOptions);

const generate = config.get('swagger.generate');
if (generate) {
    const path = config.get('swagger.path');
    fs.writeFileSync(path, yaml.dump(swaggerDocs));
}

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocs));

module.exports = router;
