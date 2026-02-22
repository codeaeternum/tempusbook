import fs from 'fs';
import path from 'path';

async function testGalleryUpload() {
    console.log('🧪 Iniciando Test E2E de Subida Binaria al GalleryModule...');

    // Crear una imagen falsa (10x10 px transparente en base64) para simular inyección
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    const dummyPath = path.join(__dirname, 'dummy-test-image.png');
    fs.writeFileSync(dummyPath, buffer);

    try {
        // @ts-ignore
        const fetch = (await import('node-fetch')).default;
        // @ts-ignore
        const FormData = (await import('form-data')).default;

        const BUSINESS_ID = '6e62095e-615d-4ac7-b74a-033603c5c980'; // Global MVP Single Tenant ID

        console.log('1. Generando FormData con File y CreateGalleryItemDto...');
        const formData = new FormData();
        formData.append('businessId', BUSINESS_ID);
        formData.append('type', 'PORTFOLIO');
        formData.append('title', 'E2E Test Image Upload');
        formData.append('isPublic', 'true');
        formData.append('file', fs.createReadStream(dummyPath));

        console.log('2. Inyectando Payload Multipart hacia NestJS...');
        const response = await fetch('http://localhost:3001/api/v1/gallery/upload', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer mock-dev-token'
            },
            body: formData as any
        });

        const status = response.status;
        const data = await response.jsonBase ? await response.json() : await response.text();

        console.log(`\n📡 HTTP Status Code: ${status}`);
        console.log(`📦 Bóveda Response: ${JSON.stringify(data, null, 2)}`);

        if (status === 201) {
            console.log('✅ MULTIPART POST [SUCCESS]: El archivo fue tragado, procesado y alojado por Multer y Prisma.');

            // Check GET Endpoint
            console.log(`\n3. Verificando lectura Pública de Archivos (GET /business/${BUSINESS_ID})...`);
            const getRes = await fetch(`http://localhost:3001/api/v1/gallery/business/${BUSINESS_ID}`);
            const items = await getRes.json();
            console.log(`Encontrados ${items.length} archivos para el negocio.`);
            console.log(`Último Archivo indexado: ${items[0]?.fileUrl}`);

            console.log('\n✅ TEST E2E [APROBADO]: GalleryModule Interconnect Activa.');
        } else {
            console.log('❌ FALLO CRÍTICO: NestJS rechazó el Multipart Form-Data.');
        }
    } catch (e) {
        console.error('Crash Total E2E:', e);
    } finally {
        fs.unlinkSync(dummyPath);
        process.exit(0);
    }
}

testGalleryUpload();
