import React,{useEffect,useState} from 'react';
import {loadCommune,fmt} from './territory.js';
import {LocalLife} from './LocalLife.jsx';
import {MarketSection} from './MarketSection.jsx';
import {SourceNotes} from './SourceNotes.jsx';

function Rows({rows}){return <dl className="readable-facts">{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
function Section({title,item,badge,children}){
 return <section className="portrait-section">
  <h3>{title}{badge&&<span className={`audience-badge audience-badge-${badge}`}>{badge==='particulier'?'🏡':badge==='agent'?'🔑':'🏗️'}</span>}</h3>
  {!item||item.status==='loading'?<p role="status">Chargement…</p>:item.status==='error'?<p className="data-warning">Données indisponibles</p>:children}
 </section>;
}
function Metric({label,value,item,tone}){return <div className={`compact-metric ${tone}`}><span>{label}</span><strong>{item?.status==='error'?'Indisponible':!item||item.status==='loading'?'…':value}</strong></div>}

export function CommunePortrait({city,audience}){
 const [data,setData]=useState({}),[refresh,setRefresh]=useState(0);
 useEffect(()=>{const controller=new AbortController();setData({});loadCommune(city.code,{signal:controller.signal,onUpdate:(key,value)=>{if(!controller.signal.aborted)setData(d=>({...d,[key]:value}));}});return()=>controller.abort();},[city.code,refresh]);
 const pop=data.population?.data,home=data.housing?.data,equipment=data.equipment?.data,risks=data.risks?.data,income=data.income?.data,employment=data.employment?.data;

 /* ---------- AGENT : vue synthèse commune ---------- */
 if(audience==='agent'){
  return <section className="commune-portrait audience-agent" aria-label={`Contexte de ${city.nom}`}>
   <p className="audience-section-intro">Contexte communal · données de référence pour votre dossier</p>
   <div className="commune-metrics">
    <Metric label="Habitants" value={fmt(pop?.total)} item={data.population} tone="sage"/>
    <Metric label="Logements" value={fmt(home?.total)} item={data.housing} tone="sand"/>
    <Metric label="Niveau de vie médian" value={income?.median!=null?fmt(income.median)+' €/an':'Non dispo'} item={data.income} tone="lavender"/>
    <Metric label="Taux de pauvreté" value={income?.poverty!=null?fmt(income.poverty,1)+' %':'Non dispo'} item={data.income} tone="blue"/>
   </div>
   <Section title="Parc de logements" item={data.housing}>
    {home&&<Rows rows={[["Total logements",fmt(home.total)],["Résidences principales",fmt(home.main)],["Logements vacants",fmt(home.vacant)],["Propriétaires occupants",home.ownerShare==null?'Non disponible':fmt(home.ownerShare,1)+' %'],["Maisons / Appartements",`${fmt(home.houses)} / ${fmt(home.apartments)}`]]}/>}
   </Section>
   <Section title="Risques recensés dans la commune" item={data.risks}>
    {risks&&<p className="concise-result">{risks.length?risks.join(' · '):'Aucun risque retourné'}</p>}
   </Section>
   <MarketSection city={city}/>
   <SourceNotes><h4>Commune · {city.nom}</h4>{Object.values(data).map(d=>d?.url&&<p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}{d.data?.year?' · '+d.data.year:''}</a></p>)}<button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Actualiser les données communales</button></SourceNotes>
  </section>;
 }

 /* ---------- PROMOTEUR : contexte foncier ---------- */
 if(audience==='promoteur'){
  return <section className="commune-portrait audience-promoteur" aria-label={`Contexte foncier de ${city.nom}`}>
   <p className="audience-section-intro">Contexte territorial · aide à la décision foncière</p>
   <div className="commune-metrics">
    <Metric label="Habitants" value={fmt(pop?.total)} item={data.population} tone="sage"/>
    <Metric label="Logements vacants" value={fmt(home?.vacant)} item={data.housing} tone="sand"/>
    <Metric label="Résidences principales" value={fmt(home?.main)} item={data.housing} tone="lavender"/>
    <Metric label="Appartements / Maisons" value={home?`${fmt(home.apartments)} / ${fmt(home.houses)}`:'…'} item={data.housing} tone="blue"/>
   </div>
   <Section title="Dynamique démographique" item={data.population}>
    {pop&&<><Rows rows={[["Population totale",fmt(pop.total)],["Moins de 20 ans",pop.ages[0]?.value!=null?fmt(pop.ages[0].value)+' ('+fmt(100*pop.ages[0].value/pop.total,1)+' %)':'Non dispo'],["25–39 ans",pop.ages[2]?.value!=null?fmt(pop.ages[2].value)+' ('+fmt(100*pop.ages[2].value/pop.total,1)+' %)':'Non dispo'],["65 ans ou plus",pop.ages[5]?.value!=null&&pop.ages[6]?.value!=null?fmt((pop.ages[5].value||0)+(pop.ages[6].value||0))+' ('+fmt(100*((pop.ages[5].value||0)+(pop.ages[6].value||0))/pop.total,1)+' %)':'Non dispo']]}/>
    {pop.history?.length>1&&<div className="population-history">{pop.history.slice(-4).map(h=><div key={h.year}><strong>{fmt(h.value)}</strong><span>{h.year}</span></div>)}</div>}</>}
   </Section>
   <Section title="Structure du parc de logements" item={data.housing}>
    {home&&<Rows rows={[["Total logements",fmt(home.total)],["Résidences principales",fmt(home.main)],["Résidences secondaires",fmt(home.secondary)],["Logements vacants",fmt(home.vacant)+" ("+(home.total>0?fmt(100*home.vacant/home.total,1):'?')+" %)"],["Maisons",fmt(home.houses)],["Appartements",fmt(home.apartments)],["Propriétaires occupants",home.ownerShare==null?'Non disponible':fmt(home.ownerShare,1)+' %']]}/>}
   </Section>
   <Section title="Risques recensés dans la commune" item={data.risks}>
    {risks&&<p className="concise-result">{risks.length?risks.join(' · '):'Aucun risque retourné'}</p>}
   </Section>
   <SourceNotes><h4>Commune · {city.nom}</h4>{Object.values(data).map(d=>d?.url&&<p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}{d.data?.year?' · '+d.data.year:''}</a></p>)}<button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Actualiser les données communales</button></SourceNotes>
  </section>;
 }

 /* ---------- PARTICULIER : vue complète ---------- */
 return <section className="commune-portrait" aria-label={`Portrait de ${city.nom}`}>
 <div className="commune-metrics">
 <Metric label="Habitants" value={fmt(pop?.total)} item={data.population} tone="sage"/>
 <Metric label="Logements" value={fmt(home?.total)} item={data.housing} tone="sand"/>
 <Metric label="Niveau de vie · €/an/UC" value={fmt(income?.median)} item={data.income} tone="lavender"/>
 <Metric label="Résidents en emploi" value={fmt(employment?.total)} item={data.employment} tone="blue"/>
 </div>
 <Section title="Population" item={data.population}>
  {pop&&<>
   <Rows rows={pop.ages.map(a=>[a.label,a.value===null?'Non disponible':`${fmt(a.value)}${pop.total>0?' · '+fmt(100*a.value/pop.total,1)+' %':''}`])}/>
   {pop.history?.length>1&&<div className="population-history">{pop.history.slice(-4).map(h=><div key={h.year}><strong>{fmt(h.value)}</strong><span>{h.year}</span></div>)}</div>}
  </>}
 </Section>
 <Section title="Revenus des ménages" item={data.income}>
  {income&&<Rows rows={[["Niveau de vie médian",income.median==null?'Non disponible':fmt(income.median)+' €/an/UC'],["Taux de pauvreté",income.poverty==null?'Non disponible':fmt(income.poverty,1)+' %']]}/>}
 </Section>
 <Section title="Logements" item={data.housing}>
  {home&&<Rows rows={[["Résidences principales",fmt(home.main)],["Résidences secondaires",fmt(home.secondary)],["Logements vacants",fmt(home.vacant)],["Maisons",fmt(home.houses)],["Appartements",fmt(home.apartments)],["Propriétaires occupants",home.ownerShare==null?'Non disponible':fmt(home.ownerShare,1)+' %']]}/>}
 </Section>
 <Section title="Emploi des habitants" item={data.employment}>
  {employment&&<Rows rows={[["Résidents en emploi (15 ans+)",fmt(employment.total)],["Temps complet",fmt(employment.fullTime)],["Temps partiel",fmt(employment.partTime)]]}/>}
 </Section>
 <Section title="Services et équipements" item={data.equipment}>
  {equipment&&<Rows rows={equipment.rows.map(r=>[r.label,fmt(r.value)])}/>}
 </Section>
 <Section title="Risques recensés dans la commune" item={data.risks}>
  {risks&&<p className="concise-result">{risks.length?risks.join(' · '):'Aucun risque retourné'}</p>}
 </Section>
 <LocalLife city={city}/>
 <MarketSection city={city}/>
 <SourceNotes><h4>Commune · {city.nom}</h4>{Object.values(data).map(d=>d?.url&&<p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}{d.data?.year?' · '+d.data.year:''}</a></p>)}<p>UC : unité de consommation. Emploi : résidents de 15 ans ou plus. Propriétaires : part des résidences principales. Données absentes ou secrètes : non disponibles. Risques communaux : exposition de la parcelle non établie.</p><a href={`https://www.insee.fr/fr/statistiques/2011101?geo=COM-${city.code}`} target="_blank" rel="noreferrer">Dossier Insee complet</a><button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Actualiser les données communales</button></SourceNotes>
 </section>;
}
