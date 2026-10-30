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
