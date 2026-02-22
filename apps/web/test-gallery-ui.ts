import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function simulateFrontendUpload() {
    console.log('🧪 Iniciando Emulador Frontend de Inyección de Archivos (UI Upload Test)...');

    // Generar otra imagen falsa PNG
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    const dummyPath = path.join(__dirname, 'frontend-upload-test.png');
    fs.writeFileSync(dummyPath, buffer);

    try {
        // @ts-ignore
        const fetch = (await import('node-fetch')).default;
        // @ts-ignore
        const FormData = (await import('form-data')).default;

        const BUSINESS_ID = '6e62095e-615d-4ac7-b74a-033603c5c980'; // Global MVP Single Tenant ID

        const formData = new FormData();
        formData.append('businessId', BUSINESS_ID);
        formData.append('type', 'BEFORE_AFTER'); // Simulando Tratamiento Antes/Después
        formData.append('title', 'Limpieza Facial Profunda - Test UI');
        formData.append('isPublic', 'true');
        formData.append('file', fs.createReadStream(dummyPath));

        console.log('1. Lanzando multipart/form-data al Endpoint NestJS (Igual a como lo haría NextJS)...');
        const response = await fetch('http://localhost:3001/api/v1/gallery/upload', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer mock-dev-token',
                // NUNCA Setear 'Content-Type': 'multipart/form-data' manual, node-fetch & browser lo hacen solos añadiendo Boundary.
            },
            body: formData as any
        });

        const status = response.status;
        const data = await response.jsonBase ? await response.json() : await response.text();

        console.log(`\n📡 HTTP Status Code: ${status}`);

        if (status === 201) {
            console.log('✅ UI EMULATOR [SUCCESS]: El Endpoint Multiforme procesa la subida visual sin errores.');
            console.log('\n✅ FASE 12 [INTEGRACIÓN DE CARGA]: Verificada y Lista para Test de Navegador.');
        } else {
            console.log('❌ FALLO CRÍTICO: La API rechazó el Payload.', data);
        }
    } catch (e) {
        console.error('Crash Total UI Emulator:', e);
    } finally {
        fs.unlinkSync(dummyPath);
        process.exit(0);
    }
}

simulateFrontendUpload();
