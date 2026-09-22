import React,{useEffect,useState} from 'react';
import {Users,House,CreditCard,Briefcase,Buildings,Bank,Warning} from '@phosphor-icons/react';
import {loadCommune,fmt} from './territory.js';
import {LocalLife} from './LocalLife.jsx';
import {MarketSection} from './MarketSection.jsx';
import {SourceNotes} from './SourceNotes.jsx';

function KpiCard({icon:Icon,label,value,sub,tone}){
 return <div className={`kpi-card kpi-${tone}`}>
  <div className="kpi-icon"><Icon size={22} weight="bold"/></div>
  <p className="kpi-label">{label}</p>
  <p className="kpi-value">{value??'…'}</p>
  {sub&&<p className="kpi-sub">{sub}</p>}
 </div>;
}

function ThemeSection({num,label,question,icon:Icon,tone,item,children}){
 return <section className="theme-section">
  <div className="theme-header">
   <div className={`theme-icon theme-icon-${tone}`}><Icon size={19} weight="bold"/></div>
   <div className="theme-title">
    <p className="theme-num">{num} · {label}</p>
    <h3 className="theme-question">{question}</h3>
   </div>
  </div>
  {!item||item.status==='loading'
   ?<p className="theme-loading" role="status">Chargement…</p>
   :item.status==='error'
   ?<p className="data-warning">Données indisponibles</p>
   :<div className="theme-body">{children}</div>}
 </section>;
}

function Grid({rows}){
 return <div className="theme-grid">
  {rows.filter(([,v])=>v!=null&&v!==undefined).map(([l,v])=>
   <div key={l} className="theme-cell">
    <span className="cell-label">{l}</span>
    <strong className="cell-value">{v}</strong>
   </div>
  )}
 </div>;
}

function Metric({label,value,item,tone}){
 return <div className={`compact-metric ${tone}`}>
  <span>{label}</span>
  <strong>{item?.status==='error'?'Indisponible':!item||item.status==='loading'?'…':value}</strong>
 </div>;
}

function arrLabel(code){
 if(!code)return null;
 if(/^751(0[1-9]|1[0-9]|20)$/.test(code)){const n=parseInt(code.slice(3),10);return n===1?'1er arr. de Paris':`${n}e arr. de Paris`;}
 if(/^6938[1-9]$/.test(code)){const n=parseInt(code.slice(4),10);return n===1?'1er arr. de Lyon':`${n}e arr. de Lyon`;}
 if(/^132(0[1-9]|1[0-6])$/.test(code)){const n=parseInt(code.slice(3),10);return n===1?'1er arr. de Marseille':`${n}e arr. de Marseille`;}
 return null;
}

export function CommunePortrait({city,districtCode,audience,onExplore}){
 const dataCode=districtCode&&districtCode!==city.code?districtCode:city.code;
 const district=arrLabel(districtCode);
 const [data,setData]=useState({}),[refresh,setRefresh]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();setData({});
  loadCommune(dataCode,{signal:controller.signal,onUpdate:(key,value)=>{if(!controller.signal.aborted)setData(d=>({...d,[key]:value}));}});
  return()=>controller.abort();
 },[dataCode,refresh]);
 const pop=data.population?.data,home=data.housing?.data,income=data.income?.data,
       employment=data.employment?.data,equipment=data.equipment?.data,risks=data.risks?.data;
 const totalEquip=equipment?.rows?.reduce((s,r)=>s+(r.value||0),0);
 const young=pop?.ages?.[0]?.value,senior=(pop?.ages?.[5]?.value||0)+(pop?.ages?.[6]?.value||0);
 const youngPct=pop?.total>0&&young!=null?fmt(100*young/pop.total,1)+' %':null;
 const seniorPct=pop?.total>0&&senior?fmt(100*senior/pop.total,1)+' % ont 65 ans ou +':null;

 if(audience==='agent'){return <section className="commune-portrait audience-agent">
  <p className="audience-section-intro">Contexte communal · données de référence pour votre dossier</p>
  {district&&<p className="district-notice">Données au niveau : <strong>{district}</strong></p>}
  <div className="commune-metrics">
   <Metric label="Habitants" value={fmt(pop?.total)} item={data.population} tone="sage"/>
   <Metric label="Logements" value={fmt(home?.total)} item={data.housing} tone="sand"/>
   <Metric label="Niveau de vie médian" value={income?.median!=null?fmt(income.median)+' €/an':'Non dispo'} item={data.income} tone="lavender"/>
   <Metric label="Taux de pauvreté" value={income?.poverty!=null?fmt(income.poverty,1)+' %':'Non dispo'} item={data.income} tone="blue"/>
  </div>
  <ThemeSection num="01" label="LOGEMENTS" question="Le parc de logements" icon={House} tone="sand" item={data.housing}>
   {home&&<Grid rows={[["Total logements",fmt(home.total)],["Résidences principales",fmt(home.main)],["Logements vacants",fmt(home.vacant)],["Propriétaires occupants",home.ownerShare==null?'Non dispo':fmt(home.ownerShare,1)+' %'],["Maisons / Appartements",`${fmt(home.houses)} / ${fmt(home.apartments)}`]]}/>}
  </ThemeSection>
  <ThemeSection num="02" label="RISQUES" question="Risques recensés dans la commune" icon={Warning} tone="amber" item={data.risks}>
   {risks&&<p className="concise-result">{risks.length?risks.join(' · '):'Aucun risque retourné'}</p>}
  </ThemeSection>
  <MarketSection city={city}/>
  <SourceNotes><h4>Commune · {city.nom}{district?' · '+district:''}</h4>{Object.values(data).map(d=>d?.url&&<p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}{d.data?.year?' · '+d.data.year:''}</a></p>)}<button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Actualiser</button></SourceNotes>
 </section>;}

 if(audience==='promoteur'){return <section className="commune-portrait audience-promoteur">
  <p className="audience-section-intro">Contexte territorial · aide à la décision foncière</p>
  {district&&<p className="district-notice">Données au niveau : <strong>{district}</strong></p>}
  <div className="commune-metrics">
   <Metric label="Habitants" value={fmt(pop?.total)} item={data.population} tone="sage"/>
   <Metric label="Logements vacants" value={fmt(home?.vacant)} item={data.housing} tone="sand"/>
   <Metric label="Résidences principales" value={fmt(home?.main)} item={data.housing} tone="lavender"/>
   <Metric label="Appartements / Maisons" value={home?`${fmt(home.apartments)} / ${fmt(home.houses)}`:'…'} item={data.housing} tone="blue"/>
  </div>
  <ThemeSection num="01" label="POPULATION" question="Dynamique démographique" icon={Users} tone="blue" item={data.population}>
   {pop&&<Grid rows={[["Population totale",fmt(pop.total)+" habitants"],["Moins de 20 ans",youngPct||null],["65 ans ou plus",senior?fmt(100*senior/pop.total,1)+' %':null],["25–39 ans",pop.ages[2]?.value!=null?fmt(pop.ages[2].value):null]]}/>}
  </ThemeSection>
  <ThemeSection num="02" label="LOGEMENTS" question="Structure du parc" icon={House} tone="sand" item={data.housing}>
   {home&&<Grid rows={[["Total",fmt(home.total)],["Résidences principales",fmt(home.main)],["Résidences secondaires",fmt(home.secondary)],["Vacants",home.total>0?fmt(home.vacant)+' ('+fmt(100*home.vacant/home.total,1)+' %)':fmt(home.vacant)],["Propriétaires occupants",home.ownerShare==null?'Non dispo':fmt(home.ownerShare,1)+' %']]}/>}
  </ThemeSection>
  <ThemeSection num="03" label="RISQUES" question="Risques recensés" icon={Warning} tone="amber" item={data.risks}>
   {risks&&<p className="concise-result">{risks.length?risks.join(' · '):'Aucun risque retourné'}</p>}
  </ThemeSection>
  <SourceNotes><h4>Commune · {city.nom}{district?' · '+district:''}</h4>{Object.values(data).map(d=>d?.url&&<p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}{d.data?.year?' · '+d.data.year:''}</a></p>)}<button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Actualiser</button></SourceNotes>
 </section>;}

 return <section className="commune-portrait" aria-label={`Portrait de ${city.nom}`}>
  <div className="portrait-hero">
   <div className="portrait-hero-content">
    <p className="portrait-hero-label"><Bank size={12} weight="bold"/> PORTRAIT TERRITORIAL</p>
    <h2 className="portrait-hero-title">{district||('L’essentiel de '+city.nom)}</h2>
    <p className="portrait-hero-sub">{district&&<span className="hero-parent">{city.nom} · </span>}Habitants · habitat · emploi · services et cadre de vie</p>
   </div>
   <div className="portrait-hero-deco" aria-hidden="true"><span/><span/></div>
  </div>
  <div className="kpi-grid">
   <KpiCard icon={Users} label="POPULATION" value={data.population?.status==='loading'?'…':pop?.total!=null?fmt(pop.total):'—'} sub="habitants · Insee" tone="blue"/>
   <KpiCard icon={Users} label="MOINS DE 20 ANS" value={data.population?.status==='loading'?'…':youngPct??'—'} sub={data.population?.status==='success'?seniorPct:null} tone="yellow"/>
   <KpiCard icon={CreditCard} label="NIVEAU DE VIE" value={data.income?.status==='loading'?'…':income?.median!=null?fmt(income.median)+' €':'—'} sub="médiane ann. · Filosofi" tone="lavender"/>
   <KpiCard icon={Briefcase} label="ACTIFS EN EMPLOI" value={data.employment?.status==='loading'?'…':employment?.total!=null?fmt(employment.total):'—'} sub="résidents de 15 ans ou +" tone="green"/>
   <KpiCard icon={House} label="LOGEMENTS" value={data.housing?.status==='loading'?'…':home?.total!=null?fmt(home.total):'—'} sub={home?.ownerShare!=null?fmt(home.ownerShare,1)+' % propriétaires':null} tone="sand"/>
   <KpiCard icon={Buildings} label="ÉTABLISSEMENTS" value={data.equipment?.status==='loading'?'…':totalEquip!=null?fmt(totalEquip):'—'} sub="actifs · REE" tone="purple"/>
  </div>
  <ThemeSection num="01" label="POPULATION ET SOCIÉTÉ" question="Qui habite la commune ?" icon={Users} tone="blue" item={data.population}>
   {pop&&<><Grid rows={[
    ["Population totale",fmt(pop.total)+" habitants"],
    ["Moins de 20 ans",youngPct||null],
    ["65 ans ou plus",senior?fmt(100*senior/pop.total,1)+' %':null],
    ["25–39 ans",pop.ages[2]?.value!=null?fmt(pop.ages[2].value)+" ("+fmt(100*pop.ages[2].value/pop.total,1)+" %)":null],
   ]}/>
   {pop.history?.length>1&&<div className="population-history">{pop.history.slice(-4).map(h=><div key={h.year}><strong>{fmt(h.value)}</strong><span>{h.year}</span></div>)}</div>}</>}
  </ThemeSection>
  <ThemeSection num="02" label="HABITAT" question="Comment se loge-t-on ?" icon={House} tone="sand" item={data.housing}>
   {home&&<Grid rows={[
    ["Résidences principales",fmt(home.main)],
    ["Résidences secondaires",fmt(home.secondary)],
    ["Logements vacants",home.total>0?fmt(home.vacant)+' ('+fmt(100*home.vacant/home.total,1)+' %)':fmt(home.vacant)],
    ["Propriétaires occupants",home.ownerShare==null?'Non disponible':fmt(home.ownerShare,1)+' %'],
    ["Maisons",fmt(home.houses)],
    ["Appartements",fmt(home.apartments)],
   ]}/>}
  </ThemeSection>
  <ThemeSection num="03" label="REVENUS ET EMPLOI" question="Quelles ressources économiques ?" icon={CreditCard} tone="lavender" item={data.income}>
   <Grid rows={[
    ["Niveau de vie médian",income?.median!=null?fmt(income.median)+' €/an/UC':null],
    ["Taux de pauvreté",income?.poverty!=null?fmt(income.poverty,1)+' %':null],
    ["Résidents en emploi",employment?.total!=null?fmt(employment.total):null],
    ["Temps complet",employment?.fullTime!=null?fmt(employment.fullTime):null],
    ["Temps partiel",employment?.partTime!=null?fmt(employment.partTime):null],
   ]}/>
  </ThemeSection>
  <ThemeSection num="04" label="ÉQUIPEMENTS" question="Quels services à proximité ?" icon={Buildings} tone="purple" item={data.equipment}>
   {equipment&&<Grid rows={equipment.rows.map(r=>[r.label,fmt(r.value)])}/>}
  </ThemeSection>
  <ThemeSection num="05" label="RISQUES" question="Quels risques dans la commune ?" icon={Warning} tone="amber" item={data.risks}>
   {risks&&<p className="concise-result">{risks.length?risks.join(' · '):'Aucun risque retourné'}</p>}
  </ThemeSection>
  <LocalLife city={city}/>
  <MarketSection city={city}/>
  <SourceNotes>
   <h4>Commune · {city.nom}{district?' · '+district:''}</h4>
   {Object.values(data).map(d=>d?.url&&<p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}{d.data?.year?' · '+d.data.year:''}</a></p>)}
   <p>UC : unité de consommation. Emploi : résidents de 15 ans ou plus. Propriétaires : part des résidences principales.</p>
   <a href={`https://www.insee.fr/fr/statistiques/2011101?geo=COM-${dataCode}`} target="_blank" rel="noreferrer">Dossier Insee complet</a>
   <button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Actualiser les données communales</button>
  </SourceNotes>
 </section>;
}
