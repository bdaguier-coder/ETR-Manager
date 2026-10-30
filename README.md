# Manager Control

Laboratoire interactif de supervision des dossiers ETR. Version démonstrative exclusivement en données fictives : aucun accès à CORE, aucun dossier client, aucun planning professionnel, aucun serveur ni base de données partagée.

## Utilisation

L’interface principale regroupe la carte, les modes TVH et FLUX, les dossiers en liste ou pipeline, les équipes et affectations, le planning, les statistiques et les archives. La mini-interface des chargés est accessible par `?view=agent` et conçue pour une largeur de 350 à 450 px.

72 scénarios fictifs couvrent les 24 pays demandés ; 66 sont actifs et 6 archivés initialement. Les noms de collaborateurs sont inventés. Les repères initiaux sont les centres de villes publiques, clairement identifiés comme indicatifs ; ils ne représentent pas des adresses de garages réels. Les lieux saisis doivent être confirmés. Un lieu non reconnu reste sans coordonnées.

Les modifications sont enregistrées dans le stockage local du navigateur. Un événement `storage` actualise les autres fenêtres de la même origine. Les brouillons périmés sont refusés pour éviter l’écrasement d’une mise à jour. Il n’existe aucune synchronisation entre appareils. Le menu Paramètres permet l’export/import JSON et une réinitialisation confirmée.

La priorité est distincte de l’étape du véhicule. Les bénéficiaires et sous-groupes conservent leur propre statut. Pour archiver, tous les bénéficiaires doivent avoir terminé leur assistance et le véhicule doit être en relivraison/résolution, avec un TVH non applicable ou livré. Une réouverture conserve l’historique.

Le glisser-déposer utilise les événements de pointeur et fonctionne aussi entre les colonnes du pipeline. Les alternatives au glisser-déposer sont disponibles dans la fiche dossier. Une affectation incompatible avec le planning, la pause, la langue, l’échéance ou la capacité indicative demande une justification. Les horaires sont interprétés dans le fuseau Europe/Paris, y compris les postes de nuit. Les langues sont attribuées explicitement aux collaborateurs et modifiables.

## Planning CSV / Excel

Première feuille, colonnes `agent_id,date,start,end,break_start,break_end,unavailable,reason`. Identifiants collaborateurs `a0` à `a11` ou colonne `nom`/`agent` avec le nom fictif exact. Date recommandée AAAA-MM-JJ ; les dates Excel numériques et les dates françaises JJ/MM/AAAA sont prises en charge. Horaires HH:MM ou fractions Excel. `unavailable` : true/false ou oui/non. Une pause 00:00–00:00 signifie aucune pause.

L’import est validé en totalité et nécessite une confirmation ; les lignes en erreur n’entraînent aucune modification partielle. Le bouton Modèle CSV fournit un exemple à la date sélectionnée. L’édition directe d’une journée et les transmissions groupées entre chargés sont disponibles dans Planning & transmissions.

## Exécution et tests

Application statique en modules ES, sans étape de compilation obligatoire. Servir ce dossier avec un serveur HTTP standard (les modules ne se lancent pas depuis `file://`).

```sh
npm test
node scripts/build.mjs
```

Le script de construction copie les ressources publiques dans `dist/`, utile pour la prévisualisation. GitHub Pages peut servir directement la racine de la branche principale.

## Publication GitHub Pages

Créer uniquement le dépôt `bdaguier-coder/ETR-Manager`, public pour l’offre gratuite Pages, puis envoyer les fichiers du projet sur la branche `main`. Dans Settings → Pages : Deploy from a branch, branche main, dossier `/ (root)`. Aucun autre dépôt n’est nécessaire ni modifié.

Le manifeste et le service worker utilisent uniquement des chemins relatifs et acceptent le sous-chemin du dépôt, notamment `/ETR-Manager/`. L’installation PWA requiert HTTPS et un navigateur qui la propose. Le service worker conserve les ressources de l’interface, pas les tuiles, les réponses de recherche ou les itinéraires externes. Hors ligne, les fiches et listes restent utilisables après la première mise en cache ; la carte de fond et les recherches nécessitent une connexion.

L’activation de Pages, l’URL publique et l’installation PWA ne peuvent être déclarées vérifiées qu’après publication effective. Ne pas publier ce prototype comme outil opérationnel réel sans infrastructure et validation adaptées.

## Architecture

`data.js` : référentiels, villes publiques et scénarios. `core.js` : règles métier, validation et contrôles. `map.js` : cartographie, recherche et routage. `app.js` : vues, formulaires et interactions. `style.css` : présentation responsive. `tests/core.test.mjs` : tests métier. `data/countries.geojson` : contours simplifiés des 24 pays.

## Services et attributions

Fond routier : Esri World Street Map, service public, attribution Esri, HERE, Garmin, USGS, NGA et autres fournisseurs indiqués par Esri. Respecter les conditions et attributions du service ; une démonstration n’est pas une garantie de disponibilité ou une licence de production. Une clé et un contrat de fournisseur de cartographie pourront être nécessaires pour le déploiement opérationnel.

Recherche : OpenStreetMap / Nominatim, seulement sur action explicite (pas d’autocomplétion réseau), au plus une requête par seconde, limitée aux pays couverts. Un catalogue local de villes et la saisie GPS offrent un repli. Données OSM sous ODbL : https://www.openstreetmap.org/copyright et règles Nominatim : https://operations.osmfoundation.org/policies/nominatim/ .

Routage : serveur public de démonstration OSRM, requêtes séquentielles et résultats conservés en mémoire pour éviter les recalculs. En cas d’échec, lien schématique identifié, sans distance inventée. En TVH en cours, la position de l’étiquette est simulée ; aucun suivi GPS n’est connecté. Le mode FLUX utilise toujours des liens schématiques.

Frontières : Natural Earth, domaine public, jeu `ne_50m_admin_0_countries` (contours généralisés, sans valeur juridique). Source : https://github.com/nvkelso/natural-earth-vector .

Bibliothèques : Leaflet 1.9.4 (BSD-2-Clause), SheetJS CE 0.18.5 (Apache-2.0), embarquées dans `vendor/`. Aucun identifiant, clé ou secret dans le projet.

## Limites et suites

Pas d’authentification ni de rôle sécurisé : l’accès manager est un mode de démonstration. Pas de suivi transporteur réel, de collaboration multi-utilisateur, de synchronisation multi-appareils ou de mesure de productivité. Les suggestions de mutualisation par pays départ/destination demandent une vérification logistique des villes, contraintes et capacités. Les estimations de charge sont des repères, pas une évaluation individuelle.

Une utilisation réelle demandera un serveur, une base partagée, une gestion des identités et habilitations, une journalisation adaptée, des fournisseurs cartographiques/routiers contractuels et la validation des services de conformité. La compatibilité Safari/iOS et l’installation PWA doivent être vérifiées sur de vrais appareils après publication HTTPS.
