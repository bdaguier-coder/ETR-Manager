# Vérifications 1.3.1 — Localisation et repère jaune

2 novembre 2026 : 52 tests Node réussis. Les nouveaux tests couvrent les 24 repères pays sans écriture de coordonnées, les lieux non reconnus, la confirmation GPS et sa persistance sans modification de priorité, puis le retour au pays.

Chrome distant, données fictives : LOC9001 créé en Espagne sans lieu apparaît en jaune « Position à préciser », séparé des dossiers localisés au même repère. Confirmation GPS 41.3851, 2.1734 depuis la fiche : enregistrement direct, jaune retiré et priorité urgente conservée. Recherche Sagrada Família, Barcelona : cinq propositions Nominatim ; confirmation et adresse conservée après rechargement dans la liste. Le texte Garage fictif non identifié, conservé sans coordonnées, rétablit le jaune. Création LOC9002 au Portugal depuis la mini-interface sans lieu : modification reçue côté manager. En vue large, point jaune sans numéro. L’accès au lieu principal est visible dans la mini-interface. Les 48 tests de régression précédents restent réussis.

Les essais portent uniquement sur des lieux publics et dossiers fictifs, sur une origine de prévisualisation distincte du site public. Services externes dépendants du réseau ; saisie GPS sans géocodage. Aucun essai matériel tactile ou Safari/iOS réel revendiqué.

---

# Vérifications de la version 1.3 — TVH, mini-interface et signalements

Essais du 31 octobre 2026, uniquement avec des données fictives.

48 tests automatisés réussis : les 35 contrôles antérieurs et 13 contrôles supplémentaires de procédure TVH, migration bénéficiaire et signalements. Toutes les origines TVH convergent vers la France, y compris les anciennes destinations étrangères. Sans adresses, les repères de pays restent schématiques et n’ajoutent aucune coordonnée aux lieux du dossier. Les livrés deviennent roses ; leurs bénéficiaires restent indépendants. La zone et le zoom minimal sont contrôlés. Les adultes et enfants seuls composent le total ; vulnérabilité et animaux restent des indicateurs séparés.

Dans Chrome distant : chargement du fond routier, onglet TVH, ouverture de la procédure 826433 Portugal–France, enregistrement livré sans adresse obligatoire et apparition du groupe rose en France. Les groupes KSK violets et les liens actifs sont présents ; 13 parcours dont 6 liens actifs dans la vue testée après modification. La commande de dézoom est désactivée au niveau minimal. La destination France est en lecture seule dans la procédure.

Dans la mini-interface : sélection de 23 pays hors France, nouvelles options véhicule et bénéficiaires, composition 2 adultes + 1 enfant = 3 personnes malgré les deux indicateurs cochés, sauvegarde et persistance. Les cinq signalements ont été actionnés : les trois premiers passent rouge urgent ; les deux derniers passent noir critique. Le noir reste prioritaire ; son retrait redonne rouge si une alerte rouge subsiste. La fiche manager et la tâche de suivi reçoivent immédiatement l’escalade dans un autre onglet. La saisie du nombre d’enfants non encore enregistrée est conservée pendant ces changements. Création SIG9001 critique, rechargement et réouverture : signal conservé, tâche critique et dossier sans chargé visible dans la file d’affectation.

Un ajout complémentaire à Camille hors service affiche l’avertissement et exige sa confirmation explicite, sans texte justificatif. Nora conserve la responsabilité initiale. Le bandeau de la mini-interface affiche immédiatement Nora et Camille avec leurs rôles respectifs. Les nouvelles alertes majorent les tâches actives dans le moteur sans modifier la priorité de base. Les six scénarios déterministes antérieurs passent toujours.

Contrôle de mise en page en iframe de 390 px : cinq cases lisibles, commandes accessibles, bandeau multi-chargés. Ce contrôle ne remplace pas un essai sur matériel tactile ou Safari/iOS réel. Les erreurs du navigateur observées proviennent de son extension ; aucune erreur du code de l’application n’a été observée pendant les parcours testés. Les données de test ont été réinitialisées localement après vérification.

Le stockage reste local, sans synchronisation entre appareils ou entre les deux domaines. Les liaisons TVH au pays ne sont ni des itinéraires routiers ni un suivi GPS. Les parcours précis, tuiles et recherches externes conservent leurs exigences réseau et de fournisseur.

---

# Vérifications de la version 1.2 — Assignment Engine

Essais du 30 octobre 2026 sur données exclusivement fictives, dans Chrome distant et avec Node.

35 tests automatisés réussis. Les scénarios A–F vérifient les scores 12/23 et le choix de Sophie, les fins de service, les langues obligatoires, la continuité CORE simulée, l’absence de candidat admissible et le départage stable. Sont aussi contrôlés les seuils de surcharge, les coefficients décimaux, les échéances proches/dépassées, les dérogations obligatoires, les pauses et postes de nuit, les changements d’heure, la migration, les responsabilités, l’import/export et les statistiques par période. Le moteur calcule et affecte avec une fonction réseau qui lève systématiquement une erreur. Test de volume : 10 000 tâches et 200 chargés, de l’ordre de quelques dizaines de millisecondes dans le runtime de test, sans garantie pour tout matériel.

Les six scénarios ont été exécutés dans l’interface. Le passage de Sophie à 30 tâches normales a recalculé immédiatement la première recommandation vers Thomas. Dans le scénario D, la confirmation a affecté la tâche à Thomas en conservant Sophie comme responsable initial et Thomas comme complémentaire.

Dans les données de démonstration, le dossier 826431 a été affecté à Camille Morel ; Camille a ensuite été déclaré absent fictivement. Une nouvelle tâche CORE simulée a été créée puis confiée à Lina Dubois. Les rôles et les deux tâches ont été vérifiés dans la fiche et la vue des collaborateurs. Un glisser-déposer du dossier 826437 sur Camille absent a affiché un avertissement ; seule la confirmation explicite de la dérogation a permis l’écriture.

Création ENGINE9001 dans la mini-interface : présence immédiate dans la file manager ouverte dans une autre fenêtre du même navigateur. Paramètres du moteur modifiés puis restaurés ; export JSON de 73 dossiers, 74 tâches et 12 chargés, contrôle des coefficients, historique du moteur, responsable initial, complémentaire et tâche CORE. Réimport confirmé puis rechargement : rôles et tâches conservés.

Import CSV fictif et Excel fictif : journées validées puis confirmées. La vue du chargé indique « Planning importé, présence non vérifiée » et conserve l’absence simulée. La synthèse affiche 12 collaborateurs, les tâches par priorité, les rôles et les filtres de période, dont une période personnalisée.

Régression : glisser-déposer de 826431 de Ouverture vers Au dépôt, archivage de 826442 avec clôture de ses tâches, trois itinéraires TVH Portugal, violet #8554d8 et animation tvhRouteFlow, flux véhicules/bénéficiaires, carte en plein écran et thèmes clair/sombre. Les scénarios initiaux sont restaurés après les essais.

Rendu à 390 px contrôlé dans des cadres de navigateur : panneau de simulation de 390 px sans débordement horizontal, saisie agent sans débordement ; boutons utilisables par clic/pointeur. Aucun appareil tactile physique ni Safari/iOS n’était disponible : le comportement matériel tactile et l’installation PWA sur ces appareils restent à valider. Le moteur local est indépendant de la connexion ; la cartographie reste dépendante de ses services externes. Le mode manager est un mode de démonstration, sans habilitation sécurisée. Aucune synchronisation multi-utilisateur n’est annoncée.

---

# Vérifications de la version 1.1

Essais réalisés le 30 octobre 2026 dans Chrome distant, en prévisualisation. Données fictives uniquement.

18 tests automatisés réussis : identifiants et doublons, 24 pays, priorités distinctes, horaires/pauses/postes de nuit, affectations immédiates et multiples, huit statuts véhicule, indépendance des bénéficiaires, archivage/réouverture, migration des anciennes sauvegardes, validation JSON, coordonnées et filtres, géométrie régionale, regroupements et repli de routage.

Le modèle spatial a été testé sur 10 000 dossiers avec au plus 160 repères détaillés. Dans l’interface, 1 000 dossiers actifs fictifs donnent 62 points regroupés en vue internationale, sans numéros individuels. La France affiche 42 dossiers dans trois groupes. Avec 500 TVH fictifs, le nombre de parcours est limité à 24 et le message invite à affiner la zone ; un groupe au même lieu présente dix numéros à la fois. Les scénarios initiaux ont ensuite été restaurés (66 actifs, six archives).

La France puis Île-de-France ont été sélectionnées : limites régionales, un dossier dans la région et indicateur Dashboard cohérent. Les 24 pays disposent de régions/provinces, soit 524 zones dont 18 régions françaises. En TVH Portugal, trois dossiers sont dans le cadrage ; les routes OSRM sont violettes et leurs pointillés animés, avec décalage variable observé. Les positions sont indiquées comme simulées.

Le glisser-déposer vers deux chargés a conservé le dossier dans les deux colonnes sans justification ni confirmation. Le retrait du premier a conservé le second. La fiche manager s’ouvre en consultation ; Modifier révèle les huit statuts. Les champs prochaine action, échéance et motif de priorité sont retirés. Un dossier terminé a été glissé dans le classeur permanent, confirmé puis retrouvé dans les archives.

L’interface chargé permet de replier les informations facultatives en mode Critique et d’enregistrer le numéro seul. Le dossier d’essai CRIT990 a été enregistré puis retrouvé pour modification. Le thème sombre est synchronisé entre onglets et conservé après rechargement. Le plein écran occupe la fenêtre, le redimensionnement de la carte est correct et la sortie fonctionne avec le bouton ou Échap.

Les contrôles de la version initiale couvrent aussi le vrai fond routier, le survol lumineux des frontières, les 24 filtres pays, la recherche Nominatim d’établissement/adresse, la confirmation GPS, la création/détection des doublons, la synchronisation locale, la sauvegarde après rechargement, l’historique, les plannings CSV/Excel et l’export/import JSON. Le rendu à 390 px a été vérifié sans débordement horizontal.

## Limites

Safari/iOS, l’installation PWA sur appareil réel et le mode hors ligne sur HTTPS ne sont pas vérifiés sur de vrais appareils. Les services externes de carte, recherche et routage peuvent être indisponibles : messages et replis sont prévus. Les positions TVH ne sont pas un suivi transporteur ; les limites administratives sont généralisées et sans valeur juridique.

Le stockage reste local à chaque origine : Sites et GitHub Pages ont des sauvegardes distinctes. L’export/import JSON permet de transporter la démonstration. Aucune base partagée, authentification métier ou connexion interne n’est ajoutée.
