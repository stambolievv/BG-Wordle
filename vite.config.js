import fs from 'node:fs';
import path from 'node:path';
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
    injectBaseUrl(),
  ]
});

/**
 * Replaces `<%- BASE_URL %>` (and `<%= %>` / whitespace variants) in copied
 * text assets after the static-copy step. Binary files are skipped.
 * @returns {import('vite').PluginOption}
 */
function injectBaseUrl() {
  let outDir;

  return {
    name: 'inject-base-url',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const pattern = /<%[-=]?\s*BASE_URL\s*%>/g;

      const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            walk(full);
            continue;
          }

          const buf = fs.readFileSync(full);
          if (buf.includes(0)) continue; // null byte = binary, skip

          const text = buf.toString('utf-8');
          const replaced = text.replace(pattern, process.env.BASE_URL);
          if (replaced !== text) fs.writeFileSync(full, replaced);
        }
      };

      walk(outDir);
    },
  };
}
