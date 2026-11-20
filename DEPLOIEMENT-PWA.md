# PK Locator / Manager Control — Hébergements, PWA et procédure de maintenance

**État relevé le 20 novembre 2026.** Document de suivi technique. Les URL et états ci-dessous distinguent strictement l'existant de la cible : ne pas considérer la migration comme effective tant que le déploiement et les essais sur appareils n'ont pas réussi.

## Sites et sources de vérité

| Application | Dépôt source | Hébergement en fonctionnement connu | Origine PWA |
| --- | --- | --- | --- |
| PK Locator v1.4.0 | https://github.com/bdaguier-coder/Pk-locator (main) | GitHub Pages : https://bdaguier-coder.github.io/Pk-locator/ | https://bdaguier-coder.github.io/Pk-locator/ |
| Manager Control v1.3.2 | https://github.com/bdaguier-coder/ETR-Manager (main) | GitHub Pages historique : https://bdaguier-coder.github.io/ETR-Manager/ | https://bdaguier-coder.github.io/ETR-Manager/ |
| Manager Control, **cible non déployée au 20/11/2026** | Même dépôt ETR-Manager (main) | **À créer** : Cloudflare Pages, nom demandé `manager-control-demo` | **Cible, non vérifiée** : https://manager-control-demo.pages.dev/ |

L'ancien site Manager Control ne doit pas être supprimé pendant la migration. Ne jamais changer l'adresse de PK Locator.

## Identités PWA réellement définies dans le code

- PK Locator : `dist/manifest.webmanifest`, `id: "./"`, `name: "PK Locator"`, `start_url: "./"`, `scope: "./"` ; icônes `dist/icons/icon-{192,512}.png` ; service worker `dist/sw.js` ; cache `pk-locator-v1.4.0`.
- Manager Control : `manifest.webmanifest`, `id: "./"`, `name: "Manager Control"`, `start_url: "./"`, `scope: "./"` ; icônes `icon-{192,512}.png` ; service worker `sw.js` ; cache `manager-control-shell-v1.3.2`.
- Variante « Chargé » Manager Control : `manifest-agent.webmanifest`, `id: "./agent"`, lancement `./?view=agent`. L'application choisit ce manifeste lorsque le paramètre de vue vaut `agent`.
- Les chemins relatifs `./` donnent des identités distinctes aux deux applications à leurs chemins GitHub Pages actuels. Sur le **nouveau domaine Cloudflare**, ils seront résolus à sa racine. Ne pas remplacer inutilement ces valeurs par `/` dans le dépôt tant que le site GitHub Pages historique reste utilisé : cela changerait son identité installée.
- Chaque worker gère les requêtes de sa propre origine et ses caches propres ; le worker PK limite également son interception au chemin PK Locator. La seule cohabitation de deux applications sous `github.io` n'établit pas une collision. L'alerte Windows sur l'identité peut provenir d'une ancienne installation ou d'un manifeste antérieur ; cette hypothèse exige une vérification sur Windows.
- Une mise à jour des ressources doit s'accompagner d'une évolution de la version du cache afin d'éviter un contenu hors ligne ancien. Les anciennes données `localStorage` ne sont pas effacées par les mises à jour du worker.

## Déploiements

**PK Locator — ne pas modifier :** workflow existant `.github/workflows/pages.yml` ; déclenchement sur `main` ; construction des données nationales, tests Node, publication de `dist/` sur GitHub Pages. Dernière exécution vérifiée comme réussie : 30 octobre 2026 (commit `b3f3e8309e9ec89427ccb4dba3ea3c86181502b1`). Cette réussite CI ne remplace pas des essais interactifs dans un navigateur.

**Manager Control — cible Cloudflare Pages :** branche `main` du dépôt `bdaguier-coder/ETR-Manager`, commande de construction conseillée `npm test && node scripts/build.mjs`, répertoire de sortie `dist` et racine du dépôt `/`. Le script `scripts/build.mjs` copie les fichiers source, les modules, les fichiers de données, les icônes, les manifestes et le service worker, sans transformation des fonctionnalités. Les chemins relatifs utilisés dans l'application sont compatibles avec un site servi à la racine d'un domaine indépendant.

**État de la création Cloudflare au 20/11/2026 : BLOQUÉ.** Deux tentatives de création de `manager-control-demo` avec connexion GitHub via l'API Cloudflare ont retourné HTTP 401, code Cloudflare `8000011` : « There is an internal issue with your Cloudflare Pages Git installation ». La connexion Cloudflare dispose bien de l'autorisation Pages Write ; la lecture de la liste des projets fonctionnait, mais indiquait zéro projet Pages au moment du diagnostic. L'intégration GitHub Cloudflare doit être rétablie dans les connexions Cloudflare/GitHub par l'utilisateur ou le fournisseur avant de réessayer. **Ne pas** créer un projet Direct Upload sous le nom définitif pour contourner l'erreur : Cloudflare ne permet pas de transformer ultérieurement ce type de projet en projet à intégration Git native.

Une fois l'autorisation Git rétablie : créer le projet Pages relié au dépôt `ETR-Manager`, vérifier le nom disponible, configurer le build et la branche, consulter les journaux et les ressources publiées (HTML, manifestes, workers, JS, icônes, fonds de carte), vérifier les tests et installer la nouvelle PWA uniquement après validation. Un rollback Cloudflare se fait en rétablissant un déploiement précédent ; un rollback Git en restaurant un commit valide et en redéployant, **sans effacer le stockage local**.

## Données locales : sauvegarde avant bascule de domaine

Manager Control persiste sa démonstration dans `localStorage` sous `manager-control-demo-v1` et le thème sous `manager-control-theme`. L'import/export JSON existe déjà dans l'interface. Les données du domaine `bdaguier-coder.github.io` ne sont **pas** automatiquement accessibles depuis `pages.dev`. Une sauvegarde du navigateur Windows n'a **pas** été effectuée à distance.

Depuis l'ancienne application sur **l'ordinateur et le profil navigateur qui contiennent les données** : ouvrir Manager Control, cliquer « Paramètres & données » puis « Export JSON » ; enregistrer le fichier JSON à un emplacement conservé. Ne pas sélectionner « Réinitialiser la démonstration ». Ne pas vider les données de site. Une fois le nouveau site Cloudflare pleinement validé, ouvrir ses « Paramètres & données », cliquer « Import JSON », choisir le fichier, lire l'avertissement de remplacement du jeu de données local et confirmer seulement si approprié. Vérifier dossiers, équipes, planning et statuts. L'export JSON contient l'état métier ; il ne transfère pas nécessairement le thème.

## Vérification Windows, à faire une fois Cloudflare fonctionnel

Sur l'ancien site, **exporter d'abord** les données Manager Control comme ci-dessus. Dans Edge, ouvrir `edge://apps` ; dans Chrome, `chrome://apps`. Identifier les applications et leur adresse d'ouverture. Si l'ancien raccourci PK Locator propose d'être renommé en Manager Control, ne pas accepter le changement d'identité. Une fois la sauvegarde vérifiée, retirer **uniquement** les installations obsolètes concernées et ne pas cocher une option de suppression des données du navigateur/site. Ne pas effacer l'historique ni les cookies globalement.

Dans le même navigateur : ouvrir **exactement** `https://bdaguier-coder.github.io/Pk-locator/`, puis installer PK Locator avec l'option « Installer cette application ». Ouvrir la nouvelle URL Cloudflare Pages confirmée et installer Manager Control de la même manière. Vérifier que les deux icônes, noms et adresses sont distincts et que chaque raccourci lance la bonne application ; fermer/rouvrir chacune et vérifier l'absence d'alerte de modification de nom/logo. Contrôler manuellement la sauvegarde restaurée.

## Protocole de recette avant déclaration de réussite

PK : ouverture URL conservée ; ville ; PK/PR ; recherche par indices ; fonds de carte ; marqueurs ; copie/export GPS ; manifeste et worker ; comportement de mise à jour.

Manager : carte ; Dossiers ; TVH ; Flux ; équipe et affectations ; priorités ; statuts bénéficiaires/véhicules ; archives ; planning ; statistiques ; filtres/recherche ; import/export JSON ; stockage/rechargement ; interface chargé et affichage mobile.

Indépendance : simultanéité des deux applications ; origine, manifeste et portée des workers ; absence de ressources croisées ; mises à jour indépendantes ; essai des deux installations Windows. **Aucun de ces essais navigateur/Windows n'a été réalisé ni certifié au 20 novembre 2026**.

## Historique

- **20/11/2026** : examen en lecture seule des manifestes, workers, points d'entrée, enregistrements de workers, build et stockage des dépôts. Versions 1.4.0 et 1.3.2 confirmées dans les sources. Déploiements GitHub Pages historiques précédemment réussis. Connexion du futur projet Pages à GitHub refusée par Cloudflare à deux reprises (HTTP 401, code 8000011). Aucun changement de code applicatif, d'icône ou d'URL publique ; aucun effacement de cache ou de données.
