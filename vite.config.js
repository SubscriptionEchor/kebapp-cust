import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['29ab-183-82-97-213.ngrok-free.app']
  },
  
  plugins: [react()],
  json: {
    namedExports: true,
    stringify: true
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.ts', '.tsx']
  }
})



// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'
//
// export default defineConfig({
//   plugins: [react()],
//   json: {
//     namedExports: true,
//     stringify: true
//   },
//   resolve: {
//     extensions: ['.json', '.js', '.jsx', '.ts', '.tsx']
//   },
//   // Add these for debugging
//   server: {
//     // This server config (and its middleware) is used only during development.
//     // It will not be bundled into your production build.
//     configureServer(server) {
//       server.middlewares.use((req, res, next) => {
//         // Set custom cache headers for asset files in dev
//         if (req.url.match(/^\/(src\/)?assets\/.*\.(svg|gif|png|json)$/)) {
//           res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
//         }
//         next();
//       });
//     },
//     port: 5173,
//     host: true
//   },
//   build: {
//     sourcemap: true
//   }
// })