import { createProject, ensureExample } from './projects.mjs';
const [slug, ...title] = process.argv.slice(2);
if (!slug) {
    console.error('Usage: npm run project -- <project-name> [Display name]');
    process.exit(1);
}
try {
    const p = slug === 'example' ? ensureExample() : createProject(slug, title.join(' ') || slug);
    console.log(`Project: ${p.root}\nDrop originals into ${p.raw}. Work with your AI assistant; preview with npm run dashboard.`);
}
catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
