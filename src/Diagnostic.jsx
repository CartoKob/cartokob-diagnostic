import React,{useEffect,useState,useRef} from 'react';
import {ArrowUpRight,ArrowClockwise,DownloadSimple,PersonSimpleWalk} from '@phosphor-icons/react';
import {loadDiagnostic,getJson,featureList} from './diagnostic.js';
import {SourceNotes} from './SourceNotes.jsx';
import {fmt} from './territory.js';
import {MarketSection} from './MarketSection.jsx';
import {featureLabel} from './feature-label.js';
export {featureLabel} from './feature-label.js';

function SourceItems({items,sourceKey}){const labels=[...new Set(items.map(x=>typeof x==='string'?x:featureLabel(x,sourceKey)))];return <p className="concise-result">{labels.join(' · ')}</p>;}
function Fact({label,value,accent}){return <div className={accent?`fact-${accent}`:''}><dt>{label}</dt><dd>{value}</dd></div>;}

function CountCard({label,src,accentHit}){
 if(!src)return <div><dt>{label}</dt><dd>—</dd></div>;
 if(src.status==='loading')return <div><dt>{label}</dt><dd className="fact-loading">…</dd></div>;
 if(src.status==='error')return <div><dt>{label}</dt><dd className="fact-error">Indispo.</dd></div>;
 const n=src.items.length;
 const names=n?[...new Set(src.items.map(x=>typeof x==='string'?x:featureLabel(x,src.key)).filter(Boolean))].slice(0,3):[]; 
 return <div className={n>0&&accentHit?'fact-hit':''}><dt>{label}</dt><dd className={n===0?'count-zero':'count-nonzero'}>{n===0?'Aucun':`${n}`}</dd>{names.length>0&&<p className="card-names">{names.join(' · ')}</p>}</div>;
}

function sourceValue(source,value){return !source||source.status==='loading'?'…':source.status==='error'?'Indisponible':value;}

export function Diagnostic({city,point,onGeometry,onIsochrone}){
 const walkController=useRef(null);
 useEffect(()=>()=>walkController.current?.abort(),[]);
 const [data,setData]=useState({}),[retry,setRetry]=useState(0),[walk,setWalk]=useState('idle');
 useEffect(()=>{const controller=new AbortController();setData({});setWalk('idle');setWalkError('');onGeometry([]);onIsochrone(null);walkController.current?.abort();loadDiagnostic(point,city.code,{signal:controller.signal,onUpdate:(key,result)=>{if(!controller.signal.aborted){setData(d=>({...d,[key]:result}));if(key==='parcel'&&result.status==='success')onGeometry(result.items);}}});return()=>controller.abort();},[point,city.code,retry]);
 const [walkError,setWalkError]=useState('');
 async function isochrone(){walkController.current?.abort();const controller=new AbortController();walkController.current=controller;setWalk('loading');setWalkError('');try{const d=await getJson('https://valhalla1.openstreetmap.de/isochrone',{signal:controller.signal,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locations:[{lat:point.lat,lon:point.lon}],costing:'pedestrian',contours:[{time:15,color:'265de1'}],polygons:true,generalize:25})});if(controller.signal.aborted)return;if(!featureList(d).length)throw Error();onIsochrone(d);setWalk('success');}catch{if(controller.signal.aborted)return;setWalk('error');setWalkError('Le calcul piéton est indisponible. Réessayez dans quelques instants.');}}
 const [pdfError,setPdfError]=useState(''),[pdfBusy,setPdfBusy]=useState(false);
 async function exportReport(){
  setPdfError('');
  const tab=window.open('about:blank','_blank');
  if(!tab){setPdfError('Autorisez les fenêtres surgissantes pour ouvrir la synthèse PDF, puis réessayez.');return;}
  tab.opener=null;tab.document.title='CartoKob - Préparation du PDF';tab.document.body.textContent='Préparation de votre synthèse CartoKob…';setPdfBusy(true);
  try{const {createDiagnosticPdf}=await import('./report-pdf.js');const pdf=createDiagnosticPdf({city,point,data});const url=URL.createObjectURL(pdf.output('blob'));if(tab.closed){URL.revokeObjectURL(url);return;}tab.location.replace(url);setTimeout(()=>URL.revokeObjectURL(url),600000);}
  catch{if(!tab.closed)tab.close();setPdfError('La synthèse PDF n'a pas pu être créée. Réessayez.');}
  finally{setPdfBusy(false);}
 }

 const parcel=data.parcel,urban=data.urban;
 const parcelId=parcel?.items?.length===1?parcel.items[0].properties?.idu:null;

 /* Valeur parcelle+urba */
 const parcelRef=parcel?.items?.length?parcel.items.map(x=>`${x.properties.section||''} ${x.properties.numero||''}`.trim()).join(' · '):'Non identifiée';
 const parcelSurf=parcel?.items?.length===1&&parcel.items[0].properties.contenance!=null?fmt(parcel.items[0].properties.contenance)+' m²':'Non disponible';
 const zonePlu=urban?.items?.length?[...new Set(urban.items.map(x=>x.properties.libelle||x.properties.typezone||'?'))].join(' · '):'Non retournée';
 const zoneDesc=urban?.items?.length?[...new Set(urban.items.map(x=>x.properties.liblong||'Non renseignée'))].join(' · '):'Non retournée';

 return <>
 <p className="eyebrow">DIAGNOSTIC DU LIEU</p>
 <h2 id="detail-title">{parcel?.items?.length===1?"Votre parcelle":"Votre sélection"} à {city.nom}.</h2>
 <p className="dialog-intro">{point.label||'Point sélectionné sur la carte'}<br/><span>{point.lat.toFixed(5)}° N · {point.lon.toFixed(5)}° E</span></p>
 <div className="report-actions">
  <button onClick={()=>setRetry(x=>x+1)}><ArrowClockwise/> Actualiser</button>
  <button onClick={exportReport} disabled={pdfBusy||Object.keys(data).length===0||Object.values(data).some(d=>d.status==='loading')}><DownloadSimple/> {pdfBusy?'Préparation…':'Ouvrir la synthèse PDF'}</button>
 </div>
 {pdfError&&<p role="alert" className="data-warning">{pdfError}</p>}

 {/* BLOC 1 : Parcelle & PLU */}
 <section className="diagnostic-section diag-block-primary">
  <h3>Parcelle et urbanisme</h3>
  <dl className="readable-facts colored-facts">
   <Fact label="Parcelle" value={sourceValue(parcel,parcelRef)} accent="sage"/>
   <Fact label="Surface cadastrale" value={sourceValue(parcel,parcelSurf)} accent="sand"/>
   <Fact label="Zone PLU" value={sourceValue(urban,zonePlu)} accent="lavender"/>
   <Fact label="Description de la zone" value={sourceValue(urban,zoneDesc)} accent="blue"/>
  </dl>
 </section>

 {/* BLOC 2 : Bâtiments (si identifié) */}
 {data.buildings&&<section className="diagnostic-section">
  <h3>Bâtiments · BDNB</h3>
  {data.buildings.status==='loading'?<p>Chargement…</p>:data.buildings.status==='error'?<p className="data-warning">Données indisponibles</p>:data.buildings.items.length?<SourceItems items={data.buildings.items} sourceKey="buildings"/>:<p className="empty-result">Aucun groupe de bâtiments identifié</p>}
 </section>}

 {/* BLOC 3 : Servitudes (grille compacte) */}
 <section className="diagnostic-section">
  <h3>Servitudes d'utilité publique</h3>
  <dl className="readable-facts sup-facts">
   <CountCard label="Surfaciques" src={data.supSurface} accentHit/>
   <CountCard label="Linéaires" src={data.supLine} accentHit/>
   <CountCard label="Ponctuelles" src={data.supPoint} accentHit/>
   {(data.supSurface?.items?.length>0||data.supLine?.items?.length>0||data.supPoint?.items?.length>0)&&
    <div className="sup-detail-col">
     {['supSurface','supLine','supPoint'].flatMap(k=>(data[k]?.items||[]).map(x=>typeof x==='string'?x:featureLabel(x,k)).filter(Boolean)).slice(0,6).map((s,i)=><span key={i} className="sup-tag">{s}</span>)}
    </div>}
  </dl>
 </section>

 {/* BLOC 4 : Risques */}
 {data.risks&&<section className="diagnostic-section">
  <h3>Risques recensés · GASPAR</h3>
  {data.risks.status==='loading'?<p>Chargement…</p>:data.risks.status==='error'?<p className="data-warning">Données indisponibles</p>:data.risks.items.length?<SourceItems items={data.risks.items} sourceKey="risks"/>:<p className="empty-result">Aucun risque retourné pour cette commune</p>}
 </section>}

 {/* BLOC 5 : Environnement (grille compacte) */}
 <section className="diagnostic-section">
  <h3>Zonages environnementaux</h3>
  <dl className="readable-facts env-facts">
   <CountCard label="Natura 2000 Habitats" src={data.nature} accentHit/>
   <CountCard label="Natura 2000 Oiseaux" src={data.birds} accentHit/>
   <CountCard label="ZNIEFF Type I" src={data.znieff} accentHit/>
   <CountCard label="ZNIEFF Type II" src={data.znieff2} accentHit/>
   <CountCard label="Réserves naturelles" src={data.reserve} accentHit/>
   <CountCard label="Parcs naturels rég." src={data.regionalPark} accentHit/>
  </dl>
 </section>

 {/* BLOC 6 : Accessibilité à pied */}
 <section className="diagnostic-section">
  <h3>Accessibilité à pied · 15 min</h3>
  <button className="walk-button" onClick={isochrone} disabled={walk==='loading'}>
   <PersonSimpleWalk/>{walk==='loading'?'Calcul en cours…':walk==='success'?'Recalculer l'isochrone':'Calculer les 15 min à pied'}
  </button>
  {walk==='success'&&<p className="empty-result">Zone affichée sur la carte.</p>}
  {walkError&&<p role="status" className="data-warning">{walkError}</p>}
 </section>

 {/* Marché immobilier */}
 {parcelId&&<MarketSection city={city} parcelId={parcelId}/>}

 <SourceNotes>
  <h4>Diagnostic parcellaire</h4>
  {Object.values(data).map(d=><p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}</a>{d.queriedAt?' · '+new Date(d.queriedAt).toLocaleDateString('fr-FR'):''}</p>)}
  <p>Zonages vérifiés au point, pas sur toute la parcelle. Un résultat vide ne prouve pas une absence de contrainte. La constructibilité reste à vérifier dans les documents opposables. DPE associé au groupe de bâtiments, à vérifier pour le logement. Les risques sont communaux. Marche : estimation Valhalla / OpenStreetMap, accessibilité PMR non vérifiée.</p>
  <div className="source-links">
   <a href={`https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${point.lon}&lat=${point.lat}&zoom=17`} target="_blank" rel="noreferrer">Documents d'urbanisme <ArrowUpRight/></a>
   <a href={`https://www.georisques.gouv.fr/api/v1/rapport_pdf?latlon=${point.lon},${point.lat}`} target="_blank" rel="noreferrer">Rapport Géorisques <ArrowUpRight/></a>
  </div>
 </SourceNotes>
 </>;
}
