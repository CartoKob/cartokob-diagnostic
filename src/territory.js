import {getJson, riskList} from './diagnostic.js';

export const numeric = value => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
export const fmt = (value, digits = 0) => value === null || value === undefined ? 'Non disponible' : new Intl.NumberFormat('fr-FR', {maximumFractionDigits: digits}).format(value);
export function parentCommune(code) {
  if (/^751(0[1-9]|1[0-9]|20)$/.test(code)) return '75056';
  if (/^6938[1-9]$/.test(code)) return '69123';
  if (/^132(0[1-9]|1[0-6])$/.test(code)) return '13055';
  return code;
}
export function selectionLevel(currentCode, nextCode, directAddress = false) {
  return directAddress || (currentCode && currentCode === nextCode) ? 'parcel' : 'commune';
}
export function latestObservations(data) {
  if (!Array.isArray(data?.observations)) throw Error('Réponse Insee non reconnue');
  const year = data.observations.reduce((max, o) => String(o.dimensions?.TIME_PERIOD || '') > max ? String(o.dimensions.TIME_PERIOD) : max, '');
  return {year, observations: data.observations.filter(o => o.dimensions?.TIME_PERIOD === year)};
}
export function observationValue(observation) {
  if (!observation || ['C','D'].includes(observation.attributes?.CONF_STATUS) || ['C','M','N','L','O'].includes(observation.attributes?.OBS_STATUS)) return null;
  return numeric(observation.measures?.OBS_VALUE_NIVEAU?.value);
}
const findValue = (observations, filters) => observationValue(observations.find(o => Object.entries(filters).every(([key,value]) => o.dimensions[key] === value)));
export function populationProfile(data) {
  const {year,observations} = latestObservations(data);
  const ages = {Y_LT15:'Moins de 15 ans',Y15T24:'15–24 ans',Y25T39:'25–39 ans',Y40T54:'40–54 ans',Y55T64:'55–64 ans',Y65T79:'65–79 ans',Y_GE80:'80 ans ou plus'};
  const total = findValue(observations,{AGE:'_T',SEX:'_T',RP_MEASURE:'POP'});
  return {year,total,ages:Object.entries(ages).map(([key,label])=>({label,value:findValue(observations,{AGE:key,SEX:'_T',RP_MEASURE:'POP'})})),history:data.observations.filter(o=>o.dimensions.AGE==='_T'&&o.dimensions.SEX==='_T'&&o.dimensions.RP_MEASURE==='POP').map(o=>({year:o.dimensions.TIME_PERIOD,value:observationValue(o)})).sort((a,b)=>a.year.localeCompare(b.year))};
}
export function housingProfile(data) {
  const {year,observations} = latestObservations(data);
  const v=(OCS,TDW='_T',TSH='_T')=>findValue(observations,{OCS,TDW,TSH});
  const main=v('DW_MAIN'),owners=v('DW_MAIN','_T','100');
  return {year,total:v('_T'),main,secondary:v('DW_SEC_DW_OCC'),vacant:v('DW_VAC'),houses:v('_T','1'),apartments:v('_T','2'),owners,ownerShare:main>0&&owners!==null?100*owners/main:null};
}
export function equipmentProfile(data) {
  const {year,observations}=latestObservations(data);
  const domains={A:'Services aux particuliers',B:'Commerces',C:'Enseignement',D:'Santé et action sociale',E:'Transports et déplacements',F:'Sports, loisirs et culture',G:'Tourisme'};
  return {year,rows:Object.entries(domains).map(([code,label])=>({label,value:findValue(observations,{FACILITY_DOM:code,FACILITY_SDOM:'_T',FACILITY_TYPE:'_T',BPE_MEASURE:'FACILITIES'})}))};
}
export function incomeProfile(data){
 const {year,observations}=latestObservations(data);
 return {year,median:findValue(observations,{FILOSOFI_MEASURE:'MED_SL',UNIT_MEASURE:'EUR_YR'}),poverty:findValue(observations,{FILOSOFI_MEASURE:'PR_MD60',UNIT_MEASURE:'PT'})};
}
const cache=new Map();
let lastInsee=0,queueTimer;
const inseeQueue=[];
function pumpInsee(){
 clearTimeout(queueTimer);
 while(inseeQueue.length&&inseeQueue[0].signal?.aborted){const job=inseeQueue.shift();job.reject(job.signal.reason);}
 if(!inseeQueue.length)return;
 const wait=Math.max(0,lastInsee+2300-Date.now());
 if(wait){queueTimer=setTimeout(pumpInsee,wait);return;}
 const job=inseeQueue.shift();lastInsee=Date.now();job.signal?.removeEventListener('abort',job.cancel);
 getJson(job.url,{signal:job.signal}).then(job.resolve,job.reject);
 pumpInsee();
}
function melodi(url,signal){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted){reject(signal.reason);return;}
  const job={url,signal,resolve,reject,cancel:null};
  job.cancel=()=>{const i=inseeQueue.indexOf(job);if(i>=0){inseeQueue.splice(i,1);reject(signal.reason);pumpInsee();}};
  signal?.addEventListener('abort',job.cancel,{once:true});inseeQueue.push(job);pumpInsee();
 });
}
export function employmentProfile(data){
 const {year,observations}=latestObservations(data);
 const filters={EMPSTA_ENQ:'1',AGE:'Y_GE15',SEX:'_T',EMPFORM:'_T',RP_MEASURE:'POP'};
 return {year,total:findValue(observations,{...filters,WKTIME:'_T'}),fullTime:findValue(observations,{...filters,WKTIME:'FT'}),partTime:findValue(observations,{...filters,WKTIME:'PT'})};
}
export function communeSources(code){
  const insee=(dataset,params)=>'https://api.insee.fr/melodi/data/'+dataset+'?'+new URLSearchParams({GEO:'COM-'+code,...params,maxResult:'500'});
  return [
    {key:'population',title:'Les habitants',source:'Insee · Recensement',url:insee('DS_RP_POPULATION_PRINC',{SEX:'_T',RP_MEASURE:'POP'}),parse:populationProfile},
    {key:'housing',title:'Le logement',source:'Insee · Recensement',url:insee('DS_RP_LOGEMENT_PRINC',{CARS:'_T',BUILD_END:'_T',NRG_SRC:'_T',CARPARK:'_T',RP_MEASURE:'DWELLINGS',NOR:'_T',L_STAY:'_T'}),parse:housingProfile},
    {key:'equipment',title:'Les services et équipements',source:'Insee · Base permanente des équipements',url:insee('DS_BPE',{FACILITY_TYPE:'_T',FACILITY_SDOM:'_T',BPE_MEASURE:'FACILITIES'}),parse:equipmentProfile},
    {key:'employment',title:'L’emploi des habitants',source:'Insee · Recensement',url:insee('DS_RP_ACTIVITE_PRINC',{SEX:'_T',EMPFORM:'_T',AGE:'Y_GE15',RP_MEASURE:'POP'}),parse:employmentProfile},
    {key:'income',title:'Les revenus des ménages',source:'Insee · Filosofi',url:insee('DS_FILOSOFI_CC',{}),parse:incomeProfile},
    {key:'risks',title:'Les risques de la commune',source:'Géorisques · GASPAR',url:'https://www.georisques.gouv.fr/api/v1/gaspar/risques?code_insee='+code,parse:riskList},
  ];
}
export async function loadCommune(code,{signal,onUpdate}) {
  await Promise.all(communeSources(code).map(async source=>{
    const cached=cache.get(source.url);
    if(cached&&Date.now()-cached.savedAt<3600000){onUpdate(source.key,cached);return;}
    onUpdate(source.key,{...source,status:'loading'});
    try{
      const raw=await (source.url.includes('api.insee.fr')?melodi(source.url,signal):getJson(source.url,{signal}));
      signal?.throwIfAborted();
      if(raw.paging?.next)throw Error('Réponse paginée incomplète');
      const result={...source,status:'success',data:source.parse(raw),savedAt:Date.now()};cache.set(source.url,result);onUpdate(source.key,result);
    }catch(e){if(!signal?.aborted)onUpdate(source.key,{...source,status:'error',error:e.message});}
  }));
}
