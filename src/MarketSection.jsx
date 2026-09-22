import React,{useState,useEffect,useRef} from 'react';
import {ArrowUpRight,ArrowClockwise} from '@phosphor-icons/react';
import {loadMarket,transactionsForParcel,DVF_YEAR} from './market.js';
import {fmt} from './territory.js';
export function MarketSection({city,parcelId}){
 const [market,setMarket]=useState(null),[busy,setBusy]=useState(false),[limit,setLimit]=useState(6);const request=useRef();
 useEffect(()=>{setMarket(null);setBusy(false);setLimit(6);return()=>request.current?.abort();},[city.code,parcelId]);
 async function load(){request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);try{const result=await loadMarket(city,{signal:controller.signal});if(!controller.signal.aborted)setMarket(result);}catch{if(!controller.signal.aborted)setMarket({status:'error'});}finally{if(!controller.signal.aborted)setBusy(false);}}
 const rows=parcelId?transactionsForParcel(market,parcelId):market?.transactions||[];
 return <section className="portrait-section market-section"><p className="eyebrow">IMMOBILIER · DGFIP / DVF</p><h3>{parcelId?'Les transactions de cette parcelle':'Les transactions dans la commune'}</h3><p>Ventes et mutations publiées pour {DVF_YEAR}. Les montants portent sur une transaction entière, qui peut regrouper plusieurs biens ou parcelles.</p>
 {!market&&<button className="outline-button" onClick={load} disabled={busy}>{busy?'Chargement des transactions…':`Consulter les transactions ${DVF_YEAR}`}</button>}
 {market?.status==='not-covered'&&<p className="data-warning">{market.reason}</p>}
 {market?.status==='error'&&<p className="data-warning">Fichier indisponible pour ce territoire ou téléchargement interrompu. Cela ne signifie pas qu’il n’y a eu aucune vente.</p>}
 {market?.status==='partial'&&<p className="data-warning">Résultats incomplets : {market.missing.length} fichier(s) territorial(aux) indisponible(s). Aucun total communal exhaustif n’est calculé.</p>}
 {['success','partial'].includes(market?.status)&&<><p className="market-count">{fmt(rows.length)} mutation{rows.length>1?'s':''} retrouvée{rows.length>1?'s':''} {parcelId?'sur la référence cadastrale':'dans les fichiers chargés'}.</p>{rows.length===0&&<p>Aucune transaction retournée pour cette référence et cette année. Une référence cadastrale peut évoluer dans le temps.</p>}<div className="transactions">{rows.slice(0,limit).map(t=><article key={t.id}><div><strong>{t.value===null?'Montant non univoque':fmt(t.value)+' €'}</strong><span>{t.date.split('-').reverse().join('/')} · {t.nature}</span></div><p>{t.types.join(' · ')||'Nature du bien non renseignée'}<br/>{t.parcels.length} référence{t.parcels.length>1?'s':''} cadastrale{t.parcels.length>1?'s':''} dans les lignes consultées</p><small>Mutation {t.id} · montant global, pas une estimation du bien</small></article>)}</div>{rows.length>limit&&<button className="outline-button" onClick={()=>setLimit(n=>n+10)}>Afficher les transactions suivantes</button>}</>}
 {market&&market.status!=='not-covered'&&<button className="text-button" onClick={load} disabled={busy}><ArrowClockwise size={14}/>{busy?'Actualisation…':'Réessayer / actualiser'}</button>}
 <p className="source-caption"><a href="https://files.data.gouv.fr/geo-dvf/latest/csv/2025/" target="_blank" rel="noreferrer">DGFiP / Etalab · DVF géolocalisées 2025 <ArrowUpRight size={12}/></a><br/>Répertoire vérifié le 22/09/2026 ; publication observée le 18/05/2026. Décompte par identifiant de mutation, sans additionner les lignes d’une même vente. Les territoires non couverts et fichiers manquants sont signalés.</p>
 </section>
}
