/**
 * src/data/projects/stolen-car-assistance.js
 * Project: CarWatch — Community-Driven Vehicle Recovery Platform
 * Category: UX/UI
 */
export default {
    id: "stolen-car-assistance",
    title: "CarWatch — Community-Driven Vehicle Recovery Platform",
    category: "UX/UI",
    featured: true,
    thumbnail: null,
    hero: null,
    description: "CarWatch is a community-driven vehicle recovery platform with a straightforward, task-oriented interface. A dual-pathway model (Report a Sighting / Search a Vehicle) immediately establishes user intent, prioritizing clarity and action over complexity — supported by a transparent three-step workflow: Community Reports → Smart Matching → Results.",
    role: ["UX Strategy", "Interaction Design", "Product Design"],
    tools: ["Figma", "React + TypeScript", "shadcn/ui", "Tailwind CSS", "Map integration"],
    challenge: "The experience had friction points that undermined confidence and data quality: a search form presenting every field (plate, make, model, color, year) with equal priority risking abandonment; no guidance on what makes a good report photo; ambiguous location entry (address vs. map tap vs. coordinates); an opaque How-It-Works with no post-submission outcome; missing validation and error states; and accessibility gaps (color-only differentiation, no visible focus states, placeholder-based labels).",
    solution: "Built on CarWatch's strengths — clear dual-CTA information architecture, transparent three-step process, color-coded affordance (red for reporting/urgency, blue for search/trust), progressive disclosure in forms, safety-first public messaging, and a clean accessible form system — while recommending high-impact improvements: real-time validation with inline errors, a hero 'tap map to pinpoint' location flow with address fallback and current-location quick-pick, expanded How-It-Works explaining post-submission outcomes, and a WCAG 2.1 AA accessibility audit.",
    results: "A functional, ready-for-iteration vehicle-recovery platform whose dual-pathway model is well executed for the use case. High-priority recommendations (validation/error handling, location hierarchy, outcome clarity, accessibility compliance) will strengthen user trust and data quality; medium/low-priority items (photo guidance, field specificity with conditional logic, submission confirmation, success stories, empty states, match indicators) add confidence and polish.",
    gallery: [
        "/src/assets/projects/stolen-car-assistance/gallery/01-carwatch.png",
        "/src/assets/projects/stolen-car-assistance/gallery/02-carwatch.png",
        "/src/assets/projects/stolen-car-assistance/gallery/03-carwatch.png",
        "/src/assets/projects/stolen-car-assistance/gallery/04-carwatch.png"
    ],
    position: { x: 9, y: -1, z: 0 },
    categoryWorld: "UX/UI"
};