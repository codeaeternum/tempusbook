'use client';
import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { useSettings } from '@/providers/SettingsProvider';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from './page.module.css';

const BUSINESS_ID = '00000000-0000-0000-0000-000000000000'; // Dev Default UUID

interface FormField { id: string; label: string; type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number' | 'signature' | 'rating'; required: boolean; options?: string; }
interface FormTemplate { id: string; name: string; description: string; fields: FormField[]; isActive: boolean; responses: number; createdAt: Date; category: string; }
type FieldForm = Omit<FormField, 'id'>;
type TemplateForm = { name: string; description: string; category: string; isActive: boolean };

const FT: Record<string, string> = { text: '📝 Texto', email: '✉️ Email', phone: '📱 Teléfono', textarea: '📄 Texto largo', select: '📋 Selección', checkbox: '☑️ Casilla', date: '📅 Fecha', number: '🔢 Número', signature: '✍️ Firma', rating: '⭐ Calificación' };

// ---- RUBRO-SPECIFIC FORM BANKS ----
const RUBRO_FORMS: Record<string, { categories: { key: string; label: string; icon: string }[]; forms: FormTemplate[] }> = {
    barbershop: {
        categories: [{ key: 'all', label: 'Todos', icon: '📋' }, { key: 'registro', label: 'Registro', icon: '📝' }, { key: 'salud', label: 'Salud', icon: '⚕️' }, { key: 'feedback', label: 'Feedback', icon: '⭐' }, { key: 'legal', label: 'Legal', icon: '📄' }, { key: 'rrhh', label: 'RRHH', icon: '🏢' }],
        forms: [
            {
                id: 'f1', name: 'Ficha de Nuevo Cliente', description: 'Datos de contacto, preferencias de corte y productos favoritos del cliente.', category: 'registro', isActive: true, responses: 87, createdAt: new Date(2025, 5, 1), fields: [
                    { id: 'ff1', label: 'Nombre Completo', type: 'text', required: true }, { id: 'ff2', label: 'Email', type: 'email', required: false }, { id: 'ff3', label: 'Teléfono / WhatsApp', type: 'phone', required: true }, { id: 'ff4', label: 'Fecha de Nacimiento', type: 'date', required: false }, { id: 'ff5', label: '¿Cómo nos conociste?', type: 'select', required: false, options: 'Redes sociales,Recomendación,Google,Pasaba por aquí,Otro' }, { id: 'ff6', label: 'Tipo de corte preferido', type: 'select', required: false, options: 'Clásico,Fade,Texturizado,Largo,Sin preferencia' }, { id: 'ff7', label: 'Observaciones', type: 'textarea', required: false }
                ]
            },
            {
                id: 'f2', name: 'Cuestionario de Alergias y Sensibilidad', description: 'Antes de aplicar tintes, keratina o tratamientos químicos. Obligatorio.', category: 'salud', isActive: true, responses: 63, createdAt: new Date(2025, 4, 1), fields: [
                    { id: 'ff8', label: 'Nombre del cliente', type: 'text', required: true }, { id: 'ff9', label: '¿Alergia a tintes o químicos?', type: 'select', required: true, options: 'No,Sí (leve),Sí (severa),No sé' }, { id: 'ff10', label: '¿Alergias conocidas?', type: 'textarea', required: true }, { id: 'ff11', label: '¿Toma medicamentos?', type: 'textarea', required: false }, { id: 'ff12', label: '¿Condiciones en el cuero cabelludo?', type: 'select', required: true, options: 'Ninguna,Dermatitis,Psoriasis,Caspa severa,Otro' }, { id: 'ff13', label: 'Contacto de emergencia', type: 'text', required: true }, { id: 'ff14', label: 'Teléfono emergencia', type: 'phone', required: true }
                ]
            },
            {
                id: 'f3', name: 'Consentimiento de Coloración/Keratina', description: 'El cliente acepta los riesgos del tratamiento químico capilar y firma.', category: 'salud', isActive: true, responses: 35, createdAt: new Date(2025, 8, 1), fields: [
                    { id: 'ff15', label: 'Nombre completo', type: 'text', required: true }, { id: 'ff16', label: 'Tratamiento a realizar', type: 'select', required: true, options: 'Coloración completa,Mechas/Balayage,Decoloración,Keratina,Alisado permanente' }, { id: 'ff17', label: '¿Prueba de alergia realizada?', type: 'checkbox', required: true }, { id: 'ff18', label: 'Riesgos explicados y comprendidos', type: 'checkbox', required: true }, { id: 'ff19', label: 'Fecha', type: 'date', required: true }, { id: 'ff20', label: 'Firma del cliente', type: 'signature', required: true }
                ]
            },
            {
                id: 'f4', name: 'Encuesta Post-Servicio', description: 'Evalúa la experiencia del cliente después de su corte o servicio.', category: 'feedback', isActive: true, responses: 156, createdAt: new Date(2025, 6, 15), fields: [
                    { id: 'ff21', label: 'Calificación general', type: 'rating', required: true }, { id: 'ff22', label: '¿Cómo calificas el resultado?', type: 'select', required: true, options: 'Excelente,Bueno,Regular,Malo' }, { id: 'ff23', label: '¿El barbero te escuchó?', type: 'select', required: true, options: 'Totalmente,Parcialmente,No' }, { id: 'ff24', label: '¿Nos recomendarías? (0-10)', type: 'number', required: true }, { id: 'ff25', label: '¿Qué podríamos mejorar?', type: 'textarea', required: false }, { id: 'ff26', label: 'Comentarios adicionales', type: 'textarea', required: false }
                ]
            },
            {
                id: 'f5', name: 'Autorización de Imagen', description: 'El cliente autoriza usar fotos del resultado para redes sociales y portafolio.', category: 'legal', isActive: true, responses: 44, createdAt: new Date(2025, 3, 1), fields: [
                    { id: 'ff27', label: 'Nombre completo', type: 'text', required: true }, { id: 'ff28', label: 'Uso autorizado', type: 'select', required: true, options: 'Redes sociales,Portfolio,Publicidad,Todos' }, { id: 'ff29', label: 'Duración', type: 'select', required: true, options: 'Indefinida,1 año,Solo esta vez' }, { id: 'ff30', label: 'Acepto los términos', type: 'checkbox', required: true }, { id: 'ff31', label: 'Firma', type: 'signature', required: true }
                ]
            },
            {
                id: 'f6', name: 'Solicitud de Empleo — Barbero', description: 'Para candidatos que quieren unirse al equipo. Experiencia, habilidades y portfolio.', category: 'rrhh', isActive: true, responses: 12, createdAt: new Date(2025, 10, 1), fields: [
                    { id: 'ff32', label: 'Nombre completo', type: 'text', required: true }, { id: 'ff33', label: 'Teléfono', type: 'phone', required: true }, { id: 'ff34', label: 'Años de experiencia', type: 'number', required: true }, { id: 'ff35', label: 'Especialidades', type: 'select', required: true, options: 'Cortes clásicos,Fades,Diseños,Coloración,Barba,Todo' }, { id: 'ff36', label: '¿Tienes certificaciones?', type: 'textarea', required: false }, { id: 'ff37', label: 'Disponibilidad', type: 'select', required: true, options: 'Tiempo completo,Medio tiempo,Freelance' }, { id: 'ff38', label: 'Link a portfolio/Instagram', type: 'text', required: false }
                ]
            },
            {
                id: 'f7', name: 'Solicitud de Cita Online', description: 'Formulario público para que nuevos clientes agenden su primera cita desde la web.', category: 'registro', isActive: true, responses: 31, createdAt: new Date(2025, 8, 20), fields: [
                    { id: 'ff39', label: 'Nombre', type: 'text', required: true }, { id: 'ff40', label: 'Teléfono / WhatsApp', type: 'phone', required: true }, { id: 'ff41', label: 'Servicio deseado', type: 'select', required: true, options: 'Corte,Barba,Corte + Barba,Coloración,Keratina,Otro' }, { id: 'ff42', label: 'Barbero preferido', type: 'select', required: false, options: 'Sin preferencia,Carlos,Ana,Miguel,Laura' }, { id: 'ff43', label: 'Fecha preferida', type: 'date', required: false }, { id: 'ff44', label: 'Horario', type: 'select', required: false, options: 'Mañana (9-12),Tarde (12-17),Noche (17-21),Flexible' }, { id: 'ff45', label: 'Notas', type: 'textarea', required: false }
                ]
            },
            {
                id: 'f8', name: 'Quejas y Sugerencias', description: 'Canal formal para recibir feedback negativo o ideas de mejora.', category: 'feedback', isActive: true, responses: 8, createdAt: new Date(2025, 11, 1), fields: [
                    { id: 'ff46', label: 'Nombre (opcional)', type: 'text', required: false }, { id: 'ff47', label: 'Email', type: 'email', required: true }, { id: 'ff48', label: 'Tipo', type: 'select', required: true, options: 'Queja,Sugerencia,Felicitación' }, { id: 'ff49', label: 'Descripción', type: 'textarea', required: true }, { id: 'ff50', label: '¿Qué resolución espera?', type: 'textarea', required: false }
                ]
            },
        ],
    },
    // Fallback for rubros not yet defined
    _default: {
        categories: [{ key: 'all', label: 'Todos', icon: '📋' }, { key: 'registro', label: 'Registro', icon: '📝' }, { key: 'feedback', label: 'Feedback', icon: '⭐' }, { key: 'legal', label: 'Legal', icon: '📄' }, { key: 'rrhh', label: 'RRHH', icon: '🏢' }],
        forms: [
            {
                id: 'fd1', name: 'Ficha de Nuevo Cliente', description: 'Registro general de clientes con datos de contacto y preferencias.', category: 'registro', isActive: true, responses: 45, createdAt: new Date(2025, 5, 1), fields: [
                    { id: 'ffd1', label: 'Nombre Completo', type: 'text', required: true }, { id: 'ffd2', label: 'Email', type: 'email', required: true }, { id: 'ffd3', label: 'Teléfono', type: 'phone', required: true }, { id: 'ffd4', label: 'Fecha de Nacimiento', type: 'date', required: false }, { id: 'ffd5', label: '¿Cómo nos conociste?', type: 'select', required: false, options: 'Redes sociales,Recomendación,Google,Otro' }, { id: 'ffd6', label: 'Observaciones', type: 'textarea', required: false }
                ]
            },
            {
                id: 'fd2', name: 'Encuesta de Satisfacción', description: 'Post-servicio: evalúa la experiencia del cliente.', category: 'feedback', isActive: true, responses: 72, createdAt: new Date(2025, 7, 1), fields: [
                    { id: 'ffd7', label: 'Calificación general', type: 'rating', required: true }, { id: 'ffd8', label: '¿Cumplió expectativas?', type: 'select', required: true, options: 'Superó,Sí,Parcialmente,No' }, { id: 'ffd9', label: '¿Nos recomendarías? (0-10)', type: 'number', required: true }, { id: 'ffd10', label: 'Comentarios', type: 'textarea', required: false }
                ]
            },
            {
                id: 'fd3', name: 'Autorización de Imagen', description: 'Para usar fotos/videos del cliente en marketing.', category: 'legal', isActive: true, responses: 20, createdAt: new Date(2025, 4, 1), fields: [
                    { id: 'ffd11', label: 'Nombre', type: 'text', required: true }, { id: 'ffd12', label: 'Uso autorizado', type: 'select', required: true, options: 'Redes sociales,Portfolio,Publicidad,Todos' }, { id: 'ffd13', label: 'Acepto términos', type: 'checkbox', required: true }, { id: 'ffd14', label: 'Firma', type: 'signature', required: true }
                ]
            },
            {
                id: 'fd4', name: 'Solicitud de Empleo', description: 'Para candidatos interesados en trabajar con nosotros.', category: 'rrhh', isActive: true, responses: 10, createdAt: new Date(2025, 9, 1), fields: [
                    { id: 'ffd15', label: 'Nombre', type: 'text', required: true }, { id: 'ffd16', label: 'Email', type: 'email', required: true }, { id: 'ffd17', label: 'Teléfono', type: 'phone', required: true }, { id: 'ffd18', label: 'Experiencia (años)', type: 'number', required: true }, { id: 'ffd19', label: 'Disponibilidad', type: 'select', required: true, options: 'Tiempo completo,Medio tiempo,Freelance' }, { id: 'ffd20', label: 'Habilidades', type: 'textarea', required: true }
                ]
            },
        ],
    },
};

const RUBRO_LABELS: Record<string, string> = { barbershop: 'Barbería', medical: 'Clínica Médica', dental: 'Consultorio Dental', spa: 'Spa', salon: 'Salón de Belleza', gym: 'Gimnasio', pet_grooming: 'Estética de Mascotas', nail: 'Uñas', food: 'Gastronomía', clothing: 'Ropa', tutoring: 'Tutorías' };
const EMPTY_TEMPLATE: TemplateForm = { name: '', description: '', category: 'registro', isActive: true };
const EMPTY_FIELD: FieldForm = { label: '', type: 'text', required: false };

export default function FormsPage() {
    const { t } = useLocale();
    const { settings } = useSettings();
    const rubroKey = settings.businessRubro || 'barbershop';
    const rubroData = RUBRO_FORMS[rubroKey] || RUBRO_FORMS._default;
    const rubroLabel = RUBRO_LABELS[rubroKey] || rubroKey;

    const [forms, setForms] = useState<FormTemplate[]>([]);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [filterCat, setFilterCat] = useState('all');
    const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [templateForm, setTemplateForm] = useState<TemplateForm>(EMPTY_TEMPLATE);
    const [fields, setFields] = useState<FormField[]>([]);
    const [fieldModal, setFieldModal] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [fieldForm, setFieldForm] = useState<FieldForm>(EMPTY_FIELD);
    const [toast, setToast] = useState<string | null>(null);
    const [confirmDeleteField, setConfirmDeleteField] = useState<FormField | null>(null);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    // --- Backend Sync ---
    const loadForms = async () => {
        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/forms?businessId=${BUSINESS_ID}`);
            if (res.ok) {
                const data = await res.json();
                setForms(data.map((item: any) => ({
                    ...item,
                    createdAt: new Date(item.createdAt)
                })));
            }
        } catch (e) { console.error('Error fetching forms', e); }
    };

    useEffect(() => { loadForms(); }, []);

    const filtered = useMemo(() => forms.filter(f => {
        const ms = f.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || (f.description || '').toLowerCase().includes(debouncedSearch.toLowerCase());
        const mc = filterCat === 'all' || f.category === filterCat;
        return ms && mc;
    }), [forms, debouncedSearch, filterCat]);

    const stats = useMemo(() => ({ total: forms.length, active: forms.filter(f => f.isActive).length, responses: forms.reduce((s, f) => s + f.responses, 0), fields: forms.reduce((s, f) => s + f.fields.length, 0) }), [forms]);

    const openCreate = () => { setEditingId(null); setTemplateForm(EMPTY_TEMPLATE); setFields([]); setModalOpen(true); };
    const openEdit = (form: FormTemplate) => { setEditingId(form.id); setTemplateForm({ name: form.name, description: form.description, category: form.category, isActive: form.isActive }); setFields([...form.fields]); setSelectedForm(null); setModalOpen(true); };

    // --- Mutations ---
    const saveTemplate = async () => {
        if (!templateForm.name) return;

        const payload = { ...templateForm, businessId: BUSINESS_ID, fields };

        try {
            let res;
            if (editingId) {
                res = await fetchWithAuth(`http://localhost:3001/api/v1/forms/${editingId}?businessId=${BUSINESS_ID}`, { method: 'PATCH', body: JSON.stringify(payload) });
                if (res.ok) showToast('Formulario actualizado');
            } else {
                res = await fetchWithAuth(`http://localhost:3001/api/v1/forms`, { method: 'POST', body: JSON.stringify(payload) });
                if (res.ok) showToast('Formulario creado');
            }
            if (res?.ok) { setModalOpen(false); loadForms(); }
        } catch (e) {
            console.error('Save failed', e);
        }
    };

    const deleteForm = async (id: string) => {
        if (confirm('¿Eliminar formulario de forma permanente?')) {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/forms/${id}?businessId=${BUSINESS_ID}`, { method: 'DELETE' });
            if (res.ok) {
                setSelectedForm(null);
                showToast('Formulario eliminado');
                loadForms();
            }
        }
    };

    const toggleForm = async (id: string, currentState: boolean) => {
        const res = await fetchWithAuth(`http://localhost:3001/api/v1/forms/${id}?businessId=${BUSINESS_ID}`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive: !currentState })
        });
        if (res.ok) {
            showToast('Estado actualizado');
            if (selectedForm?.id === id) setSelectedForm(p => p ? { ...p, isActive: !p.isActive } : null);
            loadForms();
        }
    };

    const duplicateForm = async (form: FormTemplate) => {
        const payload = { businessId: BUSINESS_ID, name: `${form.name} (Copia)`, description: form.description, category: form.category, isActive: form.isActive, fields: form.fields };
        const res = await fetchWithAuth(`http://localhost:3001/api/v1/forms`, { method: 'POST', body: JSON.stringify(payload) });
        if (res.ok) {
            setSelectedForm(null);
            showToast('Formulario duplicado');
            loadForms();
        }
    };

    const openAddField = () => { setEditingFieldId(null); setFieldForm(EMPTY_FIELD); setFieldModal(true); };
    const openEditField = (field: FormField) => { setEditingFieldId(field.id); setFieldForm({ label: field.label, type: field.type, required: field.required, options: field.options }); setFieldModal(true); };
    const saveField = () => { if (!fieldForm.label) return; if (editingFieldId) { setFields(p => p.map(f => f.id === editingFieldId ? { ...f, ...fieldForm } : f)); } else { setFields(p => [...p, { id: `ff${Date.now()}`, ...fieldForm }]); } setFieldModal(false); };
    const removeField = (id: string) => { setFields(p => p.filter(f => f.id !== id)); };

    return (
        <>
            <Header title={t('intake_forms')} subtitle={`Formularios personalizados para ${rubroLabel}`} />
            <div className={styles.content}>
                <div className={styles.rubroBanner}><span className={styles.rubroIcon}>📋</span> Formularios diseñados para <strong>{rubroLabel}</strong> — <span className={styles.rubroHint}>Cambia el rubro en Configuración</span></div>
                <div className={styles.statsRow}>
                    <div className={styles.stat}><span className={styles.statIcon}>📋</span><div><span className={styles.statValue}>{stats.total}</span><span className={styles.statLabel}>Formularios</span></div></div>
                    <div className={styles.stat}><span className={styles.statIcon}>✅</span><div><span className={styles.statValue}>{stats.active}</span><span className={styles.statLabel}>Activos</span></div></div>
                    <div className={styles.stat}><span className={styles.statIcon}>📝</span><div><span className={styles.statValue}>{stats.responses}</span><span className={styles.statLabel}>Respuestas</span></div></div>
                    <div className={styles.stat}><span className={styles.statIcon}>🔧</span><div><span className={styles.statValue}>{stats.fields}</span><span className={styles.statLabel}>Campos</span></div></div>
                </div>
                <div className={styles.catFilters}>
                    {rubroData.categories.map(cat => (<button key={cat.key} className={`${styles.catBtn} ${filterCat === cat.key ? styles.catActive : ''}`} onClick={() => setFilterCat(cat.key)}><span>{cat.icon}</span> {cat.label}</button>))}
                </div>
                <div className={styles.toolbar}>
                    <div className={styles.searchGroup}><span className={styles.sIcon}>🔍</span><input className={styles.searchInput} type="text" placeholder="Buscar formulario..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <button className={styles.addBtn} onClick={openCreate}>+</button>
                </div>
                <div className={styles.grid}>
                    {filtered.map(form => (
                        <div key={form.id} className={`${styles.card} ${!form.isActive ? styles.cardInactive : ''}`} onClick={() => setSelectedForm(form)}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardCat}>{rubroData.categories.find(c => c.key === form.category)?.icon} {rubroData.categories.find(c => c.key === form.category)?.label}</span>
                                <span className={form.isActive ? styles.statusActive : styles.statusInactive}>{form.isActive ? '● Activo' : '○ Inactivo'}</span>
                            </div>
                            <h3 className={styles.cardTitle}>{form.name}</h3>
                            <p className={styles.cardDesc}>{form.description}</p>
                            <div className={styles.cardFooter}><span>📋 {form.fields.length} campos</span><span>📝 {form.responses} resp.</span><span>📅 {form.createdAt.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}</span></div>
                        </div>
                    ))}
                </div>
            </div>
            {selectedForm && (<><div className={styles.overlay} onClick={() => setSelectedForm(null)} /><div className={styles.panel}>
                <div className={styles.panelHeader}><h3>{selectedForm.name}</h3><button className={styles.panelClose} onClick={() => setSelectedForm(null)}>✕</button></div>
                <p className={styles.panelDesc}>{selectedForm.description}</p>
                <div className={styles.panelMeta}><span>{rubroData.categories.find(c => c.key === selectedForm.category)?.icon} {rubroData.categories.find(c => c.key === selectedForm.category)?.label}</span> · <span>{selectedForm.fields.length} campos</span> · <span>{selectedForm.responses} respuestas</span></div>
                <div className={styles.panelActions}>
                    <button className={styles.editBtn} onClick={() => openEdit(selectedForm)}>✏️ Editar</button>
                    <button className={styles.toggleBtn} onClick={() => toggleForm(selectedForm.id, selectedForm.isActive)}>{selectedForm.isActive ? '⏸ Desactivar' : '▶ Activar'}</button>
                    <button className={styles.dupBtn} onClick={() => duplicateForm(selectedForm)}>📋 Duplicar</button>
                    <button className={styles.delBtn} onClick={() => deleteForm(selectedForm.id)}>🗑 Eliminar</button>
                </div>
                <h4 className={styles.fieldsTitle}>Campos del formulario</h4>
                <div className={styles.fieldsList}>{selectedForm.fields.map((field, i) => (<div key={field.id} className={styles.fieldItem}><span className={styles.fieldNum}>{i + 1}</span><div className={styles.fieldInfo}><span className={styles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</span><span className={styles.fieldType}>{FT[field.type]}{field.options ? ` — ${field.options}` : ''}</span></div></div>))}</div>
            </div></>)}
            {modalOpen && (<><div className={styles.overlay} onClick={() => setModalOpen(false)} /><div className={styles.modal}>
                <div className={styles.modalHeader}><h3>{editingId ? 'Editar Formulario' : 'Nuevo Formulario'}</h3><button className={styles.modalClose} onClick={() => setModalOpen(false)}>✕</button></div>
                <div className={styles.modalBody}>
                    <div className={styles.builderLayout}>
                        {/* LEFT: Editor */}
                        <div className={styles.builderEditor}>
                            <div className={styles.formRow}><label>Nombre *</label><input type="text" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="Nombre del formulario" /></div>
                            <div className={styles.formRow}><label>Descripción</label><textarea value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })} rows={2} /></div>
                            <div className={styles.formGrid}>
                                <div className={styles.formRow}><label>Categoría</label><select value={templateForm.category} onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}>{rubroData.categories.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
                                <div className={styles.formRow}><label>Estado</label><select value={templateForm.isActive ? 'active' : 'inactive'} onChange={e => setTemplateForm({ ...templateForm, isActive: e.target.value === 'active' })}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></div>
                            </div>
                            <div className={styles.fieldsEditor}>
                                <div className={styles.fieldsEditorHeader}><h4>Campos ({fields.length})</h4><button className={styles.addFieldBtn} onClick={openAddField}>+ Campo</button></div>
                                {fields.map((field, i) => (<div key={field.id} className={styles.fieldRow}>
                                    <div className={styles.fieldReorder}>
                                        <button className={styles.fieldReorderBtn} disabled={i === 0} onClick={() => { const n = [...fields];[n[i - 1], n[i]] = [n[i], n[i - 1]]; setFields(n); }} title="Subir">▲</button>
                                        <button className={styles.fieldReorderBtn} disabled={i === fields.length - 1} onClick={() => { const n = [...fields];[n[i], n[i + 1]] = [n[i + 1], n[i]]; setFields(n); }} title="Bajar">▼</button>
                                    </div>
                                    <span className={styles.fieldIdx}>{i + 1}</span><span className={styles.fieldName}>{field.label}{field.required ? ' *' : ''}</span><span className={styles.fieldTag}>{FT[field.type]?.split(' ')[0]}</span><button className={styles.fieldEditBtn} onClick={() => openEditField(field)}>✏️</button><button className={styles.fieldDelBtn} onClick={() => setConfirmDeleteField(field)}>✕</button>
                                </div>))}
                                {fields.length === 0 && <div className={styles.emptyFields}>Sin campos. Presiona &quot;+ Campo&quot; para agregar.</div>}
                            </div>
                        </div>
                        {/* RIGHT: Live Preview */}
                        <div className={styles.builderPreview}>
                            <div className={styles.previewHeader}>
                                <span className={styles.previewBadge}>👁 Vista Previa</span>
                                <span className={styles.previewHint}>Así verá el cliente</span>
                            </div>
                            <div className={styles.previewForm}>
                                <h3 className={styles.previewTitle}>{templateForm.name || 'Nombre del formulario'}</h3>
                                {templateForm.description && <p className={styles.previewDesc}>{templateForm.description}</p>}
                                {fields.length === 0 && <div className={styles.previewEmpty}>Agrega campos al formulario para ver la vista previa aquí.</div>}
                                {fields.map(field => (
                                    <div key={field.id} className={styles.previewField}>
                                        <label className={styles.previewLabel}>{field.label}{field.required ? <span className={styles.previewReq}> *</span> : ''}</label>
                                        {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number') && (
                                            <input className={styles.previewInput} type={field.type} placeholder={`Ingresa ${field.label.toLowerCase()}`} disabled />
                                        )}
                                        {field.type === 'date' && <input className={styles.previewInput} type="date" disabled />}
                                        {field.type === 'textarea' && <textarea className={styles.previewTextarea} rows={2} placeholder={`Escribe aquí...`} disabled />}
                                        {field.type === 'select' && (
                                            <select className={styles.previewSelect} disabled>
                                                <option>Selecciona...</option>
                                                {field.options?.split(',').map((o, i) => <option key={i}>{o.trim()}</option>)}
                                            </select>
                                        )}
                                        {field.type === 'checkbox' && (
                                            <label className={styles.previewCheckbox}><input type="checkbox" disabled /> {field.label}</label>
                                        )}
                                        {field.type === 'rating' && (
                                            <div className={styles.previewRating}>{'★★★★★'.split('').map((s, i) => <span key={i} className={i < 3 ? styles.previewStarActive : styles.previewStar}>{s}</span>)}</div>
                                        )}
                                        {field.type === 'signature' && (
                                            <div className={styles.previewSignature}>
                                                <span>✍️ Toca aquí para firmar</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {fields.length > 0 && <button className={styles.previewSubmit} disabled>Enviar Formulario</button>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancelar</button><button className={styles.saveBtn} onClick={saveTemplate}>{editingId ? 'Guardar' : 'Crear'}</button></div>
            </div></>)}
            {fieldModal && (<><div className={styles.fieldOverlay} onClick={() => setFieldModal(false)} /><div className={styles.fieldModalBox}>
                <h4>{editingFieldId ? 'Editar Campo' : 'Nuevo Campo'}</h4>
                <div className={styles.formRow}><label>Etiqueta *</label><input type="text" value={fieldForm.label} onChange={e => setFieldForm({ ...fieldForm, label: e.target.value })} /></div>
                <div className={styles.formGrid}>
                    <div className={styles.formRow}><label>Tipo</label><select value={fieldForm.type} onChange={e => setFieldForm({ ...fieldForm, type: e.target.value as FormField['type'] })}>{Object.entries(FT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                    <label className={styles.checkLabel}><input type="checkbox" checked={fieldForm.required} onChange={e => setFieldForm({ ...fieldForm, required: e.target.checked })} /> Requerido</label>
                </div>
                {fieldForm.type === 'select' && (<div className={styles.formRow}><label>Opciones (separadas por coma)</label><input type="text" value={fieldForm.options || ''} onChange={e => setFieldForm({ ...fieldForm, options: e.target.value })} /></div>)}
                <div className={styles.fieldModalActions}><button className={styles.cancelBtn} onClick={() => setFieldModal(false)}>Cancelar</button><button className={styles.saveBtn} onClick={saveField}>{editingFieldId ? 'Guardar' : 'Agregar'}</button></div>
            </div></>)}
            <ConfirmDialog
                open={!!confirmDeleteField}
                title="Eliminar campo"
                message={confirmDeleteField ? `¿Eliminar el campo "${confirmDeleteField.label}" del formulario?` : ''}
                confirmLabel="Eliminar"
                variant="danger"
                onConfirm={() => { if (confirmDeleteField) removeField(confirmDeleteField.id); setConfirmDeleteField(null); }}
                onCancel={() => setConfirmDeleteField(null)}
            />
            {toast && <div className={styles.toast}>{toast}</div>}
        </>
    );
}
