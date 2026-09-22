import {copyFile,writeFile} from 'node:fs/promises';
await copyFile('dist/server/index.js','dist/server/assets.js');
await copyFile('server/market-api.js','dist/server/market-api.js');
await writeFile('dist/server/index.js',`import assets from './assets.js';
import {handleMarketRequest} from './market-api.js';
export default {async fetch(request,env,ctx){return await handleMarketRequest(request)||assets.fetch(request,env,ctx);}};
`);
console.log('Added bounded same-origin DVF endpoint to Sites runtime.');
