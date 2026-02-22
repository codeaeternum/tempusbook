const fs = require('fs');
const path = require('path');

const files = [
    'app/dashboard/team/page.tsx',
    'app/dashboard/inventory/page.tsx',
    'app/dashboard/payments/page.tsx',
    'app/dashboard/pos/page.tsx',
    'app/dashboard/reviews/page.tsx',
    'app/dashboard/reports/page.tsx',
    'app/dashboard/gallery/page.tsx',
    'app/dashboard/loyalty/page.tsx',
    'app/dashboard/mechanic/vehicles/page.tsx',
    'app/dashboard/mechanic/work-orders/page.tsx',
    'app/dashboard/mechanic/inspections/page.tsx',
    'app/dashboard/mechanic/quotes/page.tsx',
    'app/dashboard/repair/devices/page.tsx',
    'app/dashboard/repair/work-orders/page.tsx',
    'app/dashboard/forms/page.tsx',
    'app/dashboard/clients/[id]/medical-record/page.tsx',
    'app/dashboard/clients/[id]/gallery/page.tsx',
];

const srcDir = __dirname;

files.forEach(f => {
    const fullPath = path.join(srcDir, f);
    if (!fs.existsSync(fullPath)) { console.log('SKIP (not found): ' + f); return; }
    let content = fs.readFileSync(fullPath, 'utf8');

    // Step 1: Remove ROOT_BUSINESS_ID imports (various forms)
    content = content.replace(/import \{ ROOT_BUSINESS_ID as BUSINESS_ID \} from '@aeternasuite\/shared-constants';[^\n]*\n/g, '');
    content = content.replace(/import \{ ROOT_BUSINESS_ID \} from '@aeternasuite\/shared-constants';[^\n]*\n/g, '');

    // Step 2: If file imports fetchWithAuth but NOT useAuth, add useAuth
    if (content.includes("import { fetchWithAuth } from '@/providers/AuthProvider';")) {
        content = content.replace(
            "import { fetchWithAuth } from '@/providers/AuthProvider';",
            "import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';"
        );
    }
    // If file doesn't import from AuthProvider at all, add useAuth import
    if (!content.includes("from '@/providers/AuthProvider'")) {
        content = content.replace(
            "'use client';",
            "'use client';\nimport { useAuth } from '@/providers/AuthProvider';"
        );
    }

    // Step 3: Replace hardcoded localhost URLs with template literals
    content = content.replace(/http:\/\/localhost:3001/g, '${API_URL}');

    // Step 4: Add API_URL constant if not present and file uses it
    if (content.includes('${API_URL}') && !content.includes('const API_URL')) {
        // Find last import line
        const lines = content.split('\n');
        let lastImportLine = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ') || lines[i].startsWith("import {")) {
                lastImportLine = i;
            }
        }
        lines.splice(lastImportLine + 1, 0, "\nconst API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';");
        content = lines.join('\n');
    }

    // Step 5: Replace BUSINESS_ID with activeBusinessId (word-boundary)
    content = content.replace(/\bBUSINESS_ID\b/g, 'activeBusinessId');

    // Step 6: Replace ROOT_BUSINESS_ID with activeBusinessId
    content = content.replace(/\bROOT_BUSINESS_ID\b/g, 'activeBusinessId');

    // Step 7: Remove local hardcoded BUSINESS_ID const declarations
    content = content.replace(/const activeBusinessId = '[^']*';[^\n]*\n/g, '');
    content = content.replace(/const activeBusinessId = "[^"]*";[^\n]*\n/g, '');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('FIXED: ' + f);
});

console.log('\n=== ALL DONE ===');
