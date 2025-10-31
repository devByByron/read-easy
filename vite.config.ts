import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to handle them during development
      '/api': {
        target: 'http://localhost:8080',
        configure: (proxy, options) => {
          // Handle API routes manually in development
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Custom plugin to handle API routes in development
    mode === 'development' && {
      name: 'api-routes',
      configureServer(server: any) {
        server.middlewares.use(async (req: any, res: any, next: any) => {
          if (req.url?.startsWith('/api/')) {
            try {
              const apiPath = req.url.replace('/api/', '');
              const handlerPath = path.resolve(__dirname, 'api', `${apiPath}.js`);
              
              // Dynamically import the API handler
              const { default: handler } = await import(handlerPath);
              
              // Parse request body for POST requests
              if (req.method === 'POST') {
                let body = '';
                req.on('data', (chunk: any) => {
                  body += chunk.toString();
                });
                req.on('end', () => {
                  req.body = JSON.parse(body);
                  
                  // Create a mock response object that works with our handler
                  const mockRes = {
                    status: (code: number) => {
                      res.statusCode = code;
                      return mockRes;
                    },
                    json: (data: any) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                    },
                  };
                  
                  handler(req, mockRes);
                });
              } else {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
              }
            } catch (error: any) {
              console.error('API route error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error?.message || 'Internal server error' }));
            }
          } else {
            next();
          }
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
  },
}));
