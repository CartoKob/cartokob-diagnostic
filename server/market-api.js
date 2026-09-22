// Fixed public DVF source only. This endpoint cannot proxy arbitrary URLs.
const memory=new Map();
const MAX_BYTES=8*1024*1024;
export function marketSource(code){
 if(!/^(?:0[1-9]|[1-8][0-9]|9[0-5]|2A|2B)\d{3}$/.test(code||''))return null;
 const department=code.slice(0,2);
 if(['20','57','67','68'].includes(department))return null;
 return `https://files.data.gouv.fr/geo-dvf/latest/csv/2025/communes/${department}/${code}.csv`;
}
export async function handleMarketRequest(request,fetcher=fetch){
 const url=new URL(request.url);
 if(url.pathname!=='/api/market')return null;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 const source=marketSource(url.searchParams.get('code'));
 if(!source||[...url.searchParams.keys()].some(k=>k!=='code'))return new Response('Code commune invalide ou non couvert',{status:400});
 const saved=memory.get(source);
 if(saved&&Date.now()-saved.time<3600000)return new Response(request.method==='HEAD'?null:saved.text,{headers:{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'public, max-age=3600'}});
 try{
  let upstream=await fetcher(source,{signal:AbortSignal.timeout(15000),redirect:'manual'});
  if([301,302,307,308].includes(upstream.status)){
   const target=new URL(upstream.headers.get('location')||'',source);
   if(target.protocol!=='https:'||target.hostname!=='geo-dvf.s3.sbg.io.cloud.ovh.net'||target.pathname!==new URL(source).pathname.replace('/geo-dvf','')||target.username||target.password||target.search)return new Response('Redirection source non autorisée',{status:502});
   upstream=await fetcher(target.href,{signal:AbortSignal.timeout(15000),redirect:'error'});
  }
  if(!upstream.ok)return new Response('Fichier source indisponible',{status:upstream.status===404?404:502});
  if(Number(upstream.headers.get('content-length'))>MAX_BYTES)return new Response('Fichier trop volumineux',{status:413});
  const reader=upstream.body.getReader();const parts=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();return new Response('Fichier trop volumineux',{status:413});}parts.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.byteLength;}
  const text=new TextDecoder().decode(bytes);
  if(!text.startsWith('id_mutation,'))return new Response('Format source invalide',{status:502});
  // Bound in-process cache. Edge Cache-Control also applies after hosting.
  if(memory.size>=8)memory.delete(memory.keys().next().value);
  memory.set(source,{time:Date.now(),text});
  return new Response(request.method==='HEAD'?null:text,{headers:{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('La source DVF ne répond pas',{status:502});}
}
