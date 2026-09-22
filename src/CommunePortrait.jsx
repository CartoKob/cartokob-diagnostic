import React,{useEffect,useState} from 'react';
import {ArrowRight,ArrowUpRight,CaretDown} from '@phosphor-icons/react';
import {loadCommune,fmt} from './territory.js';
import {MarketSection} from './MarketSection.jsx';
function Rows({rows}){return <dl className="portrait-rows">{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
function DataSection({item,children}){return <details className="portrait-section"><summary><h3>{item?.title||'Chargement des données'}</h3><span>{item?.status==='error'?'Indisponible':!item||item.status==='loading'?'…':'Détails'}</span><CaretDown className="details-chevron" size={14}/></summary>{!item||item.status==='loading'?<p className="loading-copy" role="status">Consultation des données…</p>:item.status==='error'?<p className="data-warning">Source momentanément indisponible. Aucune valeur n’est déduite.</p>:children}<p className="source-caption">{item?.source} · {item?.data?.year?`Millésime ${item.data.year} · `:''}{item?.url&&<a href={item.url} target="_blank" rel="noreferrer">Consulter la source <ArrowUpRight size={12}/></a>}</p></details>}
function Metric({label,value,item,tone}){return <div className={`compact-metric ${tone}`}><span>{label}</span><strong>{item?.status==='error'?'Indisponible':!item||item.status==='loading'?'…':value}</strong><small>{item?.source||'Source nationale'}{item?.data?.year?` · ${item.data.year}`:''}</small></div>}
export function CommunePortrait({city,onExplore}){
 const [data,setData]=useState({}),[refresh,setRefresh]=useState(0);
 useEffect(()=>{const controller=new AbortController();setData({});loadCommune(city.code,{signal:controller.signal,onUpdate:(key,value)=>{if(!controller.signal.aborted)setData(d=>({...d,[key]:value}));}});return()=>controller.abort();},[city.code,refresh]);
 const pop=data.population?.data,home=data.housing?.data,equipment=data.equipment?.data,risks=data.risks?.data,income=data.income?.data,employment=data.employment?.data;
 return <section className="commune-portrait" aria-label={`Portrait de ${city.nom}`}>
 <div className="commune-metrics">
 <Metric label="Habitants" value={fmt(pop?.total)} item={data.population} tone="sage"/>
 <Metric label="Logements" value={fmt(home?.total)} item={data.housing} tone="sand"/>
 <Metric label="Niveau de vie médian" value={income?.median==null?'Non disponible':fmt(income.median)+' € / an'} item={data.income} tone="lavender"/>
 <Metric label="Résidents en emploi" value={fmt(employment?.total)} item={data.employment} tone="blue"/>
 </div>
 <p className="metrics-note">Niveau de vie par unité de consommation. Dépliez un thème pour consulter les détails et les sources.</p>
 <details className="commune-details"><summary>Tous les détails de la commune</summary>
 <div className="portrait-grid">
 <DataSection item={data.population}>{pop&&<><div className="stat-display">{fmt(pop.total)} <span>habitants</span></div><p>Répartition par âge</p><Rows rows={pop.ages.map(a=>[a.label,a.value===null?'Non disponible':`${fmt(a.value)}${pop.total>0?' · '+fmt(100*a.value/pop.total,1)+' %':''}`])}/><div className="population-history">{pop.history.map(p=><div key={p.year}><span>{p.year}</span><strong>{fmt(p.value)}</strong></div>)}</div></>}</DataSection>
 <DataSection item={data.housing}>{home&&<><div className="stat-display">{fmt(home.total)} <span>logements</span></div><Rows rows={[["Résidences principales",fmt(home.main)],["Résidences secondaires et occasionnelles",fmt(home.secondary)],["Logements vacants",fmt(home.vacant)],["Maisons",fmt(home.houses)],["Appartements",fmt(home.apartments)],["Propriétaires occupants",home.ownerShare===null?'Non disponible':fmt(home.ownerShare,1)+' % des résidences principales']]}/><p className="source-caption">Effectifs du recensement arrondis. Une donnée absente ou soumise au secret statistique reste non disponible.</p></>}</DataSection>
 <DataSection item={data.equipment}>{equipment&&<><p>Équipements et services recensés dans la commune, par grand domaine.</p><Rows rows={equipment.rows.map(r=>[r.label,fmt(r.value)])}/><p className="source-caption">La BPE compte des équipements ou services, pas nécessairement des établissements distincts. Ce dénombrement ne mesure pas le temps d’accès.</p></>}</DataSection>
 <DataSection item={data.employment}>{employment&&<><div className="stat-display">{fmt(employment.total)} <span>actifs occupés</span></div><Rows rows={[["À temps complet",fmt(employment.fullTime)],["À temps partiel",fmt(employment.partTime)]]}/><p className="source-caption">Habitants de 15 ans ou plus ayant un emploi, quel que soit leur lieu de travail. Il ne s’agit pas du nombre d’emplois situés dans la commune.</p></>}</DataSection>
 <DataSection item={data.income}>{income&&<><Rows rows={[["Niveau de vie annuel médian",income.median===null?'Non disponible':fmt(income.median)+' € par unité de consommation'],["Taux de pauvreté",income.poverty===null?'Non disponible':fmt(income.poverty,1)+' %']]}/><p className="source-caption">Seuil de pauvreté : 60 % du niveau de vie médian national. Les données soumises au secret statistique ne sont pas affichées comme zéro.</p></>}</DataSection>
 <DataSection item={data.risks}>{risks&&<>{risks.length?<ul className="risk-list">{risks.map(r=><li key={r}>{r}</li>)}</ul>:<p>Aucun risque retourné par cette source pour la commune.</p>}<p className="data-warning">Contexte communal : ces informations ne démontrent ni l’exposition, ni l’absence de risque d’une parcelle précise.</p></>}</DataSection>
 </div>
 <MarketSection city={city}/>
 <section className="portrait-section"><h3>Approfondir le territoire</h3><div className="source-links"><a href={`https://www.insee.fr/fr/statistiques/2011101?geo=COM-${city.code}`} target="_blank" rel="noreferrer">Dossier complet Insee de la commune <ArrowUpRight/></a></div><p>Desserte détaillée, loyers, qualité de l’eau et énergie restent à intégrer à ce portrait. Leurs valeurs ne sont pas remplacées par des données du Val-d’Oise.</p><button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Réessayer les sources indisponibles</button></section>
 </details>
 </section>
}
