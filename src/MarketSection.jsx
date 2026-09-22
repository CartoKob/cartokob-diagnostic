import React,{useState,useEffect,useRef} from 'react';
import {ArrowClockwise} from '@phosphor-icons/react';
import {loadMarket,transactionsForParcel,DVF_YEAR} from './market.js';
import {SourceNotes} from './SourceNotes.jsx';
import {fmt} from './territory.js';

function fmtMoney(v){
  if(v>=1e9)return fmt(+(v/1e9).toFixed(1))+' Md €';
  if(v>=1e6)return fmt(+(v/1e6).toFixed(1))+' M €';
  if(v>=1e3)return fmt(+(v/1e3).toFixed(0))+' k €';
  return fmt(Math.round(v))+' €';
}

export function MarketSection({city,parcelId}){
const [market,setMarket]=useState(null),[busy,setBusy]=useState(false);const request=useRef();
useEffect(()=>{setMarket(null);load();return()=>request.current?.abort();},[city.code,parcelId]);
async function load(){request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);try{const result=await loadMarket(city,{signal:controller.signal});if(!controller.signal.aborted)setMarket(result);}catch{if(!controller.signal.aborted)setMarket({status:'error'});}finally{if(!controller.signal.aborted)setBusy(false);}}
const rows=parcelId?transactionsForParcel(market,parcelId):market?.transactions||[];

const known=rows.filter(t=>t.value!==null).map(t=>t.value);
const total=known.reduce((s,v)=>s+v,0);
const sorted=[...known].sort((a,b)=>a-b);
const median=sorted.length?sorted[Math.floor(sorted.length/2)]:null;
const avg=known.length?Math.round(total/known.length):null;

return <section className="portrait-section market-section">
<h3>{parcelId?`Transactions de la parcelle · ${DVF_YEAR}`:`Transactions dans la commune · ${DVF_YEAR}`}</h3>
<p className="market-subtitle">Montants globaux des transactions · DVF DGFiP</p>
{busy&&!market&&<p role="status">Chargement…</p>}
{market?.status==='not-covered'&&<p className="data-warning">{market.reason}</p>}
{market?.status==='error'&&<p className="data-warning">Données indisponibles.</p>}
{market?.status==='partial'&&<p className="data-warning">Résultats incomplets : {market.missing.length} fichier(s) territorial(aux) indisponible(s).</p>}
{['success','partial'].includes(market?.status)&&<>
  <p className="market-count">{fmt(rows.length)} mutation{rows.length>1?'s':''} retrouvée{rows.length>1?'s':''} {parcelId?'sur la référence cadastrale':'dans les fichiers chargés'}.</p>
  {known.length>0&&<div className="kpi-grid market-kpis">
    <div className="kpi-card kpi-blue">
      <span className="kpi-label">Volume total</span>
      <span className="kpi-value">{fmtMoney(total)}</span>
      <p className="kpi-sub">{known.length}/{rows.length} montant{known.length>1?'s':''} connu{known.length>1?'s':''}</p>
    </div>
    {median!==null&&<div className="kpi-card kpi-sand">
      <span className="kpi-label">Valeur médiane</span>
      <span className="kpi-value">{fmtMoney(median)}</span>
      <p className="kpi-sub">Par mutation</p>
    </div>}
    {avg!==null&&<div className="kpi-card kpi-lavender">
      <span className="kpi-label">Valeur moyenne</span>
      <span className="kpi-value">{fmtMoney(avg)}</span>
      <p className="kpi-sub">Par mutation</p>
    </div>}
  </div>}
  {rows.length===0&&<p>Aucune transaction retournée pour cette référence et cette année. Une référence cadastrale peut évoluer dans le temps.</p>}
  <div className="transactions">{rows.slice(0,20).map(t=><article key={t.id}><div><strong>{t.value===null?'Montant non univoque':fmtMoney(t.value)}</strong><span>{t.date.split('-').reverse().join('/')} · {t.nature}</span></div><p>{t.types.join(' · ')||'Nature du bien non renseignée'}<br/>{t.parcels.length} référence{t.parcels.length>1?'s':''} cadastrale{t.parcels.length>1?'s':''} dans les lignes consultées</p><small>Mutation {t.id}</small></article>)}</div>
  {rows.length>20&&<p className="market-subtitle">Les 20 transactions les plus récentes sont affichées.</p>}
</>}
{market&&market.status!=='not-covered'&&<button className="text-button" onClick={load} disabled={busy}><ArrowClockwise size={14}/>{busy?'Actualisation…':'Réessayer / actualiser'}</button>}
<SourceNotes><p><a href={`https://files.data.gouv.fr/geo-dvf/latest/csv/${DVF_YEAR}/`} target="_blank" rel="noreferrer">DVF {DVF_YEAR} · DGFiP / Etalab</a> · {parcelId?'Parcelle '+parcelId:city.nom}</p><p>Montant d’une mutation entière, pouvant regrouper plusieurs biens. Pas une estimation du bien. Décompte sans doublons. Couverture partielle ou indisponible signalée.</p></SourceNotes>
</section>
}
