package fr.waldoff.royal;

import android.app.Activity;
import android.content.res.AssetManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Iterator;

/**
 * Wald Royal : le jeu tourne en plein écran.
 * MISE À JOUR AUTOMATIQUE : à chaque lancement, l'appli lit version.json sur le site. Si le numéro a changé,
 * elle télécharge seulement les fichiers modifiés dans son dossier interne (files/game), puis lance le jeu depuis là.
 * Sans internet : on lance la dernière version déjà téléchargée, sinon celle incluse dans l'APK.
 */
public class MainActivity extends Activity {
    private static final String SITE = "https://waldofficiel.github.io/jeu/";
    private static final String HOST = "https://appassets.androidplatform.net";
    private WebView web;
    private volatile boolean launched = false;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        web = new WebView(this);
        web.setBackgroundColor(0xFF0B0418);
        setContentView(web);
        hideBars();

        File game = new File(getFilesDir(), "game");
        game.mkdirs();
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .addPathHandler("/game/", new WebViewAssetLoader.InternalStoragePathHandler(this, game))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(s.getUserAgentString() + " WaldRoyalApp");

        web.loadDataWithBaseURL(HOST + "/", SCREEN, "text/html", "utf-8", null);
        new Thread(new Runnable() { public void run() { update(); } }).start();
    }

    /* ---------- écran de mise à jour ---------- */
    private static final String SCREEN = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><style>"
            + "html,body{margin:0;height:100%;background:radial-gradient(circle at 50% 35%,#3a0f5e,#0b0418 70%);color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden}"
            + ".b{width:min(440px,80vw);text-align:center}h1{margin:0 0 6px;font-size:38px;font-weight:900;letter-spacing:.04em;background:linear-gradient(180deg,#fff,#ffc4ec 55%,#ff2bd6);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 14px rgba(255,43,214,.6))}"
            + "p{margin:0 0 16px;color:#d9c8f0;font-weight:700;font-size:14px}.t{height:12px;border-radius:8px;background:rgba(255,255,255,.12);overflow:hidden}"
            + ".t i{display:block;height:100%;width:3%;border-radius:8px;background:linear-gradient(90deg,#ff2bd6,#8a3dff,#3dd6ff);box-shadow:0 0 14px #ff2bd6;transition:width .2s}"
            + "small{display:block;margin-top:10px;color:#9a86b8;font-weight:700}</style></head><body><div class='b'><h1>WALD ROYAL</h1><p id='m'>Recherche de mises à jour…</p><div class='t'><i id='i'></i></div><small id='v'></small></div>"
            + "<script>function setP(p,m,v){document.getElementById('i').style.width=Math.max(3,p)+'%';if(m)document.getElementById('m').textContent=m;if(v)document.getElementById('v').textContent=v;}</script></body></html>";

    private void ui(final int pct, final String msg, final String ver) {
        runOnUiThread(new Runnable() { public void run() {
            if (launched) return;
            web.evaluateJavascript("setP(" + pct + "," + JSONObject.quote(msg) + "," + JSONObject.quote(ver == null ? "" : ver) + ")", null);
        } });
    }

    private void launch(final String base) {
        runOnUiThread(new Runnable() { public void run() {
            if (launched) return; launched = true;
            web.loadUrl(base.startsWith("http") ? base : HOST + base + "index.html?jouer");
        } });
    }

    /* ---------- mise à jour ---------- */
    private void update() {
        File game = new File(getFilesDir(), "game");
        JSONObject cur = null; String base = "/assets/";
        try { if (new File(game, "version.json").exists()) { cur = new JSONObject(new String(readFile(new File(game, "version.json")), "UTF-8")); base = "/game/"; } } catch (Exception e) { cur = null; base = "/assets/"; }
        if (cur == null) { try { cur = new JSONObject(new String(readAll(getAssets().open("version.json")), "UTF-8")); } catch (Exception e) { cur = null; } }
        JSONObject nw;
        try { nw = new JSONObject(new String(get(SITE + "version.json?t=" + System.currentTimeMillis(), 5000), "UTF-8")); }
        catch (Exception e) { launch(base); return; }   // pas d'internet : on joue avec ce qu'on a
        int vNew = nw.optInt("v", 0), vCur = cur == null ? -1 : cur.optInt("v", -1);
        // LAUNCHER : avec internet, on ouvre directement le jeu du site (toujours la dernière version) ;
        // la copie locale se met à jour en arrière-plan pour jouer hors ligne la prochaine fois.
        ui(100, "Lancement de la version " + vNew + "…", "v" + vNew);
        launch("https://waldofficiel.github.io/launcher/?app=1&v=" + vNew);   // écran du LAUNCHER (façon Epic Games), bouton JOUER
        if (vNew == vCur) return;

        File tmp = new File(getFilesDir(), "game_tmp"); delete(tmp); tmp.mkdirs();
        try {
            JSONObject files = nw.getJSONObject("files"), old = cur == null ? new JSONObject() : cur.optJSONObject("files");
            if (old == null) old = new JSONObject();
            long total = 0, done = 0;
            Iterator<String> it = files.keys();
            while (it.hasNext()) { String k = it.next(); JSONArray f = files.getJSONArray(k); JSONArray o = old.optJSONArray(k); if (o == null || !o.getString(0).equals(f.getString(0))) total += f.getLong(1); }
            ui(4, "Mise à jour vers la version " + vNew + "…", "v" + (vCur < 0 ? "?" : vCur) + " → v" + vNew);
            it = files.keys();
            AssetManager am = getAssets();
            while (it.hasNext()) {
                String k = it.next(); JSONArray f = files.getJSONArray(k); JSONArray o = old.optJSONArray(k);
                File out = new File(tmp, k); out.getParentFile().mkdirs();
                byte[] data = null;
                if (o != null && o.getString(0).equals(f.getString(0))) {   // fichier inchangé : on le recopie
                    try { data = base.equals("/game/") ? readFile(new File(game, k)) : readAll(am.open(k)); } catch (Exception e) { data = null; }
                }
                if (data == null) {
                    data = get(SITE + enc(k) + "?v=" + vNew, 20000); done += f.getLong(1);
                    ui((int) (4 + 94 * (total > 0 ? (double) done / total : 1)), "Téléchargement de la mise à jour… " + (done * 100 / Math.max(1, total)) + " %", null);
                }
                writeFile(out, data);
            }
            writeFile(new File(tmp, "version.json"), nw.toString().getBytes("UTF-8"));
            File bak = new File(getFilesDir(), "game_old"); delete(bak);
            if (game.exists() && !game.renameTo(bak)) throw new Exception("rename");
            if (!tmp.renameTo(game)) { bak.renameTo(game); throw new Exception("rename"); }
            delete(bak);
            ui(100, "Mise à jour terminée !", "v" + vNew);
            try { Thread.sleep(350); } catch (InterruptedException ignored) {}
            launch("/game/");
        } catch (Exception e) {
            delete(tmp);
            launch(new File(game, "version.json").exists() ? "/game/" : "/assets/");
        }
    }

    private static String enc(String path) throws Exception {
        StringBuilder sb = new StringBuilder(); String[] parts = path.split("/");
        for (int i = 0; i < parts.length; i++) { if (i > 0) sb.append('/'); sb.append(URLEncoder.encode(parts[i], "UTF-8").replace("+", "%20")); }
        return sb.toString();
    }
    private static byte[] get(String url, int timeout) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(timeout); c.setReadTimeout(timeout); c.setUseCaches(false);
        try { if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode()); return readAll(c.getInputStream()); }
        finally { c.disconnect(); }
    }
    private static byte[] readAll(InputStream in) throws Exception {
        try { ByteArrayOutputStream b = new ByteArrayOutputStream(); byte[] buf = new byte[65536]; int n; while ((n = in.read(buf)) > 0) b.write(buf, 0, n); return b.toByteArray(); }
        finally { in.close(); }
    }
    private static byte[] readFile(File f) throws Exception { return readAll(new FileInputStream(f)); }
    private static void writeFile(File f, byte[] d) throws Exception { OutputStream o = new FileOutputStream(f); try { o.write(d); } finally { o.close(); } }
    private static void delete(File f) {
        if (!f.exists()) return;
        File[] l = f.listFiles(); if (l != null) for (File c : l) delete(c);
        f.delete();
    }

    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    @Override
    public void onBackPressed() {   // retour = pause du jeu
        if (launched) web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape'}))", null);
    }

    @Override protected void onPause() { super.onPause(); web.onPause(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); hideBars(); }
}
