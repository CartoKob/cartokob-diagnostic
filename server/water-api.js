const cache=new Map();
export const WATER_YEAR=2024;
function plain(html){return html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&#x27;|&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
export function parseWaterPage(html,year=WATER_YEAR){
 if(!html.includes('id="fiche-commune"')||!plain(html).includes(`Commune | ${year}`))throw Error('Fiche SISPEA non reconnue');
 const text=plain(html);const price=label=>{const pattern=new RegExp(`([0-9]+(?:[.,][0-9]+)?) € TTC/m³ Prix du service ${label} au 1er janvier (\\d{4}) en ${year}`,'g');const matches=[...text.matchAll(pattern)];return matches.length===1?{value:Number(matches[0][1].replace(',','.')),priceYear:Number(matches[0][2])}:null;};
 const quality=label=>{const matches=[...text.matchAll(new RegExp(`([0-9]+(?:[.,][0-9]+)?) % Conformité ${label} de l[’']eau au robinet en ${year}`,'g'))];return matches.length===1?Number(matches[0][1].replace(',','.')):null;};
 return {year,drinking:price("d['’]eau potable"),sewer:price("d['’]assainissement"),microbiology:quality('microbiologique'),chemistry:quality('physico-chimique')};
}
export async function handleWaterRequest(request,fetcher=fetch){
 const url=new URL(request.url);if(url.pathname!=='/api/water')return null;
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':status===200?'public,max-age=86400':'no-store'}});
 if(request.method!=='GET')return json({error:'Méthode non autorisée'},405);
 const code=url.searchParams.get('code');if(!/^(?:0[1-9]|[1-8][0-9]|9[0-5]|2[AB])\d{3}$/.test(code||'')||[...url.searchParams.keys()].some(k=>k!=='code'))return json({error:'Code invalide'},400);
 const cached=cache.get(code);if(cached&&Date.now()-cached.time<86400000)return json(cached.value);
 const source=`https://www.services.eaufrance.fr/commune/${code}/${WATER_YEAR}`;
 try{const r=await fetcher(source,{redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw Error();const reader=r.body.getReader(),parts=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4*1024*1024){await reader.cancel();throw Error();}parts.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}const data={...parseWaterPage(new TextDecoder().decode(bytes)),source,consultedAt:new Date().toISOString()};if(cache.size>=128)cache.delete(cache.keys().next().value);cache.set(code,{time:Date.now(),value:data});return json(data);}catch{return json({error:'Données SISPEA indisponibles'},502);}
}
