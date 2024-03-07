import{_ as a,v as s,b as e,R as o}from"./chunks/framework.9acc882a.js";const D=JSON.parse('{"title":"Dialog API","description":"","frontmatter":{},"headers":[],"relativePath":"js-api/dialog.md","filePath":"js-api/dialog.md","lastUpdated":1709636375000}'),t={name:"js-api/dialog.md"},l=o('<h1 id="dialog-api" tabindex="-1">Dialog API <a class="header-anchor" href="#dialog-api" aria-label="Permalink to &quot;Dialog API&quot;">​</a></h1><div class="language-js"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#C792EA;">const</span><span style="color:#A6ACCD;"> dialog </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> document</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">querySelector</span><span style="color:#A6ACCD;">(</span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">awc-dialog</span><span style="color:#89DDFF;">&#39;</span><span style="color:#A6ACCD;">)</span><span style="color:#89DDFF;">;</span></span></code></pre></div><h2 id="methods" tabindex="-1">Methods <a class="header-anchor" href="#methods" aria-label="Permalink to &quot;Methods&quot;">​</a></h2><h3 id="open" tabindex="-1"><code>open</code> <a class="header-anchor" href="#open" aria-label="Permalink to &quot;`open`&quot;">​</a></h3><p>Whether the dialog is open or not.</p><div class="language-js"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#A6ACCD;">dialog</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">open</span><span style="color:#89DDFF;">;</span></span></code></pre></div><h3 id="show" tabindex="-1"><code>show</code> <a class="header-anchor" href="#show" aria-label="Permalink to &quot;`show`&quot;">​</a></h3><p>Shows the dialog.</p><div class="language-js"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#A6ACCD;">dialog</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">show</span><span style="color:#A6ACCD;">()</span><span style="color:#89DDFF;">;</span></span></code></pre></div><h3 id="hide" tabindex="-1"><code>hide</code> <a class="header-anchor" href="#hide" aria-label="Permalink to &quot;`hide`&quot;">​</a></h3><p>Hides the dialog and dispatches the <code>awc-dialog:hidden</code> event.</p><div class="language-js"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#A6ACCD;">dialog</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">hide</span><span style="color:#A6ACCD;">()</span><span style="color:#89DDFF;">;</span></span></code></pre></div><h3 id="hidewithoutemitting" tabindex="-1"><code>hideWithoutEmitting</code> <a class="header-anchor" href="#hidewithoutemitting" aria-label="Permalink to &quot;`hideWithoutEmitting`&quot;">​</a></h3><p>Hides the dialog and does not dispatch any events.</p><div class="language-js"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#A6ACCD;">dialog</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">hideWithoutEmitting</span><span style="color:#A6ACCD;">()</span><span style="color:#89DDFF;">;</span></span></code></pre></div><h2 id="events" tabindex="-1">Events <a class="header-anchor" href="#events" aria-label="Permalink to &quot;Events&quot;">​</a></h2><table><thead><tr><th>Name</th><th>Bubbles</th><th>Description</th></tr></thead><tbody><tr><td><code>awc-dialog:hidden</code></td><td><code>true</code></td><td>This event fires immediately when the dialog is hidden.</td></tr></tbody></table>',17),n=[l];function i(p,d,c,r,h,g){return s(),e("div",null,n)}const u=a(t,[["render",i]]);export{D as __pageData,u as default};
