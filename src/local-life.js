import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import {dvfCodes} from './market.js';
import {getJson} from './diagnostic.js';
const cache=new Map();
async function cached(url,signal){const old=cache.get(url);if(old&&Date.now()-old.time<3600000)return old.data;const data=await getJson(url,{signal});cache.set(url,{data,time:Date.now()});return data;}
export function transportProfile(geo,collection){
 if(!['Polygon','MultiPolygon'].includes(geo?.geometry?.type)||!Array.isArray(collection?.features))throw Error('Géométrie indisponible');
 const inside=collection.features.filter(f=>f.geometry?.type==='Point'&&booleanPointInPolygon(f,geo));
 const names=[...new Set(inside.map(f=>f.properties?.stop_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
 const networks=[...new Map(inside.map(f=>[f.properties.dataset_id,{id:f.properties.dataset_id,name:f.properties.dataset_title}])).values()].filter(n=>n.id&&n.name);
 return {points:inside.length,names,networks};
}
export async function loadTransport(code,signal){
 const geo=await cached(`https://geo.api.gouv.fr/communes/${code}?format=geojson&geometry=contour&fields=nom,code`,signal);
 const coords=geo.geometry.type==='Polygon'?geo.geometry.coordinates.flat():geo.geometry.coordinates.flat(2);
 const xs=coords.map(c=>c[0]),ys=coords.map(c=>c[1]);const bounds={west:Math.min(...xs),east:Math.max(...xs),south:Math.min(...ys),north:Math.max(...ys)};
 const url='https://transport.data.gouv.fr/api/gtfs-stops?'+new URLSearchParams(bounds);const raw=await cached(url,signal);return {...transportProfile(geo,raw),source:url};
}
function decode(value){if(Array.isArray(value))return value;try{return JSON.parse(value||'[]');}catch{return [];}}
export function publicServicesProfile(raw){if(!Array.isArray(raw.results))throw Error('Annuaire indisponible');return {total:raw.total_count,partial:raw.total_count>raw.results.length,services:raw.results.filter(r=>/mairie|france services|gendarmerie|commissariat/i.test(r.nom)).map(r=>({id:r.id,name:r.nom,phone:decode(r.telephone)[0]?.valeur,address:decode(r.adresse).filter(a=>a.type_adresse==='Adresse').map(a=>[a.numero_voie,a.code_postal,a.nom_commune].filter(Boolean).join(' ')).join(' · '),url:r.url_service_public,updated:r.date_modification}))};}
export function energyProfile(raw){if(!Array.isArray(raw.results))throw Error('Énergie indisponible');const year=raw.results[0]?.annee;if(!year)return {year:null,total:null,sites:null};const rows=raw.results.filter(r=>r.annee===year);const sum=k=>rows.every(r=>r[k]!=null&&Number.isFinite(Number(r[k])))?rows.reduce((n,r)=>n+Number(r[k]),0):null;return {year,total:sum('conso_totale_mwh'),sites:sum('nb_sites')};}
export function rentalProfile(records,code){
 if(records[code])return records[code];
 const codes=dvfCodes(code);if(codes.length===1)return null;
 const out={};for(const kind of ['apartment','house']){const entries=codes.map(c=>({code:c,...records[c]?.[kind]})).filter(r=>Number.isFinite(r.value));if(entries.length)out[kind]={value:null,minimum:Math.min(...entries.map(r=>r.value)),maximum:Math.max(...entries.map(r=>r.value)),scope:'arrondissements',entries,partial:entries.length!==codes.length};}return Object.keys(out).length?out:null;
}
export async function loadLocalLife(city,{signal,onUpdate}){
 const directory='https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?'+new URLSearchParams({where:`code_insee_commune="${city.code}"`,limit:'100'});
 const energy='https://opendata.agenceore.fr/api/explore/v2.1/catalog/datasets/consommation-annuelle-d-electricite-et-gaz-par-commune/records?'+new URLSearchParams({where:`code_commune="${city.code}" and filiere="Electricité" and code_grand_secteur="RESIDENTIEL"`,order_by:'annee desc',limit:'100'});
 const schools='https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?'+new URLSearchParams({where:`code_commune="${city.code}"`,select:'type_etablissement,count(*) as count',group_by:'type_etablissement',limit:'100'});
 const jobs=[['rents',async()=>({values:rentalProfile(await cached('/rents-2025/'+city.code.slice(0,2)+'.json',signal),city.code)})],['schools',async()=>{const raw=await cached(schools,signal);if(!Array.isArray(raw.results))throw Error();return {rows:raw.results,source:schools};}],['water',()=>cached('/api/water?code='+city.code,signal)],['transport',()=>loadTransport(city.code,signal)],['services',async()=>({...publicServicesProfile(await cached(directory,signal)),source:directory})],['energy',async()=>({...energyProfile(await cached(energy,signal)),source:energy})]];
 await Promise.all(jobs.map(async([key,run])=>{onUpdate(key,{status:'loading'});try{const data=await run();if(!signal?.aborted)onUpdate(key,{status:'success',data});}catch{if(!signal?.aborted)onUpdate(key,{status:'error'});}}));
}
