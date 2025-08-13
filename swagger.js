// swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PU Smart Tracker App API',
            version: '1.0.0',
            description: 'API documentation for PU Smart App (Student Portal)',
        },
        servers: [
            {
                url: 'http://localhost:8000',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        path.join(__dirname, 'routes/*.js'),  // ✅ Correct absolute path
        path.join(__dirname, 'docs/*.yaml'),
    ],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
