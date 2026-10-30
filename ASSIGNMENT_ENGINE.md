# Assignment Engine — version 1.2

Moteur déterministe exécuté localement en JavaScript. `assignment-engine.js` ne dépend ni du DOM, ni du réseau, ni d’une API, ni d’un fournisseur d’IA. L’interface et les écritures sont dans des modules séparés. Le même module peut être utilisé ultérieurement par un serveur interne autorisé.

## Modèle de données et migration

Chaque dossier conserve `initialAgent`, également présenté comme responsable principal. `associates` contient les chargés complémentaires. Une réaffectation de tâche ajoute le nouveau chargé au dossier sans retirer les précédents. La suppression du responsable initial est bloquée ; le retrait d’un complémentaire est bloqué s’il détient une tâche active.

`tasks` est la collection locale des tâches : identifiant unique, dossier, intitulé, priorité, état `todo`/`doing`/`done`, responsable de tâche, durée estimée, langues obligatoires/souhaitables, échéance facultative, date de création/clôture, source ETR ou CORE simulé, historique. Une tâche terminée reste conservée. Les statuts du véhicule et des bénéficiaires restent indépendants.

Au premier chargement d’une sauvegarde antérieure, une tâche de suivi est créée par dossier, avec le responsable et la priorité initiale disponibles. Une archive produit une tâche terminée à sa date de clôture. Cette migration est idempotente. Les nouvelles tâches sont ensuite explicites : le moteur n’infère pas des tâches provenant d’un système externe. Les couleurs d’un dossier restent celles de sa supervision ; ses tâches ont leurs propres priorités.

Les imports JSON valident tâches, références, responsabilités, dates, langues, coefficients et historiques. Les données et paramètres sont sauvegardés avec le reste de la démonstration. L’export/import transporte la démonstration ; il n’existe pas de synchronisation entre appareils, ni entre les origines Sites et GitHub Pages.

## Disponibilité : contraintes avant classement

Tous les horaires sont en Europe/Paris, comme les plannings de l’application. La date d’un poste de nuit est sa date de début ; le poste commencé la veille et les changements d’heure sont pris en compte. Les pauses, absences et fins de service sont contrôlées.

Absence, pause, indisponibilité déclarée, hors service, planning manquant et langue obligatoire manquante excluent normalement un candidat. Une règle facultative exige une présence déclarée ; une autre exclut les services trop courts ; la surcharge peut être éliminatoire. Aucun bonus ne neutralise une exclusion.

Un planning importé n’est jamais une preuve de présence réelle. La source du planning et le caractère fictif ou non confirmé de la présence sont affichés. Les déclarations de présence sont des simulations, non des données professionnelles connectées.

## Charge et classement exacts

Seules comptent les tâches actives attribuées sur des dossiers actifs. Un dossier non affecté n’augmente pas artificiellement la charge d’un collaborateur. La tâche en cours d’affectation est exclue de la comparaison pour comparer son titulaire et les autres sur la même base. Les métriques du panneau sont explicitement affichées hors cette tâche. La synthèse des équipes présente, elle, toute la charge courante.

Valeurs initiales : normale 1 ; à suivre 2 ; urgente 5 ; critique 10.

`charge = Nnormales × poidsNormal + NàSuivre × poidsÀSuivre + Nurgentes × poidsUrgent + Ncritiques × poidsCritique`

`indice = charge + pénalitéÉchéances + pénalitéService + pénalitéLanguesSouhaitables − bonusContinuité`

Pénalité d’échéances : +3 par tâche urgente/critique dont l’échéance arrive dans 60 minutes ; +5 par tâche urgente/critique déjà en retard. Les échéances absentes ne sont jamais inventées.

Service insuffisant si `durée estimée de la nouvelle tâche + marge de 10 min > minutes restantes`. Dans ce cas : +12, puis +0,1 par minute manquante. Le statut « Fin de service imminente » apparaît à 30 minutes ou moins. L’exclusion pour service insuffisant peut être activée séparément.

Langue simplement souhaitable manquante : +4 par langue distincte. Toutes les langues obligatoires doivent être attribuées au chargé. Bonus de continuité : −3 si le chargé est déjà responsable initial ou complémentaire du dossier.

Surcharge initiale : au moins 6 tâches urgentes, ou 3 critiques, ou une charge pondérée de 80. Ces seuils sont configurables, avec possibilité de transformer cette exclusion en avertissement.

Les candidats admissibles sont triés par indice croissant, puis par identifiant stable croissant en cas d’égalité. Le nom et l’ordre d’affichage des collaborateurs n’influencent pas ce départage. Les trois premiers sont proposés lorsqu’ils existent ; sinon le panneau affiche le nombre réel, éventuellement zéro. Aucun pourcentage de pertinence n’est calculé.

Les coefficients, pénalités, seuils de surcharge, alerte sans responsable (30 minutes initialement), règles obligatoires et autorisations de dérogation se règlent dans l’espace manager. L’interface explique la formule. L’historique global du moteur conserve les modifications de paramètres sans altérer artificiellement la date de progression des dossiers.

## Décision et dérogation

Le manager confirme une proposition, choisit un autre chargé ou effectue un glisser-déposer. Une affectation compatible s’effectue directement. Une incompatibilité affiche ses raisons avant toute écriture. Une dérogation bloquante exige une confirmation explicite, et une langue obligatoire manquante exige aussi sa propre autorisation explicite. Les paramètres peuvent interdire ces dérogations. Aucun texte de justification n’est imposé.

Les contrôles sont répétés dans la fonction de mutation du domaine. L’affectation, la réaffectation, les éventuelles dérogations et la clôture de tâche sont historisées. Un formulaire ouvert avant une modification reçue d’un autre onglet doit être rouvert avant sauvegarde.

## Synthèse et simulation

La synthèse des collaborateurs distingue les dossiers uniques par chargé, la responsabilité principale, les compléments, les tâches actives par priorité, la charge pondérée, les archives de la période et les tâches terminées de la période. Les filtres pays/chargé de la supervision sont respectés. Un dossier partagé compte une fois dans les totaux généraux ; il apparaît légitimement chez chaque chargé concerné. Aucun classement de productivité n’est produit.

Le bac à sable A–F possède une horloge fixe (30 octobre 2026 à 10 h, Paris). Les charges, priorités, langues, disponibilités et horaires sont modifiables avec recalcul immédiat. Une affectation simulée n’écrit rien dans les dossiers de démonstration.

A : Sophie, 12 tâches normales = 12 ; Thomas, 3 normales + 4 urgentes = 23. Sophie est proposée. B : fin de service proche. C : allemand obligatoire. D : tâche CORE pendant l’absence du responsable initial, avec ajout d’un relais. E : aucun candidat admissible. F : égalité départagée par identifiant stable.

## Portée et limites

Démonstration entièrement fictive, sans connexion à CORE ou à un planning professionnel. L’« accès manager » est un mode d’interface de démonstration, pas une habilitation sécurisée : une utilisation réelle nécessitera authentification et contrôles côté serveur. Le calcul fonctionne avec les ressources locales déjà chargées ; le service worker met ses modules en cache après un premier chargement réussi. Les services de cartographie conservent leurs exigences de connexion.

Une estimation de charge ne mesure ni le temps réel passé, ni la difficulté complète d’un dossier, ni la productivité d’une personne. Les recommandations sont une aide à la décision humaine.
