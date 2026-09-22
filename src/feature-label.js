export function featureLabel(feature,key){
 const p=feature.properties||{};
 if(key==='parcel')return `Parcelle ${p.section||''} ${p.numero||''} · ${p.contenance??'—'} m² · ${p.idu||'référence non renseignée'}`;
 if(key.startsWith('sup'))return [p.suptype?.toUpperCase(),p.typeass,p.nomsuplitt||p.nomass].filter(Boolean).join(' · ')||'Servitude référencée';
 if(key==='buildings')return [p.libelle_adr_principale_ban||p.batiment_groupe_id,p.annee_construction!=null?'Construction : '+p.annee_construction:null,p.nb_log!=null?p.nb_log+' logement(s)':null,p.classe_bilan_dpe?'DPE associé : '+p.classe_bilan_dpe:null,p.identifiant_dpe?'N° '+p.identifiant_dpe:null,p.date_reception_dpe?'Reçu le '+p.date_reception_dpe.slice(0,10):null].filter(Boolean).join(' · ');
 if(key==='urban')return [p.libelle||p.typezone,p.libelong].filter(Boolean).join(' · ')||'Zone référencée';
 return p.libelle||p.SITENAME||p.sitename||p.NOM||p.nom||p.nom_site||p.id_mnhn||'Périmètre identifié';
}
