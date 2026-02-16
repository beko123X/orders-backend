import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Order Management System API",
      version: "1.0.0",
      description: "API documentation for Orders, Products, Payments, and Auth",
    },
    servers: [
      { url: "http://localhost:5000", description: "Local server" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"], // ملفات routes وschemas
};

export default swaggerJSDoc(options);

