# Content Guide — Universe Portfolio

This guide explains how to add, edit, and organize content for the 3D Universe Portfolio website.

---

## Table of Contents

1. [How Content is Organized](#how-content-is-organized)
2. [Adding a New Project](#adding-a-new-project)
3. [Project Data Template](#project-data-template)
4. [Image Requirements](#image-requirements)
5. [Adding a New Category (World)](#adding-a-new-category-world)
6. [Editing Existing Content](#editing-existing-content)
7. [Removing a Project](#removing-a-project)

---

## How Content is Organized

```
src/
├── data/
│   ├── projectData.js          ← PORTFOLIO + CATEGORIES (site-level config)
│   └── projects/               ← One file per project
│       ├── index.js            ← Aggregates all projects (register new ones here)
│       ├── ux-design.js
│       ├── orion-presentation.js
│       └── ... (one file per project)
└── assets/
    └── projects/
        ├── ux-design/          ← Folder name MUST match project `id`
        │   ├── thumb.png       ← Card thumbnail (400×300px)
        │   ├── hero.png        ← Case-study hero (1600×900px)
        │   └── gallery/        ← Work sample images
        │       ├── 01-overview.jpg
        │       └── 02-detail.jpg
        ├── orion-presentation/
        └── ... (one folder per project)
```

**Key rule:** The project `id` in the data file must match the folder name in `src/assets/projects/`.

---

## Adding a New Project

Follow these 4 steps (or use the helper script below to automate steps 1-2):

### Quick Start — Helper Script

```bash
npm run new-project -- my-project "My Project Title" UX/UI
```

This creates the image folder structure and a pre-filled data file template automatically. Then complete steps 3-4 manually.

### Manual Steps

### Step 1 — Create the image folder

```
src/assets/projects/my-project/
├── thumb.png          (required for 3D card)
├── hero.png           (optional, shown in case study header)
└── gallery/           (optional, work samples)
    ├── 01-overview.jpg
    └── 02-detail.jpg
```

### Step 2 — Create the data file

Create `src/data/projects/my-project.js` using the template below.

### Step 3 — Register it in the index

Open `src/data/projects/index.js` and:

1. Add an import at the top: `import myProject from './my-project.js';`
2. Add it to the `PROJECTS` array.

### Step 4 — Add it to a category

Open `src/data/projectData.js` and add the project `id` to the `projects` array of the matching category in `CATEGORIES`.

---

## Project Data Template

```js
/**
 * src/data/projects/my-project.js
 * Project: My Project Title
 * Category: UX/UI
 */
export default {
    id: "my-project",                    // MUST match folder name in src/assets/projects/
    title: "My Project Title",
    category: "UX/UI",                   // MUST match a key in CATEGORIES
    featured: true,                      // true = highlighted in the universe
    thumbnail: "/src/assets/projects/my-project/thumb.png",
    hero: "/src/assets/projects/my-project/hero.png",
    description: "One-sentence overview shown on the 3D card.",
    role: ["UX Design", "UI Design"],    // Shown as chips
    tools: ["Figma", "Photoshop"],       // Shown as chips
    challenge: "The problem you solved.",
    solution: "How you approached it.",
    results: "Measurable outcomes.",
    gallery: [
        "/src/assets/projects/my-project/gallery/01-overview.jpg",
        "/src/assets/projects/my-project/gallery/02-detail.jpg"
    ],
    position: { x: 2, y: 1, z: -3 }      // 3D placement in the universe
};
```

### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `id` | ✅ | Unique lowercase-hyphenated ID. Must match folder name. |
| `title` | ✅ | Display title. |
| `category` | ✅ | Must match a key in `CATEGORIES` (e.g. `"UX/UI"`, `"Video"`). |
| `featured` | ❌ | `true` highlights the project in the universe. |
| `thumbnail` | ❌ | Path to card image. If `null`, a placeholder is generated. |
| `hero` | ❌ | Path to case-study hero image. If `null`, hero is hidden. |
| `description` | ✅ | Shown on the 3D card and as "Overview" in the case study. |
| `role` | ❌ | Array of role chips. |
| `tools` | ❌ | Array of tool chips. |
| `challenge` | ❌ | Problem statement. |
| `solution` | ❌ | Approach (rendered as "Approach" section). |
| `results` | ❌ | Outcomes. |
| `gallery` | ❌ | Array of image paths for the "Work" section. |
| `position` | ✅ | 3D coordinates `{ x, y, z }` in the universe. |
| `categoryWorld` | ❌ | Legacy field; can be omitted for new projects. |

---

## Image Requirements

| Image | Recommended Size | Format | Purpose |
|-------|-----------------|--------|---------|
| `thumb.png` | 400×300px | PNG/JPG | 3D card texture |
| `hero.png` | 1600×900px | PNG/JPG | Case-study header |
| Gallery images | 1200×800px | JPG | "Work" section grid |

**Naming rules:**
- Use lowercase, hyphenated names: `my-project`
- Gallery images: prefix with `01-`, `02-`, `03-` for ordering
- Keep `thumb.png` and `hero.png` names fixed

---

## Adding a New Category (World)

Open `src/data/projectData.js` and add a new entry to `CATEGORIES`:

```js
"Branding": {
    id: "branding",
    name: "Branding",
    color: 0xff9966,          // Accent color (hex)
    glow: 0xff6633,           // Glow color (hex)
    scale: 1.0,
    orbitRadius: 10,
    yOffset: 0,               // Vertical position in the universe
    description: "Brand identity & visual systems",
    planetModel: "/models/your-planet-model.glb",  // 3D planet model
    projects: ["brand-project-1", "brand-project-2"]
}
```

The UI picks up new categories automatically — no code changes needed.

---

## Editing Existing Content

1. **Project text** → Edit the corresponding file in `src/data/projects/`
2. **Project images** → Replace files in `src/assets/projects/<id>/`
3. **Category colors/descriptions** → Edit `CATEGORIES` in `src/data/projectData.js`
4. **Site name/tagline** → Edit `PORTFOLIO` in `src/data/projectData.js`

---

## Removing a Project

1. Delete the data file: `src/data/projects/<id>.js`
2. Remove its import and entry from `src/data/projects/index.js`
3. Remove its `id` from the category's `projects` array in `src/data/projectData.js`
4. (Optional) Delete the image folder: `src/assets/projects/<id>/`