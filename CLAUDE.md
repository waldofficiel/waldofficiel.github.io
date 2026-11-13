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
| `jeu/polo3d.html` | Visionneuse 3D de La Wald (rotation, phares, faire rouler) |
| `jeu/manifest.webmanifest`, `jeu/sw.js` | PWA. Cache `wald-royale-3d-v16` : **monter la version à chaque modif** |
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

## Idées en attente / pistes
- Une clé de signature Android secrète (secret GitHub) avant le Play Store.
- Un certificat de signature Windows pour enlever l'écran SmartScreen.
- Du multijoueur réel (pour l'instant ce sont des bots).
