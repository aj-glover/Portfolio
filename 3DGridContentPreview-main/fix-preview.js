const fs = require('fs');
let js = fs.readFileSync('src/js/preview.js', 'utf8');

// Fix: handle case where imgWrap doesn't exist (for detail pages without hero images)
js = js.replace(
    'this.DOM.imgWrap = this.DOM.el.querySelector(\'.preview__item-imgwrap\');\n        this.DOM.image = this.DOM.imgWrap.querySelector(\'.preview__item-img\');',
    'this.DOM.imgWrap = this.DOM.el.querySelector(\'.preview__item-imgwrap\');\n        this.DOM.image = this.DOM.imgWrap ? this.DOM.imgWrap.querySelector(\'.preview__item-img\') : null;'
);

// Fix: guard imgWrap animations
js = js.replace(
    'gsap.set(this.DOM.imgWrap, {y: \'100%\', rotationX: -20});\n        gsap.set(this.DOM.image, {y: \'-100%\'});',
    'if (this.DOM.imgWrap) {\n            gsap.set(this.DOM.imgWrap, {y: \'100%\', rotationX: -20});\n            gsap.set(this.DOM.image, {y: \'-100%\'});\n        }'
);

// Fix: guard gallery click handler (it updates hero image, skip if no hero image)
js = js.replace(
    'this.DOM.image.style.backgroundImage = `url(${src})`;',
    'if (this.DOM.image) {\n                    this.DOM.image.style.backgroundImage = `url(${src})`;\n                }'
);

fs.writeFileSync('src/js/preview.js', js);
console.log('preview.js fixed — handles pages without hero images');