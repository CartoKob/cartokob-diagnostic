import {jsPDF} from 'jspdf';
import {featureLabel} from './feature-label.js';
const navy='#101f52',muted='#637086',paper='#faf7f0';
const clean=value=>String(value??'Non renseigné').replace(/[\u202f\u00a0]/g,' ').replace(/[–—‑]/g,'-').replace(/[’‘]/g,"'").replace(/œ/g,'oe').replace(/Œ/g,'OE');
export function createDiagnosticPdf({city,point,data,now=new Date()}){
 const pdf=new jsPDF({unit:'mm',format:'a4'});let y=24;
 pdf.setProperties({title:`CartoKob - Synthèse ${city.nom}`,subject:'Diagnostic territorial et parcellaire',author:'CartoKob',creator:'CartoKob'});
 function page(){pdf.setFillColor(paper);pdf.rect(0,0,210,297,'F');pdf.setTextColor(navy);pdf.setFont('times','bold');pdf.setFontSize(25);pdf.text('CartoKob',18,18);pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(muted);pdf.text('COMPRENDRE LES TERRITOIRES',192,15,{align:'right'});pdf.text('POUR AGIR DEMAIN',192,19,{align:'right'});pdf.setDrawColor('#cbd0d4');pdf.line(18,24,192,24);y=34;}
 function room(height){if(y+height>275){pdf.addPage();page();}}
 function text(value,{size=10,color=navy,font='helvetica',style='normal',gap=3}={}){pdf.setFont(font,style);pdf.setFontSize(size);const lines=pdf.splitTextToSize(clean(value),174);const lineHeight=size*.46;for(const line of lines){room(lineHeight);pdf.setFont(font,style);pdf.setFontSize(size);pdf.setTextColor(color);pdf.text(line,18,y);y+=lineHeight;}y+=gap;}
 function heading(label){room(25);y+=4;text(label,{font:'times',style:'bold',size:19,gap:4});}
 page();text('SYNTHÈSE PARCELLAIRE',{size:9,color:muted,gap:5});text(city.nom,{font:'times',size:34,style:'bold',gap:4});text(point.label||'Point sélectionné sur la carte',{size:12});text(`${city.departement?.nom||''} | Commune ${city.code} | ${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}`,{size:9,color:muted});text(`Édité le ${now.toLocaleString('fr-FR')} | Version de travail`,{size:9,color:muted,gap:7});
 const results=Object.values(data);const unavailable=results.filter(d=>d.status==='error').length;
 text(`${results.filter(d=>d.status==='success').length} sources consultées - ${unavailable} indisponible(s)`,{size:11,style:'bold'});
 text('Lecture au point sélectionné. Les zonages ne sont pas testés sur toute la surface de la parcelle. Une absence de résultat ne démontre pas une absence de risque ou de règle.',{size:10,color:muted,gap:5});
 text('Ce document reprend les sources du diagnostic parcellaire. Les statistiques détaillées de la commune, les ventes DVF et le calcul piéton à la demande ne sont pas inclus.',{size:9,color:muted,gap:5});
 results.forEach((d,index)=>{
  heading(`${String(index+1).padStart(2,'0')} / ${d.title}`);
  text(d.scope,{size:9,color:muted});
  text(d.status==='error'?'SOURCE INDISPONIBLE':d.status==='loading'?'CONSULTATION EN COURS':`${d.items.length} résultat(s) retourné(s)`,{size:9,style:'bold',color:d.status==='error'?'#98492e':navy});
  if(d.status==='success'){
   if(!d.items.length)text('Aucun objet retourné par cette source à cet emplacement. Aucune conclusion favorable ne peut en être déduite.',{size:10});
   d.items.forEach(item=>text(typeof item==='string'?item:featureLabel(item,d.key),{size:10,gap:3}));
  }else text(d.status==='error'?'Le service n’a pas répondu correctement. Aucun résultat ne peut être conclu.':'Les résultats ne sont pas encore disponibles.',{size:10});
  if(d.truncated)text('Résultats partiels : consulter la source pour la liste complète.',{size:9,color:'#98492e'});
  if(d.key==='risks')text('Les risques GASPAR concernent la commune et ne caractérisent pas l’exposition exacte de cette parcelle.',{size:9,color:'#98492e'});
  if(d.key==='buildings')text('Données associées au groupe de bâtiments. Un éventuel DPE doit être vérifié pour le logement concerné.',{size:9,color:'#98492e'});
  text(`Source : ${d.source}${d.queriedAt?' | Consultation : '+new Date(d.queriedAt).toLocaleString('fr-FR'):''}`,{size:8,color:muted});
  if(d.url){room(7);pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor('#2353f4');pdf.textWithLink('Ouvrir la source et vérifier les données',18,y,{url:d.url});y+=7;}
 });
 heading('Bien lire cette synthèse');text('Le zonage seul ne permet pas de conclure à la constructibilité d’un projet. Consultez les documents d’urbanisme opposables et les services compétents. Les nuisances sonores et certaines protections environnementales restent à intégrer. Les millésimes dépendent des sources ; la date de consultation ne constitue pas leur date de mise à jour.',{size:10,color:muted});
 const count=pdf.getNumberOfPages();for(let i=1;i<=count;i++){pdf.setPage(i);pdf.setDrawColor('#cbd0d4');pdf.line(18,282,192,282);pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(muted);pdf.text('CartoKob | Aide à la décision',18,288);pdf.text(`${i} / ${count}`,192,288,{align:'right'});}
 return pdf;
}
