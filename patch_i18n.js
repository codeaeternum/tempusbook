const fs = require('fs');
const path = require('path');

const dir = '/Users/galindoasc/Proyectos_Sincronizados/tempusapp/apps/web/src';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(dir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Remove `as any` from literal translations: t('foo' as any) -> t('foo')
    const literalRegex = /t\((['"`][a-zA-Z0-9_]+['"`])\s+as\s+any\)/g;
    if (literalRegex.test(content)) {
        content = content.replace(literalRegex, 't($1)');
        changed = true;
    }

    // Replace `as any` with `as TranslationKey` for dynamic keys: t(key as any) -> t(key as TranslationKey)
    const dynamicRegex = /t\(([^'"`\)]+?)\s+as\s+any\)/g;
    if (dynamicRegex.test(content)) {
        content = content.replace(dynamicRegex, 't($1 as TranslationKey)');
        changed = true;

        // Ensure import exists
        if (!content.includes('TranslationKey')) {
            // Find the last import and insert it there, or top of file.
            content = `import type { TranslationKey } from '@/lib/i18n';\n` + content;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', file);
    }
});
