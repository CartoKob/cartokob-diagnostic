import test from 'node:test';
import assert from 'node:assert/strict';
import {createDiagnosticPdf} from '../src/report-pdf.js';
test('PDF paginates long results and retains failure, partial and source information',()=>{
 const pdf=createDiagnosticPdf({city:{nom:'Lyon',code:'69123'},point:{lat:45.75,lon:4.83},data:{long:{key:'sup',title:'Servitudes',scope:'Point',source:'IGN',url:'https://apicarto.ign.fr',status:'success',truncated:true,items:Array.from({length:80},(_,i)=>`Resultat ${i+1}`)},error:{key:'risks',title:'Risques',scope:'Commune',source:'GASPAR',status:'error',items:[]}},now:new Date('2026-09-22T12:00:00Z')});
 const output=pdf.output();assert.ok(output.startsWith('%PDF-'));assert.ok(pdf.getNumberOfPages()>1);assert.match(output,/SOURCE INDISPONIBLE/);assert.match(output,/Resultat 80/);assert.match(output,/https:\/\/apicarto.ign.fr/);assert.match(output,/partiels/);
});
