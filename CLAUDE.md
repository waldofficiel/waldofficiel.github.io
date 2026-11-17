# WALD ROYAL : passation complète pour Claude

Ce fichier sert à reprendre le développement du jeu **Wald Royal** dans une nouvelle discussion. Lis-le en entier avant de toucher au code.

## Qui et quoi
- **L'utilisateur** est le créateur de la chaîne TikTok **Wald Off** (@wald_off). Il parle français, écrit vite et en phonétique. Il veut des réponses courtes et des idées « de fou ».
- **Le jeu** est un battle royale 3D façon Fortnite mobile, en plus simple : 30 joueurs (lui contre 29 bots), un bus volant, un cercle (tempête), un mode classé à trophées. Lui-même est le perso jouable (bob noir, lunettes de ski, t-shirt rouge, chaîne).
- **Sa voiture**, « La Wald », est un cabriolet bleu nuit sale avec un arceau, des sièges bleus et un pot d'échappement qui sort du capot. C'est la voiture légendaire du jeu.
- **Le site** est https://waldofficiel.github.io, dépôt GitHub `waldofficiel/waldofficiel.github.io`, branche `main`. Le site est déployé par GitHub Pages (`.github/workflows/pages.yml`).
- **La page du jeu** est `wald-royal/index.html`, en ligne sur /wald-royal/. L'accueil `index.html` a un bloc « Mon jeu » qui y mène.

## Règles imposées par l'utilisateur (à respecter absolument)
1. **Aucune marque ni nom déposé** dans le jeu, car il sera publié. Ses voitures ont été renommées :
   - Polo → « La Wald »
   - Golf GTI → « Bolide Jaune »
   - 2CV Mad Max → « Rouillarde »
   - SCAR → « Fusil Doré »

   Il n'y a pas de logo VW (badge rond générique). Pas de noms de rangs Fortnite non plus : Maître / Néon / Légende au lieu de Élite / Champion / Unreal.
2. **Ne jamais mettre** « Pamiers » (sa vraie ville) ni « Cabo » / « Caboleon » (son autre identité, séparée) dans le jeu ou le site.
3. **Le jeu doit être téléchargeable**, pas un jeu qui tourne dans le navigateur. Le lien « jouer dans le navigateur » a été retiré. Le paramètre caché `?jouer` existe toujours, il sert aux applis.
4. **L'inventaire a 3 cases d'armes + 1 case de soins**, avec un bouton 🎒 pour ouvrir le panneau (jeter, réordonner avec ◀ ▶, remplacer par une arme au sol, utiliser un soin).
5. **Le K/D se calcule** ainsi : `kills / max(1, parties − TOP 1)`. Un TOP 1 ne compte pas comme une mort. Exemple : 3 kills, 2 parties, 1 TOP 1 → K/D = 3.
6. **Pas de stats** « Constru cassées » ni « TOP 1 en La Wald ».
7. **Le jeu se joue en paysage**, avec un écran « tourne ton téléphone » en portrait.
8. **Style visuel** : la ville principale (Turbo Towers) est moderne (béton, façades, verre, pas de brique) ; les autres villes sont moins modernes. La map a du relief (collines), elle n'est pas plate.
9. **Le nom officiel** est « Wald Royal », sans e. Le logo `jeu/logo.jpg` est l'image « WALD ROYAL » qu'il a fournie.
10. **Couleurs du site et du jeu** : rouge, violet, rose, noir. Style néon / chrome / bling.
11. **Ne jamais** taper de mot de passe ni se connecter à un compte à sa place.

## Fichiers
| Fichier | Rôle |
|---|---|
| `jeu/index.html` | Tout le jeu (~1240 lignes, un seul fichier, three.js r128 global `THREE`) |
| `jeu/three.min.js` | three.js r128 (récupéré de l'historique git `3abcd6c:live/three.min.js`) |
| `jeu/polo3d.js` | `window.buildPolo(THREE,{lite,lights})` : modèle 3D détaillé de La Wald |
| `jeu/skins.js` | `window.buildSkin(THREE, id)` : skins cartoon `wald` (défaut), `flubb`, `lea`, `stan`, faits en formes arrondies puis fusionnés par matériau |
| `jeu/nature.js` | `window.NATURE` : textures de sol procédurales tuilables (herbe x2, terre, roche, sable) et modèles de végétation à couleurs par sommet (`tree` oak/pine/birch, `rock`, `bush`, `flower`) avec attribut `aSway` pour le vent |
| `jeu/weapons3d.js` | `window.buildGun(THREE, k, rarColor)` : armes en profils extrudés biseautés (bois, acier, or, chargeur courbé, lunette, pompe rainuré…), mises à l'échelle par `GUNSCALE` dans `gunModel` ; `window.buildGlider(THREE, col)` : deltaplane (voile texturée W, armature, trapèze, câbles, feux), barre de contrôle aux mains (`glider.position (-.15, 1.98, 0)`) |
| `jeu/interiors.js` | Fenêtres à pièce visible, étages + escaliers, meubles Kenney (voir plus bas) |
| `jeu/city.js` | `window.CITY.build(THREE, ctx)` : décor des villes en `Kit` instanciés (clims, châteaux d'eau, antennes, panneaux solaires, cabanons, auvents, enseignes néon sans marque, lampadaires le long des routes, bancs, poubelles, bouches d'incendie, abribus, pubs du jeu, conteneurs + grue aux docks, bidons/pneus au ranch, clôtures/foin/puits au village, drapeaux à l'avenue). Rebords de toit, bandeaux d'étage et piliers pour les toits plats. Les gros objets ajoutent des boîtes dans `PCOL` (testées dans `pushCircle`). `house()` mémorise `hs.door` |
| `jeu/polo3d.html` | Visionneuse 3D de La Wald (rotation, phares, faire rouler) |
| `jeu/manifest.webmanifest`, `jeu/sw.js` | PWA. Cache `wald-royale-3d-v29` : **monter la version à chaque modif** |
| `jeu/logo.jpg`, `jeu/icons/` | Logo et icônes (512/192/180) |
| `wald-royal/index.html`, `wald-royal/img/*.jpg` | Page vitrine + captures du jeu |
| `app/android/` | Appli Android : WebView + WebViewAssetLoader, `fr.waldoff.royal` |
| `app/desktop/` | Appli Windows : Electron 31 + electron-builder NSIS, protocole `app://` |
| `.github/workflows/jeu.yml` | Construit l'APK + l'EXE et les publie dans la release `jeu` |

## Contenu de `jeu/index.html`, dans l'ordre
1. **Réglages et sons** : réglages `SET {vol, sens, gfx, auto}` puis sons.
2. **Rendu** : renderer avec ombres PCFSoft (soleil qui suit le joueur), tone mapping ACES, ciel en dégradé (shader).
3. **Textures et matériaux** : textures canvas `TX` (brique, bois, metal, beton, facade, verre, toit, toitm, sol). `worldMat()` donne des UV en coordonnées monde aux murs instanciés.
4. **Relief** : grille `HG` (pas de 2 m, 501×501), `hgt(x,z)`, `baseH`, `pad()` qui aplatit sous les maisons isolées. Les villes et les routes sont aplaties. La mer est à y = −0.55.
5. **Bâtiments** : `house(x,z,sx,sz,mat,h,door)`, avec une porte, un sol et un toit. Le toit est caché quand on est dedans et tombe quand 2 murs sont cassés. Les murs sont en InstancedMesh, avec `y0`.
6. **Villes** :
   - Turbo Towers : centre, moderne.
   - Rusty Ranch.
   - Chrome Avenue : showroom vitré.
   - Piston Docks : hangar.
   - Golden Hollow : bois.

   Il y a aussi des maisons isolées.
7. **Armes** (`WEAPONS`) :

   | Arme | Rareté |
   |---|---|
   | Pistolet | 0 |
   | Mitraillette | 1 |
   | Fusil d'assaut | 1 |
   | Pompe | 2 |
   | Sniper lourd | 3 |
   | Fusil Doré | 4 |

   Les armes sont en hitscan.
8. **Persos** : `makeChar` (bob, lunettes, chemise rouge, chaîne).
9. **Véhicules** (`VT`) :

   | Clé | Nom | Nombre sur la map |
   |---|---|---|
   | polo | La Wald | 1 (`carModel('polo')` utilise `buildPolo`, chauffeur visible) |
   | golf | Bolide Jaune | 1 |
   | van | Fourgon | 5 |
   | 2cv | Rouillarde | 7 |

   Ils sont posés au hasard partout (`vehSpot`) et suivent le relief en s'inclinant.
10. **Butin** : caisses de munitions réalistes (`ammoBox`), coffres, `dropItem`.
11. **Gameplay** :
    - Tir auto : `aimAssist`, bouton TIR AUTO sur le côté.
    - Inventaire : `giveWeapon`, `invToggle`, `invRender`.
    - Tir et dégâts : `castRay`, `fireGun`, `hurt`, `eliminate`.
    - Véhicules : `drive`, `enter`, `leave`.
    - Bots : `botThink` (butin, tempête, combat, sauts).
    - Le reste : `update`, `updCam`, `drawMini`, `hud`.
12. **Classé** :
    - `RANKS` : Bronze I 0 → Légende 5400.
    - `entryCost` : coût d'entrée qui monte avec le rang.
    - `placeGain` : points de place × bonus de rang, +1 par kill.
    - `showStats` : écran des stats, avec le K/D.
13. **Menus** : lobby 3D, pause, fin de partie, écran d'installation (logo, sans lien pour jouer dans le navigateur), écran `#rotate`.
14. **API de test** : `window.WR = { me, pl, vehicles, state, start, update, items, setCam, fire, give }`.

## Tester (conteneur cloud, sans GPU)
```bash
cd /home/claude/wo && (python3 -m http.server 8765 >/dev/null 2>&1 &); sleep 1
```
- **Lancer le jeu** : Playwright Chromium avec `args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']`, une vue 960×540, `setDefaultTimeout(120000)` (c'est lent).
- **Page à ouvrir** : `http://localhost:8765/jeu/index.html?jouer`, puis piloter avec `window.WR` (`WR.start()`, `WR.update(dt)`, `WR.give('scar')`…).
- **À vérifier** : aucune `pageerror`. Faire des captures et les regarder.

## Construire et publier les applis
- **Pour lancer** : un `git push` sur `main` qui touche `jeu/**`, `app/**` ou le workflow lance « Construire Wald Royal (Android + PC) ».
- **Ce qu'il fait** :
  - Android (ubuntu-24.04, JDK 17, SDK du runner via `local.properties`) : `gradle assembleRelease`, APK signé avec `app/android/wald.keystore` (mot de passe `waldroyal`, alias `wald`).
  - Windows (windows-latest) : `npm i` + electron-builder.
- **Où ça sort** : la release avec le tag `jeu`.
  - https://github.com/waldofficiel/waldofficiel.github.io/releases/download/jeu/WaldRoyal.apk
  - https://github.com/waldofficiel/waldofficiel.github.io/releases/download/jeu/WaldRoyal-Setup.exe
- **Suivre l'état** : `curl -sS "https://api.github.com/repos/waldofficiel/waldofficiel.github.io/actions/runs?per_page=3"`, puis `/actions/runs/{id}/jobs` et `/check-runs/{job_id}/annotations` en cas d'erreur.
- **Réseau** : npm, pypi et maven sont bloqués depuis le conteneur. GitHub marche (push, API en lecture). `gh` n'est pas connecté.
- **Signature de commit** :
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

## Méthode qui marche avec lui
- Commencer tout de suite, sans plan à valider. Tester en headless, regarder les captures, pousser, puis lui dire en 3-4 phrases ce qui a changé.
- Garder des sauvegardes avant les grosses refontes.
- Après chaque changement du jeu : monter la version du cache dans `sw.js`, pousser, vérifier que le workflow passe, et refaire les captures de `wald-royal/img/` si le look a changé.
- S'il envoie une capture d'écran avec des remarques, corriger exactement ce qu'il montre.
- Proposer de soi-même des idées marquantes : nouvelles armes, véhicules, événements délirants sur la map.

## Ajouts de novembre 2026
- **Deux cartes** : `MAP` = `campagne` (Los Campagnes) ou `desert` (Sable Rouge). Choix dans le lobby (boutons sous JOUER), gardé dans `localStorage.wr_map` ou `?map=`, la page se recharge pour construire la carte. `DES` = vrai sur le désert : ciel orangé, dunes + mesas dans `baseH`, cactus et rochers rouges, villes Mirage City / Canyon Rouillé / Oasis Chrome / Puits Turbo / Fort Cactus (mêmes plans que la carte verte pour l'instant, à améliorer).
- **Musique du lobby** : générée en WebAudio (`music(on)`, `mStep`), libre de droits. Lancée dès l'ouverture du salon (autoplay autorisé dans l'APK et dans Electron via `autoplay-policy`) ; dans un navigateur elle démarre au premier toucher. Coupée en partie.
- **K/D** : juste « K/D », sans phrase d'explication.
- **Skins + pièces 🪙** : `SKINS_SHOP` (Wald Off gratuit, Léa 400 Rare, Stan 700 Épique, Flubb 1200 Légendaire : l'utilisateur veut Flubb le plus cher). Pièces gagnées à chaque partie dans `settle` (20 + 10/élim + bonus de place), stockées dans `ST.po`, skins possédés dans `ST.own`, skin équipé dans `ST.skin`. Onglet **Boutique** (`#shopList`, skins payants en pied, couleur de rareté) et **Casier** (skins possédés, miniature tête 3D `skinThumb(id, 1)`), tous deux remplis par `lockerRender()`, achat via `buySkin()`. Au salon, on fait tourner le perso en glissant le doigt (`lRot`, avec inertie). `makeChar(lk)` utilise `buildSkin` si `lk.sk`. Un bot sur trois porte Flubb, Léa ou Stan. Modèles de référence : planches Gemini envoyées par l'utilisateur (pas de logo sur les baskets).

## Refonte graphique et tir (novembre 2026)
- **Couleurs linéaires** : `THREE.Color.setHex/setStyle/setHSL` sont patchés en tête du rendu pour convertir sRGB → linéaire (fin du rendu délavé). Toute couleur créée par hex/CSS est donc linéaire ; pour une valeur déjà linéaire, utiliser `setRGB`.
- **Post-traitement maison** `POST` (three r128 n'a pas les examples, et raw.githubusercontent est bloqué) : rendu dans une cible HalfFloat (MSAA x4 en Max sur WebGL2), bloom 3 niveaux, ACES, saturation, chaud/froid, contraste, vignette, FXAA, grain anti-banding, sortie sRGB. Actif en Moyen et Max (`R3.toneMapping = NoToneMapping` dans ce cas), coupé en Bas. `drawScene(sc, cam, lobby)` remplace `R3.render`.
- **Ciel** `skyMat` : soleil + halo (bloom), nuages fbm qui défilent, couleurs `SKY_HOR/SKY_ZEN`. Le ciel suit la caméra et est mis à l'échelle de `cam.far`. Les ShaderMaterial incluent `tonemapping_fragment` + `encodings_fragment` pour marcher avec et sans post.
- **`GFX`** (après `buildGroundGeo`) : eau animée (vagues, Fresnel, reflets du soleil), feuillage d'arbres en plus (`cr2`), herbe instanciée autour du joueur (`placeGrass`, rayon 42 en Max, 28 en Moyen) qui ondule au vent, sol en Phong avec roche sur les pentes.
- **Graphismes par défaut** : Moyen sur téléphone, Max sur PC.
- **Tir** : `aimAssist` ne bouge plus la caméra ; TIR AUTO tire seulement quand le rayon du viseur touche un ennemi (après 0,12 s). Dispersion : hanche ×1,8, en visée ×0,45 ; sniper sans lunette = imprécis. Bots moins précis (`acc` plus bas, `err` plus grand).
- **VISER** (`ads`, `adsK`) : clic droit maintenu sur PC, bouton VISER (bascule) en tactile. Zoom (55°/46°, sniper 16° avec lunette `#scope` plein écran), caméra à l'épaule, marche plus lente, sensibilité réduite. Coupé au rechargement, au changement d'arme, en véhicule.
- `WR.cam` et `WR.aim()` pour les tests. En headless (swiftshader), il n'y a qu'environ 1 image toutes les 3 s : attendre longtemps avant les captures.

## Persos, montgolfière, musique du bus (novembre 2026)
- **Anatomie des skins** (`skins.js`) : torse en `LatheGeometry` (profil de rayons), épaules reliées au torse (bras pivotent à y 1,47, z ±0,33), membres effilés (`seg`), mains avec pouce, chaussures (`shoe`), lacets (`laces`), gilets ouverts devant (lathe avec trou), jupe évasée, boucles en tire-bouchon (`curl`, TubeGeometry), bouche ondulée de Flubb en tubes. La tête de Flubb est posée à y 1,6 (pas de cou). L'utilisateur veut que ça ressemble le plus possible à ses planches Gemini : continuer à affiner.
- **La Wald en montgolfière** : la polo n'est plus posée au départ. `DROP` (états wait → fall → away → done), lancée entre 55 et 85 s de partie (`bus.t`), dans la prochaine zone (`dropSpot`). Elle descend à 7,5 m/s sous `balloon` (ballon rayé rouge/violet/rose/noir avec des W, flamme, nacelle, câbles, lumière rose), marqueur rose « W » sur la minimap, puis le ballon remonte et s'en va. `dropUpdate(dt)` est appelé dans `update`.
- **Musique du bus** : `music(true, 'bus')` joue `mStepBus` (124 BPM, électro joyeuse) tant que `me.mode === 'bus'`, coupée au saut. `MUSMODE` = 'lobby' ou 'bus'.
- **Site** : le bouton « Télécharger » du haut lance directement l'APK sur Android et l'EXE sur PC ; sinon il fait défiler jusqu'aux boutons.
- Au salon, lumières douces (`lp1`, `lp2`, `lrim`, `lrim2`) + `POST.expo` 1,15 : au-delà, le perso est éblouissant.

## Map façon Valheim (novembre 2026)
- **Sol mélangé** : `MASK` (canvas 1024, R = villes/routes/champs, G = plage) + `GT = NATURE.groundTextures`. Le shader du sol (`groundSplat`) mélange 2 herbes à 2 échelles, terre en taches, roche en triplanaire sur les pentes, sable sur la plage ; les zones peintes gardent la couleur de la carte. Les textures lues à la main sont décodées avec `pow(c, 2.2)`.
- **Végétation** : forêts groupées (`vnoise`), jusqu'à 620 arbres sur la carte verte, en 3 espèces × 3 variantes (sapins sur les hauteurs), rochers moussus, 1 500 buissons et cailloux, fleurs autour du joueur. Matériau `windMat` (vent dans le vertex shader). Les anciens arbres boules (`TREEVIS`) sont cachés ; le désert garde ses cactus.
- **Rayons de soleil** : dans le shader de composition, flou radial du bloom vers le soleil (`uSunP`, `uSunV`).
- **Persos** : matériaux Phong + liseré lumineux sur les bords (`skinRim`).

## Fluidité et netteté (novembre 2026)
- **Pas de MSAA** : `WebGLMultisampleRenderTarget` faisait planter le rendu en vue du bus. Le post-traitement utilise un FXAA léger et une résolution plus haute (Moyen jusqu'à 1,6×, Max jusqu'à 2×).
- **Résolution dynamique** `DYN` / `dynRes()` : sous ~45 i/s pendant 2 s, la résolution baisse (jusqu'à 0,6) ; au-dessus de 57 i/s, elle remonte.
- **Profondeur 24 bits** (`DepthTexture` UnsignedInt sur la cible du post) + `cam.near` qui grandit avec la hauteur de caméra + mer à y = −0,75 : plus de rayures de la mer à travers le sol vu de haut.
- **En hauteur** (bus, chute à plus de 45 m) : herbe, fleurs, buissons et cailloux sont cachés ; l'herbe ne se recalcule qu'après 11 à 16 m parcourus. Les InstancedMesh ont `frustumCulled = false` (sinon three r128 les coupe à tort).
- **Végétation** : déformation des sommets par hachage de position (`hpos`), sinon fentes entre les faces. Buissons et cailloux en icosaèdres simples, sans ombre portée.
- Shaders compilés d'avance au chargement (`R3.compile`).
- **Tests headless** : en mode Max, la vue du bus peut planter swiftshader si trop lourde ; tuer les chromium restants (`pkill -f chrom`) entre les essais.

## Soins, pompe, difficulté (novembre 2026)
- **Soins** `HEAL` : `mini` petit bouclier (+25, jusqu'à 50, 1 s, max 3 dans le sac), `shield` gros bouclier (+50, 3 s, max 2), `heal` kit de soins (vie à 100, 4 s, max 3). Modèles 3D `healModel` (fiole, bidon, mallette à croix rouge), icônes `healIcon`. `p.heals`, `p.healSel`, `useHeal(t)`, `healTick`, `cancelHeal` (tirer ou changer d'arme annule ; on marche à 45 %). 4e case de la barre `#hb3` (touche 4, ⇄ ou touche C pour changer de soin), barre de progression `#useBar`. Les bots utilisent les soins tout de suite au ramassage.
- **Sac** : section Soins (`#invHeals`, bouton UTILISER), flèches ◀ ▶ sur les armes pour changer leur ordre.
- **Pompe** : 13 × 9 plombs, ×1,5 jusqu'à 5 m puis baisse jusqu'à 26 m.
- **Difficulté** `BOTLV` = groupe de grade / 7 (Bronze 0 → Légende 1) : précision des bots `.08 + BOTLV * .38`, agressivité `.2 + BOTLV * .5`, dégâts des bots sur le joueur ×(0,6 + 0,4 × BOTLV).

## Occlusion ambiante et ressources 3D (novembre 2026)
- **SSAO** maison dans le shader de composition (`ssao()`, 12 échantillons sur la profondeur 24 bits), seulement en Max (`POST.ao = .6`).
- **Modèles libres** : on peut cloner des dépôts GitHub publics (ex. `KenneyNL/Starter-Kit-City-Builder`, modèles .glb sous licence MIT : créditer Kenney si on les utilise). `GLTFLoader.js` et les effets officiels de three r128 se récupèrent par `git clone --depth 1 --branch r128 --filter=blob:none --sparse https://github.com/mrdoob/three.js` puis `sparse-checkout set examples/js/...` (raw.githubusercontent est bloqué, git marche). Pas encore intégrés dans le jeu.

## Place centrale et textures cartoon (novembre 2026)
- **Place de Turbo Towers** (`plaza()` dans `city.js`, au centre de la ville `centre`) : pavage en rosace (canvas 1024), bordure, grande fontaine (bassin en pierres, colonne et vasque en `LatheGeometry`, eau animée en ShaderMaterial), **statue de La Wald en or** qui tourne au sommet (`buildPolo` + matériau or), 360 gouttes instanciées en paraboles (8 jets + débord de la vasque), 4 bancs, 4 bacs à fleurs avec arbre, 8 lampadaires à globe, 10 pigeons qui s'envolent quand on approche à moins de 4,5 m. Animé par `window.CITY_UPDATE(t, dt, x, z)` appelé dans la boucle. Collisions du bassin et des bacs dans `PCOL`. Le mobilier de rue évite la place (rayon 11,5 m).
- **Textures des bâtiments refaites en style cartoon peint** (`TX`, avec `rrect` et `srnd`) : briques arrondies avec reflet, planches avec veines et nœuds, tôle ondulée avec rouille cernée, béton en panneaux biseautés, façades avec cadres sombres, reflets peints, rideaux colorés et une pièce éclairée avec plante, tuiles en écailles, parquet.
- **Sol** : `maskTex` sans mipmaps, et dans le shader le vert de base de la carte n'est jamais utilisé (`isG`) : plus de bande vert fluo le long des routes et des villes. Herbe un peu désaturée.
- `WR.gfx`, `WR.mask`, `WR.terr` pour les tests.

## Persos en un bloc, bots sculptés, images du site (novembre 2026)
- **Un bloc par partie du corps** : `merge()` fusionne tous les morceaux d'un groupe (corps, tête, bras, jambes) en un seul mesh avec groupes de géométrie (un matériau par groupe). Sphères en 26×18.
- **Coques** `shell()` (morceau de sphère qui épouse la tête) : cheveux courts sous le bob et barbe sur la mâchoire du perso Wald (texture `hairTex`), masse de cheveux lisse de Léa + 34 boucles. Le perso Wald a une grosse chaîne en or (`bigChain`, gourmette sur une courbe) avec un médaillon W et le col du t-shirt.
- **Bots** : skin `npc` (même corps sculpté), variantes par `o.v` : t-shirt ou sweat à capuche, short ou pantalon, casquette, bonnet à pompon, bob ou tête nue, 6 couleurs de cheveux, barbe, lunettes rondes. `buildSkin(THREE, id, opts)` ; les bots sans skin ont `lk.sk = 'npc'`.
- **Images** : galerie de `wald-royal/` refaite (place, Turbo Towers, planeur, Golden Hollow, sac, boutique, salon, mer, collines, désert, La Wald). Sur l'accueil, le bloc « Mon jeu » a la place en fond et un bandeau de 4 captures (`.gshots`) qui mène à `wald-royal/#images`.

## Cartes refaites, ferme, capitale du désert, planeurs, danse (novembre 2026)
- **Deux îles différentes** : la campagne est une grande île découpée (baies, presqu'îles, `bumps`) avec **6 villes**, une **montagne** (`PEAKS`, type 0) et un **lac** (`LAKE`, l'eau de mer passe sous le relief creusé ; `inLake`, `onLand` exclut le lac). Le désert est une île allongée nord-sud avec un **immense lagon à l'ouest** (ellipse tournée + baie profonde), **7 villes**, des **plateaux rocheux** (`PEAKS`, type 1). Les villes ne sont plus en croix : coordonnées dans `TOWNS`, la côte est repoussée pour qu'elles restent à terre (rayon ville + 50 m). `ISLM` = rayon max de l'île pour semer arbres/loot.
- **Routes qui serpentent** : `ROADP` (Bézier + ondulation, 5 m entre les points, on évite la mer), champ de distance `RDG`/`roadD()` (grille 2 m) pour `nearRoad`, le relief et l'herbe. Lampadaires le long des courbes (`ctx.ROADP` dans `city.js`). Les routes s'arrêtent à l'entrée de la ferme (chemins de terre `FARM.pp`).
- **Ferme** (2e ville, kind `2cv`, sur les deux cartes) : grange rouge (`grange`, toit tôle `toitm`, porte à l'est avec battants à croix, porte de grenier), maison blanche à bardage (`ferme`, toit ardoise `toitf`, porche, fenêtres à volets), remise, 2 silos, éolienne de ferme qui tourne (`FX.mill`), tracteur, champs `FARM.fields` (maïs haut où se cacher, blé, citrouilles, choux) avec rangs peints, clôtures en bois, épouvantails, foin, abreuvoir, château d'eau. Herbe autorisée dans les prés de la ferme (`farmGrass`).
- **Pignons** : triangles sous les toits à 2 pentes (`hs.gim`), même texture que les murs. Toits par matière (`hs.roof`).
- **Nouvelles villes** : `chalet` Lodge des Pins (chalets, tentes, feu de camp qui vacille, tables de pique-nique), `mine` Mine Rouge (chevalement avec roue qui tourne, entrée de mine, rails, wagonnets, tas de minerai), `motel` Motel Néon (chambres en rang, station-service, enseigne néon, piscine).
- **Capitale du désert Mirage City** (rayon 88) : au sud-ouest une **favela** (`peint`, cabanes colorées par instance `w.col`, citernes bleues, fers à béton, linge), un **grand mur** cassable (`beton`, barbelés, tags) et au sud-est le **quartier ultra riche** (`riche`, villas à façade vitrée, piscines, palmiers, transats, grille dorée, héliport).
- **Plafonds** : chaque maison a un plafond opaque (bois / brique / tôle / béton, `hs.cim`) ; dedans la caméra reste sous le plafond.
- **Collisions** : cailloux (`PEBS`) et mobilier des rues (`col()`).
- **Coffres** : il faut rester 1 s à côté (`CHEST_T`, anneau `#openUI`, le coffre tremble).
- **Accroupi** : bouton `#bCrouch` (mobile) / C ou Ctrl : vitesse ×0,5, caméra plus basse. **Danse du Top 1** : débloquée au premier TOP 1 (`ST.dance`), bouton 💃 `#bDance` / touche B, aperçu au casier. Plus de bouton pause (Échap sur PC).
- **Planeurs** `GLIDERS` : Aile Wald, **Canard Gonflable** (500), **Wald Car Gonflable** (1000) — `buildGlider(THREE, col, type)` dans `weapons3d.js`, `ST.gl`, `ST.ownG`, boutique + casier.
- **Fluidité** : la lumière de la montgolfière reste dans la scène (intensité 0) pour ne pas recompiler les shaders, et `R3.compile` au lancement avec montgolfière, La Wald et planeur visibles.

## Intérieurs, vraies fenêtres, étages (novembre 2026)
- **`jeu/interiors.js`** (`window.INTERIORS`), appelé après `CITY.build` :
  - **Fenêtres** posées sur chaque mur de maison (pas les murs isolés, pas la grange, pas le verre) : vitre extérieure en **interior mapping** (`WIN_VS`/`WIN_FS` : pièce en faux 3D derrière la vitre, papier peint, parquet, canapé ou lit, étagère, lampe, pièce allumée ou non, rideaux / stores, reflet du ciel, croisillons), vitre intérieure lumineuse (`dayTex`), cadre, appui, **balcons** (dalle + garde-corps vitré) sur 30 % des fenêtres d'étage des immeubles modernes. Liées au mur (`w.wins`) : elles disparaissent quand le mur casse (`INTERIORS.setWall` appelé dans `setWall`). La texture `facade` n'a plus de fenêtres peintes.
  - **Étages** : bâtiments `facade`/`beton`/`riche`/`peint` de 6 m et plus → `hs.nf` étages (`hs.fl`), planchers (dessus parquet, dessous plafond blanc éclairé) avec trémie, **escaliers en marches** sur 2 bandes le long du mur du fond (volées alternées). `INTERIORS.groundAt(x, z, y)` remplace `hgt` pour les persos (on monte vraiment), `INTERIORS.ceilAt` garde la caméra sous le plafond de l'étage. Les boîtes `PCOL` ne gênent plus ceux qui sont à un autre étage.
  - **Meubles** : **Kenney Furniture Kit (CC0)** en .glb dans `jeu/models/` (licence `LICENSE-Kenney-Furniture-Kit.txt`), chargés avec `jeu/GLTFLoader.js` (three r128). Échelle ×2,2, le devant des modèles regarde +z. Plans par type de bâtiment (`houseType` : maison, tour/bureau, boutique, hangar, cabane, motel), rangés par un petit algorithme qui évite la porte et les escaliers (`furnish`). Tout est **fusionné par quartier** (grille 140 m) en un seul mesh à couleurs de sommets indexé, caché au-delà de 170 m (110 en Bas) ou quand la caméra est haute. Gros meubles = collisions. Terrasses de café (tables et chaises Kenney + parasols) devant les immeubles des villes modernes via `window.EXT_FURN`.
  - `WR.interiors()` donne les stats (fenêtres, meubles, sommets).
- **Planeur Wald Car Gonflable** : fait à partir du vrai modèle `buildPolo` (lite) en plastique brillant, coutures roses, valve, cordes.
- Dépôts avec des modèles libres : le kit Kenney Furniture complet se récupère par `git clone --filter=blob:none --sparse https://github.com/xiaojilele-glitch/WhyBuddy` puis `sparse-checkout set "client/public/kenney_furniture-kit/Models/GLTF format"` (140 modèles, CC0).

## Vraies vitres, décor 3D, optimisation (novembre 2026)
- **Vraies fenêtres** (`interiors.js`, `makeWindows`) : chaque mur de maison est redessiné en **morceaux** autour des ouvertures (`w.segs`, une InstancedMesh par matière avec matériaux `[ext ×5, intérieur]` : la face -z locale est l'intérieur). Le bloc plein d'origine (`w.im`) n'est plus dessiné (`w.cut`), il sert aux collisions et aux dégâts. Vitre transparente (Phong, opacité 0,26, `depthWrite` faux), cadre en 4 montants + croisillon, appui, balcons. Textures intérieures `intTex()` : papier peint (brique, motel), lambris (bois, ferme), plâtre (béton, favela, tôle), blanc (façades, villas) ; teintes pastel par bâtiment sur les façades modernes.
- **Décor 3D** `jeu/props.js` (`PROPS.build`) avec le **Kenney Nature Kit (CC0)** dans `jeu/models/nature/` : gros rochers et aiguilles (plus sur les pentes), pierres, souches, troncs, tas de bûches, champignons, buissons, prés fleuris, nénuphars et canoës sur le lac, camping (tentes + feu de camp), **ruines** (obélisque + colonnes) sur la plus haute colline ; désert : rochers rouges, cactus, palmiers sur la côte du lagon, campement nomade, ruines sur les plateaux. Fusionné par zones de 150 m (couleurs de sommets), caché au-delà de 330 m. Collisions dans `PROPCOL` (cercles, testés dans `pushCircle`).
- **Optimisation** `jeu/optimize.js` : `OPT.chunk(im)` découpe les InstancedMesh fixes (végétation, kits de `city.js`) en paquets de 200 m avec vraie sphère englobante ; `OPT.batch(roots)` fusionne tous les petits meshes fixes du décor par matériau et par zone (les couleurs unies sont écrites dans les sommets, les petits kits instanciés sont fondus aussi) ; `OPT.mergeLocal(g)` fusionne un objet qui bouge (véhicules, butin, coffres, statue). Tout ce qui s'anime doit avoir `userData.dyn = true` (ou `material.userData.noBatch` pour un shader d'eau). **Sol** en 36 morceaux avec 2 niveaux de détail et une jupe (`groundChunk`, `groundLOD`). Persos cachés au-delà de 260 m, meubles au-delà de 60/80 m, ombres recalculées 1 image sur 2 en Moyen/Bas. Mesures headless (Max, en ville) : ~2 fois moins d'appels de dessin et de triangles qu'avant.
- `WR.r3`, `WR.scene`, `WR.props()` pour les tests.

## Enseignes de magasins (novembre 2026)
- `jeu/signs.js` (`window.BRAND`) : 16 **marques inventées** (aucune vraie marque), chacune avec fond, icône dessinée et police à elle : burger (Luckiest Guy), café (Pacifico), pizza (Lobster), salle de sport (Russo One), pharmacie (Righteous), supermarché (Fredoka), jeux vidéo (Press Start 2P), mode (Abril Fatface), baskets (Permanent Marker), donuts (Shrikhand), club (Monoton), hôtel (Bungee), tacos (Bangers), banque (Alfa Slab One), glaces (Fredoka), surplus (Black Ops One). Noms différents sur le désert. Polices libres (OFL / Apache) dans `jeu/fonts/` avec leurs licences, chargées par `FontFace` ; les textures se redessinent quand elles sont prêtes (`BRAND.later`). `neonTex` (lodge, motel) et les panneaux de pub (`adTex`) utilisent aussi ces polices.

## Bulle bouclier, genoux, escaliers de secours, oasis, forêt sombre (novembre 2026)
- **Bulle bouclier** (`HEAL.bulle`, max 2, 0,5 s) : sphère de 4,8 m qui dure 15 s (`spawnBubble`, `bubbleTick`, shader hexagones + bord lumineux rose/violet). Les balles ne la traversent pas (`castRay` teste la sphère, `kind:'bubble'`, elle clignote quand on la touche). Pas de construction. Les bots la posent quand ils ont moins de 80 vie + bouclier. `WR.bubble(x,y,z)` pour les tests.
- **Accroupi avec genoux** : voir « Squelette commun » plus bas. Tête plus basse pour les tirs quand on est accroupi.
- **Villes** : escaliers de secours métalliques sur les immeubles (`makeFireEscapes`, volées + paliers sur le mur de côté) qui mènent aux **toits où l'on peut marcher** (`groundAt` teste `EXR/EXL/ROOFS`).
- **Oasis** sur le désert (`LAKE = [-40,-40,17]`) : eau turquoise, herbe verte autour, palmiers et décor (props.js). **Forêt sombre** sur la campagne (`DARKF = [-150,-205,95]`) : sapins foncés serrés (`pineD`), brouillard et lumière qui baissent quand on y entre (`DARKK`), rochers moussus, troncs, champignons, **lucioles** (`makeFlies`).

## Squelette commun, danses, casier, TOP 1, vrais arbres (novembre 2026)
- **Squelette commun** (`skins.js` > `skinify`) : chaque skin est construit en formes (comme avant) puis transformé en **un seul `SkinnedMesh`** avec 10 os : corps, cuisse + genou (×2, genou à `R.KY` = −0,43), épaule + coude (×2, coude à `R.EY` = −0,28, −0,31 pour Flubb), tête. Les sommets près du genou et du coude sont partagés entre les deux os (pli en douceur). `R.body/lL/kL/lR/kR/aL/eL/aR/eR/head` sont des os (ordre de rotation `ZXY`). `gunHold` est accroché à l'os du corps. Tout nouveau skin passe automatiquement par ce système.
- **Animations par poses** `jeu/anim.js` (`window.ANIM`) : une pose = angles simples (`lt/rt` cuisses, `lk/rk` genoux, `la/ra` bras vers l'avant, `lb/rb` bras écartés, `lw/rw` rotation du bras, `le/re` coudes, `bp/br/byw/by` bassin, `hy/hp/hr` tête). Poses : `idle`, `walk` (bras qui balancent, coudes qui plient), `crouch`, `gunArms`, `glide`, `drive`, `lobbyGun`. `ANIM.blend` lisse les transitions, `ANIM.apply(c, pose, auSol)` pose le squelette et garde les pieds au sol. `animChar` dans `index.html` choisit la pose.
- **Danses** `ANIM.D` (tempo en BPM) : `wald` Wald Groove (gagnée au premier TOP 1), `disco` Disco Fou 300 🪙, `robot` Robot 400, `poulet` Danse du Poulet 500, `moulin` Moulinette 650, `vague` La Vague 800. Données boutique dans `DANCES`, possédées dans `ST.ownD` (+ `wald` si `ST.dance`), équipée dans `ST.dz` (`curDance()`, `hasDance()`, `buyDance()`). Miniatures = le skin en pose de danse (`skinThumb(id, 0, danse)`).
- **Casier façon Fortnite** : 3 emplacements en haut (`#lslots` : SKIN, PLANEUR, DANSE), on clique une catégorie (`LCAT`) et la grille dessous montre ce qu'on possède. La boutique vend skins, planeurs et danses.
- **TOP 1** : on reste dans la partie (`WIN`, `victory()`), gros « TOP 1 » doré à l'écran (`#victory`, police Luckiest Guy `WRvic`), élim. + trophées, musique de victoire générée `mStepWin` (`music(true, 'win')`), voix Wald Off, le perso danse ; boutons DANSE (change de danse), REJOUER, MENU. La barre d'armes, la tempête et le viseur sont cachés (`body.won`). Plus de dégâts sur le joueur après la victoire. `WR.win()` pour tester.
- **Vrais arbres** `jeu/trees.js` (`window.TREES3D`) : modèles **Quaternius Ultimate Stylized Nature (CC0)** convertis en .glb dans `jeu/models/trees/` (sapins ×5, chênes ×3, bouleaux ×3, palmiers ×4, rochers ×5, textures réduites, licence dans le dossier). Feuilles en cartes transparentes (`alphaTest`), vent, lumière d'appoint, couleur par instance (forêt sombre plus foncée). **LOD** : les N arbres les plus proches de la caméra (110 Max / 55 Moyen / 28 Bas, dans 95 / 70 / 45 m) sont détaillés ; au-delà ce sont les arbres simples d'avant, recolorés pour aller avec, cachés dans le rayon par leur shader (uniformes partagés `GFX.treeR`, `GFX.treeC`). Les petits cailloux gris sont remplacés par des rochers moussus texturés ; les **palmiers** du désert (props.js les met dans `ctx.PALMS`) sont les palmiers texturés verts. Conversion : FBX chargés dans Chromium headless avec `FBXLoader` + `GLTFExporter` de three r128 (page `_t_conv.html`, non versionnée).
- **Couleurs Kenney** (`props.js`, `recol`) : la palette du kit tirait sur le bleu-vert ; herbe, feuilles et pierres sont recolorées en vert naturel et gris chaud.
- **Forêt sombre façon Valheim** : brume vert-bleu très sombre, soleil −60 %, exposition −40 %, vignette, désaturation (`POST.expo`, `POST.sat` avec `DARKK`), lucioles. `DARKK` est borné à 1 (avant, il pouvait dépasser et donner un brouillard négatif).
- **Tests headless** : la forêt dense peut faire tomber Chromium (mémoire swiftshader) en 960×540 ; utiliser 640×360. `WR.dark(v)` force l'ambiance de la forêt sombre, `WR.darkv()` lit les valeurs.

## Toute la végétation en vrais modèles 3D (novembre 2026)
- **Plus aucun arbre, cactus, buisson, fleur ou rocher « fait maison »** : `NATURE` ne sert plus que de secours si les modèles ne chargent pas.
- `trees.js` : sapins, chênes, bouleaux et **érables rouges** (≈ 20 % des feuillus) détaillés près de la caméra ; **au loin, des imposteurs** (chaque modèle est photographié au chargement dans une texture, sur un panneau qui se tourne vers la caméra, `farIM`). Les anciens arbres simples sont cachés dès que les imposteurs sont prêts. Les textures sont chargées **avant** la photo (sinon image vide). Aussi : **buissons texturés** (Bush, Bush_Large, Bush_Small, avec fleurs), **fleurs** autour du joueur (5 touffes, remplies par `placeGrass` via `TREES3D.flowers`), arbres des villes (`window.EXT_TREES` rempli par `city.js` : bacs de la place = érables / bouleaux + fleurs, bacs des rues = buissons fleuris, palmiers des villas), décor de `props.js` (`ctx.EXTRA` : palmiers, arbres morts du désert, buissons et fleurs des prés).
- `props.js` : **Quaternius Ultimate Nature Pack (CC0)** en `models/nature/q_*.glb` à couleurs unies (cactus ×5, cactus en fleurs ×4, rochers ×7, rochers moussus ×7, souches, troncs, nénuphars). Les anciens noms Kenney sont remplacés automatiquement (`sub()`), et `plant_bush*` / `flower_*` / `grass_*` partent vers `trees.js`. Les **cactus et rochers de la carte** (`TREES`) sont posés ici (`TREEVIS` est caché), avec ~14 % d'arbres morts dans le désert. Les buissons du désert (`ctx.BUSHES`) deviennent des petits cactus en fleurs et des cailloux. Restent Kenney : tentes, feux de camp, ruines, champignons, canoës.
- L'herbe reste en brins instanciés (trop d'instances pour un modèle).

## Chargement, formes naturelles, armes, voitures et bus en vrais modèles (novembre 2026)
- **Écran de chargement** `#boot` (logo + barre animée + nom de la carte), affiché dès le premier dessin de la page. Le gros script du jeu est dans `window.__WRMAIN`, lancé après une image (`requestAnimationFrame` + `setTimeout`) pour que l'écran apparaisse avant la construction de la carte ; il se cache à la fin. Quand on change de carte au salon, l'écran s'affiche avant le rechargement : plus d'écran noir. `window.SET` est exposé (utilisé par interiors.js).
- **Plus de cercles** : `lakeK` / `lakeD` (lac et oasis à bord irrégulier), `townK` / `townD` / `townPath` (chaque ville a un contour qui varie avec l'angle) utilisés pour l'aplanissement (`baseH`), la peinture du sol, le masque, `inTown`, `inLake` ; props.js suit le bord du lac (`ctx.lakeK`). La place et la fontaine restent rondes (c'est de l'architecture).
- **Eau** : on ralentit seulement quand on a les pieds dans l'eau (`inWater` : sol < −0,45), plus à 4 m du bord.
- **Armes** : Quaternius « Animated FPS Guns » (CC0) dans `jeu/models/guns/` : Pistol = pistolet, P90 = mitraillette, Rifle = fusil d'assaut (et Fusil Doré en or), Shotgun = pompe, SniperRifle = sniper. `window.GUNS3D` (weapons3d.js) charge, colore chaque partie (bois, acier, noir, laiton…), fusionne en un mesh à couleurs de sommets, canon vers +x ; `buildGun` les utilise dès qu'elles sont prêtes (sinon anciens modèles). Au chargement, les persos reprennent leur arme (`gunK` remis à zéro).
- **Voitures** : « Free Low-Poly Toy Cars » (CC0, Vuena) dans `jeu/models/cars/` avec nos palettes recolorées (`*_pal.png`) : muscle car jaune à bandes noires = Bolide Jaune, monster truck rouillé = Rouillarde, fourgon beige (camion à glace dont on a coupé le cornet) = Fourgon. `loadCars` / `prepCar` / `CART`, roues séparées qui tournent (`userData.wh`). `resetVeh` remplace les anciens modèles dès que les vrais sont chargés. **La Wald** (polo3d.js) : plus de détails (crampons, liserés de jante, écrous visibles, antenne, clignotants latéraux, baguettes chromées, trappe à essence).
- **Bus volant** `jeu/bus3d.js` (`window.buildBus`) : vieux bus scolaire rouillé façon Mad Max, plus aucun texte sur les vitres (vitres sales, barreaux, tôles rivetées), capot avec compresseur chromé, pare-buffle à pointes, phares grillagés, pare-brise blindé, 6 roues tout-terrain, pointes sur les flancs, cheminées, galerie de toit (caisses, bidons, pneus, projecteurs), ailes rivetées avec moteurs à hélice, 2 réacteurs avec flammes qui vacillent, drapeau en lambeaux. Fusionné par `OPT.mergeLocal` (seules hélices et flammes restent à part).

## Achats avec aperçu, 5 danses, grande carte, butin 3D, gratte-ciel (novembre 2026)
- **Plus d'achat au clic** : toute offre de la boutique ouvre `#buyPop` (`openBuy(kind, id)`, kind = `skin` / `gl` / `dance`) : aperçu 3D qui tourne (on glisse pour tourner), rareté, nom, description, bouton **ACHETER · prix** (puis ÉQUIPÉ / ÉQUIPER). Une danse déjà possédée ouvre le casier.
- **5 danses** : `ST.dl` (5 emplacements, `danceLoad()`), dans le casier catégorie DANSE (`LCAT='dz'`) : on clique un emplacement (`DSEL`) puis une danse possédée en dessous. En partie, le bouton danse ouvre une **roue de 5 danses** (`#dWheel`, `doDance()`, `danceNow(id)`).
- **Mini-carte** : carré arrondi 100 px (`roundRect`), cliquable (ou touche M) pour la **grande carte** `#bigMap` (`toggleMap()`, `drawMini(true)` sur `#bigC` avec les noms des villes).
- **Butin en vrais modèles** `jeu/loot3d.js` (`window.LOOT3D`, Quaternius CC0 dans `jeu/models/loot/`) : munitions = caisse, potions (mini, bouclier, bulle) en fiole avec liquide coloré et verre, soin = trousse, coffre doré. Les **bancs** (déco seulement) des places sont des modèles instanciés (`window.EXT_BENCH` rempli par `city.js`). Secours : les anciens modèles si le chargement échoue.
- **Capitales** (Turbo Towers, Mirage City) : 2 gratte-ciel placés automatiquement sur des places libres (`hs.land` = `neon` : couronnes LED + flèche avec feu rouge qui clignote `window.BLINK` ; `heli` : héliport sur le toit), façades vitrées, étages et escaliers auto (`interiors.js`). Kiosques colorés et feux tricolores au bord des routes (`city.js`, bloc `centre`).
- `WR.houses()` renvoie les bâtiments (tests). Cache du service worker : **v30**.

## Modes de jeu, rotation des cartes, mode SURVIE (novembre 2026)
- **Modes** au salon (boutons sous JOUER, `#maps [data-mode]`) : **Battle Royale** et **Survie** (`localStorage.wr_mode`). En Battle Royale, la carte change toute seule **toutes les 10 minutes** (`brMap()`, `ROT`, Los Campagnes ↔ Sable Rouge, compte à rebours `#rotT`) ; au salon, la nouvelle carte se recharge d'elle-même (`goMap`). `?map=xxx` force une carte (tests). `wr_map` ne sert plus.
- **Route** de Los Campagnes : plus de croisement moche près du ranch ; une route principale Turbo Towers → Rusty Ranch avec une **bifurcation en Y** vers Lodge des Pins (`ROADS` : entrée `['y', route, t, ville]`).
- **Survie** = carte `survie` « TERRES SAUVAGES » (`SURV`) : monde **2× plus grand** (`HALF` 1000, `ISL` 860, `TEX` 3072, masque 2048, sol en 144 morceaux), seul (`NPL` 1), pas de bus, pas de tempête, pas de véhicules, pas de trophées. 6 camps (`TOWNS` kind `chalet` : cabanes en rondins, tentes, feux), **sentiers de terre** qui suivent le relief, **7 montagnes** avec **neige** (shader du sol + peinture), grand lac, **4 forêts sombres** (`DARKFS`, `darkIn()` ; `DARKF` = la première), ~2 300 arbres + ~1 800 sapins sombres, décor props ×3, peu d'armes et **9 coffres cachés**.
- **`jeu/survie.js`** (`window.SURVIE`) : **pioche** (modèle fait main avec bague néon, accrochée à l'os du bras `aR`, coup en 0,5 s, `pose()`), ressources **bois / pierre / métal** (`RES`, puces en haut à gauche) : arbres (6 à 8 coups, l'arbre tombe, souche, repousse au bout de 5 min — `TREES3D.cut/shake`, carte `cmap` dans `OPT.chunk`), rochers et **minerai à cristaux bleus** (Quaternius RTS CC0 dans `jeu/models/survie/`, reviennent au bout de 4 min), murs des cabanes. **Constructions** façon Fortnite sur une grille de 4 m : MUR, SOL, ESCALIER, TOIT (chapeau), en bois / pierre (brique) / métal, 10 matériaux par pièce, fantôme bleu (rouge si pas assez), niveaux alignés sur les pièces voisines. Les murs vont dans `WALLS` (collisions, balles, cassables) ; sols, escaliers et toits portent le joueur (`SURVIE.groundAt`). Touches : X pioche, V construire, F1–F4 pièces, G matériau ; boutons ⛏ 🔨 à droite + barre de pièces. Tests : `SURVIE._strike()`, `SURVIE._build(pièce, mat)`, `SURVIE.give(k, n)`, `WR.trees()`.
- Tests headless de la survie : utiliser `gfx:0` et une vue 480×270 (sinon swiftshader plante souvent). Cache du service worker : **v31**.

## Survie v2 : zombies, base, monde 4 km, ambiance (novembre 2026)
- **Monde 4× plus grand** (`HALF` 2000, `ISL` 1720, grilles `HR`/`RDS` à 4 m, sol en 576 morceaux dont le détail est construit seulement près du joueur, morceaux lointains cachés). 12 lieux (`TOWNS`) dont **Plage des Naufragés** (kind `plage` : cahutes et bars de plage colorés attaqués, parasols arrachés, transats, ponton cassé, enseignes éteintes — `city.js`), 9 montagnes enneigées au nord/ouest, **sud-est aride** (`aridK()`, herbe sèche/sable dans le shader, arbres morts, palmiers près de la plage), 6 forêts sombres à **contour irrégulier** (`darkR/darkK`, plus de cercles), camps sans disque de terre (`campPatches`). Grille des arbres `TGRID` (`tgAdd`, `treesIn`, `treeNear`) pour les collisions et les tirs.
- **Toutes les maisons à moitié détruites** (survie) : murs cassés tirés au sort une fois (`ruins()`), gravats instanciés.
- **Zombies** `jeu/zombies.js` (`window.ZOMB`) : ~170, skin `zombie` dans `skins.js` (rôdeur, brute, coureur, « bizarre » à grosse tête ; yeux qui brillent, bouche ouverte), 16 modèles réutilisés pour les plus proches, poursuite (plus loin la nuit), coups, tapent les murs qui bloquent, montent les rampes. Touchés par les balles (`castRay` → `kind:'zomb'`) et la pioche. Compteur 🧟 dans le bandeau. But : tous les tuer.
- **Lit** (30 bois) = point de réapparition (`SURVIE.respawn`, appelé dans `eliminate`) ; sans lit : retour au camp, moitié des matériaux perdue. **Sauvegarde automatique** (`localStorage.wr_survie_v1` + `_fog`) toutes les 20 s, en quittant et en sortant de l'appli ; bouton « Nouveau monde » au salon.
- **Pioche et constructions aussi en Battle Royale.** Pièces en **4/3** (5 m × 3,75 m), rampe pleine et lisse (on monte sans sauter), construction dans la foulée quand on est sur une rampe, **ÉDITER** un mur (touche T / bouton ✏️) : plein, porte, fenêtre, 2 fenêtres, porte + fenêtre (`segsOf`, un mur = plusieurs morceaux dans `WALLS`). Boutons pioche / construire **dans la barre du haut** (icônes SVG). Écran d'explication des commandes au début (`intro()`, en BR seulement les 3 premières fois).
- **Matériaux** : rochers du décor et cactus cassables (`props.js` : `hv()`, `HARV`, instanciés et rangés par distance `harvPack`), carcasses de voitures (`WRECKS`, modèles de `CART` rouillés) et le tracteur du ranch (`Kit.dyn` + `Kit.show`) = métal, souche arrachée = l'arbre ne repousse plus.
- **Carte de survie dans le brouillard** (`FOGC`, se dévoile en explorant, noms des lieux cachés tant que non vus), mini-carte plus zoomée.
- **Ambiance** : cycle jour/nuit (`DAY`, `dayTick`, `DKEYS` : couchers de soleil orange/rose, nuit bleue étoilée avec lune, `uNight/uGlow/uSunC` dans le ciel), papillons le jour et lucioles la nuit/en forêt sombre (`critters`), **3 musiques calmes** générées avec réverbération (`STRACKS` : Aube sur les Terres, La Forêt Ancienne, Le Voyage) qui tournent.
- **Aide à la visée** douce (`aimPull`, ~3× moins forte que l'ancienne) réglable 0–200 % dans les paramètres (`SET.aim`).
- Optimisation : rochers/minerai rangés par distance (`nodePack`), paquets `OPT.chunk` cachés au-delà du brouillard (`OPT.cull`). `WR.day(t)`, `ZOMB.prebuild()` pour les tests. Cache du service worker : **v32**.

## 4 modes, sac, paramètres, grille, pompes, Sync Dance, Ultra PC (cache v33)
- Modes (`?mode=br|zb|survie|creatif`, `localStorage.wr_mode`) : BATTLE ROYALE (constructions, pas de bulle), ZÉRO CONSTRUCTION (bulle bouclier, pas de construction), SURVIE, CRÉATIF (carte survie, matériaux ∞, 2 shields au départ, armurerie infinie : pompe, pompe spécialisé, PM, AR, sniper, shields). Drapeaux `SURV`, `CREA`, `ZB`, `BUILD`.
- Survie : sac de 20 places (🎒 / I / Tab) dans survie.js (`BAG`, `bagAdd`) ; le lit et les coffres récupérés (coffre ouvert parfois récupéré, ou cassé à la pioche) se POSENT depuis le sac ; lit posé = point de réapparition ; coffres de rangement (`STOR`).
- Paramètres façon gros jeux : onglets JEU / GRAPHISMES / COMMANDES PC (touches réassignables + AVANCÉ, `BIND`/`BIND0`, `localStorage.wr_bind`, `bindAct(code)`, `kd(action)`) / COMMANDES TÉLÉPHONE (bientôt). survie.js lit aussi `window.bindAct`. Sprint (Maj), grimper : sauter face à un mur (`climbUp`), on tient debout sur le haut des murs.
- Grille : `house()` recale TOUS les bâtiments sur la grille de construction (côtés multiples de 5 m, étages `H = 3.75`, murs en panneaux 5 m × 3,75 m, `WKEY` évite les murs mitoyens en double, `w.bw` = poids pour `hs.broken`). Un panneau cassé se remplace pile par un mur construit (survie.js `slotWalls`, niveau calé sur les étages). Les coffres suivent leur maison (`ox/oz`).
- Pompes : `pompe` = Pompe auto (8 balles, 150 max à la tête), `pompeS` = Pompe spécialisé (5 balles, 180 à la tête, plus lent, noir/violet). Viseur CARRÉ dynamique = zone des plombs (`#cross.sg`).
- PC : pas de tir auto ni de boutons tactiles ; réglage graphique ULTRA (q=3, PC seulement, par défaut) : suréchantillonnage ×1,5, ombres 4096, AO renforcé, anisotropie 16 (`gfxAniso`), vue et herbe plus loin.
- Danses : chaque danse a sa musique ORIGINALE jouée par le synthé du jeu (`DTR`, `dStepFn`, calée sur `danceT0` et le BPM de anim.js, la musique du jeu baisse via `DUCK`). Nouvelles SYNC DANCES `syncrobot` (voix robot `dVox`) et `syncshuffle` : on se synchronise avec ceux qui dansent à moins de 15 m.

## Mise à jour automatique des applis (cache v34)
- `app/manifest.py` écrit `jeu/version.json` (`v` = nombre de commits, empreinte sha1 + taille de chaque fichier). Lancé par les 2 workflows (checkout `fetch-depth: 0`), le fichier n'est pas versionné (.gitignore).
- **Android** (`MainActivity.java`) et **PC** (`app/desktop/main.js`) : à chaque lancement, écran « Recherche de mises à jour… », lecture de `https://waldofficiel.github.io/jeu/version.json`. Si le numéro diffère : téléchargement des seuls fichiers modifiés (les autres sont recopiés) dans `files/game` (Android, servi par `InternalStoragePathHandler` sur `/game/`) ou `userData/game` (PC, servi par `app://jeu/`), barre de progression, puis lancement. Sans internet : dernière version téléchargée, sinon celle de l'installeur. Même origine qu'avant → sauvegardes gardées.
- Donc **chaque push = nouvelle version** chez tout le monde au prochain lancement, sans réinstaller. Réinstaller seulement si on change `app/**` (coque Android/PC). Le numéro s'affiche au salon (`#ver`).

## Menu JOUER, Créatif + maps publiques, 1v1 entre potes, tenues de combat (cache v35)
- Menu JOUER (`#mgrp`) : **BATTLE ROYALE** (sous-choix `#subBR` Construction `br` / Zéro Construction `zb`), **CRÉATIF** (`#subCR` : MON MONDE `creatif` + MAPS PUBLIQUES), **SURVIE**. `pickMode(mode)`, `MGRP`. Bouton « Rendre ma map publique » = bientôt (il faudra le multijoueur / un serveur).
- Map publique n°1 **1V1 ENTRE POTES** (mode `bf`, `BF`, aussi `CREA`) par « ✔ Créateur Wald Royal » : sur la carte survie, **Arène Build Fight** (`TOWNS` kind `arena` à (-60,-60), `ARENA`) = dalle plate 50 m calée sur la grille 5 m, bord néon, pylônes, enseigne (city.js). Pas de maisons, loot, zombies ni herbe dedans. Départ et réapparition dans l'arène avec 100 vie + 100 bouclier, AR + pompe spécialisé + PM, 2 shields (`bfKit` dans survie.js), armurerie au bord.
- Tous les persos (sauf zombies) ont des **protections de combat à l'ancienne** (`gear()` dans skins.js : jambières en cuir avec arête en fer et genouillère, brassards cloutés, épaulière gauche) et des vêtements en **tissu texturé** (`fabric()`), cuir `leatherTex()`.
- Site : section `#modes` sur `wald-royal/`, nouvelles captures (creatif, buildfight, construction, lobby, syncdance, parametres), bandeau de l'accueil mis à jour.

## Idées en attente / pistes
- Une clé de signature Android secrète (secret GitHub) avant le Play Store.
- Un certificat de signature Windows pour enlever l'écran SmartScreen.
- Du multijoueur réel (pour l'instant ce sont des bots).

## Launcher, constru au viseur, édition Fortnite, tempête, Partie rapide, PROPANE (cache v37)
- **Launcher** : les applis (Android `MainActivity`, PC `main.js`) ouvrent directement `https://waldofficiel.github.io/jeu/index.html?jouer` quand il y a internet (toujours la dernière version), la copie locale se met à jour en arrière-plan pour jouer hors ligne. Page `wald-royal/` : barre « INSTALLER LE LAUNCHER » en haut. ⚠ L'origine change (site au lieu d'appassets/app://) : la progression locale repart de zéro une fois.
- **Constructions** : pièces 5 m × 3,5 m (`LH` = `H` = 3.5 ; proportions 4 × 2,8 demandées, Fortnite = 512 × 384 cm), toutes les maisons au même format. Placement **au viseur** (`planAim`/`aimHit`/`lvl` dans survie.js) ; sur une rampe on garde la règle « dans la foulée ». Rampe sans marche (pente continue 0 → LH). Viseur d'arme caché avec la pioche / la constru.
- **ÉDITER façon Fortnite** : bouton rond à part `#sEdit` (tactile) / touche G ; grille 3×3 de cases bleues (`EGRID`), on tire sur les cases à enlever (rouges), ÉDITER à nouveau = valider (`p.mask`, `maskSegs`, sauvegardé).
- **Tempête** : ShaderMaterial violet animé + éclairs (`STORMU`), flashs et grondements.
- **Armes** : modèles détaillés `B.patate` (tube PVC + patate), `B.roquette` (tube kaki + ogive), `B.laser` (coque blanche + anneaux roses) ; projectiles visibles `shot3d`/`updProj` (patate en cloche, roquette avec fumée, explosion à l'arrivée).
- **PARTIE RAPIDE** (`RANKED`, `localStorage.wr_ranked`, `#segRk`) : non classé, pas de trophées ni d'entrée, bots faciles.
- **Maps publiques** : n°1 **MAP 1V1** (mode `bf`), n°2 **PROPANE** (mode `prop`, carte `propane`, `PROPM`, ✔ Wald Royal Creator) : mini-île (HALF 300, ISL 240), 8 villes, petits sommets, pas de bus ni tempête, seul pour l'instant. **Cache-cache** : le lanceur laser transforme en objet (`pickDisguise`, `disguiseModel`, `becomeProp`, `unProp`), touche F / bouton 😗 = siffler (`whistle`), E / 🎭 = redevenir soi. Miniatures dessinées en canvas (`#th1`, `#th2`).

- Rangs : emblèmes dessinés `emblem(i)` (blason métallique, gemme, chevrons, ailes dès Platine, couronne dès Maître, halo Néon, flammes Légende) ; exportés pour le site en `wald-royal/img/rk0..7.png`. Page du launcher : 10 armes, nouvelles cartes de fonctions. Cache v38.

## Jeu entre potes + nouveaux viseurs (cache v39)
- **`jeu/net.js`** (`window.NET`) : mini client MQTT 3.1.1 sur WebSocket vers des relais publics gratuits (broker.emqx.io:8084, puis hivemq, mosquitto). Aucun compte, aucun serveur à nous. Sujet `wr4/<salon>/...`, salon = `MODE-code` (sans code : `MODE-public`, tous ceux qui lancent la même map tombent ensemble).
- Seulement dans les maps du **Créatif** (`CREA` : Mon monde, MAP 1V1, PROPANE). `netGo/netStop/netSend/netMsg/netTick` dans index.html : état 10 fois/s (`t:'s'` position, skin, arme, vie, déguisement, danse), tirs `f`, dégâts `h` (la victime applique les dégâts), élim `k`, sifflet `w`, constructions `b`/`r`/`e` via `SURVIE.hook` (+ `netPlace/netRemove/netEdit`, on renvoie ses pièces à chaque nouvel arrivant). Joueurs distants = entrées `pl` avec `net:true`. Badge `#netB`. Lobby : pseudo `wr_name`, code `wr_room`, bouton 🎲 CRÉER (`.friends`).
- Testé en local avec un faux relais (messages injectés) ; le relais public n'est pas joignable depuis le conteneur.
- **Viseurs** façon Fortnite : croix fine avec écart + point ; pompes = **carré à coins arrondis** (4 équerres `.k1..k4`) qui grandit/rétrécit avec la dispersion.

## Launcher façon Epic Games (cache v40)
- **`launcher/index.html`** (en ligne sur /launcher/) : barre latérale (Accueil, Bibliothèque, Nouveautés, Mon compte), grosse bannière avec ▶ JOUER, version (`jeu/version.json`), cartes de modes (lancent directement le mode : `?mode=`), nouveautés (`NEWS`), compte local (pseudo `wr_name`, avatar `wr_av`, code potes `wr_room` : partagés avec le jeu, même origine). JOUER → `../jeu/index.html?jouer&from=launcher`.
- Les applis ouvrent `/launcher/?app=1`. Les anciennes applis qui ouvrent `jeu/?jouer` sont redirigées vers le launcher (script en tête de jeu/index.html, si UA WaldRoyalApp/Electron et pas `from=launcher`). Bouton « ⬅ LAUNCHER » au salon du jeu.
- Page wald-royal : la barre « INSTALLER LE LAUNCHER » télécharge directement l'APK (Android) ou l'EXE (Windows).

## Accès anticipé, créatures, générateurs, sprint (cache v41)
- Survie : `KIND` (zombies.js) = 8 espèces (rodeur, brute, coureur, bizarre, hurleur Rare, colosse Rare, spectre Épique nuit, roi Légendaire). `pickKind(night)`, POP 110, respawn infini 20-45 s à 60-260 m. `B.zombie` accepte SK/SH/PA/eye, moss, crown, spikes.
- survie.js : `LORE`, 8 affiches `AFF` sur pierres dans les villes (`wr_affiches`), Livre des créatures `book()` / bouton 📖 / objet sac `{t:'livre'}` (`wr_bestiaire`, débloqué au 1er kill). Plus de compteur 0/160.
- Générateurs d'armes (MAP 1V1 = ARENA z+32.5, Mon monde = TOWNS[0] z-22.5) : 13 dalles 5 m, pad bleu, pancarte, toutes armes + soins, respawn 1.5 s. `window.NOSPAWN(x,z)` : arène build fight vide (herbe/fleurs/props/mobilier).
- ctx SURVIE : getters `WEAPONS/HEAL/HORDER` (définis après ctx).
- Pause : bouton ⚙️ en haut à droite (tactile) → Paramètres (#setM), Commentaires (#fbM), Retour au salon. Badge « ACCÈS ANTICIPÉ ». Commentaires dans `localStorage.wr_fb` ; envoyés seulement si `window.FB_URL` (vide : attend l'accord de l'utilisateur pour un service mail).
- Sprint : touche Maj (PC) / bouton ⚡ SPRINT (tél), endurance ~15 s (`p.stam`), Ctrl/ACCROUPI en sprint = glissade (slideT 1.6, décélère, endurance baisse moins vite).
- Pompes : son synthé original `sgBoom` (pas le son Fortnite).
- Launcher : Bibliothèque → vidéos animées (bande-annonce, BR, Survie histoire, Créatif) avec musique synthé, fin « accès anticipé ». `window.WRTV(i)`.

## Nom du launcher (cache v42)
- Le launcher et les applis s'appellent « Wald Game » (le jeu reste Wald Royal). Fichiers de téléchargement inchangés : WaldRoyal.apk / WaldRoyal-Setup.exe.

## Police du TOP 1 (cache v43)
- Écran TOP 1 : police 'WRtop' (fonts/RussoOne), italique penchée, dégradé or + néon rose.

## Icône Wald Game (cache v44)
- Icône originale (emblème chanfreiné néon rose→violet→cyan, W chromé, « GAME ») : mipmaps Android, app/desktop/build/icon.png + app/desktop/icon.png (fenêtre), launcher/icon-192/512.png. Source SVG dans l'historique de session.

## Téléchargements Wald Game (cache v45)
- Fichiers : WaldGame.apk / WaldGame-Setup.exe (copies WaldRoyal.apk / WaldRoyal-Setup.exe gardées pour les vieux liens). Le bouton INSTALLER du jeu dans le navigateur télécharge Wald Game sur Android/PC (plus d'appli web Wald Royal).

## Site centré Wald Game (cache v46)
- Page wald-royal/ et accueil présentent Wald Game (launcher) avec Wald Royal dedans. Icône img/waldgame.png. Manifest web du jeu chargé seulement hors Android/Windows (plus de proposition « Installer Wald Royal » sur Android/PC) ; iPhone garde la version web Wald Royal.

## Wald Game = vrai launcher façon Epic, Wald Royal s'installe dedans (cache v48)
- Les applis (`MainActivity.java`, `app/desktop/main.js` + `preload.js`) ne contiennent PLUS le jeu (APK/EXE légers). Avec internet : elles ouvrent `https://waldofficiel.github.io/launcher/?app=2`. Sans internet : jeu installé s'il existe, sinon message.
- Pont JS `window.WG` (Android `addJavascriptInterface`, PC `contextBridge` + ipc limité à nos pages) : `installed()` (version ou -1), `busy()`, `install()` (télécharge `jeu/version.json` + fichiers changés dans files/game ou userData/game ; rappels `WGprog(p,msg)`, `WGdone(v)`, `WGfail(msg)`), `play(q)` (Android `https://appassets.androidplatform.net/game/index.html?jouer&from=launcher`, PC `app://jeu/...`), `launcher()`, `uninstall()`, `profile()` / `saveProfile(json)`.
- Launcher : bouton ⬇ INSTALLER → barre de progression → ▶ JOUER ; mise à jour auto au lancement si version différente ; carte Bibliothèque = installer/jouer ; « Désinstaller » (double toucher). Dans un navigateur (pas d'appli), JOUER ouvre le jeu web comme avant.
- Profil partagé : toutes les clés localStorage `wr*` passent par `profile.json` de l'appli (launcher importe au chargement, exporte avant JOUER ; le jeu installé importe au démarrage (script en tête) et exporte toutes les 15 s + en quittant, `window.WGsave`).
- Le workflow d'applis ne se lance plus que sur `app/**` (le jeu se met à jour via le site, sans rebuild).

## Image du planeur, Wald Royal iOS (cache v49)
- `wald-royal/img/capitale.jpg` (bannière du launcher, galerie, bande-annonce) : l'ancien planeur noir « WALD » est remplacé par le planeur Wald Car Gonflable actuel (rendu 3D collé sur la capture).
- iPhone/iPad = « Wald Royal iOS » (version web, sans launcher) : pas de mode Survie (`IOSW` dans jeu/index.html : bouton retiré, `?mode=survie` → br). Survie = payant, PC + Android seulement (site mis à jour).

## 32 créatures, animations à débloquer, Wald Royal + Survie 5,99 € (cache v50)
- `zombies.js` KIND = 32 espèces (24 nouvelles avec `an` = façon de bouger : crawl, hop, sway, charge, float, stomp, claw, twitch, flail ; `d` = texte du Livre). `ZOMB.demo(k, c, now, spd)` pose un modèle (rendus de pub). Jusqu'à 90 modèles construits.
- `skins.js` B.zombie : décorations `horns, antlers, shroom, crystal, lava, bones, wrap, hood, hump, eyes3, tusks, fins, tail, hs` ; `o.hat` force le chapeau (les créatures décorées sont tête nue).
- Animations de créatures (anim.js `zombi, rampe, spectre, couronne`) dans `DANCES` avec `unlock` = nb d'espèces découvertes (5/12/20/32), pas vendues en boutique ; `window.WRUNLOCK(n)` / `WRUNLOCKS()` (appelé par survie.js à chaque nouvelle espèce), affichées en haut du Livre. Musiques : alias DTR (même tempo).
- Images de pub : `wald-royal/img/crea_horde.jpg`, `crea_boss.jpg`, `crea_rares.jpg` (page de rendu `/home/claude/_t_crea.html`, hors dépôt).
- Launcher : page **Boutique** (Wald Royal + Survie 5,99 €, bouton gris tant que `window.SURV_PAY_URL` est vide), pub `TR[4]` qui se lance seule la 1re fois (`wg_adSurv1`), bouton JOUER/INSTALLER avec flèche ▾ : « Wald Royal » (gratuit) / « Wald Royal + Survie · 5,99 € » (grisé). Survie toujours jouable pour l'instant (pas de blocage, pas de paiement).

## Accès anticipé déplacé (cache v51)
- Plus de badge accès anticipé au salon (`#eaB` caché) ni dans la bannière du launcher ; la mention est sur l'écran de chargement (`#boot .bea`). Pause : bouton « 💬 Laisser un commentaire » (`#pFb`).

## Compte obligatoire, Survie/PROPANE verrouillés, accueil carrousel (cache v52)
- Launcher : écran `#auth` obligatoire (créer un compte : pseudo + e-mail + mot de passe 8 car. ; ou se connecter). Compte gardé sur l'appareil (`wg_acc` : mot de passe salé + SHA-256, `wg_sess`) : pas encore de serveur. Page Mon compte : e-mail, Se déconnecter, **Code créateur** (seule l'empreinte SHA-256 de `'wg-createur|'+code` est dans le code ; le code a été donné à l'utilisateur dans la discussion, ne jamais l'écrire dans le dépôt) → `wr_creator=1`, `wr_survie_ok=1` (passent au jeu par le profil).
- Jeu : `CREATOR` / `SURVOK` (index.html) : Survie grisée 🔒 et non lançable sauf créateur (`?mode=survie` → br). Tout le Créatif (Mon monde, MAP 1V1, PROPANE prop hunt) est GRATUIT.
- Accueil du launcher : carrousel ‹ › (pub Wald Royal + Survie, Battle Royale, Mode histoire) avec boutons Cinématique / Accès boutique, rangée « 🎬 Cinématiques », bouton ACCÈS BOUTIQUE. Boutique : « Tous les jeux » (Wald Royal gratuit, Wald Royal + Survie 5,99 € grisé, PROPANE bientôt, prochain jeu ???).

## Salle d'attente Créatif + vrai PROP HUNT (cache v54)
- Le mode/map `prop` s'affiche « PROP HUNT » partout (plus « PROPANE » ; id interne `propane` inchangé).
- Toutes les maps du Créatif : panneau `#wroom` (salle d'attente : joueurs du salon, ▶ LANCER LA PARTIE, 🚪 Quitter la partie) tant que `ROUND` est vide ; Échap → « 🚪 Quitter la partie ». Lancer = message réseau `go` {by, seek, ids} ; MAP 1V1 / Mon monde : tout le monde réapparaît (`SV.respawn`).
- PROP HUNT (`roundTick`, `rStart`, `rEnd`, `rMsg`) : 3 joueurs minimum (sinon message « il manque N joueurs »), 1 chercheur au hasard (pompe, munitions ∞), les autres = laser pour se transformer. 60 s de cachette (chercheur aveuglé `#rBlind`, mis à l'écart `rCage`), puis 4 min de chasse (`#rHud`). Personne ne construit (`BUILD` faux en `prop`). 128 objets cassables posés pareil chez tous (`PROPOBJ`, graine fixe, `propBreak` + message `x`) ; le laser copie l'objet le plus proche (`nearPropType`). Tir du chercheur sur un joueur caché = éliminé (`h` d:9999 → la victime passe spectatrice et envoie `k`) ; objet cassé = −5 PV au chercheur (règle anti tir à l'aveugle des vrais prop hunt). Fin : tous trouvés → chercheur gagne ; chrono fini → les objets gagnent ; retour en salle d'attente après 6 s. Celui qui a lancé publie `rs` toutes les 3 s (les nouveaux voient « partie en cours »).
- Tests : `WR.netMsg`, `WR.round()`, `WR.rLaunch()`, `WR.rIds()`, `WR.roundTick()`, `WR.propN()`. En headless, les joueurs simulés disparaissent après 8 s sans message (`netTick`) : les renvoyer dans le même `evaluate`.

## Sol en lave (Wald Game), voler, publier son jeu (cache v55)
- Les maps « officielles » du Créatif sont signées « ✔ Wald Game » (plus « Wald Royal Creator »).
- Mode `lave` = **SOL EN LAVE** (map publique N°3, carte `propane`, `MAPS.propane` = MINI-ÎLE) : `lavaMesh` (plan + shader de lave), `lavaTick` : la lave monte de 0,22 m/s après 15 s, 35 PV/s dedans, mort = spectateur (`k`), dernier en vie gagne (seul : survivre `time` min). Constructions illimitées, pas d'armes.
- `PROPH` = mode prop ; `TPL` = type de partie (`libre`, `bf`, `prop`, `lave`) utilisé par la salle d'attente / `roundTick` (au lieu de PROPM). `rNeed()` = joueurs minimum.
- **Voler** en Créatif (`FLYOK()` : Mon monde ou salle d'attente) : double saut (`flyJump`, `LASTJ`) ou bouton ✈️ `#bFly` ; saut = monter, accroupi = descendre (`me.fly`, gravité coupée).
- **Publier le jeu** (Mon monde, Échap → `#pPub` → `pubOpen`) : nom, type, joueurs min, durée, voler, armes de départ ; « Tester ici » applique les réglages (PUB/TPL). Publication = messages retenus MQTT (`NET.store('map/'+code)` avec les pièces `SV.myPieces()`, `NET.store('idx/'+code)` pour la liste) sur broker.emqx.io, sujet `wr4pub/v1/…`. Liste « JEUX DE LA COMMUNAUTÉ » (`#commL`, `pubList` → `NET.list('idx/')`). Jouer = `localStorage.wr_pubLoad` + mode creatif → `NET.fetch` → `pubApply` pose les pièces, salon réseau `P<code>`. Pas de modération ni de suppression (relais public).

## MAP 1V1 sur la petite île, bots de complément, sprint court, arbres sans taches noires (cache v56)
- MAP 1V1 (`bf`) se joue sur la carte `propane` (petite île) : arène 70 m (`['Arène Build Fight', 160, -70, 52, 'arena']`, `HA` 35 dans city.js), `ARENA` = la ville `arena`, rangée de 13 générateurs SUR le carré côté nord (survie.js `IN`). Armurerie active si `!PROPM || BF`.
- Salle d'attente : lancement auto au bout de 60 s (`WAIT0`, par le joueur au plus petit identifiant) ; `rAuto()` complète avec des bots (`rFill` : 4 en prop hunt et 1v1). Bots du Créatif (`BOTS`, `crBot`, `crBotPlace`, `crBotsTick`, `crBotDie`, `crBotsClear`) simulés chez celui qui lance, envoyés aux autres comme joueurs (`s` avec `bid`, `isBot`), touchés via `h` → hôte. Prop hunt : bots cachés immobiles déguisés, chercheur bot qui va vers les objets / joueurs et tire (60 % de réussite). 1v1 : bots IA normaux (fusil, pompe spé, PM), réapparaissent après 4 s. `eliminate` → `crBotDie` pour eux.
- Sprint 5 s max (`dt / 5`, recharge `dt / 4`), glissade plus longue et rapide (×1,42, 2,1 s, freinage `exp(-dt*.75)`).
- trees.js : la photo des imposteurs est vérifiée (`readRenderTargetPixels`) ; ratée (noire) → on réessaie (6 fois / 1,5 s), sinon pas d'imposteur (transparent) au lieu de taches noires.
- Persos à 90 % (`makeChar`) ; un mur en hauteur (linteau, case éditée) ne bloque plus si la tête passe dessous (`pushCircle`).

## Bâtiments 100 % aux dimensions de la construction (cache v57)
- Toits à 2 pentes : pente d'une pièce TOIT/RAMPE (3,5 m pour 5 m, `TH = atan(H/GRID)`), faîtage plat sur la case du milieu si le nombre de cases est impair (`hs.rise`).
- Pignons = murs de construction : murs pleins 5 × 3,5 m + murs édités en triangle, empilés en escalier (`pieces(hs)` ; un mur plein = 2 triangles, une seule InstancedMesh par matière, `hs.gim/gi/gmats` pour la casse).
- Grand mur de Mirage City en panneaux 5 × 3,5 m sur 2 rangées ; murs isolés en 5 m × 3,5 m. Les maisons (`house`) étaient déjà en panneaux 5 m × 3,5 m (étages `H` = 3,5).

## Gouttières, menu sans pause, danses après TOP 1 (cache v58)
- Toits à 2 pentes : avancée de 0,8 m (`OV`, `hs.eaveY/eaveZ`), gouttières + descentes en métal (2 InstancedMesh) ; chaque coin = une entrée `window.EXT_WRECK` (`gutter:1`, `kit.show`) : 2 coups de pioche = MÉTAL, pas constructibles.
- Échap / ⚙️ n'arrête plus la partie (`PMENU`, `pause()` ne change plus `state`) : seules les commandes du perso sont bloquées.
- TOP 1 : gros bouton « 💃 DANSER » en haut (`#vDance`) qui ouvre la roue avec TOUTES ses danses (`doDance`, `WIN`).

## PARCOURS (obby) + appareils du Créatif (cache v59)
- Mode `obby` = **PARCOURS** (map publique N°4, ✔ Wald Game, carte `propane`, pas de construction) : `obbyGen()` (graine 777) = 40 plateformes en 5 étapes (pf, mv qui bougent, blocs mortels à côté, points de passage `cp`, arrivée `fin`), sol via `devGround` dans la physique, `obbyTick` (points de passage, chute / bloc mortel → `obRespawn`, 1er à l'arrivée gagne : message `ow`).
- **Appareils** (`DEV`, `devMesh`, `devBuild`, `devPlace`, `devDel`, `devOpen`) : Mon monde → Échap → 🧩 Appareils (plateforme, qui bouge, point de passage, bloc mortel, arrivée), posés devant soi ou sous ses pieds en volant. Publiés avec le jeu (`dev` = [k,x,y,z,s]) et rechargés par `pubApply` ; type de partie « 🏃 Parcours » dans Publier.
- `WR.dev()`, `WR.obby(dt)` pour les tests.

## Règles QUAND/ALORS, Gun Game, 2 skins, hitbox commune (cache v60)
- **Règles** (façon appareils reliés Fortnite) : `RULES` [{q, qp, a, ap}], éditeur `rulesOpen` (Échap → ⚡ Règles ou depuis Appareils). Évènements : debut, touche (n° d'appareil, marcher dessus ou entrer dans une zone), chrono (s), score (points), mort. Actions : msg, tp, arme, soin, vitesse, saut (`SPDT/JMPT`), point (`RSCORE`), gagne (`ow` avec `w:1`), retour, cache/montre (`devShow`, message `dv`). Appareils numérotés (`d.id`, `DEVID`, étiquette `devLabel` dans Mon monde) ; nouveaux appareils : téléporteur `tp` (vers le suivant si pas de règle), bouton `btn`, zone `zn` (invisible). `devTick` : plateformes qui bougent, téléporteurs, blocs mortels, zones, règles. Publiés avec le jeu (`rules`, dev[5] = id).
- **GUN GAME** (mode `gg`, map publique N°5, ✔ Wald Game, carte `propane`) : `GG` = 10 armes (pistolet → Fusil Doré), `ggUp` à chaque élimination (bots : `crBotDie` / `eliminate` ; réseau : `k` avec `by`, les bots envoient `bid` dans `h`), `ggSpawn` réapparition immédiate, 6 bots de complément, niveau des autres via `s.gl` (`GGTOP`).
- Aide à la visée ÷2 (`aimPull` k = dt × 1,5). Hitbox commune à tous les skins (boîte 0,8 × 1,95 m, 1,35 accroupi, tête = 48 cm du haut).
- Skins : `rico` Rico (600, survêtement violet à bandes, chaîne, lunettes) et `nova` Nova (1500, combinaison noire à lignes néon, couette rose, visière) ; tous les persos (sauf Flubb) ont une ceinture à boucle. Bras : coudes plus pliés en marchant/courant (anim.js).
- Bus : un seul bouton SAUTER (le bouton d'action est caché dans le bus). Bouton « ACCROUPI » (la glissade reste : s'accroupir en sprintant).

## À REVOIR (rappeler à l'utilisateur)
- (fait en v37) 3 nouvelles armes, anciens modèles provisoires refaits : `patate` Lance-patate (explosion 3 m), `roquette` Lance-roquette (1 roquette, explosion 6 m, casse les murs), `laser` Lanceur laser (rafale rose). Stats dans `WEAPONS`, modèles `B.patate/B.roquette/B.laser` dans weapons3d.js. Cache v36.

## Paramètres de la partie (Créatif, façon Fortnite) + plus d'imposteurs d'arbres (cache v62)
- Avant « Lancer la partie » : AUCUNE arme ni soin (`rDisarm()` à chaque image dans la salle d'attente, objets au sol retirés), générateurs d'armes en veille (`SVC.genOn()`), survie.js `reset` ne donne plus de kit en créatif.
- `rSetOpen()` (bouton ⚙️ de la salle d'attente + menu Échap) : choix de la map/mode (recharge avec `wr_crGo` → la partie redémarre seule) et règles `RSET` (kit aucun/1v1/pompe/sniper/fun/perso, 100/200 PV, constructions, générateurs, réapparition, durée, objectif d'élim., bots, voler, super saut, vitesse). Sauvé dans `wr_rset_<pub>|<TPL>`, publié avec le jeu (`set`), envoyé dans le message `go` (`m.set` → `RCUR`).
- `crKit()` donne l'équipement au lancement/réapparition (libre, bf). `freeTick()` gère chrono / objectif / dernier en vie pour libre et bf. Échap : « Terminer la partie » (message `re`).
- Arbres lointains : plus de photos (imposteurs = taches noires), ce sont les arbres 3D légers à couleurs de sommets de index.html (`G.treeIM`) qui s'affichent au-delà du rayon des beaux arbres.
- `WR.ev(code)` : outil de test (évalue dans le jeu).

## Manette + clic droit matériau + mot de passe oublié (cache v63)
- `gpTick(dt)` (appelé dans `loop`) lit l'API Gamepad. Disposition `SET.gp` : `pro` (défaut, Builder Pro Fortnite : B = construction, RT mur / LT escalier / RB sol / LB toit, Y éditer, croix ← matériau) ou `simple` (jeu de tir classique, pas de construction). Actions envoyées en faux événements clavier (`gpTap`). Menus : croix + A/B (`gpMenuNav`, classe `.gpf`). Onglet Paramètres « 🎮 MANETTE » (`gpPane`). `body.gp` cache les boutons tactiles.
- En construction : clic droit = changer de matériau (plus jamais la visée), `adsSet` refuse de viser avec un outil.
- Launcher : « Mot de passe oublié ? » → recrée le mot de passe du compte local (pseudo + e-mail pré-remplis, progression gardée).

## v64 : correctifs Créatif + jouabilité avancée
- Build fight : le compte à rebours de la salle d'attente (`WAIT0`) repart quand on entre (avant : depuis le chargement → partie lancée toute seule avec des bots qui tiraient). Bots du créatif : ne visent que les joueurs de LEUR partie (`nearestEnemy`), dégâts `h` ignorés hors partie, bots des autres parties ignorés.
- Créatif : plus de Wald qui tombe du ciel (`dropUpdate`). Message d'accueil selon le mode (`SVC.creaIntro`), plus de liste de touches ; message perso à la publication (`PUB.msg`).
- Viseur du pompe ×0,55 (max 17 % de l'écran). Aide à la visée désactivée à la souris (seulement tactile/manette).
- Jouabilité avancée (Paramètres > Jeu) : éditer en un clic (`SET.editRel`, valide au relâchement, glisser = enlever plusieurs cases), FPS affichés (`SET.fps`, #fpsC), limite FPS (`SET.fpsMax`).
- Entrée valide les fenêtres ; maintenir Entrée 1 s (ou X manette) dans la salle d'attente = lancer (`enterHold`).
- Construction : `planFree()` (si la case visée est prise : case de la grille, puis étage au-dessus), aperçu bleu clair + contour.

## v65
- Miniatures dessinées pour PARCOURS (th4) et GUN GAME (th5), style néon/chrome comme 1V1 et PROP HUNT.
- Wald Game PC : fenêtre normale (1280×760, réduire/agrandir/fermer) comme Epic ; plein écran auto quand le jeu est lancé (`did-navigate`), F11 bascule.
- Codes Survie (launcher > Mon compte) : empreinte SHA-256 `wg-survie|CODE` dans `SC` (hash → nb d'utilisations). Utilisations comptées par appareil (`wg_dev`) via messages retenus MQTT `wr4pub/v1/code/<hash16>/<dev>`. Le code en clair n'est JAMAIS dans le dépôt.

## v66 : inventaire 5 places
- `me.inv` = 5 cases (armes OU soins). Un soin dans une case = marqueur `{ h: 'mini'|'shield'|'heal'|'bulle' }`, le nombre reste dans `me.heals`. `invSync()` (chaque image) : complète à 5, retire les marqueurs à 0, ajoute un marqueur pour un soin sans case. `cur(p)` = arme seulement, `curH(p)` = soin en main (tir = utiliser).
- Glisser une case sur une autre (barre ou sac) = échanger (`DRAGS`, `invSwap`). Touches Case 1-5 (`arme1..arme5`, 1-5), « soin » = C (case de soin suivante). Inventaire plein → soins refusés.
- Bots : toujours 3 cases et soins en compteur.
- Salle d'attente : « 👥 n/16 ».

## v67 : graphismes détaillés
- `GQ(k)` = sous-réglage `SET.gx[k]` sinon le préréglage `SET.gfx`. Sous-parties : res, shadow, view, grass, ao, post, tex (Bas/Moyen/Max/Ultra, Off pour ombres/herbe/ombrage). Cliquer un préréglage remet tout (`SET.gx = {}`), toucher une sous-partie = « Personnalisé ». Ultra PC poussé : brouillard 820, sol 320, herbe 68, AO .95.

## v68 : Solo/Duo/Trio/Section + amis
- `TEAMSZ` (`wr_team`, boutons #segTm sous Battle Royale), `TM()` = taille d'équipe en BR seulement. `reset()` donne `p.team` (moi + bots coéquipiers = équipe 0, étiquette bleue `teamTag`). Pas de tir ami (`hurt`), bots/aide à la visée ignorent les coéquipiers, coéquipiers sautent du bus avec moi. Fin : `teamsAlive()` ; si je meurs et que l'équipe vit encore, la partie continue.
- Amis (`FR`, bouton 👥 AMIS du salon, modal #frM) : code ami `wr_fid` (6 car.), liste `wr_friends`. Présence `pres/<id>` toutes les 30 s, invitations `inv/<id>` (relais MQTT retenu) lues toutes les 12 s → bandeau #frInv « REJOINDRE » (met le code de salon + le mode, relance). LIMITE : le Battle Royale n'est pas encore en réseau (le Créatif oui) → à faire : synchroniser bus/tempête/butin pour jouer en BR entre potes.

## v70 : grille unique + têtes plus petites
- GRILLE comme Fortnite : `snapY(y)` = 0,6 + 3,5·k (point 0 = sol des villes), cases de 5 m depuis x = 0 / z = 0. Les maisons (`house()`) ont `y0 = snapY(sol)` (+ `pad` pour aplatir), les constructions des joueurs se calent sur la même grille verticale (`C.snapY` dans `lvl` et `plan`). Zéro décalage entre map et constructions.
- Murs construits : le bas ne descend plus que jusqu'au sol, et jamais si le mur est à plus de 1,2 m du sol (avant : 1 m de mur dans le vide = « petit mur » sous les escaliers).
- Skins : même squelette « mannequin » pour tous (rig commun), tête ×0,8 (sauf Flubb/zombies). Hitbox tête = 0,40 m du haut.

## v71 : faune de la Survie (`jeu/faune.js`, `window.FAUNE`)
- Animaux en blocs façon Minecraft (`K` : loup, sanglier, cochon, mouton, poule, lapin, cerf), apparition autour du joueur (45-110 m, 14 le jour / 18 la nuit, plus de loups la nuit), modèles créés à < 95 m. Passifs = fuient, sanglier = attaque à < 9 m, loups = neutres en meute (un loup touché → toute la meute attaque).
- Viande (`SAVE.meat`, `wr_faune`, seulement en Survie) : tuer un animal (balles via `castRay` kind `faune`, pioche via `FAUNE.melee`) ; manger = N ou bouton 🍖 (#fMeat) = +20 PV.
- Loup : Interagir près de lui avec de la viande → 34 % = apprivoisé (collier rouge, suit, attaque les zombies à < 16 m, téléporté si > 45 m, Interagir = assis / suis-moi), sauvegardé (`SAVE.tamed`, max 6 recréés).
- Événements toutes les 2,5-4,5 min : 🌕 Lune des loups (meute qui chasse), 🌠 étoiles filantes (métal), 🦌 troupeau de cerfs, 📦 ravitaillement en parachute (2 armes, 4 viandes, métal, pierre).
- Tests : node + mock (`/tmp/tfa.js`) car la Survie fait planter swiftshader.

## v73 : GROUPE de 4 + Battle Royale en réseau entre potes
- `PARTY` (`wr_grp` = chef) : rejoindre par PSEUDO (`grpByPseudo` → index retenu `nom/<pseudo>` {f, g = chef}) ou par invitation (`inv` contient `g`). Membres : `join/<chef>/<fid>` (rafraîchi toutes les 30 s, `left:1` = quitté) ; le chef lit la liste (`grpPoll` toutes les 4 s) et publie `grp/<chef>` {m, go}. Barre `#grpBar` au salon. ⚠ Nom `GRP` déjà pris (noms des grades) → `PARTY`.
- Lancer : `start()` → `grpHook()` chez le chef avec ≥ 2 membres : `go` {mode, room, seed, at = +5 s, tm, n, lead} publié, compte à rebours, tout le monde lance au même moment (autre mode → `pickMode` + `wr_crGo`). `wr_brGo` garde le `go`.
- BR en groupe (`BRN`, `BRLEAD`) : réseau activé en BR, graine commune (`srand`) pour bus, tempête (`storm.rng`), butin (re-graine avant les objets et avant le bus). Les `n` premiers bots sont retirés (`gone`). Le chef simule les bots et les envoie (`bs` 4×/s, `brSendBots`) ; chez les autres ce sont des `remote` (`remoteTick`, jamais blessés localement). Tir sur un bot distant → `h` vers `b<index>` → le chef applique ; élim. créditée par `bk`. Les bots du chef tirent sur les potes via `h` + traçantes `f`. Les potes = équipe 0 (pas de tir ami en Duo/Trio/Section).

## v74 : MEURTRE MYSTÈRE (mode `mm`, map publique N°6, ✔ Wald Game, carte `propane`)
- Comme Murder Mystery / TTT : rôles tirés au lancement (`mmRoles` → `go.mur`, `go.sher`), 3 joueurs min, 7 avec les bots. Tout le monde meurt en 1 coup (9999). Meurtrier : pompe après 15 s (`ROUND.armed`), shérif : pistolet. Le shérif qui tue un innocent meurt aussi ; à la mort du shérif, le pistolet passe au premier innocent vivant (`mmDeath`). Bots : le meurtrier vise tout le monde, le shérif seulement le meurtrier une fois démasqué (`ROUND.mrev`), les innocents ne tirent pas. Fin : meurtrier mort → innocents ; plus personne d'autre → meurtrier ; 4 min → innocents (`mmTick`). Miniature `#th6`.

## v75 : ÎLE VIDE (Créatif, mode `ile`)
- `VIDE` = mode `ile` (carte `propane`) : relief tout plat à 0,6 (= point 0 de la grille), aucune maison, arbre, route, véhicule, décor props ni ferme (`TOWNS` = une ville `vide` de rayon 1,5 au centre). Type de partie `libre` : on construit sa map de zéro, appareils, règles, publier. Bouton « 🟩 ÎLE VIDE » sous Mon monde au salon et dans ⚙️ Paramètres (MAPL). Message d'accueil dédié.

## v76 : amis par pseudo + cases « + » du salon
- Ajouter un ami par PSEUDO (`frAddPseudo` → `nom/<pseudo>`) : demande `freq/<fid>` ; l'autre reçoit un bandeau « veut être ton ami · ACCEPTER » (`frReq`), l'acceptation revient par `freq` avec `ok:1` (`FR.rseen`, `wr_frSeen`). Le code ami reste possible (repliable).
- Barre du salon `#grpBar` : « 👥 SALON n/4 », le chef 👑, les membres, et des cases ＋ qui ouvrent la liste d'amis (« 📨 INVITER AU SALON »).

## v77 : animaux de la Survie en vrais modèles 3D animés
- Plus de blocs : **Quaternius Ultimate Animated Animals (CC0)** dans `jeu/models/animaux/` (Wolf, Bull, Cow, Alpaca, Fox, Deer, Stag + License.txt), récupérés depuis le dépôt public `Dustyluc123/goblo` (git sparse). `jeu/SkeletonUtils.js` (three r128) pour cloner les modèles à os.
- faune.js : `K` = loup (Wolf), taureau (Bull, agressif), vache (Cow), lama (Alpaca), renard (Fox), biche (Deer), cerf (Stag). `loadAll()` charge les 7 au lancement de la Survie, `model()` clone + `AnimationMixer` (Walk, Gallop, Idle, Eating, Attack, Death, HitReact…), `play()` en fondu. Avant des modèles = face +Z → `rotation.y = π/2 − a`. Loup apprivoisé : collier rouge sur l'os `Neck2`. Animation mise à jour à chaque image < 70 m, 5×/s au-delà.

## v78 : comptes EN LIGNE + amis / salon instantanés (Firebase, gratuit)
- Projet Firebase `wald-game` (plan Spark gratuit) : Authentication e-mail/mot de passe + Realtime Database (europe-west1). Règles publiées : `users/<uid>`, `pseudos/<pseudo-normalisé>` {uid, n} (pseudo unique), `presence/<uid>` (onDisconnect), `friends/<uid>/<autre>` {n, st ok/req/sent}, `inbox/<uid>` (invitations), `parties/<chef>/{m, go}`. La config web est publique (normal) ; la sécurité = les règles.
- `jeu/wgfire.js` (`window.WGF`) : charge le SDK compat 10.12.2 depuis gstatic ; `signUp/signIn/reset/signOut`, `addFriend/accept/remove`, `send`, `presence`, `party/partyJoin/partyLeave/partyGo`, évènements `auth/friends/request/inbox/fail`. La session voyage vers le jeu installé (autre origine) par la clé `wr_fbu` du profil partagé (`'0'` = déconnecté).
- Launcher : création de compte / connexion / mot de passe oublié (vrai e-mail) via Firebase ; un ancien compte local est converti automatiquement à la première connexion. Sans Firebase (pas de réseau) : ancien compte local.
- Jeu : couche « AMIS + SALON EN TEMPS RÉEL » (après `grpDraw`) qui remplace frAddPseudo/frSend/frPresence/grpJoin/grpLeave/grpByPseudo/grpHook quand `FB()` ; `FR.id` = uid. Sinon relais MQTT comme avant.

## v79 : vraies armes en vignette, nouveaux modèles, PM Fantôme, lance-patate façon lance-grenade, textures de construction
- **Vignettes 3D** (`snapObj`, `ICO3`, `drawSnap`) : la barre et le sac affichent une photo du VRAI modèle 3D (arme = `gunModel(k)`, soin = `LOOT3D.get`) faite par un petit renderer à part (`SNAPR`). `icon0` / `healIcon0` = anciens dessins de secours.
- **Armes PBR** (weapons3d.js) : `M()` donne des MeshStandardMaterial avec reflets d'un studio peint (`envTex`, equirect) ; armes Quaternius rangées par matière (`CLS`, `gmat`). Nouveaux modèles faits main : `B.ar` (fusil d'assaut = carabine moderne), `B.scarx` (Fusil Doré façon SCAR — le nom SCAR est une marque, on garde « Fusil Doré »), `B.pump` (pompe auto gros, bois). Pompe spécialisé reste Quaternius noir/violet. `GUNSCALE` fusil/scar .76, pompe .82.
- **PM Fantôme** `pmx` (Légendaire, rar 4) : carbone, or, lignes violettes, chargeur transparent ; rare dans `WLIST`.
- **Lance-patate** : `potLaunch` / `updPots` / `potBoom` : vitesse calculée pour retomber au point visé (cloche, gravité 20), la patate a une tête qui crie (`potScream`, synthé) puis explose (rayon 3,5, 70 dégâts au centre, casse les murs). Réseau : `f` avec `v` (vitesse) → les autres voient la même patate.
- **Textures de construction** (survie.js `bTex`, `bMat`) : bois = cadre + planches clouées avec jours et petits trous transparents (alphaTest), pierre = briquettes dans un cadre de pierre, métal = tôle ondulée rivetée. Les maisons gardent leurs textures.

## v80 : cinématiques 3D + Survie renommée MODE HISTOIRE
- **`launcher/cine.js`** (`window.CINE`) : les vidéos Survie du launcher (`TR[2]` histoire, `TR[4]` pub, plans `'#id'` avec image de secours en 5e case) sont rendues en VRAIE 3D avec les modèles du jeu (créatures `buildSkin('zombie')` + `ZOMB.demo`, Roi Violet géant, loups/cerfs/taureau Quaternius animés, sapins texturés, lune, étoiles, brume violette, éclairs, feu de camp, cabane qui se construit). Plans : brume, horde, rares, boss, loups, faune, feu, base, titre. Chargé à la demande (three + scripts du jeu), `CINE.frame(id, t, W, H)` dessiné sous les titres de `play2`.
- **Survie → « Mode Histoire »** partout (jeu, launcher, site ; id interne `survie` inchangé). Au salon : bouton 📖 MODE HISTOIRE avec `#subST` : Histoire 1 **LA BRUME VIOLETTE** (la map actuelle) et Histoire 2 **LA CONTRÉE LOINTAINE** 🔒 prochainement (map encore plus grande, à faire). Le Mode Histoire contiendra plusieurs histoires.

## v81 : 📜 SCRIPTS du Créatif, perso 3D importé, vue FPS, CS WILD GO
- **Scripts** (`SCR`, `scrRun/scrStop/scrEv/scrOpen`, bouton Échap → 📜 Script dans Mon monde / Île vide) : le code du créateur tourne dans un **Worker dans une iframe sandbox** (`SCR_BOOT`, origine opaque : aucun accès au compte Firebase, au localStorage ni à la page) et parle au jeu par messages. API : `game.camera('fps'|'tps')`, `speed`, `jump`, `size`, `health`, `give(arme)`, `clear`, `msg`, `hud`, `skin`, `useModel`, `teleport`, `game.on('start'|'tick'|'kill'|'death'|'key', f)`, objet `me`. Exemples `SCR_EX`. Sauvé dans `wr_script`, publié avec la map (`scr`).
- **Perso 3D importé** (.glb ≤ 6 Mo) : `scrModelBuf` (GLTFLoader.parse) → `scrApply(c)` remplace l'apparence de TOUS les persos (`c.cm`, cache les meshes du skin, garde l'arme), mis à 1,95 m, animations auto (idle/walk/run par nom de clip, `c.cmMix`), ↻ pour tourner (`wr_cmrot`). Gardé dans `wr_cmodel` (< 2,6 Mo), publié en morceaux MQTT `map/<code>/cm<i>` (`cmN`, `cmR`). Pas de création de perso à partir d'une IMAGE (il faudrait un service d'IA 3D payant).
- **Vue FPS** (`fpsCam`, `VM`) : caméra dans la tête, perso caché, arme en bas à droite (accrochée à la caméra, qui est ajoutée à la scène).
- **CS WILD GO** (mode `cs`, map publique N°7, carte `propane` vidée comme `ile`, `TPL` `cs`) : map `CSMAP` (ASCII 22×14, cases de 5 m) construite en **pièces de construction** (`csBuild` → `SV.netPlace` : murs brique 2 niveaux, caisses métal, tunnel = sols) + zones A/B/spawns peintes (`csZones`), murs indestructibles (`hitWall`), pas de construction, `NOSPAWN` vide la zone. Vue FPS par le script de la map (`CS_SCRIPT`). Équipes (`csTeams` dans le `go`), manches (`csGo/csRound/csTick/csWin`, achat 12 s figé au spawn, 1:55, bombe 40 s, pose 3 s / désamorçage 5 s en maintenant E ou le bouton `#csAct`), boutique `csShop` (touche B / bouton 🛒, `CSP`), argent `CSMON`, 7 manches pour gagner. Hôte = celui qui lance : bots (`csBot` : chemin BFS sur la grille `csPath`, ligne de vue par `castRay`, tir), messages `csr` (nouvelle manche), `csw` (manche gagnée), `csp` (bombe posée), `csd` (désamorcée). 2 joueurs min, complété à 8 (4 contre 4). Pas de tir ami en `cs`.
- Site et launcher : « Créatif presque illimité » (scripts, perso 3D, CS Wild Go fait avec le Créatif).

## v82 : salon ranch, constructions façon Fortnite, X jeter, bouton réinitialiser
- **Salon** : ranch au coucher du soleil (`RANCH` : ciel dégradé, soleil, collines, grange rouge, clôture avec guirlande lumineuse, foin, éolienne, château d'eau, sapins, estrade en planches avec néon), La Wald garée derrière, **caméra fixe** (on fait seulement tourner son perso). **4 places** (`LSLOT`, `lobbySlots`) : silhouettes transparentes + « ＋ » (clic = `frOpen`), un pote du groupe = son perso + pseudo. **Échap au salon** = amis en grand (`#frM.big`).
- Stats : 4 cases (Parties, TOP 1, Éliminations, K/D), plus de « meilleure place ».
- **Constructions** : vie comme Fortnite (`HPP` 150 / 300 / 500, sols-escaliers-toits 140 / 280 / 460) qui monte petit à petit depuis `HP0` (90 / 99 / 110) en `HPT` (4 / 11,5 / 24,5 s). **Solidité** : une pièce plus reliée au sol tombe (`support()`, `linked`, `grounded`, lancé quand une pièce est détruite ; murs détruits → `SV.wallDown`). Escalier = une planche en pente (plus de bloc dessous), UN seul escalier par clic (`planFree` sans repli pour `esc`). Matière : si on n'a plus la matière choisie → bois, puis pierre, puis métal (`pickMat`). Clic droit = changer de matière (`pointerdown`, `SV.nextMat`).
- **Dégâts de chute** : au-delà de 10,5 m (3 étages), 10 + 5,2 par mètre en plus (`p.ftop`).
- **Sac PC** : X = jeter l'objet sous la souris (ou sélectionné / en main).
- **MAP 1V1** : panneau-bouton « RÉINITIALISER les constructions » au bout de la rangée de générateurs (`rzTick`, `rzDo`, E ou bouton), message réseau `rz`, `SV.wipe()`.

## v83 : MES ÎLES (Créatif façon Fortnite)
- Au salon, Créatif → **MES ÎLES** (`ISLES` dans `wr_isles`, 4 max, `islDraw`) : carte par île (nom, modèle, nb de pièces, date, ✏️ renommer, 🗑 supprimer) + « ＋ NOUVELLE ÎLE » (`islNew`) avec 2 modèles : **ÎLE GRILLE** (mode `ile` : sol gris quadrillé 5 m, rien dessus, pas de butin, `NOSPAWN` partout) ou **GRANDE MAP** (mode `creatif`). `islGo` → `wr_isle` + `wr_crGo`.
- Dans l'île : `islTick` recharge `wr_isle_<id>` (pièces via `SV.restore` = pièces à soi, appareils, règles, script) puis **sauvegarde toute seule** toutes les 15 s, en quittant (`toMenu`) et en fermant (`pagehide`) (`islStore`). Les anciens boutons Mon monde / Île vide sont remplacés par ce système.

## v84-v85
- v84 : icône ESCALIER = rampe, noms des pièces sans doublon (`window.keyName` exposé pour survie.js `KN`), « ∞ » en Créatif.
- v85 : **matériaux 500 max de chaque** (comme Fortnite) partout (`RMAX`, `give` affiche « MAX »). En Créatif : infinis par défaut, règle de partie `mats` (`RSOPT.mats` : ♾️ infinis / 🪵 500 max) dans ⚙️ Paramètres (libre, MAP 1V1) ; avec « 500 max » chacun commence la partie à 500 de chaque (`SV.setRes`) et récolte à la pioche. `INF()` dans survie.js remplace les tests `C.CREA` liés aux matériaux ; `C.mat500()`.

## v86 : menu Échap façon Fortnite, logo Wald Royal, écran de démarrage PC
- Salon (PC) : **Échap** (ou bouton ☰ `#escB` en haut à droite) = `escMenu(true)` : amis en grand à gauche (`#frM.big`) + colonne `#escM` à droite (⚙️ RÉGLAGES, 📊 STATS, 💬 COMMENTAIRES, ⬅ WALD GAME, ✕). L'onglet « Réglages » de la barre du haut est caché sur PC (`body.pcLobby`), il reste sur téléphone.
- Launcher : le **logo `jeu/logo.jpg`** remplace les vieilles images pour Wald Royal (carte Bibliothèque, carte Boutique, titre de la diapo Battle Royale `.hlogo`). Images du site rafraîchies : `lobby.jpg` (salon ranch), `creatif.jpg` (Mes îles).
- Appli PC (`app/desktop/main.js` `screen()`) : écran de démarrage en LARGE (icône Wald Game à gauche, titre, barre qui charge, « WALD OFF GAMES · WALD ROYAL ») au lieu du petit bloc façon téléphone. Il faut réinstaller WaldGame-Setup.exe pour l'avoir.
- v87 : viseur carré des pompes (auto + spécialisé) divisé par 2 (max 8,5 % de l'écran).
- v88 : constructions façon Fortnite — une pièce ne se pose que si elle touche le sol, une maison ou partage une ARÊTE avec une autre pièce (`cpts`/`linked`/`anchored`/`planOk` dans survie.js ; plus de sol dans le vide ni de murs décalés en escalier, et `support()` utilise les mêmes liens) ; portes de maison = « edit » de la map, on ne peut pas les boucher (`taken`) ; visée de construction plus longue (2,1 cases) et vers le bas ; petit point de visée `#bcross` en construction/édition ; vie des constructions touchées « 250 / 300 » + barre (`bHp`, `C.bhp`) ; pioche à deux mains (table `GRIP`/`pickGrip`) ; cahier de construction bleu dans la main gauche (`BOOK`) ; clic droit en édition = réinitialiser le mur (`SV.editReset`) ; l'arme suit le viseur haut/bas (`camP`, envoyé en réseau `pt`) ; on colle aux rampes en descendant + 0,15 s de marge pour sauter (`onG`, `p.cyT`) ; s'agripper au bord d'un sol/rampe (`SV.ledge`) ; enjamber un haut de mur < 50 cm (`pushCircle`) ; vue FPS : perso caché (`FPSV`) + bras visibles (`vmArms`) ; danse = touche P par défaut, marche aussi au salon (le perso du salon danse, la roue se ferme seule) ; Créatif : plus de coffres du mode classique.
- v89 : coffres sur PC = maintenir E (0,5 s) avec l'indication « MAINTIENS E · OUVRIR LE COFFRE » ; sur mobile et pour les bots, ouverture en restant à côté (inchangé).
- v90 : commandes PC sans les touches de soin (soin / soin suivant retirées de BIND0, BLAB, BGRP, BADV et du keydown ; anciennes valeurs sauvegardées ignorées) ; COMBAT = interagir, recharger, cases 1 à 5, sac.
- v91 : roue des danses façon GTA/Fortnite (souris vers une danse = sélection `DWV`/`dwPick`, clic ou re-appui = danser, la caméra ne tourne pas pendant) ; NAGE quand le fond est sous -2 m (`SWIMY`, `p.swim` : surface à -2, pas de tir/construction, pose de crawl) ; inventaire façon Fortnite (5 cases alignées en bas, matériaux + munitions à droite `#invSide`).
- v92 : pioche = 10 dégâts aux joueurs (`SVC.meleePl`) ; meubles des maisons destructibles 50 PV (petits) / 100 PV (gros) avec « PV / max » et un peu de bois (`INTERIORS.melee`, sommets écrasés dans le mesh fusionné via `p.v0/v1`) ; 50 joueurs par partie (NPL) ; carte désert un peu plus grande (ISL 465, HALF 550) ; tempête ~35 % plus lente ; favela : tags graffitis (lettres bulles, coulures, crews inventés) des deux côtés du mur + barbelé en accordéon (TubeGeometry hélice) sur tout le mur ; hitbox : corps + tête séparée plus petite (40 cm), bonus tête par arme (pistolet ×2, SMG/PM ×1,75, fusils/laser ×1,5, sniper ×2,5) ; têtes des skins plus petites (0,72).
- v93 : grande carte (M) : souris libre (sortie du pointer lock), molette = zoom ×1 à ×6 sous le curseur, glisser = déplacer, ✕ pour fermer (`MZ`, `MC`) ; vue du ciel détaillée dessinée une fois (`mapPhoto` : terrain + ombres + toits par matériau + arbres/rochers ; le rendu 3D orthographique faisait planter le rendu logiciel, abandonné) ; vie des murs de maison affichée quand on les tape (`w.hmax`) ; rupteur (`rupteur()`) avant la voix « Polo » en montant dans La Wald ; panneau « LA WALD CAR ».
- v94 : MATCHMAKING BR (`mmWant`/`mmQueue`, salon MQTT `mmq-<mode>-<équipe>-<map>`) : 1 min (`MMWAIT`) pour réunir de vrais joueurs, le premier arrivé est le chef et publie le `go` (n humains, seed, salle, `wend`) + le garde en message retenu `mm/<clé>` ; les bots complètent jusqu'à 50. ÎLE D'ATTENTE 20 s (`MMWARM`, `warmStart`/`warmTick`/`warmEnd`) dans un coin de la carte en mer (`WX/WZ = -(HALF-40)`, la carte bloque à ±(HALF-5)) : bus et tempête en pause, bots cachés, armes données, on réapparaît en mourant ; à la fin `reset()` (même seed) → bus. Retardataires pendant l'île : `go.late` + `go.ls` (case de bot à retirer), message réseau `late` → `brLate` (BRGONE) ; bots plus mis à jour par le chef cachés (`brStale`).
- v95 : écran PC façon Fortnite (body:not(.touch)) : mini-carte 170 px en haut à droite, en vie / élim. et bandeau tempête dessous, armes en bas à droite avec pioche/construire à gauche des cases, nom d'arme, pièces de construction puis matériaux empilés au-dessus ; mobile inchangé (déjà proche de Fortnite mobile) ; pas de tempête ni « hors zone » sur l'île d'attente.
- v96 : nouveau mode Créatif FIN DE ZONE (`MODE`/`TPL` 'zw', carte N°8 `#th8`, ✔ Wald Game) sur la carte désert, dans la favela de Mirage City (`zwArena`) : `zwStart` construit pour chaque joueur une petite pièce (sol, 4 murs dont une porte '010010000' tournée vers le centre, toit) via `SV.netPlace` (même placement chez tous grâce au hash de m.by + ids), butin aléatoire par terre (2 armes + 1 soin), 500 matériaux, tempête 5 phases (`ZWPLAN`, `zwNext` déterministe), pas de réapparition (`freeTick`) ; pas de bots BR ni de bus en zw (NPL 1, storm off hors manche `zwOff`) ; pas de rotation auto de carte en zw. BUG CORRIGÉ : le panneau RÉINITIALISER de la MAP 1V1 appelait `SV.wipe` (qui n'efface que la sauvegarde) → nouveau `SV.clearBuilds()`. « 50 joueurs » dans les textes.
- v97 : BOULE À DAB (`WEAPONS.dabb`, épique, dans le butin) : se lance comme la patate (`potLaunch(..., 'dabb')`, réseau `f` avec k), boule disco (`discoMesh`) qui reste 5 s en tournant (`DABS`/`updDabs`) ; tous ceux à moins de 7 m DABENT 5 s sans pouvoir bouger ni tirer (`p.dabT`, `dabPose` qui alterne les côtés, envoyé en réseau via dz 'dab') ; mini-carte PC responsive (min(170px, 26vh)).
- v98 : KO / RÉANIMATION en équipe (`koCan`/`knock`/`koTick`/`revive`/`teamWipe`) : au lieu de mourir on tombe KO si un coéquipier est debout, 5 s invincible puis 100 PV de KO (−2/s), couché qui gigote, pas de déplacement ni de tir ; réanimer = rester 10 s à côté avec E maintenu (`reviveTick`, anneau `REVUI`), bots coéquipiers qui viennent réanimer (`botRevive`), réseau `ko` dans l'état + message `rv` ; équipe toute KO = éliminée. CS WILD GO : textures dessinées façon map de désert (`csWallTex` enduit/pierre, `csCrateTex` caisses) appliquées aux murs pierre/métal ; tenues de soldats originales `csT` (cagoule, treillis sable) / `csCT` (casque, lunettes, bleu marine) dans skins.js (`soldier`), mises par `setModel` selon l'équipe pour soi, les bots et les autres joueurs (sk réseau). Créatif : TEXTURES PERSO des blocs bois/pierre/métal (fenêtre script ⚡ : image → 512×358 JPEG, `CTEX`, `wr_ctex`, publiée avec la map `tx`, `SV.setTex`).
- v99 : MAPS DU CRÉATIF DE ZÉRO : Gun Game, Meurtre Mystère, Sol en lave et Parcours passent sur l'île plate vide (`VIDE`, plus de maisons/arbres/voitures du mode classique) ; Gun Game et Meurtre Mystère ont la map officielle WALD VILLAGE construite avec les pièces (`wvBuild` : 9 maisons 2×2 dont certaines à étage avec rampe, portes/fenêtres éditées, toits plats, abris, + collines et montagnes), reconstruite à chaque manche. TERRAIN dans les appareils (🧩) : colline, montagne (avec neige), plateau, dune (`TERK`, `terH`, `terMesh` en LatheGeometry à couleurs de sommets ; on marche dessus via `devTop`/`devGround`), publiés avec la map comme les autres appareils.
- v100 : menu Échap du salon PC : placé en haut à droite (top 70px), bouton RÉGLAGES en premier et beaucoup plus gros (`.emBig`).
- v101 : ÉDITS EN TRIANGLE façon Fortnite (`TRIS`/`triOf`/`triMesh` : « L » de 3 cases dans un coin = petit triangle en biais, escalier de 6 cases = demi-mur en diagonale ; mesh extrudé, les boîtes de collision restent en escalier mais cachées `w.cut`) ; un côté de mur entièrement enlevé ne tient plus (cpts selon le masque, rangée du bas enlevée = plus posé au sol) et `support()` après chaque édit → un mur au sol sans sa rangée du bas et sans voisin tombe. Réseau : heures des appareils corrigées (`goLocal`) pour le groupe et la recherche de joueurs, état de connexion affiché dans la recherche (`#mqC`), avertissement dans AMIS quand on n'est pas connecté à son compte (amis invisibles / lents).
- v102 : recherche de joueurs plus large : salon `mmq2-<mode>` (plus la carte ni la taille d'équipe dans la clé) ; le `go` du chef porte sa carte (`go.map`) et sa taille d'équipe (`go.tm`) : un joueur sur l'autre carte la charge (`goMap` + `wr_crGo`) puis rejoint ; noms des joueurs trouvés affichés ; dans un groupe, seul le chef lance (les autres ne partent plus seuls).
- v103 : BUG AMIS « hors ligne » : `setInterval(frPoll, 12000)` gardait l'ANCIENNE fonction (avant le remplacement Firebase) → toutes les 12 s elle relisait la présence sur le relais MQTT (rien) et remettait tous les amis hors ligne (et donc pas d'invitation possible). Maintenant `setInterval(function () { frPoll(); })`. Règle : ne jamais passer directement une fonction remplacée plus tard (frPoll, grpPoll, frPresence…) à setInterval/addEventListener.
- v104 : VISÉE DE CONSTRUCTION façon Fortnite (pour les 90) : `planAim` part des PIEDS du joueur (niveau de grille sous les pieds, +0,35 de marge en saut ; sur une rampe assez haut = haut de la rampe) et de la direction : regard en bas → sol/rampe dans SA case, sinon dans la case devant, regard en haut → étage au-dessus ; mur sur le bord de sa case ; toit au-dessus. Utilisée partout (plus d'exception sur les rampes) ; la continuité des rampes reste (`back`).
- v105 : FIN DE ZONE passe sur l'île vide (VIDE, carte propane) : `zwMap` construit la map de zéro avec les outils du Créatif (sol sable 125 m, 10 dunes, 4 montagnes, 46 décors, 6 cabanes en pièces refaites à chaque manche), arène au centre (`zwArena` = 0,0), 500 matériaux (RCUR.mats). NOUVEAUX OUTILS dans 🧩 Appareils : peinture de sol (sable, herbe, neige, béton = `PAINTC`, disques plats), décors (`DECO` : cactus, palmier, rocher, caisse, baril, clôture, buisson ; rocher/caisse/baril = on monte dessus via `devTop`), `decoMesh`. Thème sable du terrain quand `SANDT` (zw).
- v106 : ESCALADE lente (`mantleGo`/`mantleTick`, `p.mtl`) : il s'accroche, se hisse en galérant (bras, jambes qui pédalent), ~0,75 s + 0,17 s/m, pas de commandes pendant ; saut un peu plus haut (vy 8,9) ; pioche tenue DROITE (plus de rotation rw/rb du bras, plus de torsion du buste ; la table GRIP n'est plus utilisée) ; ÉDITS DE MUR limités aux formes Fortnite (`EDOK` : fenêtre, fenêtres larges, porte, portes de côté, double porte, arche, demi-murs, triangles, colonnes…) — une forme inconnue est refusée, la grille reste ouverte.
- v107 : bus visible seulement en BR (`busM.visible` exclut CREA/SURV/PROPM/WARMI) ; FIN DE ZONE : pas de réapparition (TPL 'zw' ajouté aux conditions `!RCUR.resp`), SPECTATEUR (`SPECT`/`SPECI`, clic = joueur suivant, bandeau `#rBlind.spec`), FAVELA COLORÉE construite au chargement (`zwFavela()` : maisons 'peint' + `hs.fav`, tags `graff()` sortie en commun dans city.js), murs de la favela remis à neuf à chaque manche ; Créatif : outils « Maison favela » (`favHouse`, fav1/fav2/fav3/fav4) en vraies pièces aux peintures `pc0..pc7` (crépi `favTex`, solide comme la pierre) ; murs 2× moins épais (`WTH` = .07), sols .16, rampes .15 ; mur édité = un seul objet (`maskMesh`) avec texture à sa place + ENCADREMENT et appui de fenêtre ; ÎLE D'ATTENTE refaite (`warmIsle` : place néon, arche WALD ROYAL, palmiers, cibles, ponton, bus garé, drapeaux, lampions).
- v108 : SOLS / ESCALIERS / TOITS SOLIDES : « plats » invisibles dans C.WALLS (`flatSegs`/`flatFree`, `w.flat` 1 = sol/toit, 2 = marches de rampe, `w.cut`) → les balles et la pioche les touchent et les cassent, `SV.ceil` arrête la tête en sautant dessous ; `pushCircle`/`groundAt` les ignorent, l'escalade ignore les marches ; `setWall` ne fait rien sur un plat. ÉDITION de toutes les pièces : SOL 2×2 (1 à 3 cases enlevées, `floorMesh`, `groundAt` respecte les trous), ESCALIER 2×2 (2 cases côte à côte du bas vers le haut = nouvelle direction, `rampDir`, `ESEL` garde l'ordre, réseau `mask:'dN'`), clic droit = d'origine (`p.d0`) ; visée `aimEdit` (rayon sur la pente `rayRamp`) ; grille hologramme bleu transparent, cases choisies éteintes orange, étincelles à la validation (`editPop`) ; `editApply` commun local / réseau (`netEdit`).
- v109 : PROP HUNT : on devient EXACTEMENT ce qu'on vise (`propFromHit` : 'veh:N' = clone de la vraie voiture, 'tr:sp:mi:sc:col' = vrai arbre détaillé via `TREES3D.disguise` sans LOD, sinon objets d'avant) ; `propOk`/`propLabel`/`propModel` (réseau via `pr`) ; les cachés se transforment avec n'importe quelle arme ; castRay 'tree' renvoie `o` ; arbres détaillés ×1,9 rayon / ×2,4 nombre en Prop Hunt ; imposteurs d'arbres 256×512 + mipmaps.
- v110 : WALD CITY (mode 'city', map publique N°9 `#th9`, carte propane VIDE, TPL libre) : `jeu/city6.js` (`CITY6.build`) = ville originale réaliste au coucher du soleil (grille d'avenues `AV`/rues `ST`/Ocean Drive `OD`, asphalte + marquages + passages piétons, trottoirs, feux, lampadaires, hôtels art déco pastel à néons et enseignes inventées `HN`, tours de verre PBR (reflets), immeubles à balcons, boutiques, parcs à palmiers + fontaine, plage qui suit le terrain, parasols, cabanes de sauveteur, ponton + grande roue qui tourne, yachts, places de parking `CITY6.spots` pour `vehSpot`). Géométrie fusionnée par matériau (`box` UV en mètres, `flush`). Reflets : `scene.environment` = PMREM du ciel puis HDRI `jeu/hdr/venice_sunset_1k.hdr` (Poly Haven CC0) via `jeu/RGBELoader.js` (three r128). Collisions = murs invisibles `MATS.inv` (indestructibles, `C.W`). Soleil/ciel fixes (SUNDIR, uniformes du ciel), bloom/rayons réduits, pas d'herbe/buissons/cailloux. Créatif : appareils `CITYD` hôtel, tour, immeuble, boutique, lampadaire, parasol, cabane de sauveteur (`CITY6.device`, murs `d.walls`, `wallsDrop`).
- v111 : PARCOURS refait façon deathrun (`obbyGen`, ≈ 121 blocs, 8 épreuves avec point de passage : escalier en spirale, poteaux, couloir piégé, plateformes qui bougent, damier de lave (une case sûre par rangée, ±1 colonne), tour en zigzag, grands sauts, pont final ; tous les sauts vérifiés ≤ 4,6 m / +1,3 m) ; MEURTRE MYSTÈRE : les bots sans arme se baladent dans le village et fuient le meurtrier démasqué (`crBotsTick`, `p.wx/wz/wT`).
- v112 : BUG CORRIGÉ « c'est toi qui contrôles les robots » : les bots sans IA (`noai` : meurtre mystère, prop hunt, CS…) passaient dans la branche du JOUEUR de `update` (ils marchaient/sautaient/tiraient avec nos touches, et têtes cachées en vue FPS) → `noaiTick` (gravité + sol seulement). PERSOS RÉALISTES `jeu/real.js` (`REAL.load/apply/unapply`, modèles Mixamo `jeu/models/real/soldier.glb` + `michelle.glb`, animations Idle/Walk/Run du soldat, pistes de position retirées pour Michelle ; branchés sur `c.cm`/`c.cmMix` comme le perso importé) : `realTick`/`realWant` → CS (csT teinte sable, csCT teinte bleue) et Wald City (tout le monde). WALD CITY façon GTA : pas de construction (`BUILD`), pas de salle d'attente (`cityTick` dans `roundTick`), kit pistolet + fusil + pompe (`cityKit`), 26 VILLAGEOIS (`PEDS`, `pedMake/pedPlace/pedTick` : marchent de coin en coin sur les trottoirs `pedLines`, fuient les coups de feu `LASTSHOT`, `pedDie` = corps à terre `p.corpse` puis réapparition), 16 voitures en libre accès, VÉHICULE IMPORTÉ (Échap → 🚗 Mon véhicule `#pVeh`, `cvehOpen` : .glb ≤ 6 Mo + nom + vitesse ≤ 173 km/h (`CVMAX.vmax` 48 m/s) + puissance ≤ 28, gardé dans `wr_cveh`, `cvehSpawn` ajoute un `VT['cv_N']`, aussi en Créatif / Île vide). CS : mur « photo » (`csWallTex` bruit multi-échelle, enduit tombé, coulures) + sol de sable sous la map.
- v113 : PERSONNES RÉALISTES : `REAL.VARS` = 10 personnes (7 civiles sur le corps de Michelle, 3 sur le soldat) différenciées par recoloration pixel par pixel des textures (`recolor` : vêtements, peau, détails, haut ; tissu/plaques du soldat), taille/carrure (`sy/sw`), casquette et lunettes accrochées à l'os de la tête (`accessories`) ; clé `vN` dans `REAL.apply`. Taille mesurée sur les OS (la boîte d'un SkinnedMesh est fausse : Michelle couchée en cm) ; animations du soldat sur Michelle avec correction de la rotation des hanches (`noPos(c, k)` : qm = inv(Pm)·Ps·qs, positions retirées). Barre « ⬇ TÉLÉCHARGEMENT · persos réalistes » (`#realDL`, progression du GLTFLoader). WALD CITY : 50 villageois (`PEDN`), personnes `v0..v9`, visibles à 110 m, animation des lointains moins souvent. CRÉATIF : Échap → 🧍 PNJ (`pnjOpen` : 0-50, zone 10-150 m autour de soi, style réalistes / persos du jeu / modèle .glb importé `REAL.add('perso')`, gardé dans `wr_pnj_<île>` + `_glb`, `pnjTick` dans `roundTick`, promenade dans la zone) ; bots de combat jusqu'à 50 dans ⚙️ Paramètres (`RSOPT.bots`).
- v114 : têtes des skins beaucoup plus petites (`buildSkin` : `R.head.scale` 0,52 au lieu de 0,72, abaissée de 0,095) → proportions entre Roblox et Fortnite (~1/7 de la taille) ; Flubb et les zombies inchangés ; danses testées (os inchangés).
- v115 : CITADINS RÉALISTES : **Microsoft Rocketbox Avatar Library (MIT)** dans `jeu/models/rb/` (16 personnes : jean, polo, chemise, robe, costume… + `LICENSE.txt`), convertis FBX → .glb dans Chromium headless (FBXLoader + GLTFExporter ; ⚠ réindexer la géométrie pour que chaque matériau ait UN seul groupe, sinon l'exporteur r128 mélange les textures), textures réduites (corps 1024, tête 512, cheveux 512 png alpha). Animations motion capture (`anims.json` : idle / walk / run hommes `m` et femmes `f`, squelette Biped `Bip01_*`, pistes de position seulement sur `Bip01`, doigts retirés). `REAL` : clés `c0..c15` (`REAL.RB`), chargement À LA DEMANDE (`need(k)`, `needAnims`, barre ⬇ TÉLÉCHARGEMENT), anciennes clés `vN` → `c(N%16)`, vitesse de l'animation calée sur la vitesse (`c.civ`). Wald City : villageois, joueurs et bots = citadins (moi = `c8`, Léa/Nova = `c9`) ; CS garde le soldat Mixamo. Michelle n'est plus chargée.
- v116 : OUTIL TERRAIN du Créatif façon mode Paysage de Fortnite (`TERR`, `terToggle/terTick/terBrush/terAim/terRing/terUI`, Échap → 🏔️ Terrain `#pTer`, seulement MES ÎLES `ile`/`creatif` sans jeu publié chargé, `terOK`) : on vise le sol, TIR maintenu = MONTER / CREUSER / LISSER / APLANIR (hauteur du début du coup) / MONTAGNE (un clic = sommet à crêtes, `TERR.mt`) / PEINDRE (herbe, sable, neige, terre, effacer). Modifie la vraie grille `HG` (physique via `hgt`, l'eau de mer remplit les trous), morceaux du sol reconstruits (`terDirty`/`terRebuild`, 110 ms). Peinture = DataTexture `TPT` (r herbe, g sable, b neige, a terre) lue par le shader du sol (`tPaint`). ÎLE GRILLE : le plan gris est supprimé, le quadrillage 5 m / 25 m est dessiné par le shader du sol tant que le sol est à 0,6 (sculpté = herbe, roche dans les pentes, neige au-dessus de ~40 m). Barre `#terB` (taille 3-60 m, force 1-10, ↩ annuler 25 coups, PC : R outil, F couleur, molette taille, Maj+molette force, Ctrl+Z). Sauvegarde `terSave` (cases changées par rapport à `HG0`, copié au 1er usage, au 1/20 m + peinture en plages) dans `wr_isle_<id>` (`ter`) et publiée avec le jeu (`ter` → `pubApply` → `terLoad`).
