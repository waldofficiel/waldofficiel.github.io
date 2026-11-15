package fr.waldoff.royal;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
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
 * WALD GAME : le launcher de Wald Off (appli légère, sans le jeu dedans).
 * - Avec internet : ouvre la page du launcher (site). De là, le joueur INSTALLE Wald Royal :
 *   les fichiers du jeu sont téléchargés dans le dossier interne de l'appli (files/game).
 * - JOUER lance le jeu installé (hors ligne possible). Les mises à jour ne téléchargent que les fichiers changés.
 * - Pont JavaScript « WG » : installed(), install(), play(q), uninstall(), profil partagé (pseudo, skins, pièces…).
 */
public class MainActivity extends Activity {
    private static final String SITE = "https://waldofficiel.github.io/jeu/";
    private static final String LAUNCHER = "https://waldofficiel.github.io/launcher/?app=2";
    private static final String HOST = "https://appassets.androidplatform.net";
    private WebView web;
    private volatile boolean busy = false;

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

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/game/", new WebViewAssetLoader.InternalStoragePathHandler(this, gameDir()))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) {
                if (request.isForMainFrame() && request.getUrl().toString().startsWith("https://waldofficiel.github.io/"))
                    view.loadDataWithBaseURL(HOST + "/", screen("Impossible de joindre Wald Game. Vérifie ta connexion internet.<br><br><a href='" + LAUNCHER + "' style='color:#ffd23d;font-size:18px'>↻ Réessayer</a>"), "text/html", "utf-8", null);
            }
        });
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(s.getUserAgentString() + " WaldRoyalApp WaldGame/2");
        web.addJavascriptInterface(new Bridge(), "WG");

        web.loadDataWithBaseURL(HOST + "/", screen("Connexion…"), "text/html", "utf-8", null);
        new Thread(new Runnable() { public void run() { start(); } }).start();
    }

    private File gameDir() { File g = new File(getFilesDir(), "game"); g.mkdirs(); return g; }
    private int installedVersion() {
        try { return new JSONObject(new String(readFile(new File(gameDir(), "version.json")), "UTF-8")).optInt("v", -1); }
        catch (Exception e) { return -1; }
    }

    /* ---------- démarrage : launcher en ligne, sinon jeu installé, sinon message ---------- */
    private void start() {
        boolean online;
        try { get(SITE + "version.json?t=" + System.currentTimeMillis(), 10000); online = true; } catch (Exception e) { online = false; }
        final boolean on = online;
        runOnUiThread(new Runnable() { public void run() {
            if (on) web.loadUrl(LAUNCHER);
            else if (installedVersion() >= 0) web.loadUrl(HOST + "/game/index.html?jouer&from=launcher&off=1");
            else web.loadUrl(LAUNCHER);   // on essaie quand même le launcher (la vérification a pu échouer pour une autre raison)
        } });
    }

    private static String screen(String msg) {
        return "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><style>"
            + "html,body{margin:0;height:100%;background:radial-gradient(circle at 50% 35%,#3a0f5e,#0b0418 70%);color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden}"
            + ".b{width:min(440px,84vw);text-align:center}h1{margin:0 0 10px;font-size:38px;font-weight:900;letter-spacing:.04em;background:linear-gradient(180deg,#fff,#ffc4ec 55%,#ff2bd6);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 14px rgba(255,43,214,.6))}"
            + "p{margin:0;color:#d9c8f0;font-weight:700;font-size:15px;line-height:1.4}</style></head><body><div class='b'><h1>WALD GAME</h1><p>" + msg + "</p></div></body></html>";
    }

    private void js(final String code) {
        runOnUiThread(new Runnable() { public void run() { web.evaluateJavascript(code, null); } });
    }

    /* ---------- pont JavaScript ---------- */
    private class Bridge {
        @JavascriptInterface public int installed() { return installedVersion(); }
        @JavascriptInterface public boolean busy() { return busy; }
        @JavascriptInterface public void install() {
            if (busy) return; busy = true;
            new Thread(new Runnable() { public void run() {
                try { download(); js("window.WGdone&&WGdone(" + installedVersion() + ")"); }
                catch (Exception e) { js("window.WGfail&&WGfail(" + JSONObject.quote(String.valueOf(e.getMessage())) + ")"); }
                finally { busy = false; }
            } }).start();
        }
        @JavascriptInterface public void play(final String q) {
            if (installedVersion() < 0) return;
            runOnUiThread(new Runnable() { public void run() { web.loadUrl(HOST + "/game/index.html?jouer&from=launcher" + (q == null ? "" : q)); } });
        }
        @JavascriptInterface public void launcher() { runOnUiThread(new Runnable() { public void run() { web.loadUrl(LAUNCHER); } }); }
        @JavascriptInterface public void uninstall() { if (!busy) delete(gameDir()); }
        @JavascriptInterface public String profile() {
            try { return new String(readFile(new File(getFilesDir(), "profile.json")), "UTF-8"); } catch (Exception e) { return ""; }
        }
        @JavascriptInterface public void saveProfile(String json) {
            try { writeFile(new File(getFilesDir(), "profile.json"), json.getBytes("UTF-8")); } catch (Exception ignored) {}
        }
    }

    /* ---------- installation / mise à jour de Wald Royal ---------- */
    private void download() throws Exception {
        File game = gameDir();
        JSONObject cur = null;
        try { cur = new JSONObject(new String(readFile(new File(game, "version.json")), "UTF-8")); } catch (Exception e) { cur = null; }
        JSONObject nw = new JSONObject(new String(get(SITE + "version.json?t=" + System.currentTimeMillis(), 8000), "UTF-8"));
        int vNew = nw.optInt("v", 0);
        if (cur != null && cur.optInt("v", -1) == vNew) { js("window.WGprog&&WGprog(100,'À jour')"); return; }
        File tmp = new File(getFilesDir(), "game_tmp"); delete(tmp); tmp.mkdirs();
        try {
            JSONObject files = nw.getJSONObject("files"), old = cur == null ? new JSONObject() : cur.optJSONObject("files");
            if (old == null) old = new JSONObject();
            long total = 0, done = 0;
            Iterator<String> it = files.keys();
            while (it.hasNext()) { String k = it.next(); JSONArray f = files.getJSONArray(k); JSONArray o = old.optJSONArray(k); if (o == null || !o.getString(0).equals(f.getString(0))) total += f.getLong(1); }
            it = files.keys();
            int lastP = -1;
            while (it.hasNext()) {
                String k = it.next(); JSONArray f = files.getJSONArray(k); JSONArray o = old.optJSONArray(k);
                File out = new File(tmp, k); out.getParentFile().mkdirs();
                byte[] data = null;
                if (o != null && o.getString(0).equals(f.getString(0))) { try { data = readFile(new File(game, k)); } catch (Exception e) { data = null; } }
                if (data == null) {
                    data = get(SITE + enc(k) + "?v=" + vNew, 30000); done += f.getLong(1);
                    int p = (int) (100.0 * done / Math.max(1, total));
                    if (p != lastP) { lastP = p; js("window.WGprog&&WGprog(" + p + "," + JSONObject.quote(String.format("%.1f / %.1f Mo", done / 1048576.0, total / 1048576.0)) + ")"); }
                }
                writeFile(out, data);
            }
            writeFile(new File(tmp, "version.json"), nw.toString().getBytes("UTF-8"));
            File bak = new File(getFilesDir(), "game_old"); delete(bak);
            if (game.exists() && !game.renameTo(bak)) throw new Exception("rename");
            if (!tmp.renameTo(game)) { bak.renameTo(game); throw new Exception("rename"); }
            delete(bak);
        } catch (Exception e) { delete(tmp); throw e; }
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
    public void onBackPressed() {   // dans le jeu : pause ; dans le launcher : page précédente
        String u = web.getUrl();
        if (u != null && u.startsWith(HOST + "/game/")) web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape'}))", null);
        else if (web.canGoBack()) web.goBack();
    }

    @Override protected void onPause() { super.onPause(); web.onPause(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); hideBars(); }
}
