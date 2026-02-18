import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
    { slug: 'medical', name: 'Médicos', icon: '🏥', description: 'Consultorios médicos y clínicas', enabledModules: ['prescriptions', 'lab-orders', 'medical-history', 'intake-forms'], sortOrder: 1 },
    { slug: 'dental', name: 'Dentistas', icon: '🦷', description: 'Consultorios dentales y ortodoncia', enabledModules: ['dental-charts', 'xray-orders', 'treatment-plans', 'intake-forms'], sortOrder: 2 },
    { slug: 'nails', name: 'Manicuristas', icon: '💅', description: 'Salones de uñas', enabledModules: ['design-reference', 'gallery', 'intake-forms'], sortOrder: 3 },
    { slug: 'barbershop', name: 'Barberías', icon: '💈', description: 'Barberías y salones de corte', enabledModules: ['gallery', 'walk-in-queue', 'intake-forms'], sortOrder: 4 },
    { slug: 'spa', name: 'Spas', icon: '💆', description: 'Spas y centros de bienestar', enabledModules: ['packages', 'gift-cards', 'intake-forms'], sortOrder: 5 },
    { slug: 'gym', name: 'Gimnasios', icon: '🏋️', description: 'Gimnasios y entrenadores personales', enabledModules: ['group-classes', 'training-plans', 'progress-tracking', 'intake-forms'], sortOrder: 6 },
    { slug: 'veterinary', name: 'Veterinarias', icon: '🐾', description: 'Veterinarias y estéticas caninas', enabledModules: ['pet-profiles', 'vaccine-history', 'intake-forms'], sortOrder: 7 },
    { slug: 'yoga', name: 'Yoga / Pilates', icon: '🧘', description: 'Studios de yoga, pilates y fitness', enabledModules: ['group-classes', 'intake-forms'], sortOrder: 8 },
    { slug: 'optometry', name: 'Ópticas', icon: '👁️', description: 'Ópticas y optometristas', enabledModules: ['prescription-history', 'lens-orders', 'intake-forms'], sortOrder: 9 },
    { slug: 'psychology', name: 'Psicólogos', icon: '🧠', description: 'Psicólogos y terapeutas', enabledModules: ['session-notes', 'crisis-detection', 'intake-forms'], sortOrder: 10 },
    { slug: 'home-services', name: 'Servicios a domicilio', icon: '🏠', description: 'Plomeros, electricistas y más', enabledModules: ['geolocation', 'photo-evidence', 'intake-forms'], sortOrder: 11 },
    { slug: 'chiropractic', name: 'Quiroprácticos', icon: '💆', description: 'Quiroprácticos y fisioterapeutas', enabledModules: ['treatment-plans', 'body-chart', 'intake-forms'], sortOrder: 12 },
    { slug: 'tutoring', name: 'Tutores', icon: '📚', description: 'Tutores y profesores particulares', enabledModules: ['subjects', 'group-classes', 'intake-forms'], sortOrder: 13 },
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
