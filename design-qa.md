# Design QA — volet compact CartoKob

- Source visuelle : captures utilisateur du 22 septembre 2026, 13:53:25 et 13:53:53, visibles dans la conversation. Référence de marque conservée : docs/reference-visuelle.png.
- Cible : carte utilisable à gauche, volet compact à droite, chiffres clés communaux puis informations parcellaires en dessous, aucun menu à gauche. Palette ivoire/marine et typographie CartoKob conservées par demande explicite.
- Implémentation : application locale port 4180.
- Capture d’implémentation, viewport, dimensions et normalisation : indisponibles.
- Blocage actuel : l’outil navigateur échoue à l’initialisation (app-server exited before returning initialize). Pas de capture ni de comparaison visuelle possible. Aucun contournement du contrôle précédent.
- Typographie, rythme/espacements, couleurs, images et contenu : non validés visuellement. Aucun verdict de fidélité fondé sur le code.
- Comparaison globale et régions détaillées : bloquées. Historique : aucune nouvelle comparaison visuelle réalisée.
- Vérifications non visuelles : compilation, tests des données et du serveur, parcours React avec coexistence du portrait et de la parcelle dans le même volet, suppression de sélection et changement de commune. Ne remplacent pas la validation navigateur.
- À vérifier : dimensions desktop/mobile, défilement indépendant, contraste, focus, chargement de carte après redimensionnement, sélection et position de défilement.

final result: blocked
