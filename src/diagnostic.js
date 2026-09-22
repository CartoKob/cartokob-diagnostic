export async function getJson(url,{signal,...options}={}){
 const timeout=AbortSignal.timeout(15000);
 const r=await fetch(url,{...options,signal:signal?AbortSignal.any([signal,timeout]):timeout});
 if(!r.ok)throw new Error(`Service indisponible (${r.status})`);
 const data=await r.json();if(data?.error || (data?.response_code>=400))throw new Error('Réponse du service invalide');return data;
}
export const featureList=d=>{if(!Array.isArray(d?.features))throw Error('Format géographique inattendu');return d.features;};
export function riskList(d){if(!Array.isArray(d?.data))throw Error('Format risques inattendu');return [...new Set(d.data.flatMap(c=>(c.risques_detail||[]).map(x=>x.libelle_risque_long||x.libelle_risque)).filter(Boolean))];}
export function diagnosticSources(point,code){
 const geom=encodeURIComponent(JSON.stringify({type:'Point',coordinates:[point.lon,point.lat]}));
 const carto='https://apicarto.ign.fr/api/';
 return [
 {key:'parcel',title:'Cadastre',source:'IGN · Parcellaire Express',scope:'Au point',url:carto+'cadastre/parcelle?geom='+geom,parse:featureList},
 {key:'urban',title:'Urbanisme',source:'IGN · Géoportail de l’urbanisme',scope:'Au point',url:carto+'gpu/zone-urba?geom='+geom,parse:featureList},
 {key:'risks',title:'Risques recensés',source:'Géorisques · GASPAR',scope:'À l’échelle de la commune',url:'https://www.georisques.gouv.fr/api/v1/gaspar/risques?code_insee='+code,parse:riskList},
 {key:'nature',title:'Natura 2000 · habitats',source:'IGN · INPN',scope:'Au point · directive Habitats uniquement',url:carto+'nature/natura-habitat?geom='+geom,parse:featureList},
 {key:'birds',title:'Natura 2000 · oiseaux',source:'IGN · INPN',scope:'Au point · directive Oiseaux uniquement',url:carto+'nature/natura-oiseaux?geom='+geom,parse:featureList},
 {key:'znieff',title:'Inventaire ZNIEFF type I',source:'IGN · INPN',scope:'Au point · inventaire écologique',url:carto+'nature/znieff1?geom='+geom,parse:featureList},
 ];
}
export async function loadDiagnostic(point,code,{signal,onUpdate}){
 const sources=diagnosticSources(point,code);
 await Promise.all(sources.map(async source=>{onUpdate(source.key,{...source,status:'loading'});try{const raw=await getJson(source.url,{signal});const items=source.parse(raw);onUpdate(source.key,{...source,status:'success',items,queriedAt:new Date().toISOString(),truncated:Number(raw.numberMatched)>items.length});}catch(e){if(!signal?.aborted)onUpdate(source.key,{...source,status:'error',error:e.message});}}));
}
