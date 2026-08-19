/**
 * src/data/projectData.js - Central repository for all project information.
 * The renderer consumes this data; it contains no project-specific rendering logic.
 *
 * PORTFOLIO and CATEGORIES live here.
 * PROJECTS are split into individual files under src/data/projects/ and aggregated
 * by src/data/projects/index.js. To add a project, create a file in that folder
 * and register it in the index.
 */

import { PROJECTS } from './projects/index.js';

const BASE = import.meta.env.BASE_URL;

export const PORTFOLIO = {
    name: "AJ",
    tagline: "Creative Universe Portfolio",
    intro: "Explore my work across design, marketing, and technology — each project is a world floating in space.",
    hint: "Hover a project to preview it. Click to fly into its world.",
    categoriesLabel: "Worlds"
};

export const CATEGORIES = {
    "UX/UI": {
        id: "ux-ui",
        name: "UX/UI",
        color: 0x66ccff,
        glow: 0x3399ff,
        scale: 1.0,
        orbitRadius: 10,
        yOffset: 4,
        description: "User experience & interface design",
        planetModel: `${BASE}models/019fde95-ca3b-743f-bd61-a3377b36ec5f.glb`,
        projects: ["rhymebook-app", "fanrant", "shake-it", "woundx", "contact-sheet-pro", "stolen-car-assistance"]
    },
    "Video": {
        id: "video",
        name: "Video",
        color: 0xffcc66,
        glow: 0xffaa33,
        scale: 1.0,
        orbitRadius: 10,
        yOffset: -2.5,
        description: "Video production & motion graphics",
        planetModel: `${BASE}models/019fde7b-4d3f-70f4-b687-6ac367eaa9db.glb`,
        projects: [
            "freshstep-duct-cleaning",
            "nawco-heal-conference",
            "fresh-step-mold-remediation",
            "nareb-fair-housing",
            "my-hood-music-video",
            "stefisdope-errthing-lit",
            "community-development-pitch-deck",
            "cai-guo-qiang-nft",
            "pixel-art-tips"
        ]
    },
    "Growth": {
        id: "growth",
        name: "Growth",
        color: 0x66ff99,
        glow: 0x33cc66,
        scale: 1.0,
        orbitRadius: 10,
        yOffset: 3,
        description: "Growth marketing & digital strategy",
        planetModel: `${BASE}models/019fde7f-e903-73d5-97ff-ed94cdcacd2e.glb`,
        projects: ["healthcare-nonprofit", "whale-members-youtube", "freshstep-mold-carpet-cleaning", "marketing-intellect"]
    },
    "Photo": {
        id: "photo",
        name: "Photo",
        color: 0xff66cc,
        glow: 0xff3399,
        scale: 1.0,
        orbitRadius: 10,
        yOffset: -4,
        description: "Visual storytelling through the lens",
        planetModel: `${BASE}models/019fde80-3c0a-71e0-bf8e-ebe4141c9272.glb`,
        projects: [
            "uppercuts-editorial",
            "kelow-latesha-submerged",
            "wrapped-material-form",
            "rollout-street-style",
            "grace-in-ruins",
            "urban-frequency",
            "after-hours",
            "jen-bunny",
            "david-giampicollo",
            "product-photography"
        ]
    },
    "About": {
        id: "about",
        name: "About",
        isAbout: true,
        color: 0x9966ff,
        glow: 0x6633cc,
        scale: 1.0,
        orbitRadius: 10,
        yOffset: 1,
        description: "Personal portfolio & professional journey",
        planetModel: `${BASE}models/019fde80-6581-7e7e-879f-eee203bf0e65.glb`,
        projects: []
    }
};

export const WORLD_MARKERS = [];

export { PROJECTS };