import React,{useEffect,useState} from 'react';
import {loadCommune,fmt} from './territory.js';
import {LocalLife} from './LocalLife.jsx';
import {MarketSection} from './MarketSection.jsx';
import {SourceNotes} from './SourceNotes.jsx';
function Rows({rows}){return <dl className="readable-facts">{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
function Section({title,item,children}){return <section className="portrait-section"><h3>{title}</h3>{!item||item.status==='loading'?<p role="status">Chargement…</p>:item.status==='error'?<p className="data-warning">Données indisponibles</p>:children}</section>}
function Metric({label,value,item,tone}){return <div className={`compact-metric ${tone}`}><span>{label}</span><strong>{item?.status==='error'?'Indisponible':!item||item.status==='loading'?'…':value}</strong></div>}
export function CommunePortrait({city}){
 const [data,setData]=useState({}),[refresh,setRefresh]=useState(0);
 useEffect(()=>{const controller=new AbortController();setData({});loadCommune(city.code,{signal:controller.signal,onUpdate:(key,value)=>{if(!controller.signal.aborted)setData(d=>({...d,[key]:value}));}});return()=>controller.abort();},[city.code,refresh]);
 const pop=data.population?.data,home=data.housing?.data,equipment=data.equipment?.data,risks=data.risks?.data,income=data.income?.data,employment=data.employment?.data;
 return <section className="commune-portrait" aria-label={`Portrait de ${city.nom}`}>
 <div className="commune-metrics">
 <Metric label="Habitants" value={fmt(pop?.total)} item={data.population} tone="sage"/>
 <Metric label="Logements" value={fmt(home?.total)} item={data.housing} tone="sand"/>
 <Metric label="Niveau de vie · €/an/UC" value={fmt(income?.median)} item={data.income} tone="lavender"/>
 <Metric label="Résidents en emploi" value={fmt(employment?.total)} item={data.employment} tone="blue"/>
 </div>
 <Section title="Population et revenus" item={data.population}>{pop&&<Rows rows={pop.ages.map(a=>[a.label,a.value===null?'Non disponible':`${fmt(a.value)}${pop.total>0?' · '+fmt(100*a.value/pop.total,1)+' %':''}`])}/>}</Section>
 <Section title="Habitat" item={data.housing}>{home&&<Rows rows={[["Résidences principales",fmt(home.main)],["Résidences secondaires",fmt(home.secondary)],["Logements vacants",fmt(home.vacant)],["Maisons",fmt(home.houses)],["Appartements",fmt(home.apartments)],["Propriétaires occupants",home.ownerShare==null?'Non disponible':fmt(home.ownerShare,1)+' %']]}/>}</Section>
 <Section title="Vie locale" item={data.equipment}>{equipment&&<Rows rows={equipment.rows.map(r=>[r.label,fmt(r.value)])}/>}</Section>
 <Section title="Emploi des habitants" item={data.employment}>{employment&&<Rows rows={[["Temps complet",fmt(employment.fullTime)],["Temps partiel",fmt(employment.partTime)]]}/>}</Section>
 <Section title="Revenus" item={data.income}>{income&&<Rows rows={[["Niveau de vie médian",income.median==null?'Non disponible':fmt(income.median)+' €/an/UC'],["Taux de pauvreté",income.poverty==null?'Non disponible':fmt(income.poverty,1)+' %']]}/>}</Section>
 <Section title="Risques recensés dans la commune" item={data.risks}>{risks&&<p className="concise-result">{risks.length?risks.join(' · '):'Aucun risque retourné'}</p>}</Section>
 <LocalLife city={city}/>
 <MarketSection city={city}/>
 <SourceNotes><h4>Commune · {city.nom}</h4>{Object.values(data).map(d=><p key={d.key}><a href={d.url} target="_blank" rel="noreferrer">{d.title} · {d.source}{d.data?.year?' · '+d.data.year:''}</a></p>)}<p>UC : unité de consommation. Emploi : résidents de 15 ans ou plus. Propriétaires : part des résidences principales. Équipements : services recensés, pas établissements distincts. Données absentes ou secrètes : non disponibles. Risques communaux : exposition de la parcelle non établie.</p><a href={`https://www.insee.fr/fr/statistiques/2011101?geo=COM-${city.code}`} target="_blank" rel="noreferrer">Dossier Insee complet</a><button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Actualiser les données communales</button></SourceNotes>
 </section>
}
