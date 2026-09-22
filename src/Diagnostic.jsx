import React,{useEffect,useState,useRef} from 'react';
import {ArrowUpRight,ArrowClockwise,DownloadSimple,PersonSimpleWalk} from '@phosphor-icons/react';
import {loadDiagnostic,getJson,featureList} from './diagnostic.js';
import {SourceNotes} from './SourceNotes.jsx';
import {fmt} from './territory.js';
import {MarketSection} from './MarketSection.jsx';
import {featureLabel} from './feature-label.js';
export {featureLabel} from './feature-label.js';

/* Keys displayed in each audience view, in order */
const AGENT_KEYS=['parcel','urban','buildings','supSurface','supLine','supPoint','risks'];
const PROMOTEUR_KEYS=['urban','supSurface','supLine','supPoint','risks','nature','birds','znieff','znieff2','reserve','regionalPark','parcel'];

function SourceItems({items,sourceKey}){const labels=[...new Set(items.map(x=>typeof x==='string'?x:featureLabel(x,sourceKey)))];return <p className="concise-result">{labels.join(' · ')}</p>;}
function Fact({label,value}){return <div><dt>{label}</dt><dd>{value}</dd></div>;}
function sourceValue(source,value){return !source||source.status==='loading'?'Chargement…':source.status==='error'?'Indisponible':value;}

function DiagSection({d}){
 return <section className="diagnostic-section" key={d.key}>
  <div className="diagnostic-heading">
   <h3>{d.key==='risks'?'Risques dans la commune':d.title}</h3>
   {d.status==='success'&&<span className="source-status">{d.items.length} résultat{d.items.length>1?'s':''}</span>}
  </div>
  {d.status==='error'?<p className="data-warning">Données indisponibles</p>:d.status==='loading'?<p>Chargement…</p>:d.items.length?<SourceItems items={d.items} sourceKey={d.key}/>:<p className="empty-result">Aucun élément retourné</p>}
  {d.truncated&&<p className="data-warning">Résultats partiels</p>}
 </section>;
}

export function Diagnostic({city,point,audience,onGeometry,onIsochrone}){
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

 const parcelId=data.parcel?.items?.length===1&&data.parcel.items[0].properties?.idu?data.parcel.items[0].properties.idu:null;

 /* ---------- Sections ordonnées par audience ---------- */
 function renderSections(keys){
  return keys.map(key=>{const d=data[key];if(!d)return null;return <DiagSection key={key} d={d}/>;});
 }
 function renderRemaining(excludeKeys){
  return Object.values(data).filter(d=>!excludeKeys.includes(d.key)&&!['parcel','urban'].includes(d.key)&&d.key!=='buildings').map(d=><DiagSection key={d.key} d={d}/>);
 }

 const header=<>
  <p className="eyebrow">DIAGNOSTIC DU LIEU</p>
  <h2 id="detail-title">{data.parcel?.items?.length===1?"Votre parcelle":"Votre sélection"} à {city.nom}.</h2>
  <p className="dialog-intro">{point.label||'Point sélectionné sur la carte'}<br/><span>{point.lat.toFixed(5)}° N · {point.lon.toFixed(5)}° E</span></p>
  <div className="report-actions">
   <button onClick={()=>setRetry(x=>x+1)}><ArrowClockwise/> Actualiser</button>
   <button onClick={exportReport} disabled={pdfBusy||Object.keys(data).length===0||Object.values(data).some(d=>d.status==='loading')}><DownloadSimple/> {pdfBusy?'Préparation…':'Synthèse PDF'}</button>
  </div>
  {pdfError&&<p role="alert" className="data-warning">{pdfError}</p>}
 </>;

 /* ---- AGENT : parcelle + bâti + marché puis le reste ---- */
 if(audience==='agent'){
  return <>{header}
   <p className="audience-section-intro agent-intro">Cadastre · bâti · DPE · marché immobilier</p>
   {/* Parcel + PLU */}
   <section className="diagnostic-section"><h3>Parcelle et urbanisme</h3><dl className="readable-facts">
    <Fact label="Parcelle" value={sourceValue(data.parcel,data.parcel?.items?.length?data.parcel.items.map(x=>`${x.properties.section||''} ${x.properties.numero||''}`).join(' · '):'Non identifiée')}/>
    <Fact label="Surface cadastrale" value={sourceValue(data.parcel,data.parcel?.items?.length===1&&data.parcel.items[0].properties.contenance!=null?fmt(data.parcel.items[0].properties.contenance)+' m²':'Non disponible')}/>
    <Fact label="Zone PLU" value={sourceValue(data.urban,data.urban?.items?.length?[...new Set(data.urban.items.map(x=>x.properties.libelle||x.properties.typezone||'Non renseignée'))].join(' · '):'Non retournée')}/>
    <Fact label="Description de la zone" value={sourceValue(data.urban,data.urban?.items?.length?[...new Set(data.urban.items.map(x=>x.properties.libelong||'Non renseignée'))].join(' · '):'Non retournée')}/>
   </dl></section>
   {/* Buildings + DPE */}
   {data.buildings&&<DiagSection d={data.buildings}/>}
   {/* Risques */}
   {data.risks&&<DiagSection d={data.risks}/>}
   {/* Servitudes */}
   {data.supSurface&&<DiagSection d={data.supSurface}/>}
   {data.supLine&&<DiagSection d={data.supLine}/>}
   {data.supPoint&&<DiagSection d={data.supPoint}/>}
   {/* Market */}
   <MarketSection city={city} parcelId={parcelId||undefined}/>
   {/* Accessibilité */}
   <section className="diagnostic-section"><h3>Accessibilité à pied · 15 min</h3><button className="walk-button" onClick={isochrone} disabled={walk==='loading'}><PersonSimpleWalk/>{walk==='loading'?'Calcul en cours…':walk==='success'?'Recalculer les 15 minutes':'Voir les 15 minutes à pied'}</button>{walk==='success'&&<p>Zone affichée sur la carte.</p>}{walkError&&<p role="status">{walkError}</p>}</section>
   <SourceNotes><h4>Diagnostic parcellaire</h4>{Object.values(data).map(d=><p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}</a>{d.queriedAt?' · '+new Date(d.queriedAt).toLocaleDateString('fr-FR'):''}</p>)}<p>Zonages vérifiés au point, pas sur toute la parcelle. Un résultat vide ne prouve pas une absence de contrainte. La constructibilité reste à vérifier dans les documents opposables. DPE associé au groupe de bâtiments, à vérifier pour le logement.</p><div className="source-links"><a href={`https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${point.lon}&lat=${point.lat}&zoom=17`} target="_blank" rel="noreferrer">Documents d'urbanisme <ArrowUpRight/></a><a href={`https://www.georisques.gouv.fr/api/v1/rapport_pdf?latlon=${point.lon},${point.lat}`} target="_blank" rel="noreferrer">Rapport Géorisques <ArrowUpRight/></a></div></SourceNotes>
  </>;
 }

 /* ---- PROMOTEUR : PLU + contraintes + nature puis parcelle ---- */
 if(audience==='promoteur'){
  return <>{header}
   <p className="audience-section-intro promoteur-intro">PLU · servitudes · risques · environnement · potentiel constructible</p>
   {/* PLU focus */}
   <section className="diagnostic-section"><h3>Zone PLU et constructibilité</h3><dl className="readable-facts">
    <Fact label="Zone PLU" value={sourceValue(data.urban,data.urban?.items?.length?[...new Set(data.urban.items.map(x=>x.properties.libelle||x.properties.typezone||'Non renseignée'))].join(' · '):'Non retournée')}/>
    <Fact label="Description de la zone" value={sourceValue(data.urban,data.urban?.items?.length?[...new Set(data.urban.items.map(x=>x.properties.libelong||'Non renseignée'))].join(' · '):'Non retournée')}/>
    <Fact label="Parcelle" value={sourceValue(data.parcel,data.parcel?.items?.length?data.parcel.items.map(x=>`${x.properties.section||''} ${x.properties.numero||''}`).join(' · '):'Non identifiée')}/>
    <Fact label="Surface cadastrale" value={sourceValue(data.parcel,data.parcel?.items?.length===1&&data.parcel.items[0].properties.contenance!=null?fmt(data.parcel.items[0].properties.contenance)+' m²':'Non disponible')}/>
   </dl><div className="source-links" style={{marginTop:'14px'}}><a href={`https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${point.lon}&lat=${point.lat}&zoom=17`} target="_blank" rel="noreferrer">Documents d'urbanisme complets <ArrowUpRight/></a></div></section>
   {/* Servitudes */}
   {data.supSurface&&<DiagSection d={data.supSurface}/>}
   {data.supLine&&<DiagSection d={data.supLine}/>}
   {data.supPoint&&<DiagSection d={data.supPoint}/>}
   {/* Risques */}
   {data.risks&&<DiagSection d={data.risks}/>}
   {/* Environnement */}
   {data.nature&&<DiagSection d={data.nature}/>}
   {data.birds&&<DiagSection d={data.birds}/>}
   {data.znieff&&<DiagSection d={data.znieff}/>}
   {data.znieff2&&<DiagSection d={data.znieff2}/>}
   {data.reserve&&<DiagSection d={data.reserve}/>}
   {data.regionalPark&&<DiagSection d={data.regionalPark}/>}
   {/* Bâti existant */}
   {data.buildings&&<DiagSection d={data.buildings}/>}
   {/* Accessibilité */}
   <section className="diagnostic-section"><h3>Accessibilité à pied · 15 min</h3><button className="walk-button" onClick={isochrone} disabled={walk==='loading'}><PersonSimpleWalk/>{walk==='loading'?'Calcul en cours…':walk==='success'?'Recalculer les 15 minutes':'Calculer l'isochrone piéton'}</button>{walk==='success'&&<p>Zone affichée sur la carte.</p>}{walkError&&<p role="status">{walkError}</p>}</section>
   <SourceNotes><h4>Diagnostic parcellaire · potentiel constructible</h4>{Object.values(data).map(d=><p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}</a>{d.queriedAt?' · '+new Date(d.queriedAt).toLocaleDateString('fr-FR'):''}</p>)}<p>Zonages vérifiés au point, pas sur toute la parcelle. Un résultat vide ne prouve pas une absence de contrainte. La constructibilité reste à vérifier dans les documents opposables.</p><div className="source-links"><a href={`https://www.georisques.gouv.fr/api/v1/rapport_pdf?latlon=${point.lon},${point.lat}`} target="_blank" rel="noreferrer">Rapport Géorisques <ArrowUpRight/></a></div></SourceNotes>
  </>;
 }

 /* ---- PARTICULIER : vue standard ---- */
 return <><p className="eyebrow">DIAGNOSTIC DU LIEU</p><h2 id="detail-title">{data.parcel?.items?.length===1?"Votre parcelle":"Votre sélection"} à {city.nom}.</h2><p className="dialog-intro">{point.label||'Point sélectionné sur la carte'}<br/><span>{point.lat.toFixed(5)}° N · {point.lon.toFixed(5)}° E</span></p><div className="report-actions"><button onClick={()=>setRetry(x=>x+1)}><ArrowClockwise/> Actualiser</button><button onClick={exportReport} disabled={pdfBusy||Object.keys(data).length===0||Object.values(data).some(d=>d.status==='loading')}><DownloadSimple/> {pdfBusy?'Préparation…':'Synthèse PDF'}</button></div>{pdfError&&<p role="alert" className="data-warning">{pdfError}</p>}
 <section className="diagnostic-section"><h3>Parcelle et urbanisme</h3><dl className="readable-facts">
 <Fact label="Parcelle" value={sourceValue(data.parcel,data.parcel?.items?.length?data.parcel.items.map(x=>`${x.properties.section||''} ${x.properties.numero||''}`).join(' · '):'Non identifiée')}/>
 <Fact label="Surface cadastrale" value={sourceValue(data.parcel,data.parcel?.items?.length===1&&data.parcel.items[0].properties.contenance!=null?fmt(data.parcel.items[0].properties.contenance)+' m²':'Non disponible')}/>
 <Fact label="Zone PLU" value={sourceValue(data.urban,data.urban?.items?.length?[...new Set(data.urban.items.map(x=>x.properties.libelle||x.properties.typezone||'Non renseignée'))].join(' · '):'Non retournée')}/>
 <Fact label="Description de la zone" value={sourceValue(data.urban,data.urban?.items?.length?[...new Set(data.urban.items.map(x=>x.properties.libelong||'Non renseignée'))].join(' · '):'Non retournée')}/>
 </dl></section>
 <div className="diagnostic-sections">{Object.values(data).filter(d=>!['parcel','urban'].includes(d.key)).map(d=><DiagSection key={d.key} d={d}/>)}</div>
 <section className="diagnostic-section"><h3>Accessibilité à pied</h3><button className="walk-button" onClick={isochrone} disabled={walk==='loading'}><PersonSimpleWalk/>{walk==='loading'?'Calcul en cours…':walk==='success'?'Recalculer les 15 minutes':'Voir les 15 minutes à pied'}</button>{walk==='success'&&<p>Zone affichée sur la carte. Explorez-la sur la carte.</p>}{walkError&&<p role="status">{walkError}</p>}</section>
 {parcelId&&<MarketSection city={city} parcelId={parcelId}/>}
 <SourceNotes><h4>Diagnostic parcellaire</h4>{Object.values(data).map(d=><p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}</a>{d.queriedAt?' · '+new Date(d.queriedAt).toLocaleDateString('fr-FR'):''}</p>)}<p>Zonages vérifiés au point, pas sur toute la parcelle. Un résultat vide ne prouve pas une absence de contrainte. La constructibilité reste à vérifier dans les documents opposables. DPE associé au groupe de bâtiments, à vérifier pour le logement. Les risques sont communaux. Marche : estimation Valhalla / OpenStreetMap, accessibilité PMR non vérifiée.</p><div className="source-links"><a href={`https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${point.lon}&lat=${point.lat}&zoom=17`} target="_blank" rel="noreferrer">Documents d'urbanisme <ArrowUpRight/></a><a href={`https://www.georisques.gouv.fr/api/v1/rapport_pdf?latlon=${point.lon},${point.lat}`} target="_blank" rel="noreferrer">Rapport Géorisques <ArrowUpRight/></a></div></SourceNotes></>;
}
