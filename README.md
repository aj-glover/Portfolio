# AJ Glover Portfolio

A cinematic portfolio experience for AJ Glover, crafted as an immersive digital showcase for creative strategy, UX/UI design, photography, motion, and production work.

## Overview

This project is a dynamic, visually driven portfolio built to function as an interactive digital presence rather than a conventional static resume page. The experience combines layered storytelling, smooth motion, and 3D visual cues to highlight creative work in a way that feels expressive, modern, and brand-forward.

The project is structured as a static front-end site and is designed for straightforward deployment on platforms such as GitHub Pages, Netlify, or any other static hosting provider.

## What This Project Includes

- Immersive visual storytelling and cinematic layout
- Smooth scrolling and motion-based transitions
- Interactive 3D scene and visual exploration elements
- Portfolio presentation for creative and strategic work
- Modular structure for media, project assets, and supporting utilities

## Tech Stack

The application is built with a lightweight front-end stack, including:

- HTML for the page structure
- CSS for visual styling and layout
- JavaScript for app logic and interactivity
- Three.js for 3D rendering and scene composition
- Lenis for smooth scroll behavior
- Structured source organization under the src folder

## Project Structure

```text
Portfolio/
├── index.html                  # Main document shell and metadata
├── index.js                    # Application entry and runtime logic
├── index.css                   # Global styling and site visuals
├── src/                        # Core application source files
│   ├── assets/                 # Asset and motion-related helpers
│   ├── game/                   # Interactive scene and experience logic
│   └── utils/                  # Shared utility modules
├── models/                     # 3D models and supporting media assets
├── dist/                       # Bundled output if generated
├── audit-screenshots/          # QA or review screenshots
├── 3DGridContentPreview-main/  # Additional preview or support assets
├── Anthony_Glover_Marketing_Resume.pdf  # Resume asset
├── robots.txt                  # Crawl / indexing instructions
├── .gitignore                  # Git ignore rules
├── README.md                   # Project documentation
└── .nojekyll                   # Static hosting compatibility file
```

## Local Development

This project can be run locally as a static site without a full build pipeline.

From the project root, run:

```bash
cd Portfolio
python -m http.server 8000
```

Then open the site in your browser at:

```text
http://localhost:8000
```

If Python is not available, use any local static server of your choice.

## Deployment

This project is suitable for deployment on static hosts, including:

- GitHub Pages
- Netlify
- Vercel static hosting
- Any general-purpose static server

Before deploying, verify asset paths and public URLs are configured correctly for the target host environment.

## Notes

- The experience depends on the proper loading of media and 3D assets.
- Asset integrity and path configuration are important for smooth production deployment.
- Testing on multiple screen sizes and browsers is recommended before launch.

## License

This repository does not currently include a license file. If this project is intended for public reuse or distribution, add the appropriate license before publishing.

## Contact

For project inquiries, collaborations, or hiring-related conversations, use the contact details provided within the portfolio site itself.
