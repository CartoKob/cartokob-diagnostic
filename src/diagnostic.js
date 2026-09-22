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
 {key:'supSurface',title:'Servitudes surfaciques',source:'IGN · Géoportail de l’urbanisme',scope:'Assiettes de servitudes intersectant le point',url:carto+'gpu/assiette-sup-s?geom='+geom,parse:featureList},
 {key:'supLine',title:'Servitudes linéaires',source:'IGN · Géoportail de l’urbanisme',scope:'Intersection exacte du point ; une proximité n’est pas détectée',url:carto+'gpu/assiette-sup-l?geom='+geom,parse:featureList},
 {key:'supPoint',title:'Servitudes ponctuelles',source:'IGN · Géoportail de l’urbanisme',scope:'Intersection exacte du point, sans rayon de recherche',url:carto+'gpu/assiette-sup-p?geom='+geom,parse:featureList},
 {key:'risks',title:'Risques recensés',source:'Géorisques · GASPAR',scope:'À l’échelle de la commune',url:'https://www.georisques.gouv.fr/api/v1/gaspar/risques?code_insee='+code,parse:riskList},
 {key:'nature',title:'Natura 2000 · habitats',source:'IGN · INPN',scope:'Au point · directive Habitats uniquement',url:carto+'nature/natura-habitat?geom='+geom,parse:featureList},
 {key:'birds',title:'Natura 2000 · oiseaux',source:'IGN · INPN',scope:'Au point · directive Oiseaux uniquement',url:carto+'nature/natura-oiseaux?geom='+geom,parse:featureList},
 {key:'znieff',title:'Inventaire ZNIEFF type I',source:'IGN · INPN',scope:'Au point · inventaire écologique',url:carto+'nature/znieff1?geom='+geom,parse:featureList},
 {key:'znieff2',title:'Inventaire ZNIEFF type II',source:'IGN · INPN',scope:'Au point · inventaire écologique',url:carto+'nature/znieff2?geom='+geom,parse:featureList},
 {key:'reserve',title:'Réserves naturelles nationales',source:'IGN · INPN',scope:'Au point · cette catégorie de protection uniquement',url:carto+'nature/rnn?geom='+geom,parse:featureList},
 {key:'regionalPark',title:'Parcs naturels régionaux',source:'IGN · INPN',scope:'Au point · périmètre du parc',url:carto+'nature/pnr?geom='+geom,parse:featureList},

 ];
}
export function buildingSource(parcelId){
 if(!/^(?:\d{2}|2[AB])\d{6}[A-Z0-9]{2}\d{4}$/.test(parcelId||''))return null;
 const fields='batiment_groupe_id,annee_construction,nb_log,libelle_adr_principale_ban,classe_bilan_dpe,date_reception_dpe,identifiant_dpe';
 return {key:'buildings',title:'Bâtiments et DPE associés',source:'BDNB · données ouvertes',scope:'Groupes de bâtiments liés à la référence cadastrale ; DPE associé au groupe, pas nécessairement au logement visé',url:'https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/parcelle?'+new URLSearchParams({parcelle_id:'eq.'+parcelId,select:fields,limit:'20'})};
}
export function parseProprietaires(raw){
 // API Carto proprietaire : retourne un objet { features:[...] } ou tableau direct
 const list=Array.isArray(raw)?raw:Array.isArray(raw?.features)?raw.features.map(f=>f.properties||f):[];
 const seen=new Set();const out=[];
 for(const p of list){
  const nom=(p.dnomlp||p.ddenom||p.denomination||'').trim().toUpperCase();
  if(!nom||seen.has(nom))continue;seen.add(nom);
  const isPublic=/\b(commune|mairie|d[ée]partement|r[ée]gion|[ée]tat|sncf|ratp|rff|anah|epf|epa|oph|ophlm|sem|spla|spl|syndicat|m[ée]tropole|agglom[ée]ration|communaut[ée]|h[oô]pital|universit[ée]|lyc[ée]e|[ée]cole)\b/i.test(nom);
  const isMoral=nom.length>0&&!/^[*\-\s]+$/.test(nom)&&nom!=='PROPRIETAIRE PRIVE'&&nom!=='NON DIFFUSE';
  out.push({nom,isPublic,isMoral});
 }
 return out;
}
export async function loadDiagnostic(point,code,{signal,onUpdate}){
 const sources=diagnosticSources(point,code);let cursor=0;
 sources.forEach(source=>onUpdate(source.key,{...source,status:'loading'}));
 await Promise.all(Array.from({length:3},async()=>{
  while(cursor<sources.length){
   if(signal?.aborted)return;
   const source=sources[cursor++];
   try{const raw=await getJson(source.url,{signal});if(signal?.aborted)return;const items=source.parse(raw);onUpdate(source.key,{...source,status:'success',items,queriedAt:new Date().toISOString(),truncated:Number(raw.numberMatched)>items.length});
    if(source.key==='parcel'&&items.length===1){
     const idu=items[0].properties?.idu;
     const building=buildingSource(idu);
     if(building){
      onUpdate('buildings',{...building,status:'loading'});
      try{const records=await getJson(building.url,{signal});if(signal?.aborted)return;if(!Array.isArray(records))throw Error('Format bâtiment inattendu');onUpdate('buildings',{...building,status:'success',items:records.map(properties=>({properties})),truncated:records.length>=20,queriedAt:new Date().toISOString()});}
      catch(e){if(!signal?.aborted)onUpdate('buildings',{...building,status:'error',error:e.message});}
     }
     if(idu){
      const propKey='proprietaire';
      onUpdate(propKey,{key:propKey,title:'Propriétaires cadastraux',source:'DGFiP · via IGN Carto',scope:'Personnes morales uniquement — les personnes physiques ne sont pas diffusées en open data',url:'https://apicarto.ign.fr/api/cadastre/proprietaire?numero_parcelle='+idu,status:'loading',items:[]});
      try{const propRaw=await getJson('https://apicarto.ign.fr/api/cadastre/proprietaire?numero_parcelle='+idu,{signal});
       if(signal?.aborted)return;
       const parsed=parseProprietaires(propRaw);
       onUpdate(propKey,{key:propKey,title:'Propriétaires cadastraux',source:'DGFiP · via IGN Carto',scope:'Personnes morales uniquement — les personnes physiques ne sont pas diffusées en open data',url:'https://apicarto.ign.fr/api/cadastre/proprietaire?numero_parcelle='+idu,status:'success',items:parsed,queriedAt:new Date().toISOString()});}
      catch(e){if(!signal?.aborted)onUpdate(propKey,{key:propKey,title:'Propriétaires cadastraux',source:'DGFiP · via IGN Carto',scope:'Personnes morales uniquement',url:'https://apicarto.ign.fr/api/cadastre/proprietaire?numero_parcelle='+idu,status:'error',error:e.message,items:[]});}
     }
    }}
   catch(e){if(!signal?.aborted)onUpdate(source.key,{...source,status:'error',error:e.message});}
  }
 }));
}
