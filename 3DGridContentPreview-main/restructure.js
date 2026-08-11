
// Replace all 18 grid items with 7 category items
const newGrid = '\t\t\t\t\t<a href="#preview-photo" class="grid__item pos-1" data-title="Photo"><div class="grid__item-img" style="background-image:url(img/thumbs/photo.png);"></div></a>\n\t\t\t\t\t<a href="#preview-ux" class="grid__item pos-2" data-title="UX Design"><div class="grid__item-img" style="background-image:url(img/thumbs/ux.png);"></div></a>\n\t\t\t\t\t<a href="#preview-presentation" class="grid__item pos-3" data-title="Presentation"><div class="grid__item-img" style="background-image:url(img/thumbs/presentation.png);"></div></a>\n\t\t\t\t\t<a href="#preview-contact" class="grid__item pos-4" data-title="Contact"><div class="grid__item-img" style="background-image:url(img/thumbs/contact.png);"></div></a>\n\t\t\t\t\t<a href="#preview-about" class="grid__item pos-5" data-title="About"><div class="grid__item-img" style="background-image:url(img/thumbs/about.png);"></div></a>\n\t\t\t\t\t<a href="#preview-video" class="grid__item pos-6" data-title="Video"><div class="grid__item-img" style="background-image:url(img/thumbs/video.png);"></div></a>\n\t\t\t\t\t<a href="#preview-growth" class="grid__item pos-7" data-title="Growth"><div class="grid__item-img" style="background-image:url(img/thumbs/growth.png);"></div></a>\n\t\t\t\t</div>';

html = html.replace(/<a href="#preview-1".*<\/div>\n\t\t\t\t<div class="preview">/s, newGrid + '\n\t\t\t\t<div class="preview">');

// Photo category sub-items (14 items)
const photoItems = [
'<a href="#preview-1" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/1.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Mercury</p></a>',
'<a href="#preview-4" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/4.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Mars</p></a>',
'<a href="#preview-2" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/2.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Venus</p></a>',
'<a href="#preview-3" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/3.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Earth</p></a>',
'<a href="#preview-5" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/5.jpeg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Jupiter</p></a>',
'<a href="#preview-6" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/6.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Saturn</p></a>',
'<a href="#preview-8" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/8.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Neptune</p></a>',
'<a href="#preview-9" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/9.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Pluto</p></a>',
'<a href="#preview-10" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/10.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Sol</p></a>',
'<a href="#preview-11" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/11.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Sirius</p></a>',
'<a href="#preview-12" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/12.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Vega</p></a>',
'<a href="#preview-13" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/13.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Polaris</p></a>',
'<a href="#preview-15" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/15.jpeg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Andromeda</p></a>',
'<a href="#preview-16" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/16.jpeg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Nebula</p></a>',
].join('\n\t\t\t\t\t\t\t\t\t');

// Growth category sub-items
const growthItems = [
'<a href="#preview-17" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/nawco-logo.png);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Non Profit Case Study</p></a>',
'<a href="#preview-18" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/18.svg);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">WHALE Members YouTube</p></a>',
].join('\n\t\t\t\t\t\t\t\t\t');

// UX item
const uxItem = '<a href="#preview-7" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/7.png);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">UX Design</p></a>';

// Presentation item
const presItem = '<a href="#preview-14" class="grid__item" style="grid-area:auto;display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/14.png);background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a1a2e;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Presentation Design</p></a>';

// Build category pages
const catPages = `
\t\t\t\t\t<div class="preview__item" id="preview-photo">
\t\t\t\t\t\t<button class="preview__item-back unbutton"><span>Back</span></button>
\t\t\t\t\t\t<h2 data-splitting class="preview__item-title">Photo</h2>
\t\t\t\t\t\t<div class="preview__item-content">
\t\t\t\t\t\t\t<div class="cs-hero"><p class="preview__item-description">Photography portfolio — creative and editorial work.</p></div>
\t\t\t\t\t\t\t<div class="cs-section"><h3>Gallery</h3><div class="preview__item-gallery-items" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));">
${photoItems}
\t\t\t\t\t\t\t</div></div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="preview__item" id="preview-ux">
\t\t\t\t\t\t<button class="preview__item-back unbutton"><span>Back</span></button>
\t\t\t\t\t\t<h2 data-splitting class="preview__item-title">UX Design</h2>
\t\t\t\t\t\t<div class="preview__item-content">
\t\t\t\t\t\t\t<div class="cs-hero"><p class="preview__item-description">User experience design projects.</p></div>
\t\t\t\t\t\t\t<div class="cs-section"><h3>Gallery</h3><div class="preview__item-gallery-items" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));">
${uxItem}
\t\t\t\t\t\t\t</div></div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="preview__item" id="preview-presentation">
\t\t\t\t\t\t<button class="preview__item-back unbutton"><span>Back</span></button>
\t\t\t\t\t\t<h2 data-splitting class="preview__item-title">Presentation</h2>
\t\t\t\t\t\t<div class="preview__item-content">
\t\t\t\t\t\t\t<div class="cs-hero"><p class="preview__item-description">Presentation and pitch deck design.</p></div>
\t\t\t\t\t\t\t<div class="cs-section"><h3>Gallery</h3><div class="preview__item-gallery-items" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));">
${presItem}
\t\t\t\t\t\t\t</div></div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="preview__item" id="preview-contact">
\t\t\t\t\t\t<button class="preview__item-back unbutton"><span>Back</span></button>
\t\t\t\t\t\t<h2 data-splitting class="preview__item-title">Contact</h2>
\t\t\t\t\t\t<div class="preview__item-content">
\t\t\t\t\t\t\t<div class="cs-section"><h3>Get In Touch</h3><p>Let's work together.</p></div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="preview__item" id="preview-about">
\t\t\t\t\t\t<button class="preview__item-back unbutton"><span>Back</span></button>
\t\t\t\t\t\t<h2 data-splitting class="preview__item-title">About</h2>
\t\t\t\t\t\t<div class="preview__item-content">
\t\t\t\t\t\t\t<div class="cs-section"><h3>About Me</h3><p>A multi-disciplinary designer and marketer passionate about building brands through strategic design and data-driven marketing.</p></div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="preview__item" id="preview-video">
\t\t\t\t\t\t<button class="preview__item-back unbutton"><span>Back</span></button>
\t\t\t\t\t\t<h2 data-splitting class="preview__item-title">Video</h2>
\t\t\t\t\t\t<div class="preview__item-content">
\t\t\t\t\t\t\t<div class="cs-section"><h3>Video Portfolio</h3><p>Video production and YouTube channel management.</p></div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="preview__item" id="preview-growth">
\t\t\t\t\t\t<button class="preview__item-back unbutton"><span>Back</span></button>
\t\t\t\t\t\t<h2 data-splitting class="preview__item-title">Growth</h2>
\t\t\t\t\t\t<div class="preview__item-content">
\t\t\t\t\t\t\t<div class="cs-hero"><p class="preview__item-description">Growth marketing and business case studies.</p></div>
\t\t\t\t\t\t\t<div class="cs-section"><h3>Gallery</h3><div class="preview__item-gallery-items" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));">
${growthItems}
\t\t\t\t\t\t\t</div></div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
`;

html = html.replace('<div class="preview__item" id="preview-1">', catPages + '\n\t\t\t\t\t<div class="preview__item" id="preview-1">');

fs.writeFileSync('src/index.html', html);
console.log('Site restructured: 7 categories with sub-items');