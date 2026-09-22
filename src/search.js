export const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’\-]/g,' ').trim();
export function searchCommunes(communes, query) {
 const q=normalize(query); if(!q)return [];
 return communes.filter(c=>c.key.includes(q)||c.code===q||c.codesPostaux.some(p=>p.startsWith(q))).sort((a,b)=>{
 const score=c=>c.key===q?0:c.code===q?1:c.key.startsWith(q)?2:3;
 return score(a)-score(b)||(b.population||0)-(a.population||0);
 }).slice(0,8);
}
