# Design QA — évolution commune / parcelle

- Source visuelle : `docs/reference-visuelle.png`, maquette Atlas éditorial validée, capture du 22/09/2026 à 12:45 fournie dans la conversation.
- Implémentation : application locale sur le port 4180, parcours à deux niveaux.
- Capture navigateur, viewport, normalisation de densité : indisponibles.
- Contrôle bloquant : le navigateur intégré refuse l’accès à localhost, car la vérification de sécurité administrateur est indisponible. Aucun contournement effectué.
- Comparaison globale / régions détaillées : non réalisée. Typographie, espacements, couleurs, qualité des ressources et contenu ne sont pas déclarés visuellement validés.
- Historique : nouvel essai d’accès au navigateur, même blocage. Aucune itération de comparaison visuelle.
- Changements intentionnels : accueil national, contour communal, fil de navigation commune/parcelle, portrait détaillé sous la carte et diagnostic non modal pour conserver la carte utilisable. Les évaluations fictives du mock sont remplacées par des données sourcées.
- Tests non visuels : parcours React sous jsdom (carte et services simulés), données/états/quotas, CSV DVF/déduplication/territoires, passerelle serveur, compilation. Ce ne sont pas des tests navigateur.
- Appels réels vérifiés : contours, statistiques Insee Lyon et équipements Ajaccio, API Carto cadastre/urbanisme/servitudes, tuile cadastrale IGN, BDNB par référence cadastrale, DVF Lyon 2e et Cergy via route locale.
- À vérifier en navigateur autorisé avant publication : premier/second clic, recherche clavier, zoom/contours/tuiles, sélection parcellaire, clic hors commune, isochrone, téléchargements, états d’erreur, mobile, débordements et console.

final result: blocked
