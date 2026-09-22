import React,{useEffect,useMemo,useRef,useState} from 'react';
import {MagnifyingGlass,ArrowRight,X} from '@phosphor-icons/react';
import {getJson} from './diagnostic.js';
import {searchCommunes} from './search.js';
import {fmt} from './territory.js';
export function SearchBox({communes,loading,onSelect,selectionLabel=''}){
 const [query,setQuery]=useState(''),[open,setOpen]=useState(false),[index,setIndex]=useState(-1),[addresses,setAddresses]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');const input=useRef();
 useEffect(()=>{setQuery(selectionLabel);setOpen(false);setIndex(-1);},[selectionLabel]);
 const results=useMemo(()=>[...searchCommunes(communes,query),...addresses],[communes,query,addresses]);
 useEffect(()=>{
  setAddresses([]);setError('');setIndex(-1);
  if(!open||query.trim().length<4){setBusy(false);return;}
  const controller=new AbortController();setBusy(true);
  const timer=setTimeout(async()=>{
   try{const data=await getJson('https://data.geopf.fr/geocodage/search?'+new URLSearchParams({q:query,limit:'5',index:'address'}),{signal:controller.signal});
    if(!controller.signal.aborted)setAddresses((data.features||[]).filter(f=>{const d=f.properties.depcode;return d==='2A'||d==='2B'||(/^\d{2}$/.test(d)&&Number(d)>0&&Number(d)<=95);}).map((f,i)=>({address:true,code:'address-'+i,nom:f.properties.label,departement:{nom:'Adresse'},codeDepartement:f.properties.depcode,codesPostaux:[f.properties.postcode].filter(Boolean),lon:f.geometry.coordinates[0],lat:f.geometry.coordinates[1]})));
   }catch{if(!controller.signal.aborted)setError('Recherche d’adresses indisponible ; essayez une commune.');}finally{if(!controller.signal.aborted)setBusy(false);}
  },350);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,open]);
 function select(c){if(!c)return;setOpen(false);setQuery(c.nom);onSelect(c);}
 return <div className="search-area"><form role="search" onSubmit={e=>{e.preventDefault();if(results.length)select(results[index>=0&&index<results.length?index:0]);else setOpen(true);}}><div className="search-field"><MagnifyingGlass size={24}/><input ref={input} aria-label="Rechercher une adresse, une commune ou un code postal" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="results" aria-activedescendant={index>=0?`result-${index}`:undefined} value={query} placeholder="Une adresse, une commune…" disabled={loading} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} onChange={e=>{setQuery(e.target.value);setOpen(true);setIndex(-1);}} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setIndex(i=>Math.min(i+1,results.length-1));}if(e.key==='ArrowUp'){e.preventDefault();setIndex(i=>Math.max(0,i-1));}if(e.key==='Escape')setOpen(false);}}/>{query&&<button type="button" aria-label="Effacer la recherche" onClick={()=>{setQuery('');input.current.focus();}}><X size={20}/></button>}</div><button className="search-go" aria-label="Rechercher" disabled={loading}><ArrowRight size={27}/></button></form><p className="search-help">{loading?'Chargement des communes…':`${fmt(communes.length)} communes · France métropolitaine, Corse comprise`}</p>
 {open&&query&&<ul id="results" role="listbox" className="results">{results.map((c,i)=><li id={`result-${i}`} key={c.code} role="option" aria-selected={i===index} onMouseDown={e=>e.preventDefault()} onClick={()=>select(c)} className={i===index?'active':''}><div><strong>{c.nom}</strong><span>{c.departement.nom} · {c.codeDepartement}</span></div><small>{c.codesPostaux.slice(0,2).join(', ')}</small></li>)}{busy&&<li className="empty">Recherche d’adresses…</li>}{error&&<li className="empty">{error}</li>}{!results.length&&!busy&&<li className="empty">Aucun résultat. Essayez une commune ou une adresse.</li>}</ul>}</div>
}
