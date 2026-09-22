import {numeric} from './territory.js';

// Verified national release directory on 2026-09-22. Update after checking a new annual release.
export const DVF_YEAR=2025;
export const DVF_RELEASE='2026-05-18';
export function dvfCodes(code){
  if(code==='75056')return Array.from({length:20},(_,i)=>String(75101+i));
  if(code==='69123')return Array.from({length:9},(_,i)=>String(69381+i));
  if(code==='13055')return Array.from({length:16},(_,i)=>String(13201+i));
  return [code];
}
export const dvfUrl=(department,code)=>`https://files.data.gouv.fr/geo-dvf/latest/csv/${DVF_YEAR}/communes/${department}/${code}.csv`;
export function parseCsv(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(ch===','&&!quoted){row.push(cell);cell='';}
    else if(ch==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else cell+=ch;
  }
  if(quoted)throw Error('Fichier DVF incomplet');
  if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}
  const headers=rows.shift()?.map(h=>h.replace(/^\uFEFF/,''));
  if(!headers?.includes('id_mutation')||!headers.includes('id_parcelle'))throw Error('Format DVF inattendu');
  return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??''])));
}
export function groupTransactions(rows){
  const groups=new Map();
  for(const r of rows){
    if(!r.id_mutation)continue;
    let g=groups.get(r.id_mutation);
    if(!g){g={id:r.id_mutation,date:r.date_mutation,nature:r.nature_mutation,values:new Set(),parcels:new Set(),types:new Set(),rows:[]};groups.set(r.id_mutation,g);}
    const value=numeric(r.valeur_fonciere);if(value!==null)g.values.add(value);
    if(r.id_parcelle)g.parcels.add(r.id_parcelle);if(r.type_local)g.types.add(r.type_local);g.rows.push(r);
  }
  return [...groups.values()].map(g=>({...g,value:g.values.size===1?[...g.values][0]:null,parcels:[...g.parcels],types:[...g.types],values:undefined})).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
const cache=new Map();
export async function loadMarket(city,{signal}={}){
  if(['57','67','68'].includes(city.codeDepartement))return {status:'not-covered',year:DVF_YEAR,reason:'Les mutations DVF ne sont pas publiées pour la Moselle, le Bas-Rhin et le Haut-Rhin.',transactions:[]};
  const existing=cache.get(city.code);if(existing)return existing;
  const codes=dvfCodes(city.code),rows=[],missing=[],urls=[];
  // At most three concurrent files; metropolitan PLM cities are split by arrondissement in DVF.
  let cursor=0;
  await Promise.all(Array.from({length:Math.min(3,codes.length)},async()=>{
    while(cursor<codes.length){
      signal?.throwIfAborted();const code=codes[cursor++],url=dvfUrl(city.codeDepartement,code);urls.push(url);
      try{const response=await fetch('/api/market?'+new URLSearchParams({code}),{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});if(!response.ok)throw Error(`HTTP ${response.status}`);rows.push(...parseCsv(await response.text()));}
      catch(e){if(signal?.aborted)throw e;missing.push(code);}
    }
  }));
  const result={status:missing.length===codes.length?'error':missing.length?'partial':'success',year:DVF_YEAR,release:DVF_RELEASE,transactions:groupTransactions(rows),missing,urls};
  if(result.status==='success')cache.set(city.code,result);
  return result;
}
export function transactionsForParcel(market,id){return market?.transactions?.filter(t=>t.parcels.includes(id))||[];}
