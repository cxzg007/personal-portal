import { build } from 'esbuild';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(root, '../../public/experiments/henry');
const loaders = Object.fromEntries(['.png', '.jpg', '.gif', '.svg', '.ttf', '.woff', '.woff2', '.mp3', '.mp4', '.pdf'].map((extension) => [extension, 'file']));

for (const app of ['room', 'desktop']) {
    const destination = resolve(output, app);
    await mkdir(destination, { recursive: true });
    const result = await build({
        absWorkingDir: root,
        entryPoints: [`${app}-entry.ts`],
        outfile: resolve(destination, 'app.js'),
        bundle: true,
        minify: true,
        platform: 'browser',
        format: 'iife',
        target: ['es2020'],
        jsx: 'automatic',
        define: { 'process.env.NODE_ENV': '"production"' },
        loader: { ...loaders, '.glsl': 'text' },
        assetNames: 'assets/[name]-[hash]',
        publicPath: `/experiments/henry/${app}/`,
        metafile: true,
        legalComments: 'linked',
    });
    await writeFile(resolve(root, `${app}-build.json`), JSON.stringify(result.metafile, null, 2));
    let html;
    if (app === 'room') {
        const upstream = await readFile(resolve(root, 'room/src/index.html'), 'utf8');
        const styles = upstream.match(/<style>[\s\S]*?<\/style>/)[0];
        const body = upstream.match(/<body>([\s\S]*?)<\/body>/)[1].replaceAll('../static/', './').replaceAll('muted loop autoplay', 'muted loop autoplay playsinline');
        html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jiang Junjie - Personal Space</title>${styles}</head><body>${body}</body></html>`;
    } else {
        html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JunjieOS</title></head><body><div id="root"></div></body></html>`;
    }
    html = html.replace('</head>', '<meta name="robots" content="noindex"><link rel="stylesheet" href="./app.css"></head>')
        .replace('</body>', `<script defer src="./app.js" onerror="parent.postMessage({type:'henry:error'},location.origin)"></script></body>`);
    await writeFile(resolve(destination, 'index.html'), html);
    if (app === 'room') await cp(resolve(root, app, 'LICENSE.md'), resolve(destination, 'LICENSE.txt'));
    console.log(`Built ${app}: ${Object.keys(result.metafile.inputs).length} source modules`);
}
