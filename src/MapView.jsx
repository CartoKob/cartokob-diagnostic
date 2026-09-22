import React,{useEffect,useRef,useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {Plus,Minus,Crosshair,Compass,MapPin,Stack} from '@phosphor-icons/react';
import markerUrl from 'leaflet/dist/images/marker-icon.png';
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {getJson} from './diagnostic.js';
const icon=L.icon({iconUrl:markerUrl,iconRetinaUrl:markerRetinaUrl,shadowUrl:markerShadow,iconSize:[25,41],iconAnchor:[12,41]});
export const CADASTRE_URL='https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=PCI%20vecteur&TILEMATRIXSET=PM_0_19&TILEROW={y}&TILECOL={x}&TILEMATRIX={z}&FORMAT=image/png';
export function MapView({city,point,parcels,isochrone,onPoint,focusVersion=0}){
 const root=useRef(),map=useRef(),marker=useRef(),boundary=useRef(),parcelLayer=useRef(),isoLayer=useRef(),cadastre=useRef(),callback=useRef(onPoint);callback.current=onPoint;
 const [zoom,setZoom]=useState(6),[cadastreOn,setCadastreOn]=useState(true),[tileError,setTileError]=useState(false),[cadastreError,setCadastreError]=useState(false),[boundaryError,setBoundaryError]=useState(false);
 useEffect(()=>{
  const m=L.map(root.current,{zoomControl:false,scrollWheelZoom:true}).setView([46.6,2.5],6);map.current=m;
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).on('tileerror',()=>setTileError(true)).on('tileload',()=>setTileError(false)).addTo(m);
  cadastre.current=L.tileLayer(CADASTRE_URL,{minZoom:15,maxZoom:19,opacity:.85,attribution:'Parcellaire Express · IGN / DGFiP'}).on('tileerror',()=>setCadastreError(true)).on('tileload',()=>setCadastreError(false)).addTo(m);
  L.control.scale({imperial:false,position:'bottomright'}).addTo(m);
  m.on('zoomend',()=>setZoom(m.getZoom()));m.on('click',e=>callback.current(e.latlng));
  const observer=new ResizeObserver(()=>m.invalidateSize({pan:false}));observer.observe(root.current);
  return()=>{observer.disconnect();m.remove();map.current=null;};
 },[]);
 useEffect(()=>{
  if(!map.current)return;
  if(boundary.current){boundary.current.remove();boundary.current=null;}
  setBoundaryError(false);
  if(!city){map.current.setView([46.6,2.5],6);return;}
  const controller=new AbortController();const m=map.current;
  const [lon,lat]=city.centre.coordinates;m.setView([lat,lon],12);
  getJson(`https://geo.api.gouv.fr/communes/${city.code}?format=geojson&geometry=contour&fields=nom,code`,{signal:controller.signal}).then(geo=>{
   if(controller.signal.aborted||!geo.geometry)return;
   boundary.current=L.geoJSON(geo,{interactive:false,style:{color:'#10265f',weight:2,fillOpacity:.025,dashArray:'5 4'}}).addTo(m);
   // The asynchronous outline must not override a more recent parcel selection.
   if(!latestPoint.current)m.fitBounds(boundary.current.getBounds(),{padding:[35,35],maxZoom:14});
  }).catch(()=>{if(!controller.signal.aborted)setBoundaryError(true);});
  return()=>controller.abort();
 },[city?.code]);
 const latestPoint=useRef(point);latestPoint.current=point;
 useEffect(()=>{
  if(!map.current)return;if(marker.current){marker.current.remove();marker.current=null;}
  if(point){marker.current=L.marker([point.lat,point.lon],{icon}).addTo(map.current);map.current.setView([point.lat,point.lon],17);}
  else if(city&&boundary.current)map.current.fitBounds(boundary.current.getBounds(),{padding:[35,35],maxZoom:14});
 },[point,city?.code]);
 useEffect(()=>{if(focusVersion&&map.current&&city){const [lon,lat]=city.centre.coordinates;map.current.setView([lat,lon],16);root.current.focus();}},[focusVersion]);
 useEffect(()=>{if(!map.current)return;if(parcelLayer.current)parcelLayer.current.remove();if(parcels.length)parcelLayer.current=L.geoJSON(parcels,{interactive:false,style:{color:'#ce5834',weight:3,fillOpacity:.16}}).addTo(map.current);},[parcels]);
 useEffect(()=>{if(!map.current)return;if(isoLayer.current)isoLayer.current.remove();if(isochrone){isoLayer.current=L.geoJSON(isochrone,{interactive:false,style:{color:'#265de1',weight:2,fillOpacity:.12}}).addTo(map.current);map.current.fitBounds(isoLayer.current.getBounds(),{padding:[35,35]});}},[isochrone]);
 useEffect(()=>{if(!map.current||!cadastre.current)return;if(cadastreOn)cadastre.current.addTo(map.current);else cadastre.current.remove();},[cadastreOn]);
 function recenter(){if(point)map.current.setView([point.lat,point.lon],17);else if(boundary.current)map.current.fitBounds(boundary.current.getBounds(),{padding:[35,35],maxZoom:14});else map.current.setView([46.6,2.5],6);}
 return <section id="carte" className="map-wrap" aria-label="Carte interactive de France"><div ref={root} className="map" tabIndex={0} aria-label="Carte : utilisez la recherche d’adresse pour sélectionner un lieu au clavier"/><div className="north"><Compass size={24}/><span>N</span></div><div className="map-controls"><button aria-label="Zoomer" onClick={()=>map.current.zoomIn()}><Plus/></button><button aria-label="Dézoomer" onClick={()=>map.current.zoomOut()}><Minus/></button><button aria-label="Recentrer sur la sélection" onClick={recenter}><Crosshair/></button></div><button className="cadastre-toggle" aria-pressed={cadastreOn} onClick={()=>setCadastreOn(v=>!v)}><Stack size={16}/>Parcelles {cadastreOn?'activées':'masquées'}{zoom<15&&cadastreOn&&<small>Visibles en zoomant</small>}</button><div className="map-hint"><MapPin size={15}/>{city?'Un clic dans la commune analyse le terrain ; ailleurs, découvrez une autre commune.':'Cliquez sur la carte pour découvrir une commune.'}</div>{(tileError||(cadastreError&&cadastreOn&&zoom>=15)||boundaryError)&&<div className="map-error" role="status">{tileError?'Fond de carte indisponible. ':''}{cadastreError&&cadastreOn&&zoom>=15?'Affichage cadastral indisponible. ':''}{boundaryError?'Contour communal indisponible.':''}</div>}</section>
}
