// Custom p5.brush bundle: identical to the official p5 build, plus `brush.flush()`,
// which composites any pending brush work immediately. We need it to interleave
// p5.brush marks with native p5 drawing (text, images) in the correct order, and
// to finish painting into offscreen framebuffers before switching targets.
export * from '../node_modules/p5.brush/src/index.p5.js';
export { flushActiveComposite as flush } from '../node_modules/p5.brush/src/core/color.js';
