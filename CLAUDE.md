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
| `jeu/manifest.webmanifest`, `jeu/sw.js` | PWA. Cache `wald-royale-3d-v28` : **monter la version à chaque modif** |
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

## Idées en attente / pistes
- Une clé de signature Android secrète (secret GitHub) avant le Play Store.
- Un certificat de signature Windows pour enlever l'écran SmartScreen.
- Du multijoueur réel (pour l'instant ce sont des bots).
