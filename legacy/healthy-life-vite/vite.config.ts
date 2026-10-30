import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const root = import.meta.dirname;

function workspaceRoutes(): Plugin {
  const rewrite = (request: { url?: string }, _response: unknown, next: () => void) => {
    const [pathname, query] = (request.url ?? '/').split('?');
    if (['/member', '/experts', '/admin', '/member/', '/experts/', '/admin/'].includes(pathname)) {
      request.url = `/app.html${query ? `?${query}` : ''}`;
    }
    next();
  };
  return {
    name: 'healthy-life-workspace-routes',
    configureServer(server) { server.middlewares.use(rewrite); },
    configurePreviewServer(server) { server.middlewares.use(rewrite); },
  };
}

export default defineConfig({
  plugins: [workspaceRoutes()],
  build: {
    rolldownOptions: {
      input: {
        home: resolve(root, 'index.html'),
        about: resolve(root, 'about.html'),
        notFound: resolve(root, '404.html'),
        app: resolve(root, 'app.html'),
      },
    },
  },
});
