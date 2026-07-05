import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerPath = path.resolve(__dirname, '../config/swagger.json');

class DocsController {
  /**
   * GET /api/docs
   * Renders the Swagger UI web page referencing the CDN libraries
   */
  serveUI(req, res) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Gatekeeper Auth - API Documentation</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
        <style>
          html { box-sizing: border-box; overflow: -y-scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin: 0; background: #fafafa; }
          .swagger-ui .topbar { display: none; } /* Hide the default topbar */
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"> </script>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"> </script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              url: "/api/docs/json",
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: "BaseLayout"
            });
            window.ui = ui;
          };
        </script>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  /**
   * GET /api/docs/json
   * Serves the static swagger.json file
   */
  serveJSON(req, res, next) {
    try {
      if (!fs.existsSync(swaggerPath)) {
        return res.status(404).json({
          success: false,
          message: 'Swagger JSON specification file not found.',
        });
      }
      const fileContent = fs.readFileSync(swaggerPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(fileContent);
    } catch (error) {
      next(error);
    }
  }
}

export default new DocsController();
