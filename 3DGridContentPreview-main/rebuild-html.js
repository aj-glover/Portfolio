const fs = require('fs');
const path = require('path');

// Read the base structure up to preview-17 closing
let html = fs.readFileSync('src/index.html', 'utf8');

// Strip from after preview-17 closing to end of file
// Find the last good closing: the preview-17 closing `</div></div></div>` before the corruption
// The file currently ends after line 578 which is the .preview closing
// We need to append preview-18 + closing tags

// Find the closing of the .preview div
const previewClose = '</div>\n\n\t\t<div class="cursor">';
const idx = html.indexOf('</div>\n\n\t\t<div class="cursor">');
if (idx > 0) {
    // Keep everything up to the .preview closing
    html = html.substring(0, idx);
} else {
    console.log('Could not find insertion point');
    process.exit(1);
}

// Append preview-18 detail page
const p18 = '\n\t\t\t\t<div class="preview__item" id="preview-18">\n' +
'\t\t\t\t\t<button class="preview__item-back unbutton"><span>Back</span></button>\n' +
'\t\t\t\t\t<h2 data-splitting class="preview__item-title">WHALE Members YouTube</h2>\n' +
'\t\t\t\t\t<div class="preview__item-content">\n' +
'\t\t\t\t\t\t<div class="cs-hero">\n' +
'\t\t\t\t\t\t\t<p class="preview__item-description">Launching & Scaling the WHALE Members YouTube Channel — A complete content operation for one of the early Web3 and NFT communities.</p>\n' +
'\t\t\t\t\t\t\t<div class="cs-kpi-grid">\n' +
'\t\t\t\t\t\t\t\t<div class="cs-kpi-card"><span class="cs-kpi-value">589</span><span class="cs-kpi-label">Videos Published</span></div>\n' +
'\t\t\t\t\t\t\t\t<div class="cs-kpi-card"><span class="cs-kpi-value">110K</span><span class="cs-kpi-label">Lifetime Views</span></div>\n' +
'\t\t\t\t\t\t\t\t<div class="cs-kpi-card"><span class="cs-kpi-value">2.6K</span><span class="cs-kpi-label">Subscribers</span></div>\n' +
'\t\t\t\t\t\t\t\t<div class="cs-kpi-card"><span class="cs-kpi-value">3 yrs</span><span class="cs-kpi-label">Duration</span></div>\n' +
'\t\t\t\t\t\t\t</div>\n' +
'\t\t\t\t\t\t</div>\n' +
'\t\t\t\t\t\t<div class="cs-section"><h3>Challenge</h3><p><strong>Client:</strong> WHALE Members — Web3 / NFTs / Digital Collectibles</p><p>In 2020, WHALE Members was expanding rapidly as interest in NFTs accelerated. The community lacked a dedicated video platform for long-form education, interviews, and market discussions.</p><p>The organization needed a scalable publishing process to launch a new channel, produce educational content consistently, and maintain professional quality.</p></div>\n' +
'\t\t\t\t\t\t<div class="cs-section"><h3>Objectives</h3><div class="cs-card-grid"><div class="cs-card"><strong>Launch</strong><br>Establish the channel from scratch</div><div class="cs-card"><strong>Educate</strong><br>Publish educational content on a consistent schedule</div><div class="cs-card"><strong>Optimize</strong><br>Improve discoverability through YouTube SEO</div><div class="cs-card"><strong>Grow</strong><br>Build a structured library of Web3 resources</div></div></div>\n' +
'\t\t\t\t\t\t<div class="cs-section"><h3>My Role</h3><div class="cs-card-grid"><div class="cs-card"><strong>Content Strategy</strong><br>Planned video releases, structured playlists, maintained publishing standards</div><div class="cs-card"><strong>Video Production</strong><br>Recorded interviews, edited long-form content, mixed audio, created graphics</div><div class="cs-card"><strong>Publishing & SEO</strong><br>Uploaded videos, wrote titles/descriptions, applied metadata and YouTube optimization</div><div class="cs-card"><strong>Content Operations</strong><br>Developed repeatable workflows, coordinated assets, managed schedules</div></div></div>\n' +
'\t\t\t\t\t\t<div class="cs-section"><h3>Workflow</h3><div class="cs-strategy-flow"><div class="cs-flow-step"><span class="cs-flow-num">1</span><strong>Content Planning</strong><br>Planned and organized video releases</div><div class="cs-flow-step"><span class="cs-flow-num">2</span><strong>Recording</strong><br>Recorded interviews and presentations</div><div class="cs-flow-step"><span class="cs-flow-num">3</span><strong>Video Editing</strong><br>Edited long-form educational content</div><div class="cs-flow-step"><span class="cs-flow-num">4</span><strong>Graphics & Audio</strong><br>Created visual elements and mixed audio</div><div class="cs-flow-step"><span class="cs-flow-num">5</span><strong>Quality Assurance</strong><br>Reviewed and approved final assets</div><div class="cs-flow-step"><span class="cs-flow-num">6</span><strong>Publishing</strong><br>Uploaded and scheduled videos</div><div class="cs-flow-step"><span class="cs-flow-num">7</span><strong>YouTube Optimization</strong><br>Applied metadata, tags, and playlists</div><div class="cs-flow-step"><span class="cs-flow-num">8</span><strong>Community Distribution</strong><br>Shared content across community channels</div></div></div>\n' +
'\t\t\t\t\t\t<div class="cs-section cs-results"><h3>Results</h3><div class="cs-results-grid"><div class="cs-result-card"><span class="cs-result-value">589</span><span class="cs-result-label">Videos Published</span></div><div class="cs-result-card"><span class="cs-result-value">110K+</span><span class="cs-result-label">Lifetime Views</span></div><div class="cs-result-card"><span class="cs-result-value">2.6K+</span><span class="cs-result-label">Subscribers</span></div><div class="cs-result-card"><span class="cs-result-value">2020-23</span><span class="cs-result-label">Active Duration</span></div></div></div>\n' +
'\t\t\t\t\t\t<div class="cs-section"><h3>Skills Demonstrated</h3><div class="cs-card-grid"><div class="cs-card"><strong>Content Marketing</strong><br>YouTube channel management, content strategy, community marketing</div><div class="cs-card"><strong>Production</strong><br>Video production, video editing, creative direction</div><div class="cs-card"><strong>Operations</strong><br>Content operations, workflow development, project coordination</div><div class="cs-card"><strong>Digital</strong><br>Digital publishing, YouTube SEO, brand management</div></div></div>\n' +
'\t\t\t\t\t\t<div class="cs-section"><h3>Tools</h3><div class="cs-card-grid"><div class="cs-card"><strong>Video</strong><br>Final Cut Pro, OBS Studio</div><div class="cs-card"><strong>Design</strong><br>Adobe Photoshop</div><div class="cs-card"><strong>Platform</strong><br>YouTube Studio, Google Workspace</div><div class="cs-card"><strong>Communication</strong><br>Discord, Zoom</div></div></div>\n' +
'\t\t\t\t\t\t<div class="cs-section"><h3>Lessons Learned</h3><div class="cs-card-grid"><div class="cs-card"><strong>Consistency</strong><br>Building a successful content platform requires more than editing videos — consistency and organization are just as important as creative execution</div><div class="cs-card"><strong>Adaptability</strong><br>Working in the rapidly evolving Web3 space required repeatable production systems that could adapt to changing topics</div><div class="cs-card"><strong>Systems Thinking</strong><br>Developing workflows allowed the team to focus on delivering value rather than reinventing processes</div></div></div>\n' +
'\t\t\t\t\t\t<div class="cs-section"><h3>Project Impact</h3><p>This project demonstrates the ability to build and manage a complete digital content operation — from launching a new channel to maintaining a structured publishing workflow over multiple years, with an emphasis on creating scalable systems that support long-term growth.</p></div>\n' +
'<!-- GALLERY:preview-18 -->\n<!-- /GALLERY:preview-18 -->\n' +
'\t\t\t\t\t</div>\n' +
'\t\t\t\t</div>\n' +
'\t\t\t</div>\n';

// Append closing tags
const closing = '\t\t</div>\n' +
'\t</main>\n' +
'\t<div class="lightbox" id="lightbox" onclick="this.classList.remove(\'open\')"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" id="lightbox-img" alt=""></div>\n' +
'\t\t<div class="cursor">\n' +
'\t\t\t<svg class="cursor__svg" width="80" height="80" viewBox="0 0 80 80">\n' +
'\t\t\t\t<circle vector-effect="non-scaling-stroke" class="cursor__svg-circle" cx="40" cy="40" r="20"/>\n' +
'\t\t\t</svg>\n' +
'\t\t\t<span class="cursor__text"></span>\n' +
'\t\t</div>\n' +
'\t\t<script type="module" src="js/index.js"></script>\n' +
'\t<script>document.addEventListener("click",function(e){if(e.target.matches(".preview__item-gallery-items img")){var lb=document.getElementById("lightbox");var lbImg=document.getElementById("lightbox-img");lbImg.src=e.target.src;lb.classList.add("open");}});</script>\n' +
'\t</body>\n' +
'</html>\n';

html += p18 + closing;
fs.writeFileSync('src/index.html', html);
console.log('HTML fully rebuilt with preview-18');