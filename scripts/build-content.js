#!/usr/bin/env node
/*
 * Reads the Dragons & Distractions Jekyll site and emits JSON content
 * for The Mage's Rituals app. The site is the source of truth.
 *
 * Outputs:
 *   data/chooser.json   — the "Today" decision tree (struggle → monster)
 *   data/monsters.json  — bestiary entries (frontmatter only, body not needed at v1)
 *   data/spellbook.json — ritual oaths, steps, prompts extracted from each ritual page
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SITE = process.env.DD_SITE_PATH
    || path.resolve(__dirname, '..', '..', '..', '..', 'dragons-and-distractions-site');

const OUT_DIR = path.resolve(__dirname, '..', 'app', 'data');

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function readFile(p) {
    return fs.readFileSync(p, 'utf8');
}

function splitFrontmatter(source) {
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { frontmatter: {}, body: source };
    const frontmatter = yaml.load(match[1]) || {};
    return { frontmatter, body: match[2] };
}

function slugFromFilename(filename) {
    return path.basename(filename, path.extname(filename));
}

function buildChooser() {
    const file = path.join(SITE, '_data', 'chooser_paths.yml');
    const entries = yaml.load(readFile(file)) || [];
    return entries.map(entry => ({
        slug: entry.slug,
        struggle: entry.struggle,
        summary: entry.summary,
        monster: {
            name: entry.monster_name,
            slug: entry.slug
        },
        signs: entry.signs || [],
        ritual: {
            label: entry.ritual_label,
            slug: deriveSlugFromUrl(entry.ritual_url),
            summary: entry.ritual_summary
        }
    }));
}

function deriveSlugFromUrl(url) {
    if (!url) return null;
    // Match /spellbook/<slug> while excluding fragments, queries, and file
    // extensions. URLs that are fragment-only (e.g. "#dopamine-goblin-rituals")
    // intentionally return null — they point inside another page, not to a
    // spellbook entry.
    const match = url.match(/\/spellbook\/([^/.#?]+)/);
    return match ? match[1] : null;
}

function buildMonsters() {
    const dir = path.join(SITE, '_monsters');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    return files.map(file => {
        const { frontmatter } = splitFrontmatter(readFile(path.join(dir, file)));
        const slug = slugFromFilename(file);
        return {
            slug,
            name: frontmatter.name,
            emoji: frontmatter.emoji,
            tagline: frontmatter.tagline,
            plainName: frontmatter.plain_name,
            challenge: frontmatter.challenge_summary,
            accentColor: frontmatter.accent_color,
            youMightBeHereIf: frontmatter.you_might_be_here_if || [],
            startHereRitual: frontmatter.start_here_ritual
                ? {
                    label: frontmatter.start_here_ritual.label,
                    slug: deriveSlugFromUrl(frontmatter.start_here_ritual.url),
                    description: frontmatter.start_here_ritual.description
                }
                : null,
            supportBoundary: frontmatter.support_boundary,
            order: typeof frontmatter.order === 'number' ? frontmatter.order : 99
        };
    }).sort((a, b) => a.order - b.order);
}

// Spellbook bodies are HTML inside markdown. Extract the structured pieces
// we care about with focused regex against the field-guide layout.

function extractSection(body, heading) {
    const re = new RegExp(
        `<h2>${heading}</h2>\\s*([\\s\\S]*?)</section>`,
        'i'
    );
    const match = body.match(re);
    return match ? match[1] : null;
}

function extractParagraphs(html) {
    if (!html) return [];
    const out = [];
    const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        out.push(stripTags(m[1]).trim());
    }
    return out.filter(Boolean);
}

function extractListItems(html) {
    if (!html) return [];
    const out = [];
    const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        out.push(stripTags(m[1]).trim());
    }
    return out.filter(Boolean);
}

function extractCodeBlock(html) {
    if (!html) return null;
    const match = html.match(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/i);
    return match ? decodeEntities(match[1]).replace(/\r\n/g, '\n').trim() : null;
}

function stripTags(s) {
    let prev;
    let curr = s;
    do {
        prev = curr;
        curr = curr.replace(/<[^>]+>/g, '');
    } while (curr !== prev);
    return decodeEntities(curr);
}

function decodeEntities(s) {
    const map = {
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' ',
        '&amp;': '&'
    };
    return s.replace(/&(?:lt|gt|quot|#39|nbsp|amp);/g, m => map[m]);
}

function buildSpellbook() {
    const dir = path.join(SITE, 'spellbook');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'index.md');
    return files.map(file => {
        const { frontmatter, body } = splitFrontmatter(readFile(path.join(dir, file)));
        const slug = slugFromFilename(file);
        const oathHtml = extractSection(body, 'The oath');
        const howHtml = extractSection(body, 'How to use it');
        const whyHtml = extractSection(body, 'Why it helps');
        const promptHtml = extractSection(body, 'Minimal prompt');
        return {
            slug,
            title: frontmatter.title,
            description: frontmatter.description,
            heroIntro: frontmatter.hero_intro,
            oath: extractParagraphs(oathHtml),
            howToUse: extractListItems(howHtml),
            whyItHelps: extractListItems(whyHtml),
            minimalPrompt: extractCodeBlock(promptHtml)
        };
    });
}

function writeJson(name, data) {
    const file = path.join(OUT_DIR, name);
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    return file;
}

function htmlEscape(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderRitualBody(ritual) {
    if (!ritual) return '<p class="ritual-content__missing">Ritual content missing.</p>';
    const parts = [];
    if (ritual.heroIntro) {
        parts.push(`<p class="ritual-content__intro">${htmlEscape(ritual.heroIntro)}</p>`);
    }
    if (ritual.oath && ritual.oath.length) {
        parts.push('<h3>The oath</h3>');
        parts.push('<div class="ritual-content__oath">');
        for (const line of ritual.oath) parts.push(`<p>${htmlEscape(line)}</p>`);
        parts.push('</div>');
    }
    if (ritual.howToUse && ritual.howToUse.length) {
        parts.push('<h3>How to use it</h3>');
        parts.push('<ol>');
        for (const step of ritual.howToUse) parts.push(`<li>${htmlEscape(step)}</li>`);
        parts.push('</ol>');
    }
    if (ritual.minimalPrompt) {
        parts.push('<h3>Minimal prompt</h3>');
        parts.push(`<pre class="ritual-content__prompt">${htmlEscape(ritual.minimalPrompt)}</pre>`);
    }
    if (ritual.whyItHelps && ritual.whyItHelps.length) {
        parts.push('<h3>Why it helps</h3>');
        parts.push('<ul class="ritual-content__why">');
        for (const reason of ritual.whyItHelps) parts.push(`<li>${htmlEscape(reason)}</li>`);
        parts.push('</ul>');
    }
    return parts.join('\n');
}

function renderStaticToday(chooser, ritualsBySlug) {
    const cards = chooser.map(p => {
        const ritual = ritualsBySlug.get(p.ritual.slug);
        const body = renderRitualBody(ritual);
        return `
            <li>
                <details class="chooser__card">
                    <summary class="chooser__summary">
                        <p class="chooser__monster">${htmlEscape(p.monster.name)}</p>
                        <p class="chooser__struggle">${htmlEscape(p.struggle)}</p>
                        <span class="chooser__hint" aria-hidden="true">Tap to open the ritual</span>
                    </summary>
                    <div class="ritual-content">
${body}
                    </div>
                </details>
            </li>`;
    }).join('');
    return `
        <section class="today">
            <p class="today__lead">Which feeling matches right now?</p>
            <ul class="chooser">${cards}
            </ul>
            <p class="today__footnote">One match is enough. You can come back when the next beast shows up.</p>
        </section>`;
}

function injectIntoHtml(chooser, monsters, spellbook) {
    const htmlPath = path.resolve(__dirname, '..', 'app', 'index.html');
    if (!fs.existsSync(htmlPath)) return;
    let html = fs.readFileSync(htmlPath, 'utf8');

    function replaceJsonScript(id, data) {
        const re = new RegExp(
            `(<script id="${id}" type="application/json">)([\\s\\S]*?)(</script>)`
        );
        html = html.replace(re, `$1${JSON.stringify(data)}$3`);
    }

    replaceJsonScript('data-chooser', chooser);
    replaceJsonScript('data-monsters', monsters);
    replaceJsonScript('data-spellbook', spellbook);

    // Inject static Today view (works even if scripts are blocked)
    const ritualsBySlug = new Map(spellbook.map(r => [r.slug, r]));
    const staticToday = renderStaticToday(chooser, ritualsBySlug);
    const staticRe = /(<main id="view"[^>]*>)([\s\S]*?)(<\/main>)/;
    html = html.replace(staticRe, `$1${staticToday}$3`);

    fs.writeFileSync(htmlPath, html);
}

function main() {
    if (!fs.existsSync(SITE)) {
        console.error(`Site path not found: ${SITE}`);
        console.error('Set DD_SITE_PATH to the dragons-and-distractions-site directory.');
        process.exit(1);
    }
    ensureDir(OUT_DIR);

    const chooser = buildChooser();
    const monsters = buildMonsters();
    const spellbook = buildSpellbook();

    const manifest = {
        builtAt: new Date().toISOString(),
        source: SITE,
        counts: {
            chooser: chooser.length,
            monsters: monsters.length,
            spellbook: spellbook.length
        }
    };

    writeJson('chooser.json', chooser);
    writeJson('monsters.json', monsters);
    writeJson('spellbook.json', spellbook);
    writeJson('manifest.json', manifest);
    injectIntoHtml(chooser, monsters, spellbook);

    console.log(`Built content from ${SITE}`);
    console.log(`  chooser:   ${chooser.length} paths`);
    console.log(`  monsters:  ${monsters.length} entries`);
    console.log(`  spellbook: ${spellbook.length} rituals`);
    console.log('Injected into app/index.html');
}

main();
