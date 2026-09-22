# Couverture des données — 22 septembre 2026

Le produit couvre géographiquement la France métropolitaine et la Corse. Cela ne signifie pas que tous les thèmes sont renseignés en tout lieu. Les deux références DDT95 ont servi à identifier les fonctions ; leurs profils locaux ne sont pas utilisés comme données nationales.

## Portrait de la commune

| Thème | Source branchée | Périmètre et limites |
|---|---|---|
| Recherche et repères | API Découpage administratif | Extrait de 34 746 communes, centres, département, région, population, superficie. L’extraction n’est pas le millésime de population. |
| Contour | API Découpage administratif en direct | Polygone communal chargé à la sélection. Erreur de service signalée. |
| Population et âges | Insee Melodi, DS_RP_POPULATION_PRINC | Dernière période retournée, séries comparables présentes dans la réponse. Classes d’âge non chevauchantes. |
| Logement | Insee Melodi, DS_RP_LOGEMENT_PRINC | Résidences principales, secondaires/occasionnelles, vacance, maisons, appartements, propriétaires occupants. Valeurs pondérées arrondies. |
| Emploi des résidents | Insee Melodi, DS_RP_ACTIVITE_PRINC | Actifs occupés de 15 ans ou plus, temps complet/partiel. Pas un nombre d’emplois au lieu de travail. |
| Revenus | Insee Melodi, DS_FILOSOFI_CC | Niveau de vie médian par unité de consommation et pauvreté à 60 %. Secret/absence respectés. |
| Équipements | Insee Melodi, DS_BPE | Domaines de services, commerces, enseignement, santé/action sociale, transports, sport/culture et tourisme. Agrégats sélectionnés sans double comptage des sous-catégories. |
| Risques | Géorisques GASPAR | Contexte communal ; ne démontre pas l’exposition de la parcelle. |
| Marché immobilier | DGFiP / Etalab, fichiers DVF 2025 | Chargement à la demande, déduplication par mutation. Paris, Lyon, Marseille réunissent leurs arrondissements. Montants globaux, sans prix au m² ni estimation automatique. Fichiers absents et résultats partiels signalés. |

## Parcelle et point sélectionné

| Thème | Source branchée | Périmètre et limites |
|---|---|---|
| Fond cadastral national | IGN WMTS Parcellaire Express PCI | Tuiles affichées dès le zoom 15, masquables. Style et TileMatrixSet vérifiés sur GetCapabilities. Lacunes possibles du plan cadastral et erreurs du service. |
| Parcelle | IGN API Carto cadastre/parcelle | Référence, section, numéro, contenance et géométrie intersectant le point. Ne constitue pas un bornage. |
| Zonage d’urbanisme | IGN API Carto GPU zone-urba | Intersections au point. N’établit pas, seul, la constructibilité du terrain ou la faisabilité d’un projet. |
| Servitudes | IGN API Carto GPU assiette-sup-s/l/p | Assiettes surfaciques, linéaires et ponctuelles, intersection exacte au point, sans recherche de proximité. |
| Nature | IGN API Carto / INPN | Natura 2000 Habitats et Oiseaux, ZNIEFF I et II, réserves naturelles nationales, parcs naturels régionaux au point. Ce n’est pas l’ensemble des protections. |
| Bâtiments | BDNB ouverte, filtre exact sur la parcelle | Groupes de bâtiments associés à une référence unique. Construction, logements et éventuel DPE associé avec identifiant et date de réception. Maximum 20 résultats, limitation signalée. Un DPE de groupe n’est pas attribué comme certitude au logement acheté. |
| Transactions de la parcelle | Même fichier DVF 2025 | Filtre sur la référence cadastrale exacte, uniquement lorsqu’une seule parcelle est identifiée. Un identifiant peut avoir changé ; aucun résultat ne prouve pas une absence de vente. |
| Marche à 15 minutes | Valhalla / OpenStreetMap | Estimation de réseau sur demande, affichage de l’isochrone. Pas une liste complète de services accessibles, ni une vérification PMR. |
| Export | Texte de synthèse | Sources et états des consultations du diagnostic au point. Les consultations DVF à la demande ne sont pas incluses dans cet export. |

## Restrictions connues

- DVF : absence de publication pour la Moselle (57), le Bas-Rhin (67) et le Haut-Rhin (68). Pas de valeur de remplacement.
- DVF 2025 : répertoire officiel vérifié le 22/09/2026 ; publication observée le 18/05/2026. Les années antérieures restent à intégrer. Fichiers téléchargés à la demande via une route serveur bornée, car le serveur de fichiers ne fournit pas CORS.
- Melodi : file d’attente espacée de 2,3 secondes et cache mémoire d’une heure dans le client. La diffusion commerciale nécessitera une gestion partagée des quotas adaptée au trafic.
- Les périmètres urbanisme/nature sont interrogés au point, pas sur toute l’étendue du polygone cadastral.
- Données manquantes, confidentielles, sources indisponibles et zéro observé sont des états distincts.
- Desserte GTFS, nuisances sonores, eau, énergie, loyers, constructions autorisées, prix historiques, documents réglementaires détaillés et cartographie complète des risques à la parcelle ne sont pas encore tous intégrés.

## Références officielles

- https://geo.api.gouv.fr/decoupage-administratif/communes
- https://www.insee.fr/fr/information/1302169?question=comment-utiliser-l-api-melodi
- https://api.insee.fr/melodi/catalog/all
- https://cadastre.data.gouv.fr/datasets
- https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetCapabilities
- https://apicarto.ign.fr/api/doc/
- https://www.georisques.gouv.fr/api/v1/
- https://files.data.gouv.fr/geo-dvf/latest/csv/2025/
- https://dvf-ipfo.infra.geo.data.gouv.fr/faq.html
- https://bdnb.io/services/services_api/
