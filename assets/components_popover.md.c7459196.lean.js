import{_ as s,v as a,b as o,R as t}from"./chunks/framework.9acc882a.js";const h=JSON.parse('{"title":"Popover","description":"","frontmatter":{},"headers":[],"relativePath":"components/popover.md","filePath":"components/popover.md","lastUpdated":1693937897000}'),e={name:"components/popover.md"},n=t(`<h1 id="popover" tabindex="-1">Popover <a class="header-anchor" href="#popover" aria-label="Permalink to &quot;Popover&quot;">​</a></h1><p>A popover is a floating panel that can display rich content like navigation menus and mobile menus.</p><h2 id="usage" tabindex="-1">Usage <a class="header-anchor" href="#usage" aria-label="Permalink to &quot;Usage&quot;">​</a></h2><div class="language-erb"><button title="Copy Code" class="copy"></button><span class="lang">erb</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#89DDFF;">&lt;%=</span><span style="color:#A6ACCD;"> render</span><span style="color:#89DDFF;">(</span><span style="color:#FFCB6B;">Impulse</span><span style="color:#89DDFF;">::</span><span style="color:#FFCB6B;">PopoverComponent</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">new</span><span style="color:#89DDFF;">(title:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">Activity feed</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">))</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">do</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;">c</span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> c</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">with_trigger </span><span style="color:#89DDFF;">{</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">Toggle popover</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> c</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">with_body </span><span style="color:#89DDFF;font-style:italic;">do</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">&lt;</span><span style="color:#F07178;">span</span><span style="color:#89DDFF;">&gt;</span><span style="color:#A6ACCD;">And here&#39;s some amazing content. It&#39;s very engaging. Right?</span><span style="color:#89DDFF;">&lt;/</span><span style="color:#F07178;">span</span><span style="color:#89DDFF;">&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">end</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">end</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span></code></pre></div><h2 id="arguments" tabindex="-1">Arguments <a class="header-anchor" href="#arguments" aria-label="Permalink to &quot;Arguments&quot;">​</a></h2><table><thead><tr><th>Name</th><th>Default</th><th>Description</th></tr></thead><tbody><tr><td>title</td><td>N/A</td><td>The title of the popover.</td></tr><tr><td>open</td><td><code>false</code></td><td>Whether the popover is open or not.</td></tr><tr><td>placement</td><td><code>bottom</code></td><td>The preferred placement of the popover. The actual placement may vary to keep the element inside the viewport.</td></tr><tr><td>click_boundaries</td><td><code>[]</code></td><td>The CSS selector of the element that should avoid closing the popover when clicked inside.</td></tr></tbody></table><h2 id="examples" tabindex="-1">Examples <a class="header-anchor" href="#examples" aria-label="Permalink to &quot;Examples&quot;">​</a></h2><h3 id="custom-header" tabindex="-1">Custom header <a class="header-anchor" href="#custom-header" aria-label="Permalink to &quot;Custom header&quot;">​</a></h3><p>You can customize the header to add rich content instead of a simple title by calling the <code>with_header</code> slot. You will still need to pass the <code>title</code> argument to the popover component for accessibility reasons.</p><div class="language-erb"><button title="Copy Code" class="copy"></button><span class="lang">erb</span><pre class="shiki material-theme-palenight has-highlighted-lines"><code><span class="line"><span style="color:#89DDFF;">&lt;%=</span><span style="color:#A6ACCD;"> render</span><span style="color:#89DDFF;">(</span><span style="color:#FFCB6B;">Impulse</span><span style="color:#89DDFF;">::</span><span style="color:#FFCB6B;">PopoverComponent</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">new</span><span style="color:#89DDFF;">(title:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">Activity feed</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">))</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">do</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;">c</span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> c</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">with_trigger </span><span style="color:#89DDFF;">{</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">Toggle popover</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line highlighted"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> c</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">with_header </span><span style="color:#89DDFF;">{</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">Custom header</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> c</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">with_body </span><span style="color:#89DDFF;font-style:italic;">do</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">&lt;</span><span style="color:#F07178;">span</span><span style="color:#89DDFF;">&gt;</span><span style="color:#A6ACCD;">And here&#39;s some amazing content. It&#39;s very engaging. Right?</span><span style="color:#89DDFF;">&lt;/</span><span style="color:#F07178;">span</span><span style="color:#89DDFF;">&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">end</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">end</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span></code></pre></div><h3 id="closing-the-popover" tabindex="-1">Closing the popover <a class="header-anchor" href="#closing-the-popover" aria-label="Permalink to &quot;Closing the popover&quot;">​</a></h3><p>Add the <code>data-action=&quot;click-&gt;awc-popover#hide&quot;</code> attribute on the <code>button</code> element to close the popover when clicking it.</p><div class="language-erb"><button title="Copy Code" class="copy"></button><span class="lang">erb</span><pre class="shiki material-theme-palenight has-highlighted-lines"><code><span class="line"><span style="color:#89DDFF;">&lt;%=</span><span style="color:#A6ACCD;"> render</span><span style="color:#89DDFF;">(</span><span style="color:#FFCB6B;">Impulse</span><span style="color:#89DDFF;">::</span><span style="color:#FFCB6B;">PopoverComponent</span><span style="color:#89DDFF;">.</span><span style="color:#F78C6C;">new</span><span style="color:#89DDFF;">(title:</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">Activity feed</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">))</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">do</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;">c</span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> c</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">with_trigger </span><span style="color:#89DDFF;">{</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">Toggle popover</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">}</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> c</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">with_body </span><span style="color:#89DDFF;font-style:italic;">do</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line highlighted"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">&lt;</span><span style="color:#F07178;">button</span><span style="color:#89DDFF;"> </span><span style="color:#C792EA;">type</span><span style="color:#89DDFF;">=</span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">button</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;"> </span><span style="color:#C792EA;">data-action</span><span style="color:#89DDFF;">=</span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">click-&gt;awc-popover#hide</span><span style="color:#89DDFF;">&quot;</span><span style="color:#89DDFF;">&gt;</span><span style="color:#A6ACCD;">Close</span><span style="color:#89DDFF;">&lt;/</span><span style="color:#F07178;">button</span><span style="color:#89DDFF;">&gt;</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">end</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span>
<span class="line"><span style="color:#89DDFF;">&lt;%</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">end</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">%&gt;</span></span></code></pre></div><h2 id="slots" tabindex="-1">Slots <a class="header-anchor" href="#slots" aria-label="Permalink to &quot;Slots&quot;">​</a></h2><h3 id="with-trigger" tabindex="-1"><code>with_trigger</code> <a class="header-anchor" href="#with-trigger" aria-label="Permalink to &quot;\`with_trigger\`&quot;">​</a></h3><p>The button element that is responsible for showing or hiding the popover.</p><table><thead><tr><th>Name</th><th>Default</th><th>Description</th></tr></thead><tbody><tr><td><code>system_args</code></td><td><code>{}</code></td><td>HTML attributes that should be passed to the Rails&#39; <code>content_tag</code> method.</td></tr></tbody></table><h3 id="with-header" tabindex="-1"><code>with_header</code> <a class="header-anchor" href="#with-header" aria-label="Permalink to &quot;\`with_header\`&quot;">​</a></h3><p>The header of the popover. If you just want to change the title of the popover, pass the <code>title</code> argument to the component.</p><table><thead><tr><th>Name</th><th>Default</th><th>Description</th></tr></thead><tbody><tr><td><code>system_args</code></td><td><code>{}</code></td><td>HTML attributes that should be passed to the Rails&#39; <code>content_tag</code> method.</td></tr></tbody></table><h3 id="with-body" tabindex="-1"><code>with_body</code> <a class="header-anchor" href="#with-body" aria-label="Permalink to &quot;\`with_body\`&quot;">​</a></h3><p>The body of the popover.</p><table><thead><tr><th>Name</th><th>Default</th><th>Description</th></tr></thead><tbody><tr><td><code>system_args</code></td><td><code>{}</code></td><td>HTML attributes that should be passed to the Rails&#39; <code>content_tag</code> method.</td></tr></tbody></table><h2 id="imports" tabindex="-1">Imports <a class="header-anchor" href="#imports" aria-label="Permalink to &quot;Imports&quot;">​</a></h2><div class="vp-code-group"><div class="tabs"><input type="radio" name="group-Fs8tJ" id="tab-khg9izU" checked="checked"><label for="tab-khg9izU">js</label><input type="radio" name="group-Fs8tJ" id="tab-EyyqYPP"><label for="tab-EyyqYPP">scss</label></div><div class="blocks"><div class="language-js active"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#89DDFF;font-style:italic;">import</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">@ambiki/impulse-view-components/dist/elements/popover</span><span style="color:#89DDFF;">&#39;</span><span style="color:#89DDFF;">;</span></span></code></pre></div><div class="language-scss"><button title="Copy Code" class="copy"></button><span class="lang">scss</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#89DDFF;font-style:italic;">@import</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&#39;</span><span style="color:#C3E88D;">~@ambiki/impulse-view-components/dist/elements/popover</span><span style="color:#89DDFF;">&#39;</span><span style="color:#89DDFF;">;</span></span></code></pre></div></div></div><h2 id="js-api" tabindex="-1">JS API <a class="header-anchor" href="#js-api" aria-label="Permalink to &quot;JS API&quot;">​</a></h2><p><a href="./../js-api/popover.html">Read here</a>.</p>`,27),l=[n];function p(r,c,D,i,y,F){return a(),o("div",null,l)}const C=s(e,[["render",p]]);export{h as __pageData,C as default};
