const fs = require('fs');

let html = fs.readFileSync('src/index.html', 'utf8');

// Check if categories already exist
if (html.indexOf('id="preview-photo"') > -1) {
    console.log('Category pages already exist');
    process.exit(0);
}

// Find the preview div and preview-1
const previewIdx = html.indexOf('<div class="preview">');
const preview1Idx = html.indexOf('id="preview-1"');

if (previewIdx === -1 || preview1Idx === -1) {
    console.log('ERROR: Could not find preview div or preview-1');
    process.exit(1);
}

// Category pages HTML
const categories = `
				<div class="preview__item" id="preview-photo">
					<button class="preview__item-back unbutton"><span>Back</span></button>
					<h2 data-splitting class="preview__item-title">Photo</h2>
					<div class="preview__item-content">
						<div class="cs-hero"><p class="preview__item-description">Photography portfolio</p></div>
						<div class="cs-section"><h3>Gallery</h3><div class="preview__item-gallery-items" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));">
							<a href="#preview-1" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/1.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Mercury</p></a>
							<a href="#preview-4" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/4.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Mars</p></a>
							<a href="#preview-2" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/2.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Venus</p></a>
							<a href="#preview-3" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/3.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Earth</p></a>
							<a href="#preview-5" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/5.jpeg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Jupiter</p></a>
							<a href="#preview-6" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/6.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Saturn</p></a>
							<a href="#preview-8" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/8.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Neptune</p></a>
							<a href="#preview-9" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/9.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Pluto</p></a>
							<a href="#preview-10" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/10.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Sol</p></a>
							<a href="#preview-11" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/11.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Sirius</p></a>
							<a href="#preview-12" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/12.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Vega</p></a>
							<a href="#preview-13" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/13.jpg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Polaris</p></a>
							<a href="#preview-15" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/15.jpeg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Andromeda</p></a>
							<a href="#preview-16" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/16.jpeg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Nebula</p></a>
						</div></div>
					</div>
				</div>
				<div class="preview__item" id="preview-ux">
					<button class="preview__item-back unbutton"><span>Back</span></button>
					<h2 data-splitting class="preview__item-title">UX Design</h2>
					<div class="preview__item-content">
						<div class="cs-hero"><p class="preview__item-description">User experience design projects.</p></div>
						<div class="cs-section"><h3>Gallery</h3><div class="preview__item-gallery-items" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));">
							<a href="#preview-7" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/7.png);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">UX Design</p></a>
						</div></div>
					</div>
				</div>
				<div class="preview__item" id="preview-presentation">
					<button class="preview__item-back unbutton"><span>Back</span></button>
					<h2 data-splitting class="preview__item-title">Presentation</h2>
					<div class="preview__item-content">
						<div class="cs-hero"><p class="preview__item-description">Presentation and pitch deck design.</p></div>
						<div class="cs-section"><h3>Gallery</h3><div class="preview__item-gallery-items" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));">
							<a href="#preview-14" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/14.png);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Presentation Design</p></a>
						</div></div>
					</div>
				</div>
				<div class="preview__item" id="preview-contact">
					<button class="preview__item-back unbutton"><span>Back</span></button>
					<h2 data-splitting class="preview__item-title">Contact</h2>
					<div class="preview__item-content">
						<div class="cs-section"><h3>Get In Touch</h3><p>Let's work together.</p></div>
					</div>
				</div>
				<div class="preview__item" id="preview-about">
					<button class="preview__item-back unbutton"><span>Back</span></button>
					<h2 data-splitting class="preview__item-title">About</h2>
					<div class="preview__item-content">
						<div class="cs-section"><h3>About Me</h3><p>A multi-disciplinary designer and marketer.</p></div>
					</div>
				</div>
				<div class="preview__item" id="preview-video">
					<button class="preview__item-back unbutton"><span>Back</span></button>
					<h2 data-splitting class="preview__item-title">Video</h2>
					<div class="preview__item-content">
						<div class="cs-section"><h3>Video Portfolio</h3><p>Video production and YouTube channel management.</p></div>
					</div>
				</div>
				<div class="preview__item" id="preview-growth">
					<button class="preview__item-back unbutton"><span>Back</span></button>
					<h2 data-splitting class="preview__item-title">Growth</h2>
					<div class="preview__item-content">
						<div class="cs-hero"><p class="preview__item-description">Growth marketing and business case studies.</p></div>
						<div class="cs-section"><h3>Gallery</h3><div class="preview__item-gallery-items" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));">
							<a href="#preview-17" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/nawco-logo.png);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">Non Profit Case Study</p></a>
							<a href="#preview-18" style="display:block;text-decoration:none;"><div class="grid__item-img" style="background-image:url(img/thumbs/18.svg);background-size:contain;background-repeat:no-repeat;background-position:center;border-radius:50%;aspect-ratio:1;"></div><p style="text-align:center;color:#fff;font-size:0.75rem;margin-top:0.5rem;">WHALE Members YouTube</p></a>
						</div></div>
					</div>
				</div>
`;

// Insert categories right before preview-1
const beforePreview1 = html.substring(0, preview1Idx);
const afterPreview1 = html.substring(preview1Idx);
const newHtml = beforePreview1 + categories + afterPreview1;

fs.writeFileSync('src/index.html', newHtml);
console.log('Category pages added successfully');
console.log('Preview div count:', (newHtml.match(/class="preview"/g) || []).length);
console.log('Preview item count:', (newHtml.match(/class="preview__item"/g) || []).length);