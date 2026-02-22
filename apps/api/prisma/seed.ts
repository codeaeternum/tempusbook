import { PrismaClient, UserRole, BusinessStatus, BusinessRole } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
    { slug: 'barbershop', name: 'Barberías', icon: '💈', description: 'Barberías y salones de corte', enabledModules: ['gallery', 'walk-in-queue', 'intake-forms'], sortOrder: 1 },
    { slug: 'beauty-salon', name: 'Salones de Belleza', icon: '💇‍♀️', description: 'Cortes, tintes y estilismo', enabledModules: ['gallery', 'intake-forms'], sortOrder: 2 },
    { slug: 'nails', name: 'Uñas y Manicura', icon: '💅', description: 'Salones de uñas', enabledModules: ['design-reference', 'gallery', 'intake-forms'], sortOrder: 3 },
    { slug: 'lashes-brows', name: 'Cejas y Pestañas', icon: '👁️', description: 'Microblading y extensiones', enabledModules: ['gallery', 'intake-forms'], sortOrder: 4 },
    { slug: 'makeup', name: 'Maquillistas', icon: '💄', description: 'Maquillaje profesional', enabledModules: ['gallery', 'intake-forms'], sortOrder: 5 },
    { slug: 'waxing', name: 'Depilación y Láser', icon: '✨', description: 'Centros de depilación', enabledModules: ['treatment-plans', 'intake-forms'], sortOrder: 6 },
    { slug: 'spa', name: 'Spas y Masajes', icon: '💆‍♀️', description: 'Spas y centros de bienestar', enabledModules: ['packages', 'gift-cards', 'intake-forms'], sortOrder: 7 },
    { slug: 'cosmetology', name: 'Cosmetología', icon: '🧖‍♀️', description: 'Tratamientos faciales y corporales', enabledModules: ['body-chart', 'treatment-plans', 'intake-forms'], sortOrder: 8 },

    { slug: 'medical', name: 'Clínicas y Médicos', icon: '🏥', description: 'Consultorios médicos y clínicas', enabledModules: ['prescriptions', 'lab-orders', 'medical-history', 'intake-forms'], sortOrder: 9 },
    { slug: 'dental', name: 'Dentistas', icon: '🦷', description: 'Consultorios dentales y ortodoncia', enabledModules: ['dental-charts', 'xray-orders', 'treatment-plans', 'intake-forms'], sortOrder: 10 },
    { slug: 'optometry', name: 'Ópticas', icon: '👓', description: 'Ópticas y optometristas', enabledModules: ['prescription-history', 'lens-orders', 'intake-forms'], sortOrder: 11 },
    { slug: 'podiatry', name: 'Podólogos', icon: '🦶', description: 'Clínicas podológicas', enabledModules: ['treatment-plans', 'medical-history', 'intake-forms'], sortOrder: 12 },
    { slug: 'psychology', name: 'Psicólogos', icon: '🧠', description: 'Psicólogos y terapeutas', enabledModules: ['session-notes', 'crisis-detection', 'intake-forms'], sortOrder: 13 },
    { slug: 'nutrition', name: 'Nutriólogos', icon: '🥗', description: 'Consultas nutricionales', enabledModules: ['body-measurements', 'diet-plans', 'intake-forms'], sortOrder: 14 },
    { slug: 'physiotherapy', name: 'Fisioterapia', icon: '🦴', description: 'Rehabilitación y fisioterapia', enabledModules: ['body-chart', 'treatment-plans', 'intake-forms'], sortOrder: 15 },
    { slug: 'chiropractic', name: 'Quiroprácticos', icon: '💆‍♂️', description: 'Quiroprácticos y masajes', enabledModules: ['treatment-plans', 'body-chart', 'intake-forms'], sortOrder: 16 },

    { slug: 'gym', name: 'Gimnasios', icon: '🏋️', description: 'Gimnasios y entrenamiento', enabledModules: ['group-classes', 'training-plans', 'progress-tracking', 'intake-forms'], sortOrder: 17 },
    { slug: 'yoga-pilates', name: 'Yoga y Pilates', icon: '🧘‍♀️', description: 'Studios de yoga y pilates', enabledModules: ['group-classes', 'intake-forms'], sortOrder: 18 },

    { slug: 'veterinary', name: 'Veterinarias', icon: '🐾', description: 'Veterinarias y clínicas de mascotas', enabledModules: ['pet-profiles', 'vaccine-history', 'intake-forms'], sortOrder: 19 },
    { slug: 'pet-grooming', name: 'Estéticas Caninas', icon: '✂️', description: 'Baño y corte para mascotas', enabledModules: ['pet-profiles', 'gallery', 'intake-forms'], sortOrder: 20 },

    { slug: 'legal', name: 'Abogados y Legal', icon: '⚖️', description: 'Despachos jurídicos', enabledModules: ['case-files', 'document-signing', 'intake-forms'], sortOrder: 21 },
    { slug: 'accounting', name: 'Contadores', icon: '📊', description: 'Despachos contables y fiscales', enabledModules: ['document-collection', 'intake-forms'], sortOrder: 22 },

    { slug: 'tattoo', name: 'Tatuajes y Piercings', icon: '🖋️', description: 'Estudios de tatuajes', enabledModules: ['consent-forms', 'gallery', 'aftercare-instructions', 'intake-forms'], sortOrder: 23 },
    { slug: 'tutoring', name: 'Tutorías', icon: '📚', description: 'Tutores y academias', enabledModules: ['subjects', 'group-classes', 'intake-forms'], sortOrder: 24 },

    { slug: 'mechanic', name: 'Taller Mecánico', icon: '🔧', description: 'Talleres mecánicos y refaccionarias', enabledModules: ['vehicle-profiles', 'inspections', 'intake-forms'], sortOrder: 25 },
    { slug: 'carwash', name: 'Autolavado', icon: '🚙', description: 'Autolavado y detailing', enabledModules: ['vehicle-profiles', 'packages', 'intake-forms'], sortOrder: 26 },
    { slug: 'electronics-repair', name: 'Reparación de Celulares', icon: '📱', description: 'Taller de reparación, computadoras e iPads', enabledModules: ['device-profiles', 'inspections', 'intake-forms'], sortOrder: 27 },

    { slug: 'party-rentals', name: 'Renta de Mobiliario', icon: '🎪', description: 'Renta para fiestas y eventos', enabledModules: ['inventory-tracking', 'delivery-routes', 'intake-forms'], sortOrder: 28 },
    { slug: 'apparel-rental', name: 'Renta de Vestidos', icon: '👗', description: 'Renta de vestidos y trajes', enabledModules: ['inventory-tracking', 'fitting-appointments', 'intake-forms'], sortOrder: 29 },

    { slug: 'general', name: 'General / Otros', icon: '📅', description: 'Cualquier otro tipo de negocio', enabledModules: ['intake-forms'], sortOrder: 30 },
];

async function main() {
    console.log('🌱 Seeding database...');

    // Seed categories
    for (const cat of CATEGORIES) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                icon: cat.icon,
                description: cat.description,
                enabledModules: cat.enabledModules,
                sortOrder: cat.sortOrder,
            },
            create: {
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
                description: cat.description,
                enabledModules: cat.enabledModules,
                sortOrder: cat.sortOrder,
            },
        });
        console.log(`  ✅ Category: ${cat.icon} ${cat.name}`);
    }

    console.log('\n👤 Seeding Mock Users and Businesses for Development...');
    const mockAccounts = CATEGORIES.map(cat => ({
        uid: `mock-${cat.slug}-id`,
        email: `${cat.slug}@dev.aeternasuite.com`,
        name: `Test ${cat.name}`,
        role: UserRole.BUSINESS_USER,
        businessRole: BusinessRole.OWNER,
        catSlug: cat.slug,
        businessName: `Aeterna ${cat.name}`
    }));

    mockAccounts.push({
        uid: 'mock-general-id',
        email: 'general@dev.aeternasuite.com',
        name: 'Administrador General',
        role: UserRole.BUSINESS_USER,
        businessRole: BusinessRole.OWNER,
        catSlug: 'retail',
        businessName: 'Aeterna Retail (Default)'
    });

    for (const acc of mockAccounts) {
        // Find or create category if it doesn't exist (like retail)
        let category = await prisma.category.findUnique({ where: { slug: acc.catSlug } });
        if (!category && acc.catSlug === 'retail') {
            category = await prisma.category.create({
                data: { slug: 'retail', name: 'Retail General', icon: '🛍️', sortOrder: 99, enabledModules: [] }
            });
        }

        const user = await prisma.user.upsert({
            where: { id: acc.uid },
            update: { email: acc.email, firstName: acc.name, role: acc.role },
            create: { id: acc.uid, firebaseUid: acc.uid, email: acc.email, firstName: acc.name, lastName: '', role: acc.role },
        });

        const slug = acc.businessName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');

        const business = await prisma.business.upsert({
            where: { slug },
            update: { name: acc.businessName },
            create: {
                name: acc.businessName,
                slug,
                categoryId: category!.id,
                status: BusinessStatus.ACTIVE,
            },
        });

        // Ensure user is member
        const member = await prisma.businessMember.findFirst({
            where: { userId: user.id, businessId: business.id }
        });

        if (!member) {
            await prisma.businessMember.create({
                data: {
                    userId: user.id,
                    businessId: business.id,
                    role: acc.businessRole,
                    isActive: true,
                }
            });
        }

        console.log(`  ✅ Dev Ecosystem Ready: ${acc.businessName} (${acc.email})`);
    }

    console.log('\n🎉 Seed completed!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
