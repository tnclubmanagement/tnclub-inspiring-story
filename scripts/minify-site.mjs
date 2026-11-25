import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import CleanCSS from 'clean-css';
import { minify as minifyJS } from 'terser';
import { minify as minifyHTML } from 'html-minifier-terser';

const root = path.resolve(process.argv[2] || '_site');
if (!(await stat(root)).isDirectory() || root === process.cwd()) {
  throw new Error('Expected a generated site directory, not the source directory');
}
const totals = { files: 0, before: 0, after: 0 };

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
      continue;
    }
    if (!entry.isFile() || !/\.(html|css|js)$/.test(entry.name) || /\.min\.(css|js)$/.test(entry.name)) continue;
    const source = await readFile(file, 'utf8');
    let output;
    try {
      if (file.endsWith('.css')) {
        const result = new CleanCSS({ level: 1, rebase: false, inline: ['none'] }).minify(source);
        if (result.errors.length) throw new Error(result.errors.join('\n'));
        output = result.styles;
      } else if (file.endsWith('.js')) {
        output = (await minifyJS(source, { format: { comments: 'some' } })).code;
      } else {
        output = await minifyHTML(source, {
          collapseWhitespace: true,
          conservativeCollapse: true,
          removeComments: false,
          minifyCSS: true,
          minifyJS: true,
        });
      }
    } catch (error) {
      throw new Error(`Cannot minify ${file}: ${error.message}`, { cause: error });
    }
    totals.files++;
    totals.before += Buffer.byteLength(source);
    totals.after += Buffer.byteLength(output);
    await writeFile(file, output);
  }
}

await walk(root);
console.log(`Minified ${totals.files} files: ${totals.before} → ${totals.after} bytes`);
