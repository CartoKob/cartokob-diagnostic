import {handleMarketRequest} from './market-api.js';
export function marketApiPlugin(){
 const configure=server=>{server.middlewares.use(async(req,res,next)=>{
  if(req.url?.split('?')[0]!=='/api/market')return next();
  try{const response=await handleMarketRequest(new Request('http://localhost'+req.url,{method:req.method}));res.statusCode=response.status;for(const [k,v] of response.headers)res.setHeader(k,v);res.end(Buffer.from(await response.arrayBuffer()));}catch{res.statusCode=500;res.end('Erreur du service DVF');}
 });};
 return {name:'cartokob-market-api',configureServer:configure,configurePreviewServer:configure};
}
