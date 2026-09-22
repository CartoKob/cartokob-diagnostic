import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalize,searchCommunes} from '../src/search.js';
import {riskList,loadDiagnostic,diagnosticSources} from '../src/diagnostic.js';
const communes=JSON.parse(await readFile(new URL('../public/communes.json',import.meta.url))).map(c=>({...c,key:normalize(c.nom)}));
test('coverage includes Corsica, large and small municipalities; excludes overseas',()=>{
 for(const code of ['75056','69123','13055','2A004','2B033'])assert.ok(communes.some(c=>c.code===code));
 assert.ok(communes.length>34000);assert.ok(communes.every(c=>!c.codeDepartement.startsWith('97')&&!c.codeDepartement.startsWith('98')));
 assert.equal(new Set(communes.map(c=>c.code)).size,communes.length);
});
test('search supports accents, postal codes and names',()=>{assert.equal(searchCommunes(communes,'lyon')[0].code,'69123');assert.equal(searchCommunes(communes,'ajaccio')[0].code,'2A004');assert.ok(searchCommunes(communes,'Évry').length);assert.ok(searchCommunes(communes,'69002').some(c=>c.code==='69123'));assert.deepEqual(searchCommunes(communes,'zzzzzzzz'),[]);});
test('risk parser extracts nested GASPAR risks without duplicates',()=>{assert.deepEqual(riskList({data:[{risques_detail:[{libelle_risque_long:'Inondation'},{libelle_risque_long:'Inondation'}]}]}),['Inondation']);assert.throws(()=>riskList({message:'error'}));});
test('point geometry retains exact coordinates and risks use commune scope',()=>{const s=diagnosticSources({lon:-4.486,lat:48.39},'29019');assert.deepEqual(JSON.parse(new URL(s[0].url).searchParams.get('geom')).coordinates,[-4.486,48.39]);assert.ok(s.find(x=>x.key==='risks').url.endsWith('29019'));});
test('one failed source does not erase successful or empty results',async()=>{const original=global.fetch;global.fetch=async url=>url.includes('/gpu/')?new Response('',{status:503}):Response.json(url.includes('gaspar')?{data:[]}:{features:[]});const updates={};try{await loadDiagnostic({lat:45.75,lon:4.83},'69123',{signal:new AbortController().signal,onUpdate:(k,v)=>updates[k]=v});assert.equal(updates.urban.status,'error');assert.equal(updates.parcel.status,'success');assert.deepEqual(updates.parcel.items,[]);assert.equal(updates.risks.status,'success');}finally{global.fetch=original;}});
