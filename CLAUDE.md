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
4. **L'inventaire a 3 cases**, avec un bouton 🎒 pour ouvrir le panneau (jeter, échanger, remplacer par une arme au sol).
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
| `jeu/polo3d.html` | Visionneuse 3D de La Wald (rotation, phares, faire rouler) |
| `jeu/manifest.webmanifest`, `jeu/sw.js` | PWA. Cache `wald-royale-3d-v7` : **monter la version à chaque modif** |
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

## Idées en attente / pistes
- Skins dans le casier (déjà prévus au début du projet).
- Une clé de signature Android secrète (secret GitHub) avant le Play Store.
- Un certificat de signature Windows pour enlever l'écran SmartScreen.
- Du multijoueur réel (pour l'instant ce sont des bots).
