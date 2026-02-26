
// IMPORTANT: we have to manually resolve the three import url here because import maps don't work with web workers
// if you want to bump the three.js version you need to do so here and in the import map in index.html

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@v0.183.0/build/three.module.js';
export { THREE }
