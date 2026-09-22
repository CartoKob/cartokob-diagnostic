"""Import official ANIL 2025 files; retain geography and reliability fields."""
import csv,json,pathlib,urllib.request,io,re
sources={'apartment':'https://static.data.gouv.fr/resources/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025/20251211-145010/pred-app-mef-dhup.csv','house':'https://static.data.gouv.fr/resources/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025/20251211-145039/pred-mai-mef-dhup.csv'}
def number(value):
 try:return float(value.replace(',','.'))
 except (ValueError,AttributeError):return None
allrows={}
for kind,url in sources.items():
 raw=urllib.request.urlopen(url,timeout=30).read().decode('cp1252')
 for r in csv.DictReader(io.StringIO(raw),delimiter=';'):
  code=r['INSEE_C']
  if not re.fullmatch(r'(?:0[1-9]|[1-8][0-9]|9[0-5]|2[AB])\d{3}',code):continue
  allrows.setdefault(code,{})[kind]={'value':number(r['loypredm2']),'low':number(r['lwr.IPm2']),'high':number(r['upr.IPm2']),'scope':r['TYPPRED'],'observations':number(r['nbobs_com']),'r2':number(r['R2_adj'])}
root=pathlib.Path('public/rents-2025');root.mkdir(exist_ok=True)
for dep in sorted({c[:2] for c in allrows}):
 (root/(dep+'.json')).write_text(json.dumps({c:r for c,r in allrows.items() if c.startswith(dep)},ensure_ascii=False,separators=(',',':')))
(root/'sources.json').write_text(json.dumps({'year':2025,'geography':'COG 2025','sources':sources,'attribution':'Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin'},ensure_ascii=False,indent=2))
print(len(allrows),'communes imported')
