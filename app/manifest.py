# Écrit jeu/version.json : numéro de version (nombre de commits) + empreinte de chaque fichier du jeu.
# L'appli (téléphone et PC) le compare au sien à chaque lancement et ne télécharge que les fichiers qui ont changé.
import hashlib, json, os, subprocess, time
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'jeu')
SKIP = {'version.json', 'sw.js', 'perso.jpg', 'polo_drift.webp'}
try: v = int(subprocess.check_output(['git', 'rev-list', '--count', 'HEAD'], cwd=ROOT).strip())
except Exception: v = int(time.time())
files = {}
for d, _, fs in os.walk(ROOT):
    for f in fs:
        p = os.path.join(d, f); rel = os.path.relpath(p, ROOT).replace(os.sep, '/')
        if rel in SKIP: continue
        h = hashlib.sha1(open(p, 'rb').read()).hexdigest()[:16]
        files[rel] = [h, os.path.getsize(p)]
json.dump({'v': v, 'files': dict(sorted(files.items()))}, open(os.path.join(ROOT, 'version.json'), 'w'), separators=(',', ':'))
print('version', v, len(files), 'fichiers')
