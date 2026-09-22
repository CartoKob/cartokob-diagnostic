import React,{useState,useEffect,useRef} from 'react';
import {ArrowClockwise} from '@phosphor-icons/react';
import {loadMarket,transactionsForParcel,DVF_YEAR} from './market.js';
import {SourceNotes} from './SourceNotes.jsx';
import {fmt} from './territory.js';
export function MarketSection({city,parcelId}){
 const [market,setMarket]=useState(null),[busy,setBusy]=useState(false);const request=useRef();
 useEffect(()=>{setMarket(null);load();return()=>request.current?.abort();},[city.code,parcelId]);
 async function load(){request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);try{const result=await loadMarket(city,{signal:controller.signal});if(!controller.signal.aborted)setMarket(result);}catch{if(!controller.signal.aborted)setMarket({status:'error'});}finally{if(!controller.signal.aborted)setBusy(false);}}
 const rows=parcelId?transactionsForParcel(market,parcelId):market?.transactions||[];
 return <section className="portrait-section market-section"><h3>{parcelId?'Transactions de la parcelle · 2025':'Transactions dans la commune · 2025'}</h3><p className="market-subtitle">Montants globaux des transactions</p>
 {busy&&!market&&<p role="status">Chargement…</p>}
 {market?.status==='not-covered'&&<p className="data-warning">{market.reason}</p>}
 {market?.status==='error'&&<p className="data-warning">Données indisponibles.</p>}
 {market?.status==='partial'&&<p className="data-warning">Résultats incomplets : {market.missing.length} fichier(s) territorial(aux) indisponible(s). </p>}
 {['success','partial'].includes(market?.status)&&<><p className="market-count">{fmt(rows.length)} mutation{rows.length>1?'s':''} retrouvée{rows.length>1?'s':''} {parcelId?'sur la référence cadastrale':'dans les fichiers chargés'}.</p>{rows.length===0&&<p>Aucune transaction retournée pour cette référence et cette année. Une référence cadastrale peut évoluer dans le temps.</p>}<div className="transactions">{rows.slice(0,20).map(t=><article key={t.id}><div><strong>{t.value===null?'Montant non univoque':fmt(t.value)+' €'}</strong><span>{t.date.split('-').reverse().join('/')} · {t.nature}</span></div><p>{t.types.join(' · ')||'Nature du bien non renseignée'}<br/>{t.parcels.length} référence{t.parcels.length>1?'s':''} cadastrale{t.parcels.length>1?'s':''} dans les lignes consultées</p><small>Mutation {t.id}</small></article>)}</div>{rows.length>20&&<p className="market-subtitle">Les 20 transactions les plus récentes sont affichées.</p>}</>}
 {market&&market.status!=='not-covered'&&<button className="text-button" onClick={load} disabled={busy}><ArrowClockwise size={14}/>{busy?'Actualisation…':'Réessayer / actualiser'}</button>}
 <SourceNotes><p><a href="https://files.data.gouv.fr/geo-dvf/latest/csv/2025/" target="_blank" rel="noreferrer">DVF 2025 · DGFiP / Etalab</a> · {parcelId?'Parcelle '+parcelId:city.nom}</p><p>Montant d’une mutation entière, pouvant regrouper plusieurs biens. Pas une estimation du bien. Décompte sans doublons. Couverture partielle ou indisponible signalée.</p></SourceNotes>
 </section>
}
