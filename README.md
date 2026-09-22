# CartoParcelle — Aide à la décision territoriale

Un lieu, deux niveaux de lecture : comprendre la commune, puis examiner une parcelle. Interface nationale dans la direction visuelle « atlas éditorial » : ivoire, bleu encre, carte panoramique et titres géographiques.

## Parcours

1. Cliquer sur la carte ou rechercher une commune : le contour communal et le portrait apparaissent.
2. Cliquer à l’intérieur de cette commune : le point sélectionné est conservé, la carte zoome et le diagnostic parcellaire se charge automatiquement.
3. Cliquer dans une autre commune : le contexte revient au portrait de cette nouvelle commune.
4. Rechercher une adresse précise : accès direct au diagnostic du point géocodé.
5. Utiliser le fil « commune / parcelle » pour revenir au contexte. Le bouton Parcelles permet de masquer le fond cadastral, visible à partir du zoom 15.

## Données

Portrait : population, logement, emploi des résidents, revenus, équipements, risques communaux et transactions DVF 2025 à la demande.

Diagnostic au point : parcelle, zonage d’urbanisme, servitudes, Natura 2000, ZNIEFF, réserves nationales, parcs régionaux, bâtiments/DPE associés à la référence cadastrale, transactions DVF de la parcelle et isochrone piéton de 15 minutes.

Les états vides, confidentiels, partiels et indisponibles sont distingués. Les données de contexte communal ne sont pas présentées comme des caractéristiques certaines du bien. L’intégralité des fonctions et des sources des deux outils DDT95 n’est pas encore couverte : voir **[DATA-COVERAGE.md](DATA-COVERAGE.md)**.

## Développement

Node.js 22 recommandé.

```sh
npm ci
npm run dev -- --port 4180
npm run check
```

- `npm test` : tests de données, couverture, DVF et passerelle serveur.
- `npm run test:flow` : tests du parcours React sous DOM simulé, services et carte simulés. Ne remplace pas une vérification en navigateur.
- `npm run build` : application dans `dist/client` et Worker dans `dist/server`.

### Service DVF

`/api/market?code=95127` relaie un fichier officiel DVF 2025. Le chemin amont est fixe, les codes validés, les requêtes bornées à 8 Mo / 15 secondes, et les réponses mises en cache une heure. Seule la redirection officielle vers le stockage public DVF identifié est acceptée. Aucun jeton ni URL arbitraire.

Le serveur Vite fournit cette route en développement et en preview. Le build ajoute une enveloppe au Worker statique sans modifier les fichiers de runtime d’origine. Un hébergement purement statique ne suffit plus pour DVF : il faut servir aussi le Worker ou un équivalent de cette route.

## Validation et état

Les tests automatisés et les appels réseau sont vérifiables via les scripts. La comparaison visuelle avec la maquette et le parcours complet sur carte réelle restent bloqués dans l’environnement de réalisation par le contrôle de sécurité du navigateur. Voir [design-qa.md](design-qa.md). Cette version n’est pas présentée comme prête à commercialiser ou déjà publiée.

## Sources et crédits

- API Découpage administratif ; Insee Melodi ; IGN API Carto / Géoplateforme ; Géorisques ; BDNB ; DGFiP / Etalab DVF ; Valhalla / OpenStreetMap.
- Fond : © contributeurs OpenStreetMap ; parcellaire IGN / DGFiP.
- Phosphor (MIT), marqueur Leaflet (BSD-2-Clause), DM Sans et Libre Caslon Display (OFL).
- Contour France de l’en-tête : ressource de la vitrine locale CartoKob, provenance géographique à confirmer avant publication.
- Références fonctionnelles : https://github.com/DDT95/val-doise-a-la-loupe et https://github.com/DDT95/diagnostic-aide-decision-95. Interface CartoKob écrite séparément, aucune donnée locale réétiquetée comme nationale.

Dépôt : **CartoKob/cartokob-diagnostic**. Ne pas publier sur DDT95.

Vie quotidienne : eau et assainissement SISPEA, arrêts PAN, contacts DILA, écoles, électricité ORE et loyers ANIL 2025 sont désormais intégrés. Le serveur doit également servir `/api/water`. Les loyers se régénèrent avec `python3 scripts/import-rents.py`. Voir `DATA-COVERAGE.md` pour les périmètres et les rubriques restant à nationaliser.
