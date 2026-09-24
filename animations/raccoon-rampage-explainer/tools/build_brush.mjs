// Builds lib/p5.brush.flush.js: the official p5.brush 2.2.3 p5 build plus `brush.flush()`,
// which composites pending brush work immediately so native p5 drawing (text, images,
// flat fills) can be interleaved in the right order.
//   node tools/build_brush.mjs
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['tools/brush-entry.js'],
  bundle: true, format: 'iife', globalName: 'brush', minify: true,
  ignoreAnnotations: true, // p5.brush marks itself side-effect free, but its entry registers the p5 addon
  loader: { '.vert': 'text', '.frag': 'text' },
  outfile: 'lib/p5.brush.flush.js',
});
console.log('built lib/p5.brush.flush.js');
