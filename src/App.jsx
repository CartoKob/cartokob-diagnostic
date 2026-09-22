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

const AUDIENCES=[
  {key:'particulier',label:'Particulier',icon:'🏡'},
  {key:'agent',label:'Agent immo',icon:'🔑'},
  {key:'promoteur',label:'Promoteur',icon:'🏗️'},
];

export function App(){
 const [communes,setCommunes]=useState([]),[loading,setLoading]=useState(true),[city,setCity]=useState(null),[point,setPoint]=useState(null),[parcels,setParcels]=useState([]),[isochrone,setIsochrone]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[level,setLevel]=useState('commune'),[focusVersion,setFocusVersion]=useState(0);
 const [sourceHost,setSourceHost]=useState(null);
 const [audience,setAudience]=useState('particulier');
 const [districtCode,setDistrictCode]=useState(null);
 const panel=useRef(),parcelSection=useRef(),communeSection=useRef();
 useEffect(()=>{if(point&&parcelSection.current&&panel.current)panel.current.scrollTo?.({top:parcelSection.current.offsetTop-65,behavior:'smooth'});else panel.current?.scrollTo?.({top:0});},[city?.code,point]);
 const pending=useRef(),selection=useRef(null);selection.current=city;
 useEffect(()=>{const controller=new AbortController();getJson(import.meta.env.BASE_URL+'communes.json',{signal:controller.signal}).then(data=>{if(controller.signal.aborted)return;const list=data.map(c=>({...c,key:normalize(c.nom)}));setCommunes(list);const code=new URLSearchParams(location.search).get('commune');if(code)setCity(list.find(c=>c.code===code)||null);}).catch(()=>{if(!controller.signal.aborted)setError('Impossible de charger le référentiel. Rechargez la page.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>{controller.abort();pending.current?.abort();};},[]);
 function chooseCommune(c){pending.current?.abort();setBusy(false);setCity(c);setDistrictCode(null);setLevel('commune');setPoint(null);setParcels([]);setIsochrone(null);setError('');saveUrl(c.code);}
 function saveUrl(code){const url=new URL(location.href);url.searchParams.set('commune',code);history.replaceState({},'',url);}
 async function choosePoint({lat,lng,label},directAddress=false){
  if(loading)return;pending.current?.abort();const controller=new AbortController();pending.current=controller;setBusy(true);setError('');
  try{const data=await getJson(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=code`,{signal:controller.signal});if(controller.signal.aborted)return;
   const c=communes.find(c=>c.code===parentCommune(data[0]?.code||''));if(!c){setError('Choisissez un lieu situé en France métropolitaine.');return;}
   const nextLevel=selectionLevel(selection.current?.code,c.code,directAddress);
   const rawCode=data[0]?.code||'';setDistrictCode(rawCode&&rawCode!==c.code?rawCode:null);setCity(c);setLevel(nextLevel);setPoint(nextLevel==='parcel'?{lat,lon:lng,label:label||'Point sélectionné sur la carte'}:null);setParcels([]);setIsochrone(null);saveUrl(c.code);
  }catch{if(!controller.signal.aborted)setError('La localisation est momentanément indisponible. Réessayez.');}finally{if(!controller.signal.aborted)setBusy(false);}
 }
 function exploreParcel(){setError('');setFocusVersion(v=>v+1);document.getElementById('carte')?.scrollIntoView({behavior:'smooth',block:'start'});}
 function backToCommune(){pending.current?.abort();setBusy(false);setLevel('commune');setPoint(null);setParcels([]);setIsochrone(null);setError('');}
 function resetApp(){pending.current?.abort();setBusy(false);setCity(null);setDistrictCode(null);setLevel('commune');setPoint(null);setParcels([]);setIsochrone(null);setError('');const url=new URL(location.href);url.searchParams.delete('commune');history.replaceState({},'',url);}
 function switchAudience(key){
  setAudience(key);
  if(key==='particulier'){panel.current?.scrollTo?.({top:0,behavior:'smooth'});}
  else if(point){parcelSection.current?.scrollIntoView({behavior:'smooth',block:'start'});}
  else{exploreParcel();}
 }
 return <SourceDestination.Provider value={sourceHost}><main>
 <header className="masthead"><a className="brand" href="./" aria-label="CartoParcelle par CartoKob, accueil">CartoParcelle<span>COMMUNE · QUARTIER · PARCELLE<br/>par CartoKob</span></a><SearchBox communes={communes} loading={loading} selectionLabel={point?.label||city?.nom||''} onSelect={c=>c.address?choosePoint({lat:c.lat,lng:c.lon,label:c.nom},true):chooseCommune(c)}/><div className="brand-note"><span>LE TERRITOIRE<br/>LE QUARTIER<br/>LA PARCELLE</span><img src={import.meta.env.BASE_URL+'france.svg'} alt="France métropolitaine"/><span>UN LIEU.<br/>LES BONNES<br/>QUESTIONS.</span></div></header>
 <div role="status" className={error||busy?'status visible':'status'}>{busy?'Localisation de votre sélection…':error}</div>
 <div className="atlas-workspace">
 <MapView city={city} point={point} parcels={parcels} isochrone={isochrone} onPoint={choosePoint} focusVersion={focusVersion}/>
 <aside className="information-panel" ref={panel} aria-label="Informations du territoire">
 <div className="panel-toolbar"><span>VOTRE LIEU À LA LOUPE</span><span>{city?city.codeDepartement:'FRANCE'}</span>{city&&<button className="reset-btn" onClick={resetApp} aria-label="Nouvelle recherche" title="Nouvelle recherche">✕</button>}</div>
 {city?<>
 <header className="panel-place"><p className="eyebrow">01 · LA COMMUNE</p><h1>{city.nom}</h1><p>{city.departement.nom} · {city.region.nom}</p></header>
 <nav className="audience-nav" aria-label="Profil utilisateur">
  {AUDIENCES.map(a=><button key={a.key} className={audience===a.key?'audience-btn active':'audience-btn'} onClick={()=>switchAudience(a.key)}><span className="audience-icon">{a.icon}</span><span>{a.label}</span></button>)}
 </nav>
 {audience==='particulier'&&<div className="audience-hint">Portrait de la commune · prix au m² · vie locale</div>}
 {audience==='agent'&&<div className="audience-hint">Cadastre · bâti · DPE · marché immobilier</div>}
 {audience==='promoteur'&&<div className="audience-hint">PLU · servitudes · risques · potentiel constructible</div>}
 <CommunePortrait key={districtCode||city.code} city={city} districtCode={districtCode} audience={audience} onExplore={exploreParcel}/>
 <section className="parcel-report" ref={parcelSection} aria-label="Informations de la parcelle">
 <div className="parcel-divider"><p className="eyebrow">02 · LA PARCELLE</p>{point&&<button className="text-button" onClick={backToCommune}>Effacer la sélection</button>}</div>
 {point?<Diagnostic key={`${city.code}:${point.lat},${point.lon}`} city={city} point={point} audience={audience} onGeometry={setParcels} onIsochrone={setIsochrone}/>:<div className="parcel-empty"><MapTrifold size={26}/><h2>
   {audience==='agent'?'La parcelle de votre client ?':audience==='promoteur'?'Analyser un terrain ?':'Et ce terrain ?'}
 </h2><p>
   {audience==='agent'?'Cliquez dans la commune pour afficher le cadastre, la zone PLU, le bâti et les transactions immobilières.':audience==='promoteur'?'Cliquez dans la commune pour analyser le potentiel constructible : PLU, servitudes, risques et nature.':"Cliquez dans la commune pour afficher ici le cadastre, l'urbanisme et les informations du bien."}
 </p><button className="outline-button" onClick={exploreParcel}>Zoomer sur les parcelles <ArrowRight size={15}/></button></div>}
 </section>
 </>:<section className="panel-welcome"><p className="eyebrow">CARTOPARCELLE</p><h1>Un lieu.<br/>Les bonnes questions.</h1><p>Recherchez une commune ou cliquez sur la carte.</p><ol><li><strong>Particulier</strong><span>Portrait de la commune, revenus, logements, services et prix au m².</span></li><li><strong>Agent immobilier</strong><span>Cadastre, zone PLU, bâtiments, DPE et transactions DVF de la parcelle.</span></li><li><strong>Promoteur</strong><span>PLU, servitudes, risques naturels, Natura 2000 et potentiel constructible.</span></li></ol></section>}
 {city&&<section className="all-sources"><h3>Sources et précisions</h3><div ref={setSourceHost}/></section>}
 </aside></div>
 <footer><div className="signature">CartoParcelle <span>—</span> CartoKob</div><span className="edition">France métropolitaine <span>·</span> Version de travail</span></footer>
 </main></SourceDestination.Provider>
}
