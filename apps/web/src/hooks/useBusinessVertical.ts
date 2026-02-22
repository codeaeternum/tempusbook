import { useSettings } from '../providers/SettingsProvider';
import { useMemo } from 'react';

/**
 * Motor de Contexto Vertical
 * Evalúa el rubro actual del negocio y deriva booleanos estructurales.
 * Permite que componentes UI se adapten universalmente (e.g. ocultar EHR a barberías).
 */
export function useBusinessVertical() {
    const { settings } = useSettings();
    const rubro = settings?.businessRubro || 'barbershop';

    return useMemo(() => {
        // Categorías Maestras
        const isBeauty = ['barbershop', 'salon', 'spa', 'nails', 'tattoo'].includes(rubro);
        const isClinical = ['clinic', 'dental', 'veterinary', 'psychology', 'nutrition', 'medical_spa'].includes(rubro);
        const isAutomotive = ['mechanic', 'auto_repair', 'car_wash', 'detailing'].includes(rubro);
        const isTechRepair = ['tech_repair', 'electronics'].includes(rubro);
        const isFitness = ['gym', 'yoga', 'crossfit', 'martial_arts'].includes(rubro);
        const isRetail = ['retail', 'boutique', 'grocery'].includes(rubro);
        const isFood = ['restaurant', 'cafe', 'bar', 'food_truck'].includes(rubro);

        // Agrupaciones de Comportamiento UI
        const hasMedicalRecords = isClinical; // Requiere EHR completo (BodyChart, Odontograma)
        const hasVehicles = isAutomotive;
        const hasDevices = isTechRepair;
        const hasAppointments = !isRetail && !isFood; // Mayoría reserva, retail/comida usualmente no.

        // Nomenclatura específica
        const clientLabelStr = isClinical ? 'paciente' : isFitness ? 'miembro' : isFood ? 'comensal' : 'cliente';

        return {
            rubro,
            isBeauty,
            isClinical,
            isAutomotive,
            isTechRepair,
            isFitness,
            isRetail,
            isFood,

            // Flags de funcionalidad UI
            hasMedicalRecords,
            hasVehicles,
            hasDevices,
            hasAppointments,

            // Labels de contexto
            clientLabelStr
        };
    }, [rubro]);
}
