import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,MapTrifold} from '@phosphor-icons/react';
import {normalize} from './search.js';
import {Diagnostic} from './Diagnostic.jsx';
import {CommunePortrait} from './CommunePortrait.jsx';
import {MapView} from './MapView.jsx';
import {SourceDestination} from './SourceNotes.jsx';
import {SearchBox} from './SearchBox.jsx';
import {getJson} from './diagnostic.js';
import {parentCommune,selectionLevel} from './territory.js';
export function App(){
 const [communes,setCommunes]=useState([]),[loading,setLoading]=useState(true),[city,setCity]=useState(null),[point,setPoint]=useState(null),[parcels,setParcels]=useState([]),[isochrone,setIsochrone]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[level,setLevel]=useState('commune'),[focusVersion,setFocusVersion]=useState(0);
 const [sourceHost,setSourceHost]=useState(null);
 const panel=useRef(),parcelSection=useRef();
 useEffect(()=>{if(point&&parcelSection.current&&panel.current)panel.current.scrollTo?.({top:parcelSection.current.offsetTop-65,behavior:'smooth'});else panel.current?.scrollTo?.({top:0});},[city?.code,point]);
 const pending=useRef(),selection=useRef(null);selection.current=city;
 useEffect(()=>{const controller=new AbortController();getJson('/communes.json',{signal:controller.signal}).then(data=>{if(controller.signal.aborted)return;const list=data.map(c=>({...c,key:normalize(c.nom)}));setCommunes(list);const code=new URLSearchParams(location.search).get('commune');if(code)setCity(list.find(c=>c.code===code)||null);}).catch(()=>{if(!controller.signal.aborted)setError('Impossible de charger le référentiel. Rechargez la page.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>{controller.abort();pending.current?.abort();};},[]);
 function chooseCommune(c){pending.current?.abort();setBusy(false);setCity(c);setLevel('commune');setPoint(null);setParcels([]);setIsochrone(null);setError('');saveUrl(c.code);}
 function saveUrl(code){const url=new URL(location.href);url.searchParams.set('commune',code);history.replaceState({},'',url);}
 async function choosePoint({lat,lng,label},directAddress=false){
  if(loading)return;pending.current?.abort();const controller=new AbortController();pending.current=controller;setBusy(true);setError('');
  try{const data=await getJson(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=code`,{signal:controller.signal});if(controller.signal.aborted)return;
   const c=communes.find(c=>c.code===parentCommune(data[0]?.code||''));if(!c){setError('Choisissez un lieu situé en France métropolitaine.');return;}
   const nextLevel=selectionLevel(selection.current?.code,c.code,directAddress);
   setCity(c);setLevel(nextLevel);setPoint(nextLevel==='parcel'?{lat,lon:lng,label:label||'Point sélectionné sur la carte'}:null);setParcels([]);setIsochrone(null);saveUrl(c.code);
  }catch{if(!controller.signal.aborted)setError('La localisation est momentanément indisponible. Réessayez.');}finally{if(!controller.signal.aborted)setBusy(false);}
 }
 function exploreParcel(){setError('');setFocusVersion(v=>v+1);document.getElementById('carte')?.scrollIntoView({behavior:'smooth',block:'start'});}
 function backToCommune(){pending.current?.abort();setBusy(false);setLevel('commune');setPoint(null);setParcels([]);setIsochrone(null);setError('');}
 return <SourceDestination.Provider value={sourceHost}><main>
 <header className="masthead"><a className="brand" href="./" aria-label="CartoKob, accueil">CartoKob<span>COMPRENDRE LES TERRITOIRES<br/>POUR AGIR DEMAIN</span></a><SearchBox communes={communes} loading={loading} selectionLabel={point?.label||city?.nom||''} onSelect={c=>c.address?choosePoint({lat:c.lat,lng:c.lon,label:c.nom},true):chooseCommune(c)}/><div className="brand-note"><span>LE TERRITOIRE<br/>LE QUARTIER<br/>LA PARCELLE</span><img src="/france.svg" alt="France métropolitaine"/><span>UN LIEU.<br/>LES BONNES<br/>QUESTIONS.</span></div></header>
 <div role="status" className={error||busy?'status visible':'status'}>{busy?'Localisation de votre sélection…':error}</div>
 <div className="atlas-workspace">
 <MapView city={city} point={point} parcels={parcels} isochrone={isochrone} onPoint={choosePoint} focusVersion={focusVersion}/>
 <aside className="information-panel" ref={panel} aria-label="Informations du territoire">
 <div className="panel-toolbar"><span>VOTRE LIEU À LA LOUPE</span><span>{city?city.codeDepartement:'FRANCE'}</span></div>
 {city?<>
 <header className="panel-place"><p className="eyebrow">01 · LA COMMUNE</p><h1>{city.nom}</h1><p>{city.departement.nom} · {city.region.nom}</p></header>
 <nav className="panel-navigation" aria-label="Niveau de lecture"><button onClick={()=>panel.current?.scrollTo?.({top:0,behavior:'smooth'})}>La commune</button><button onClick={()=>point?parcelSection.current?.scrollIntoView({behavior:'smooth',block:'start'}):exploreParcel()}>{point?'La parcelle':'Choisir une parcelle'} <ArrowRight size={14}/></button></nav>
 <CommunePortrait key={city.code} city={city} onExplore={exploreParcel}/>
 <section className="parcel-report" ref={parcelSection} aria-label="Informations de la parcelle">
 <div className="parcel-divider"><p className="eyebrow">02 · LA PARCELLE</p>{point&&<button className="text-button" onClick={backToCommune}>Effacer la sélection</button>}</div>
 {point?<Diagnostic key={`${city.code}:${point.lat},${point.lon}`} city={city} point={point} onGeometry={setParcels} onIsochrone={setIsochrone}/>:<div className="parcel-empty"><MapTrifold size={26}/><h2>Et ce terrain ?</h2><p>Cliquez dans la commune pour afficher ici le cadastre, l’urbanisme et les informations du bien.</p><button className="outline-button" onClick={exploreParcel}>Zoomer sur les parcelles <ArrowRight size={15}/></button></div>}
 </section>
 </>:<section className="panel-welcome"><p className="eyebrow">L’ATLAS CARTOKOB</p><h1>Un lieu.<br/>Les bonnes questions.</h1><p>Recherchez une commune ou cliquez sur la carte.</p><ol><li><strong>Découvrez la commune</strong><span>Habitants, logements, revenus et vie locale.</span></li><li><strong>Explorez une parcelle</strong><span>Cliquez ensuite dans la commune : les informations du terrain apparaîtront juste dessous.</span></li></ol></section>}
 {city&&<section className="all-sources"><h3>Sources et précisions</h3><div ref={setSourceHost}/></section>}
 </aside></div>
 <footer><div className="signature">Atlas éditorial <span>—</span> CartoKob</div><span className="edition">France métropolitaine <span>·</span> Version de travail</span></footer>
 </main></SourceDestination.Provider>
}
