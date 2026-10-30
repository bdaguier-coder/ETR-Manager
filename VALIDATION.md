# Vérifications de la version 1.0

Essais réalisés dans Chrome distant, le 30 octobre 2026, sur une prévisualisation HTTP de l’application.

## Vérifiés

- 9 tests automatisés métier réussis : jeu de 72 dossiers, 24 pays actifs, identifiants normalisés et doublons y compris archives, priorités indépendantes, plages de travail/pauses/postes de nuit en heure de Paris, langues et exceptions d’affectation, garde de résolution/archivage de tous les sous-groupes, filtrage/GPS, rejet des imports JSON invalides, calcul routier indisponible et cache du repli schématique.
- Navigation par filtre des 24 pays : trois dossiers actifs par pays pour 18 pays et deux pour les six derniers pays, comme attendu.
- Chargement visible d’un vrai fond routier Esri, frontières des 24 pays et regroupements de dossiers. Sélection de la France depuis le contour (clavier Entrée) vérifiée.
- Recherche d’établissement : la tour Eiffel et Le Jules Verne ont été retournés par Nominatim avec adresse et coordonnées. Saisie GPS 48.8566, 2.3522 confirmée avant enregistrement.
- Création de dossier, détection de 826-431 comme doublon de 826431, sauvegarde d’une prochaine action et d’un statut bénéficiaire.
- Affectation réelle par glisser-déposer à Camille Morel : alerte Hors service, justification obligatoire, puis carte déplacée et compteur de charge actualisé.
- Déplacement réel du dossier 826431 de Ouverture à Intervention dans le pipeline.
- Mini-interface : création du dossier AGENT9002 à trois personnes, changement de statut et mise à jour visible immédiatement dans la fenêtre manager. Identification d’un numéro déjà enregistré, rechargement et récupération du dossier.
- Archivage confirmé du dossier d’essai terminé, présence dans Archives puis réouverture confirmée. Conservation de l’historique.
- Import CSV fictif : une journée validée puis confirmée. Import Excel fictif : une journée validée puis confirmée. Correction apportée au traitement automatique des dates et heures Excel/CSV.
- Export JSON téléchargé, puis réimport du même fichier avec confirmation (73 dossiers, 12 chargés). Validation du fichier avant remplacement.
- Mode TVH filtré Portugal : 3 itinéraires routiers OSRM calculés ; 3 tracés en pointillés (7 9), étiquettes de position explicitement simulées.
- Dashboard filtré Portugal : 3 dossiers actifs, 3 TVH en cours, indicateurs cohérents avec la carte.

- Survol réel de la France : infobulle avec nombre de dossiers et alertes, opacité de surbrillance vérifiée à 0,19.
- Rendu vérifié en cadres de 390 px pour la mini-interface et la supervision, sans débordement horizontal du document.

- Réinitialisation de la démonstration après les essais : retour aux 66 dossiers actifs et 6 archives initiaux.

## Limites de vérification

Le dépôt de publication créé par l’utilisateur est `bdaguier-coder/ETR-Manager`. Le connecteur GitHub permet de transférer le code ; la configuration de Pages reste une étape distincte. L’URL publique et le service worker sur HTTPS doivent être vérifiés après activation effective de Pages. Les autres dépôts ne sont pas modifiés.

Safari/iOS, l’installation PWA sur un appareil réel et le mode hors ligne après publication HTTPS ne sont pas vérifiés. Les dépendances externes peuvent varier selon le réseau, le fournisseur et sa politique. Les fonds OpenStreetMap direct et CARTO ont été écartés après constat de blocage / demande de clé ; Esri a été testé visuellement.
