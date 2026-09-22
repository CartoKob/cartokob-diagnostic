import {handleMarketRequest} from './market-api.js';
import {handleWaterRequest} from './water-api.js';
export function marketApiPlugin(){
 const configure=server=>{server.middlewares.use(async(req,res,next)=>{
  if(!['/api/market','/api/water'].includes(req.url?.split('?')[0]))return next();
  try{const request=new Request('http://localhost'+req.url,{method:req.method});const response=await handleWaterRequest(request)||await handleMarketRequest(request);res.statusCode=response.status;for(const [k,v] of response.headers)res.setHeader(k,v);res.end(Buffer.from(await response.arrayBuffer()));}catch{res.statusCode=500;res.end('Erreur du service DVF');}
 });};
 return {name:'cartokob-market-api',configureServer:configure,configurePreviewServer:configure};
}
