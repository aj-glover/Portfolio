/**
 * src/data/projects/index.js - Aggregates all individual project data files.
 * Import this to get the full PROJECTS array.
 */

import healthcareNonprofit from './healthcare-nonprofit.js';
import whaleMembersYoutube from './whale-members-youtube.js';
import freshstepMoldCarpetCleaning from './freshstep-mold-carpet-cleaning.js';
import rhymebookApp from './rhymebook-app.js';
import fanrant from './fanrant.js';
import shakeIt from './shake-it.js';
import woundx from './woundx.js';
import contactSheetPro from './contact-sheet-pro.js';
import stolenCarAssistance from './stolen-car-assistance.js';
import uppercutsEditorial from './uppercuts-editorial.js';
import kelowLateshaSubmerged from './kelow-latesha-submerged.js';
import wrappedMaterialForm from './wrapped-material-form.js';
import rolloutStreetStyle from './rollout-street-style.js';
import graceInRuins from './grace-in-ruins.js';
import urbanFrequency from './urban-frequency.js';
import afterHours from './after-hours.js';
import jenBunny from './jen-bunny.js';
import davidGiampicollo from './david-giampicollo.js';
import productPhotography from './product-photography.js';
import marketingIntellect from './marketing-intellect.js';
import freshstepDuctCleaning from './freshstep-duct-cleaning.js';
import nawcoHealConference from './nawco-heal-conference.js';
import freshStepMoldRemediation from './fresh-step-mold-remediation.js';
import narebFairHousing from './nareb-fair-housing.js';
import myHoodMusicVideo from './my-hood-music-video.js';
import stefisdopeErrthingLit from './stefisdope-errthing-lit.js';
import communityDevelopmentPitchDeck from './community-development-pitch-deck.js';
import caiGuoQiangNft from './cai-guo-qiang-nft.js';
import pixelArtTips from './pixel-art-tips.js';

/**
 * The full list of projects, in display order.
 * Add new projects by creating a file in this folder and importing it here.
 */
const RAW_PROJECTS = [
    healthcareNonprofit,
    whaleMembersYoutube,
    freshstepMoldCarpetCleaning,
    rhymebookApp,
    fanrant,
    shakeIt,
    woundx,
    contactSheetPro,
    stolenCarAssistance,
    uppercutsEditorial,
    kelowLateshaSubmerged,
    wrappedMaterialForm,
    rolloutStreetStyle,
    graceInRuins,
    urbanFrequency,
    afterHours,
    jenBunny,
    davidGiampicollo,
    productPhotography,
    marketingIntellect,
    freshstepDuctCleaning,
    nawcoHealConference,
    freshStepMoldRemediation,
    narebFairHousing,
    myHoodMusicVideo,
    stefisdopeErrthingLit,
    communityDevelopmentPitchDeck,
    caiGuoQiangNft,
    pixelArtTips
];

// Project files reference local images as "/src/assets/projects/..." paths, which
// only resolve during `vite dev`. The images actually live in public/assets/projects
// (copied verbatim into dist/ at build time), so rewrite those references to respect
// the deployed base path (e.g. "/Portfolio/") instead of assuming the site is served
// from "/".
const SRC_ASSET_PREFIX = '/src/';
const BASE = import.meta.env.BASE_URL;

function resolveAssetPath(value) {
    if (typeof value !== 'string' || !value.startsWith(SRC_ASSET_PREFIX)) return value;
    return `${BASE}${value.slice(SRC_ASSET_PREFIX.length)}`;
}

// The files under public/assets/projects are camera originals (up to 6016x4016
// and 20MB each). scripts/optimize-images.mjs writes two web-sized derivatives
// next to every original; point the app at those instead.
//
//   .thumb.jpg (512px) - card textures, loaded eagerly at startup
//   .web.jpg  (1600px) - case-study hero and gallery images
//
// Remote thumbnails (YouTube) and images with no derivative are left as-is.
const LOCAL_IMAGE_RE = /\.(jpe?g|png)$/i;

/**
 * Rewrites a local project image to a generated derivative.
 * @param {*} value - Already base-resolved asset path.
 * @param {'.thumb.jpg'|'.web.jpg'} suffix - Which derivative to use.
 * @returns {*} The derivative path, or the input unchanged.
 */
function useDerivative(value, suffix) {
    if (typeof value !== 'string' || !LOCAL_IMAGE_RE.test(value)) return value;
    if (!value.includes('/assets/projects/')) return value;
    return value.replace(LOCAL_IMAGE_RE, suffix);
}

export const PROJECTS = RAW_PROJECTS.map(project => ({
    ...project,
    thumbnail: useDerivative(resolveAssetPath(project.thumbnail), '.thumb.jpg'),
    hero: useDerivative(resolveAssetPath(project.hero), '.web.jpg'),
    gallery: Array.isArray(project.gallery)
        ? project.gallery.map(v => useDerivative(resolveAssetPath(v), '.web.jpg'))
        : project.gallery
}));