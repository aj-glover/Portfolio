const fs = require('fs');
let js = fs.readFileSync('src/js/grid.js', 'utf8');

// Fix: guard imgWrap/image animations in showContent() for pages without hero images
js = js.replace(
    `.to([item.preview.DOM.imgWrap, item.preview.DOM.image], {
            duration: 1.5,
            ease: 'expo.inOut',
            opacity: 1,
            y: '0%',
            rotationX: 0
        }, 'start+=0.5')
        .to(item.preview.DOM.imgWrap, {
            duration: 1.5,
            ease: 'expo.inOut',
            opacity: 1
        }, 'start+=0.5')`,
    `.add(() => {
            if (item.preview.DOM.imgWrap) {
                gsap.to(item.preview.DOM.imgWrap, {duration: 1.5, ease: 'expo.inOut', opacity: 1, y: '0%', rotationX: 0});
                gsap.to(item.preview.DOM.image, {duration: 1.5, ease: 'expo.inOut', opacity: 1, y: '0%', rotationX: 0});
            }
        }, 'start+=0.5')`
);

// Fix: guard imgWrap/image animations in hideContent() for pages without hero images
js = js.replace(
    `.to(item.preview.DOM.imgWrap, {
            duration: 1.5,
            ease: 'expo.inOut',
            y: '100%',
            rotationX: -20
        }, 'start')
        .to(item.preview.DOM.image, {
            duration: 1.5,
            ease: 'expo.inOut',
            y: '-100%'
        }, 'start')`,
    `.add(() => {
            if (item.preview.DOM.imgWrap) {
                gsap.to(item.preview.DOM.imgWrap, {duration: 1.5, ease: 'expo.inOut', y: '100%', rotationX: -20});
                gsap.to(item.preview.DOM.image, {duration: 1.5, ease: 'expo.inOut', y: '-100%'});
            }
        }, 'start')`
);

fs.writeFileSync('src/js/grid.js', js);
console.log('grid.js fixed — guards imgWrap animations');