# CartoKob — Aide à la décision

Première version nationale d’une interface de diagnostic territorial au point, selon la direction « atlas éditorial » : fond ivoire, titres bleu encre, carte panoramique.

## Fonctionnement

Rechercher une commune ou une adresse, sélectionner un point précis, puis choisir **Analyser ce point**. Les recherches de communes couvrent 34 746 communes de France métropolitaine, Corse comprise, dans l’extrait du 22 septembre 2026.

- Recherche communale locale (nom, code postal, code INSEE), adresses via IGN.
- Carte OpenStreetMap avec sélection au point.
- Cadastre et zonage d’urbanisme intersectant le point via API Carto IGN.
- Risques GASPAR à l’échelle communale, explicitement distingués de l’exposition parcellaire.
- Natura 2000 Habitats/Oiseaux et ZNIEFF I au point.
- Isochrone piéton de 15 minutes via Valhalla, sur demande.
- Export texte de la synthèse avec sources et statut de chaque réponse.

Les services sont interrogés directement depuis le navigateur : leur disponibilité, la couverture et les règles CORS peuvent varier. Une réponse vide n’est jamais interprétée comme une absence de risque ou de contrainte. Les résultats environnementaux couvrent uniquement les couches indiquées. Les données communales de population/surface sont des repères, pas un diagnostic.

## Limites actuelles

Cette version ne reproduit pas encore toutes les fonctions de l’outil DDT95 : servitudes, bâti, logement, nuisances sonores, liste des services accessibles et ensemble des protections environnementales restent à intégrer. Aucune donnée spécifique au Val-d’Oise n’a été présentée comme nationale. La carte réelle utilise OpenStreetMap ; elle ne reproduit pas exactement la carte illustrative de la maquette.

Validation visuelle et parcours dans un navigateur bloqués dans l’environnement de réalisation par la vérification de sécurité du navigateur. Voir `design-qa.md`. Ne pas considérer cette version comme prête pour une publication publique sans cette vérification.

## Développement

Node.js récent (22 recommandé).

```sh
npm install
npm run dev -- --port 4180
npm test
npm run build
```

Le build statique est dans `dist/client`. Les fichiers du runtime Sites sont conservés pour une éventuelle publication ultérieure, non effectuée ici.

## Sources

- Communes : https://geo.api.gouv.fr/ — extrait le 22 septembre 2026 ; la date d’extraction n’est pas le millésime de population.
- Adresses : https://data.geopf.fr/geocodage/search — IGN / BAN.
- Cadastre, urbanisme et nature : https://apicarto.ign.fr/api/doc/
- Risques : https://www.georisques.gouv.fr/api/v1/
- Fond cartographique : © contributeurs OpenStreetMap, https://www.openstreetmap.org/copyright
- Itinéraires : Valhalla / OpenStreetMap, https://valhalla1.openstreetmap.de/
- Icônes : Phosphor (MIT), marqueur Leaflet (BSD-2-Clause).
- Polices : DM Sans et Libre Caslon Display, Google Fonts (OFL).
- Contour France : ressource issue de la vitrine locale CartoKob ; provenance géographique à confirmer avant publication.

Le projet source fonctionnel est https://github.com/DDT95/diagnostic-aide-decision-95 ; cette interface a été écrite séparément pour CartoKob.
