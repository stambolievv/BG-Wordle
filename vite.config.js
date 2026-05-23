import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { createHtmlPlugin } from 'vite-plugin-html';
import viteBanner from 'vite-plugin-banner';
import pkg from './package.json';

const banner = `
/**
 * @name ${pkg.name}
 * @description ${pkg.description}
 *
 * @version ${pkg.version}
 * @author ${pkg.author}
 * @license ${pkg.license}
 */
`.trim();

/**
 * Deploying to `https://<USERNAME>.github.io/`, or to a custom domain through GitHub Pages (eg. www.example.com),
 * set `base` to `'/'`. Alternatively, remove `base` from the configuration, as it defaults to `'/'`.
 *
 * Deploying to `https://<USERNAME>.github.io/<REPO>/` (eg. repository is at `https://github.com/<USERNAME>/<REPO>`),
 * then set `base` to `'/<REPO>/'`.
 * @see https://vite.dev/guide/static-deploy.html#github-pages
 */
process.env.BASE_URL = process.env.BRANCH === 'gh-pages' ? '/BG-Wordle/' : '/'; // The name of the Github repository

export default defineConfig({
  base: process.env.BASE_URL,
  server: {
    open: true,
    host: true,
  },
  build: {
    assetsInlineLimit: 0,
    minify: 'terser',
    rollupOptions: {
      output: {
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js',
        assetFileNames: ({ originalFileNames: [path], names: [name] }) => {
          const isCSS = name?.endsWith('.css');
          const isFromHTML = path?.endsWith('.html');

          if (isCSS && isFromHTML) {
            return 'assets/styles/style.css';
          }

          if (path) return path;
          return '[name][extname]';
        }
      }
    }
  },
  plugins: [
    viteBanner({ content: banner }),
    viteStaticCopy({ targets: [{ src: 'assets/images', dest: './assets', overwrite: false }] }),
    createHtmlPlugin({ minify: true, inject: { data: { BASE_URL: process.env.BASE_URL } } }),
  ]
});
