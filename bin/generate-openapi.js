#!/usr/bin/env node

/**
 * Generate OpenAPI spec file from JSDoc annotations.
 * Usage: node bin/generate-openapi.js
 */

const fs = require("node:fs");
const config = require("config");
const swaggerJsDoc = require("swagger-jsdoc");
const yaml = require("js-yaml");

const swaggerOptions = config.get("swagger.options");
const swaggerDocs = swaggerJsDoc(swaggerOptions);
const filePath = config.get("swagger.path");

fs.writeFileSync(filePath, yaml.dump(swaggerDocs));
console.log("OpenAPI spec written to %s", filePath);
