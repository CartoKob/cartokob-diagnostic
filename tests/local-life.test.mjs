import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseWaterPage,handleWaterRequest} from '../server/water-api.js';
import {transportProfile,energyProfile,publicServicesProfile,rentalProfile} from '../src/local-life.js';
const html=content=>`<main id="fiche-commune">Commune | 2024 ${content}</main>`;
test('water reads local prices and their tariff year, never the national comparison',()=>{
 const d=parseWaterPage(html("2.52 € TTC/m³ Prix du service d'eau potable au 1er janvier 2025 en 2024 Moyenne France 2.5 € TTC/m³ 1.74 € TTC/m³ Prix du service d'assainissement au 1er janvier 2025 en 2024 100.00 % Conformité microbiologique de l’eau au robinet en 2024"));
 assert.deepEqual(d.drinking,{value:2.52,priceYear:2025});assert.equal(d.sewer.value,1.74);assert.equal(d.microbiology,100);assert.equal(d.chemistry,null);
});
test('water missing or ambiguous local tariffs remain missing',()=>{
 assert.equal(parseWaterPage(html('Moyenne France 2.50 € TTC/m³')).drinking,null);
 const item="2.52 € TTC/m³ Prix du service d'eau potable au 1er janvier 2025 en 2024 ";assert.equal(parseWaterPage(html(item+item)).drinking,null);assert.throws(()=>parseWaterPage('<html>Error</html>'));
});
test('water endpoint rejects arbitrary sources, overseas and writes without network calls',async()=>{
 let calls=0;const f=async()=>{calls++;throw Error();};
 for(const path of ['?code=97101','?code=95127&url=https://other.test','?code=../'])assert.equal((await handleWaterRequest(new Request('https://local/api/water'+path),f)).status,400);
 assert.equal((await handleWaterRequest(new Request('https://local/api/water?code=95127',{method:'POST'}),f)).status,405);assert.equal(calls,0);
});
test('transport respects polygon holes, exterior points and name deduplication',()=>{
 const geo={type:'Feature',geometry:{type:'Polygon',coordinates:[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[2,1],[2,2],[1,2],[1,1]]]},properties:{}};
 const feature=(name,xy)=>({type:'Feature',geometry:{type:'Point',coordinates:xy},properties:{stop_name:name,dataset_id:1,dataset_title:'Réseau'}});
 const d=transportProfile(geo,{features:[feature('Gare',[3,3]),feature('Gare',[3,3.1]),feature('Hors commune',[5,5]),feature('Trou',[1.5,1.5])]});assert.equal(d.points,2);assert.deepEqual(d.names,['Gare']);assert.equal(d.networks.length,1);
});
test('energy aggregates operators in latest year only and preserves missing values',()=>{
 assert.deepEqual(energyProfile({results:[{annee:'2024',conso_totale_mwh:10,nb_sites:2},{annee:'2024',conso_totale_mwh:20,nb_sites:3},{annee:'2023',conso_totale_mwh:900,nb_sites:90}]}),{year:'2024',total:30,sites:5});assert.equal(energyProfile({results:[{annee:'2024',conso_totale_mwh:null}]}).total,null);
});
test('public directory parses contact fields and marks truncated results',()=>{
 const d=publicServicesProfile({total_count:2,results:[{id:'x',nom:'Mairie - Test',telephone:'[{"valeur":"0102030405"}]',adresse:'[{"type_adresse":"Adresse","numero_voie":"1 rue A","code_postal":"95000","nom_commune":"Test"}]'}]});assert.equal(d.partial,true);assert.equal(d.services[0].phone,'0102030405');assert.equal(d.services[0].address,'1 rue A 95000 Test');
});
test('national rental imports preserve sparse-observation and geographic precision metadata',()=>{
 for(const [dep,code] of [['95','95127'],['69','69381'],['2A','2A004']]){const data=JSON.parse(readFileSync(new URL('../public/rents-2025/'+dep+'.json',import.meta.url)));for(const kind of ['apartment','house']){const r=data[code][kind];assert.ok(r.value>0);assert.ok(['commune','maille'].includes(r.scope));assert.ok(r.low<r.high);assert.ok(r.observations>=0);}}
});

test('rental PLM range is explicit, with no invented municipal mean',()=>{const d=rentalProfile({'69381':{apartment:{value:10}},'69382':{apartment:{value:20}}},'69123');assert.equal(d.apartment.value,null);assert.equal(d.apartment.minimum,10);assert.equal(d.apartment.maximum,20);assert.equal(d.apartment.partial,true);assert.equal(d.apartment.scope,'arrondissements');});
