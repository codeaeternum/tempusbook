'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSettings, ALL_MODULES, SOCIAL_NETWORKS } from '@/providers/SettingsProvider';
import type { TranslationKey } from '@/lib/i18n';
import type { BusinessAddress, SocialLink, DaySchedule, ModuleKey } from '@/providers/SettingsProvider';
import styles from './page.module.css';

// ---- Options ----
const COLOR_OPTIONS = [
    { value: '#6C5CE7', name: 'Purple' }, { value: '#00CEC9', name: 'Teal' }, { value: '#FD79A8', name: 'Pink' },
    { value: '#00B894', name: 'Green' }, { value: '#FDCB6E', name: 'Gold' }, { value: '#74B9FF', name: 'Blue' },
    { value: '#FF6B6B', name: 'Coral' }, { value: '#E17055', name: 'Orange' },
];
import { CATEGORIES } from '@aeternasuite/shared-constants';

const REGIMEN_OPTIONS = [
    { value: '', label: '— Seleccionar —' }, { value: '601', label: '601 - General de Ley' },
    { value: '603', label: '603 - Personas Morales sin fines de lucro' }, { value: '605', label: '605 - Sueldos y Salarios' },
    { value: '606', label: '606 - Arrendamiento' }, { value: '612', label: '612 - Personas Físicas con A.E.' },
    { value: '616', label: '616 - Sin obligaciones fiscales' }, { value: '621', label: '621 - Incorporación Fiscal' },
    { value: '625', label: '625 - RESICO' }, { value: '626', label: '626 - Régimen Simplificado de Confianza' },
];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TZ_OPTIONS = ['America/Mexico_City', 'America/Cancun', 'America/Tijuana', 'America/Monterrey', 'America/Merida', 'America/Mazatlan', 'America/Chihuahua', 'America/Hermosillo', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/Madrid', 'America/Bogota', 'America/Lima', 'America/Santiago', 'America/Buenos_Aires'];

function fmtAddr(a: BusinessAddress) {
    const parts = [a.street, a.extNum && `#${a.extNum}`, a.intNum && `Int. ${a.intNum}`, a.colonia && `Col. ${a.colonia}`, a.city, a.state, a.zip && `CP ${a.zip}`, a.country].filter(Boolean);
    return parts.join(', ') || 'Sin dirección';
}

export default function SettingsPage() {
    const { t, locale, setLocale } = useLocale();
    const { theme, setTheme } = useTheme();
    const { settings, updateSettings, enabledModules, toggleModule, moveModule, toggleFavorite } = useSettings();
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
    const [closedDateInput, setClosedDateInput] = useState('');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressDraft, setAddressDraft] = useState<BusinessAddress>(settings.businessAddress);
    const [showSocialPicker, setShowSocialPicker] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Accordion — all sections start expanded
    const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
    const toggleSection = (n: number) => setCollapsedSections(prev => {
        const next = new Set(prev);
        if (next.has(n)) next.delete(n); else next.add(n);
        return next;
    });

    const showToast = (msg: string) => { setToast({ message: msg, visible: true }); setTimeout(() => setToast(p => ({ ...p, visible: false })), 2500); };
    const set = (field: string, value: unknown) => { updateSettings({ [field]: value } as never); showToast(`✅ ${t('settings_saved')}`); };

    // Address helpers
    const addr = settings.businessAddress || { street: '', extNum: '', intNum: '', colonia: '', city: '', state: '', zip: '', country: 'México' };
    const saveAddress = () => { set('businessAddress', addressDraft); setShowAddressModal(false); };
    const openAddressModal = () => { setAddressDraft({ ...addr }); setShowAddressModal(true); };

    // Social helpers
    const socialLinks: SocialLink[] = settings.socialLinks || [];
    const addSocial = (networkId: string) => {
        if (socialLinks.some(s => s.network === networkId)) return;
        set('socialLinks', [...socialLinks, { network: networkId, url: '' }]);
        setShowSocialPicker(false);
    };
    const updateSocial = (networkId: string, url: string) => { set('socialLinks', socialLinks.map(s => s.network === networkId ? { ...s, url } : s)); };
    const removeSocial = (networkId: string) => { set('socialLinks', socialLinks.filter(s => s.network !== networkId)); };
    const availableNetworks = SOCIAL_NETWORKS.filter(n => !socialLinks.some(s => s.network === n.id));

    // Logo upload
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { set('logoUrl', reader.result as string); };
        reader.readAsDataURL(file);
    };

    // Rest days
    const toggleRestDay = (d: number) => {
        const cur = settings.restDays || [];
        set('restDays', cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d]);
    };

    // Closed dates
    const addClosedDate = () => { if (!closedDateInput) return; const c = settings.closedDates || []; if (!c.includes(closedDateInput)) set('closedDates', [...c, closedDateInput]); setClosedDateInput(''); };
    const removeClosedDate = (d: string) => set('closedDates', (settings.closedDates || []).filter(x => x !== d));

    // Day schedules
    const daySchedules: DaySchedule[] = settings.daySchedules || DAY_FULL.map(() => ({ open: '09:00', close: '21:00', enabled: true }));
    const updateDaySchedule = (idx: number, field: keyof DaySchedule, val: string | boolean) => {
        const next = [...daySchedules];
        next[idx] = { ...next[idx], [field]: val };
        set('daySchedules', next);
    };

    // Module order + Drag-and-drop
    const moduleOrder: ModuleKey[] = settings.moduleOrder || ALL_MODULES.map(m => m.key);
    const favs = new Set(settings.favoriteModules || []);
    const orderedModules = useMemo(() => {
        const isAutoShop = settings.businessRubro === 'mechanic' || settings.businessRubro === 'auto_repair';
        const isTechRepair = settings.businessRubro === 'tech_repair' || settings.businessRubro === 'electronics';

        let list = moduleOrder
            .map(key => ALL_MODULES.find(m => m.key === key))
            .filter(Boolean) as typeof ALL_MODULES;

        return list.filter(mod => {
            if (mod.key === 'vehicles' || mod.key === 'inspections') return isAutoShop || enabledModules.has(mod.key);
            if (mod.key === 'devices') return isTechRepair || enabledModules.has(mod.key);
            return true;
        });
    }, [moduleOrder, settings.businessRubro, enabledModules]);

    // Drag state
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartY = useRef(0);
    const touchActiveRef = useRef(false);

    const reorderModules = useCallback((fromIdx: number, toIdx: number) => {
        if (fromIdx === toIdx) return;
        const order = [...moduleOrder];
        const [moved] = order.splice(fromIdx, 1);
        order.splice(toIdx, 0, moved);
        updateSettings({ moduleOrder: order });
        showToast('✅ Orden actualizado');
    }, [moduleOrder, updateSettings]);

    // HTML5 Drag (desktop)
    const onDragStart = (idx: number) => { setDragIdx(idx); };
    const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
    const onDrop = (idx: number) => { if (dragIdx !== null) reorderModules(dragIdx, idx); setDragIdx(null); setDragOverIdx(null); };
    const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

    // Touch drag (mobile/tablet) — with visual floating clone
    const dragCloneRef = useRef<HTMLElement | null>(null);
    const dragCloneOffsetY = useRef(0);

    const removeDragClone = () => {
        if (dragCloneRef.current) {
            dragCloneRef.current.remove();
            dragCloneRef.current = null;
        }
    };

    const onTouchStart = (idx: number, e: React.TouchEvent) => {
        const target = e.currentTarget as HTMLElement;
        touchStartY.current = e.touches[0].clientY;
        touchActiveRef.current = false;
        touchTimerRef.current = setTimeout(() => {
            touchActiveRef.current = true;
            setDragIdx(idx);
            if (navigator.vibrate) navigator.vibrate(30);

            // Create floating clone
            const rect = target.getBoundingClientRect();
            const clone = target.cloneNode(true) as HTMLElement;
            clone.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                z-index: 9999;
                pointer-events: none;
                opacity: 0.92;
                transform: scale(1.04) rotate(1deg);
                box-shadow: 0 12px 40px rgba(0,0,0,0.4);
                border-radius: 12px;
                border: 2px solid var(--color-primary);
                background: var(--color-bg-secondary);
                transition: transform 0.08s ease;
            `;
            document.body.appendChild(clone);
            dragCloneRef.current = clone;
            dragCloneOffsetY.current = e.touches[0].clientY - rect.top;
        }, 300);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (!touchActiveRef.current) {
            // Cancel long press if moved before activation
            if (Math.abs(e.touches[0].clientY - touchStartY.current) > 10) {
                if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
            }
            return;
        }
        e.preventDefault();
        const touch = e.touches[0];

        // Move the floating clone
        if (dragCloneRef.current) {
            dragCloneRef.current.style.top = `${touch.clientY - dragCloneOffsetY.current}px`;
        }

        // Detect which row we're over
        const elements = document.querySelectorAll('[data-module-idx]');
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                setDragOverIdx(Number(el.getAttribute('data-module-idx')));
            }
        });
    };
    const onTouchEnd = () => {
        if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
        if (touchActiveRef.current && dragIdx !== null && dragOverIdx !== null) {
            reorderModules(dragIdx, dragOverIdx);
        }
        touchActiveRef.current = false;
        removeDragClone();
        setDragIdx(null);
        setDragOverIdx(null);
    };

    return (
        <>
            <Header title={t('settings')} subtitle="Configuración completa de tu negocio" />
            <div className={styles.settingsPage}>

                {/* ═══════════ 1. PERFIL DEL NEGOCIO ═══════════ */}
                <section className={styles.section}>
                    <div className={`${styles.sectionHeader} ${styles.sectionToggle}`} onClick={() => toggleSection(1)}>
                        <div className={styles.sectionIcon}>🏪</div>
                        <div><div className={styles.sectionTitle}>Perfil del Negocio</div><div className={styles.sectionDescription}>Identidad, contacto y presencia digital</div></div>
                        <span className={styles.chevron}>{collapsedSections.has(1) ? '▸' : '▾'}</span>
                    </div>
                    {!collapsedSections.has(1) && <>

                        {/* Logo Upload */}
                        <div className={styles.logoArea}>
                            <div className={styles.logoPreview} onClick={() => logoInputRef.current?.click()}>
                                {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className={styles.logoImg} /> : <span className={styles.logoPlaceholder}>📷<br />Subir logo</span>}
                            </div>
                            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                            <div className={styles.logoHint}>Click para subir · JPG, PNG, WebP · Máx 2MB</div>
                        </div>

                        <div className={styles.fieldGrid}>
                            <div className={styles.field}><label className={styles.fieldLabel}>{t('business_name')}</label><input className={styles.fieldInput} type="text" value={settings.businessName} onChange={e => set('businessName', e.target.value)} /></div>
                            <div className={styles.field}>
                                <label className={styles.fieldLabel} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {t('select_rubro')}
                                    <span title="Tu suscripción ha fijado la topología del negocio. Para cambiar de categoría, debes resetear tu Workspace o abrir una nueva Sucursal B2B." style={{ cursor: 'help', color: 'var(--color-primary)', fontSize: '0.9em' }}>
                                        ⓘ
                                    </span>
                                </label>
                                <select
                                    className={styles.fieldSelect}
                                    value={settings.businessRubro}
                                    onChange={e => set('businessRubro', e.target.value)}
                                    disabled
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                >
                                    {CATEGORIES.map(r => <option key={r.slug} value={r.slug}>{r.icon} {r.nameEs}</option>)}
                                </select>
                            </div>
                            <div className={styles.field}><label className={styles.fieldLabel}>📞 Teléfono</label><input className={styles.fieldInput} type="tel" value={settings.businessPhone} onChange={e => set('businessPhone', e.target.value)} /></div>
                            <div className={styles.field}><label className={styles.fieldLabel}>✉️ Email</label><input className={styles.fieldInput} type="email" value={settings.businessEmail} onChange={e => set('businessEmail', e.target.value)} /></div>
                            <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.fieldLabel}>📝 Descripción</label><textarea className={styles.fieldTextarea} rows={2} value={settings.businessDescription} onChange={e => set('businessDescription', e.target.value)} /></div>
                            <div className={styles.field}><label className={styles.fieldLabel}>🌐 Sitio web</label><input className={styles.fieldInput} type="url" value={settings.businessWebsite} onChange={e => set('businessWebsite', e.target.value)} placeholder="https://..." /></div>
                        </div>

                        {/* Address */}
                        <div className={styles.subsection}>
                            <label className={styles.fieldLabel} style={{ marginBottom: '8px', display: 'block' }}>📍 Dirección</label>
                            <div className={styles.addressPreview} onClick={openAddressModal}>
                                <span>{fmtAddr(addr)}</span>
                                <button className={styles.editAddrBtn}>✏️ Editar</button>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className={styles.subsection}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label className={styles.fieldLabel}>Redes Sociales</label>
                                <div style={{ position: 'relative' }}>
                                    <button className={styles.addSocialBtn} onClick={() => setShowSocialPicker(p => !p)}>+ Agregar red</button>
                                    {showSocialPicker && availableNetworks.length > 0 && (
                                        <div className={styles.socialPicker}>
                                            {availableNetworks.map(n => (
                                                <button key={n.id} className={styles.socialPickerItem} onClick={() => addSocial(n.id)}>{n.icon} {n.label}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {socialLinks.length === 0 && <div className={styles.emptyHint}>Agrega tus redes sociales con el botón de arriba</div>}
                            <div className={styles.socialList}>
                                {socialLinks.map(link => {
                                    const net = SOCIAL_NETWORKS.find(n => n.id === link.network);
                                    return (
                                        <div key={link.network} className={styles.socialItem}>
                                            <span className={styles.socialItemIcon}>{net?.icon || '🔗'}</span>
                                            <span className={styles.socialItemLabel}>{net?.label || link.network}</span>
                                            <input className={styles.fieldInput} placeholder={net?.placeholder || 'URL'} value={link.url} onChange={e => updateSocial(link.network, e.target.value)} />
                                            <button className={styles.socialRemoveBtn} onClick={() => removeSocial(link.network)}>✕</button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>}
                </section>

                {/* ═══════════ 2. MÓDULOS + ORDEN ═══════════ */}
                <section className={styles.section}>
                    <div className={`${styles.sectionHeader} ${styles.sectionToggle}`} onClick={() => toggleSection(2)}>
                        <div className={styles.sectionIcon}>🧩</div>
                        <div><div className={styles.sectionTitle}>{t('active_modules')}</div><div className={styles.sectionDescription}>Activa, desactiva y reordena los módulos del menú. ⭐ = Favorito (siempre arriba)</div></div>
                        <span className={styles.chevron}>{collapsedSections.has(2) ? '▸' : '▾'}</span>
                    </div>
                    {!collapsedSections.has(2) && <>
                        <div className={styles.moduleList}>
                            {orderedModules.map((mod, idx) => {
                                const isActive = enabledModules.has(mod.key);
                                const isFav = favs.has(mod.key);
                                const isDragging = dragIdx === idx;
                                const isDragOver = dragOverIdx === idx && dragIdx !== idx;
                                return (
                                    <div
                                        key={mod.key}
                                        data-module-idx={idx}
                                        className={`${styles.moduleRow} ${isActive ? styles.moduleRowActive : ''} ${isFav ? styles.moduleRowFav : ''} ${isDragging ? styles.moduleRowDragging : ''} ${isDragOver ? styles.moduleRowDragOver : ''}`}
                                        draggable
                                        onDragStart={() => onDragStart(idx)}
                                        onDragOver={e => onDragOver(e, idx)}
                                        onDrop={() => onDrop(idx)}
                                        onDragEnd={onDragEnd}
                                        onTouchStart={e => onTouchStart(idx, e)}
                                        onTouchMove={onTouchMove}
                                        onTouchEnd={onTouchEnd}
                                    >
                                        <span className={styles.dragHandle}>☰</span>
                                        <span className={styles.moduleRowIcon}>{mod.icon}</span>
                                        <span className={styles.moduleRowLabel}>{t(mod.labelKey as TranslationKey)}</span>
                                        <button className={`${styles.favBtn} ${isFav ? styles.favBtnActive : ''}`} onClick={() => toggleFavorite(mod.key)} title="Favorito">⭐</button>
                                        <label className={styles.toggle} onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" className={styles.toggleInput} checked={isActive} onChange={() => toggleModule(mod.key)} />
                                            <span className={styles.toggleSlider} />
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </>}
                </section>

                {/* ═══════════ 3. AGENDA Y RESERVAS ═══════════ */}
                <section className={styles.section}>
                    <div className={`${styles.sectionHeader} ${styles.sectionToggle}`} onClick={() => toggleSection(3)}>
                        <div className={styles.sectionIcon}>📅</div>
                        <div><div className={styles.sectionTitle}>Agenda y Reservas</div><div className={styles.sectionDescription}>Horarios, fechas, pagos y configuración avanzada</div></div>
                        <span className={styles.chevron}>{collapsedSections.has(3) ? '▸' : '▾'}</span>
                    </div>
                    {!collapsedSections.has(3) && <>

                        <div className={styles.fieldGrid}>
                            <div className={styles.field}><label className={styles.fieldLabel}>Reservas online</label><label className={styles.toggle}><input type="checkbox" className={styles.toggleInput} checked={settings.bookingEnabled} onChange={e => set('bookingEnabled', e.target.checked)} /><span className={styles.toggleSlider} /></label></div>
                            <div className={styles.field}><label className={styles.fieldLabel}>Intervalo de citas</label><select className={styles.fieldSelect} value={settings.bookingInterval} onChange={e => set('bookingInterval', +e.target.value)}><option value={15}>15 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select></div>
                            <div className={styles.field}><label className={styles.fieldLabel}>Buffer entre citas</label><select className={styles.fieldSelect} value={settings.bookingBuffer} onChange={e => set('bookingBuffer', +e.target.value)}><option value={0}>Sin buffer</option><option value={5}>5 min</option><option value={10}>10 min</option><option value={15}>15 min</option><option value={30}>30 min</option></select></div>
                            <div className={styles.field}><label className={styles.fieldLabel}>Confirmación automática</label><label className={styles.toggle}><input type="checkbox" className={styles.toggleInput} checked={settings.bookingAutoConfirm} onChange={e => set('bookingAutoConfirm', e.target.checked)} /><span className={styles.toggleSlider} /></label></div>
                            <div className={styles.field}><label className={styles.fieldLabel}>Cancelación sin cargo</label><select className={styles.fieldSelect} value={settings.bookingCancellationHours} onChange={e => set('bookingCancellationHours', +e.target.value)}><option value={2}>2h antes</option><option value={12}>12h antes</option><option value={24}>24h antes</option><option value={48}>48h antes</option></select></div>
                            <div className={styles.field}><label className={styles.fieldLabel}>🌎 Zona horaria</label><select className={styles.fieldSelect} value={settings.timezone} onChange={e => set('timezone', e.target.value)}>{TZ_OPTIONS.map(tz => <option key={tz} value={tz}>{tz.replace('America/', '').replace(/_/g, ' ')}</option>)}</select></div>
                        </div>

                        {/* Per-Day Schedules */}
                        <div className={styles.subsection}>
                            <label className={styles.fieldLabel} style={{ marginBottom: '12px', display: 'block' }}>🕐 Horarios por Día</label>
                            <div className={styles.sectionDescription} style={{ marginBottom: '12px' }}>Configura horario diferente para cada día de la semana</div>
                            <div className={styles.dayScheduleGrid}>
                                {DAY_FULL.map((name, idx) => {
                                    const sched = daySchedules[idx] || { open: '09:00', close: '21:00', enabled: true };
                                    return (
                                        <div key={idx} className={`${styles.dayScheduleRow} ${!sched.enabled ? styles.dayScheduleOff : ''}`}>
                                            <label className={styles.daySwitchLabel}>
                                                <input type="checkbox" checked={sched.enabled} onChange={e => updateDaySchedule(idx, 'enabled', e.target.checked)} className={styles.dayCheckbox} />
                                                <span className={styles.daySchedName}>{name}</span>
                                            </label>
                                            {sched.enabled ? (
                                                <div className={styles.daySchedTimes}>
                                                    <input type="time" value={sched.open} onChange={e => updateDaySchedule(idx, 'open', e.target.value)} className={styles.dayTimeInput} />
                                                    <span>—</span>
                                                    <input type="time" value={sched.close} onChange={e => updateDaySchedule(idx, 'close', e.target.value)} className={styles.dayTimeInput} />
                                                </div>
                                            ) : <span className={styles.dayClosedLabel}>Cerrado</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment requirement */}
                        <div className={styles.subsection}>
                            <label className={styles.fieldLabel} style={{ marginBottom: '8px', display: 'block' }}>💳 Requisito de pago</label>
                            <div className={styles.themeSelector}>
                                {([{ value: 'none' as const, icon: '🆓', label: 'Sin pago' }, { value: 'deposit' as const, icon: '💵', label: 'Anticipo' }, { value: 'full' as const, icon: '💳', label: 'Completo' }]).map(opt => (
                                    <button key={opt.value} className={`${styles.themeOption} ${settings.bookingPaymentRequirement === opt.value ? styles.themeOptionActive : ''}`} onClick={() => set('bookingPaymentRequirement', opt.value)}>
                                        <span className={styles.themeOptionIcon}>{opt.icon}</span><span className={styles.themeOptionLabel}>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                            {settings.bookingPaymentRequirement === 'deposit' && (
                                <div className={styles.depositConfig}>
                                    <div className={styles.depositTypeToggle}>
                                        <button className={`${styles.depositTypeBtn} ${settings.depositType === 'percent' ? styles.depositTypeBtnActive : ''}`} onClick={() => set('depositType', 'percent')}>Porcentaje %</button>
                                        <button className={`${styles.depositTypeBtn} ${settings.depositType === 'fixed' ? styles.depositTypeBtnActive : ''}`} onClick={() => set('depositType', 'fixed')}>Cantidad fija $</button>
                                    </div>
                                    {settings.depositType === 'percent' ? (
                                        <div className={styles.depositRow}><input type="number" min={5} max={90} step={5} value={settings.bookingDepositPercent} onChange={e => set('bookingDepositPercent', +e.target.value)} className={styles.depositInput} /><span>%</span></div>
                                    ) : (
                                        <div className={styles.depositRow}><span>$</span><input type="number" min={10} step={10} value={settings.depositFixedAmount} onChange={e => set('depositFixedAmount', +e.target.value)} className={styles.depositInput} /><span>MXN</span></div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date opening */}
                        <div className={styles.subsection}>
                            <label className={styles.fieldLabel} style={{ marginBottom: '8px', display: 'block' }}>📅 Apertura de Fechas</label>
                            <div className={styles.sectionDescription} style={{ marginBottom: '12px' }}>¿Cada cuándo se abren nuevas fechas para que tus clientes reserven?</div>
                            <div className={styles.dateOpenCards}>
                                <div className={`${styles.dateOpenCard} ${settings.dateOpeningMode === 'weekly' ? styles.dateOpenCardActive : ''}`} onClick={() => set('dateOpeningMode', 'weekly')}>
                                    <span className={styles.dateOpenIcon}>📆</span>
                                    <strong>Semanal</strong>
                                    <p>Cada semana se abren los próximos 7 días</p>
                                    {settings.dateOpeningMode === 'weekly' && (
                                        <div className={styles.dateOpenSub}><label>Día que se abren:</label><select className={styles.fieldSelect} value={settings.dateOpeningDay} onChange={e => set('dateOpeningDay', +e.target.value)}>{DAY_FULL.map((n, i) => <option key={i} value={i}>{n}</option>)}</select></div>
                                    )}
                                </div>
                                <div className={`${styles.dateOpenCard} ${settings.dateOpeningMode === 'monthly' ? styles.dateOpenCardActive : ''}`} onClick={() => set('dateOpeningMode', 'monthly')}>
                                    <span className={styles.dateOpenIcon}>🗓️</span>
                                    <strong>Mensual</strong>
                                    <p>Se abre todo el mes siguiente completo</p>
                                    {settings.dateOpeningMode === 'monthly' && (
                                        <div className={styles.dateOpenSub}><label>Día del mes:</label><select className={styles.fieldSelect} value={settings.dateOpeningDay} onChange={e => set('dateOpeningDay', +e.target.value)}>{Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>Día {i + 1}</option>)}</select></div>
                                    )}
                                </div>
                                <div className={`${styles.dateOpenCard} ${settings.dateOpeningMode === 'custom' ? styles.dateOpenCardActive : ''}`} onClick={() => set('dateOpeningMode', 'custom')}>
                                    <span className={styles.dateOpenIcon}>⚙️</span>
                                    <strong>Personalizado</strong>
                                    <p>Defina exactamente cuántos días hacia adelante</p>
                                    {settings.dateOpeningMode === 'custom' && (
                                        <div className={styles.dateOpenSub}><label>Días hacia adelante:</label><input type="number" min={1} max={365} value={settings.bookingMaxAdvanceDays} onChange={e => set('bookingMaxAdvanceDays', +e.target.value)} className={styles.depositInput} /><span>días</span></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lunch break */}
                        <div className={styles.subsection}>
                            <div className={styles.toggleRow}>
                                <div className={styles.toggleRowLabel}><span className={styles.toggleRowIcon}>🍽️</span><div>Horario de Comida<div className={styles.toggleRowDescription}>Bloquea un rango para comida</div></div></div>
                                <label className={styles.toggle}><input type="checkbox" className={styles.toggleInput} checked={settings.lunchBreakEnabled} onChange={e => set('lunchBreakEnabled', e.target.checked)} /><span className={styles.toggleSlider} /></label>
                            </div>
                            {settings.lunchBreakEnabled && (
                                <div className={styles.lunchTimes}>
                                    <div className={styles.field}><label className={styles.fieldLabel}>Inicio</label><input className={styles.fieldInput} type="time" value={settings.lunchBreakStart} onChange={e => set('lunchBreakStart', e.target.value)} /></div>
                                    <div className={styles.field}><label className={styles.fieldLabel}>Fin</label><input className={styles.fieldInput} type="time" value={settings.lunchBreakEnd} onChange={e => set('lunchBreakEnd', e.target.value)} /></div>
                                </div>
                            )}
                        </div>

                        {/* Closed dates */}
                        <div className={styles.subsection}>
                            <label className={styles.fieldLabel} style={{ marginBottom: '8px', display: 'block' }}>🚫 Fechas Cerradas</label>
                            <div className={styles.closedDateAdd}><input type="date" value={closedDateInput} onChange={e => setClosedDateInput(e.target.value)} className={styles.fieldInput} /><button className={styles.addDateBtn} onClick={addClosedDate}>+ Agregar</button></div>
                            {(settings.closedDates || []).length > 0 && (
                                <div className={styles.closedDateList}>{settings.closedDates.sort().map(d => (<span key={d} className={styles.closedDateTag}>{new Date(d + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}<button onClick={() => removeClosedDate(d)}>✕</button></span>))}</div>
                            )}
                        </div>
                    </>}
                </section>

                {/* ═══════════ 4. PLAN ═══════════ */}
                <section className={styles.section}>
                    <div className={`${styles.sectionHeader} ${styles.sectionToggle}`} onClick={() => toggleSection(4)}><div className={styles.sectionIcon}>⭐</div><div><div className={styles.sectionTitle}>{t('subscription')}</div></div><span className={styles.chevron}>{collapsedSections.has(4) ? '▸' : '▾'}</span></div>
                    {!collapsedSections.has(4) && <><div className={styles.planCard}>
                        <div className={styles.planInfo}><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span className={styles.planBadge}>{t('pro_plan')}</span><span className={styles.planName}>{t('plan_trial')}</span></div><div className={styles.planTrialText}>{t('plan_expires')} <span className={styles.planTrialDays}>{settings.trialDaysLeft}</span> {t('trial_days_left')}</div><div className={styles.planProgress}><div className={styles.planProgressBar} style={{ width: `${((14 - settings.trialDaysLeft) / 14) * 100}%` }} /></div></div>
                        <button className={styles.upgradeBtn}>{t('upgrade')}</button>
                    </div>
                    </>}
                </section>

                {/* ═══════════ 5. FISCAL ═══════════ */}
                <section className={styles.section}>
                    <div className={`${styles.sectionHeader} ${styles.sectionToggle}`} onClick={() => toggleSection(5)}><div className={styles.sectionIcon}>🧾</div><div><div className={styles.sectionTitle}>Facturación y Contabilidad</div><div className={styles.sectionDescription}>Datos fiscales para enviar a tu contadora junto con los tickets</div></div><span className={styles.chevron}>{collapsedSections.has(5) ? '▸' : '▾'}</span></div>
                    {!collapsedSections.has(5) && <>
                        <div className={styles.toggleRow}><div className={styles.toggleRowLabel}><span className={styles.toggleRowIcon}>📄</span><div>Datos de facturación<div className={styles.toggleRowDescription}>RFC, razón social y régimen para contabilidad</div></div></div><label className={styles.toggle}><input type="checkbox" className={styles.toggleInput} checked={settings.emiteFactura} onChange={e => set('emiteFactura', e.target.checked)} /><span className={styles.toggleSlider} /></label></div>
                        <div className={`${styles.fiscalFields} ${settings.emiteFactura ? styles.fiscalFieldsOpen : ''}`}>
                            <div className={styles.fieldGrid}>
                                <div className={styles.field}><label className={styles.fieldLabel}>{t('rfc')}</label><input className={styles.fieldInput} type="text" placeholder="XAXX010101000" value={settings.rfcNegocio} onChange={e => updateSettings({ rfcNegocio: e.target.value.toUpperCase() })} maxLength={13} /></div>
                                <div className={styles.field}><label className={styles.fieldLabel}>{t('razon_social')}</label><input className={styles.fieldInput} type="text" value={settings.razonSocial} onChange={e => updateSettings({ razonSocial: e.target.value })} /></div>
                                <div className={styles.field}><label className={styles.fieldLabel}>{t('regimen_fiscal')}</label><select className={styles.fieldSelect} value={settings.regimenFiscal} onChange={e => updateSettings({ regimenFiscal: e.target.value })}>{REGIMEN_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                                <div className={styles.field}><label className={styles.fieldLabel}>{t('tax_rate')} (%)</label><input className={styles.fieldInput} type="number" min={0} max={100} value={settings.tasaIVA} onChange={e => updateSettings({ tasaIVA: +e.target.value })} /></div>
                            </div>
                        </div>
                        <div className={styles.toggleRow} style={{ marginTop: 'var(--space-3)' }}><div className={styles.toggleRowLabel}><span className={styles.toggleRowIcon}>💰</span><div>Flujo de Efectivo<div className={styles.toggleRowDescription}>Se activa automáticamente con el Punto de Venta</div></div></div><label className={styles.toggle}><input type="checkbox" className={styles.toggleInput} checked={settings.manejaEfectivo || enabledModules.has('pos')} disabled={enabledModules.has('pos')} onChange={e => set('manejaEfectivo', e.target.checked)} /><span className={styles.toggleSlider} /></label></div>
                        {enabledModules.has('pos') && <div className={styles.modeHint}>🔗 Activado automáticamente porque el Punto de Venta está habilitado</div>}
                    </>}
                </section>

                {/* ═══════════ 6. APARIENCIA ═══════════ */}
                <section className={styles.section}>
                    <div className={`${styles.sectionHeader} ${styles.sectionToggle}`} onClick={() => toggleSection(6)}><div className={styles.sectionIcon}>🎨</div><div><div className={styles.sectionTitle}>{t('appearance')}</div></div><span className={styles.chevron}>{collapsedSections.has(6) ? '▸' : '▾'}</span></div>
                    {!collapsedSections.has(6) && <>
                        <label className={styles.fieldLabel} style={{ marginBottom: '12px', display: 'block' }}>Tema</label>
                        <div className={styles.themeSelector}>
                            <button className={`${styles.themeOption} ${theme === 'light' ? styles.themeOptionActive : ''}`} onClick={() => setTheme('light')}><span className={styles.themeOptionIcon}>☀️</span><span className={styles.themeOptionLabel}>{t('light_mode')}</span></button>
                            <button className={`${styles.themeOption} ${theme === 'dark' ? styles.themeOptionActive : ''}`} onClick={() => setTheme('dark')}><span className={styles.themeOptionIcon}>🌙</span><span className={styles.themeOptionLabel}>{t('dark_mode')}</span></button>
                        </div>
                        <div style={{ marginTop: 'var(--space-5)' }}><label className={styles.fieldLabel} style={{ marginBottom: '12px', display: 'block' }}>{t('primary_color')}</label><div className={styles.colorSwatches}>{COLOR_OPTIONS.map(c => (<div key={c.value} className={`${styles.colorSwatch} ${settings.primaryColor === c.value ? styles.colorSwatchActive : ''}`} style={{ background: c.value }} onClick={() => set('primaryColor', c.value)} title={c.name} role="button" tabIndex={0} />))}</div></div>
                    </>}
                </section>

                {/* ═══════════ 7. NOTIFICATIONS ═══════════ */}
                <section className={styles.section}>
                    <div className={`${styles.sectionHeader} ${styles.sectionToggle}`} onClick={() => toggleSection(7)}><div className={styles.sectionIcon}>🔔</div><div><div className={styles.sectionTitle}>Notificaciones</div><div className={styles.sectionDescription}>Canales y alertas automáticas</div></div><span className={styles.chevron}>{collapsedSections.has(7) ? '▸' : '▾'}</span></div>
                    {!collapsedSections.has(7) && <>
                        <label className={styles.fieldLabel} style={{ marginBottom: '8px', display: 'block' }}>Canales activos</label>
                        <div className={styles.notifChannels}>
                            {([{ key: 'notifEmail' as const, icon: '📧', label: 'Email' }, { key: 'notifPush' as const, icon: '📱', label: 'Push' }, { key: 'notifWhatsApp' as const, icon: '💬', label: 'WhatsApp' }, { key: 'notifSMS' as const, icon: '📲', label: 'SMS' }]).map(ch => (
                                <div key={ch.key} className={styles.toggleRow}><div className={styles.toggleRowLabel}><span className={styles.toggleRowIcon}>{ch.icon}</span><span>{ch.label}</span></div><label className={styles.toggle}><input type="checkbox" className={styles.toggleInput} checked={settings[ch.key]} onChange={e => set(ch.key, e.target.checked)} /><span className={styles.toggleSlider} /></label></div>
                            ))}
                        </div>
                        <div className={styles.subsection}>
                            <div className={styles.reminderRow}><span className={styles.reminderLabel}>⏰ {t('reminder_hours')}:</span><input className={styles.reminderInput} type="number" min={1} max={72} value={settings.reminderHoursBefore} onChange={e => set('reminderHoursBefore', +e.target.value)} /><span className={styles.reminderLabel}>{t('hours')}</span></div>
                        </div>
                        <div className={styles.subsection}>
                            <label className={styles.fieldLabel} style={{ marginBottom: '8px', display: 'block' }}>Alertas automáticas</label>
                            {([
                                { key: 'notifAppointmentReminder' as const, icon: '⏰', label: 'Recordatorio de cita', desc: 'Antes de cada cita' },
                                { key: 'notifNewClientWelcome' as const, icon: '👋', label: 'Bienvenida', desc: 'Nuevo cliente registrado' },
                                { key: 'notifNoShowFollowUp' as const, icon: '🚫', label: 'No-show', desc: 'Cliente no se presentó' },
                                { key: 'notifReviewRequest' as const, icon: '⭐', label: 'Reseña', desc: 'Pide feedback post-servicio' },
                                { key: 'notifMarketingEnabled' as const, icon: '📣', label: 'Marketing', desc: 'Promos periódicas' },
                            ]).map(item => (
                                <div key={item.key} className={styles.toggleRow}><div className={styles.toggleRowLabel}><span className={styles.toggleRowIcon}>{item.icon}</span><div>{item.label}<div className={styles.toggleRowDescription}>{item.desc}</div></div></div><label className={styles.toggle}><input type="checkbox" className={styles.toggleInput} checked={settings[item.key]} onChange={e => set(item.key, e.target.checked)} /><span className={styles.toggleSlider} /></label></div>
                            ))}
                        </div>
                    </>}
                </section>
            </div>

            {/* Address Modal */}
            {showAddressModal && (
                <>
                    <div className={styles.overlay} onClick={() => setShowAddressModal(false)} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}><h3>📍 Editar Dirección</h3><button className={styles.modalClose} onClick={() => setShowAddressModal(false)}>✕</button></div>
                        <div className={styles.modalBody}>
                            <div className={styles.fieldGrid}>
                                <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.fieldLabel}>Calle</label><input className={styles.fieldInput} value={addressDraft.street} onChange={e => setAddressDraft(p => ({ ...p, street: e.target.value }))} /></div>
                                <div className={styles.field}><label className={styles.fieldLabel}># Exterior</label><input className={styles.fieldInput} value={addressDraft.extNum} onChange={e => setAddressDraft(p => ({ ...p, extNum: e.target.value }))} /></div>
                                <div className={styles.field}><label className={styles.fieldLabel}># Interior</label><input className={styles.fieldInput} value={addressDraft.intNum} onChange={e => setAddressDraft(p => ({ ...p, intNum: e.target.value }))} placeholder="Opcional" /></div>
                                <div className={styles.field}><label className={styles.fieldLabel}>Colonia</label><input className={styles.fieldInput} value={addressDraft.colonia} onChange={e => setAddressDraft(p => ({ ...p, colonia: e.target.value }))} /></div>
                                <div className={styles.field}><label className={styles.fieldLabel}>Ciudad</label><input className={styles.fieldInput} value={addressDraft.city} onChange={e => setAddressDraft(p => ({ ...p, city: e.target.value }))} /></div>
                                <div className={styles.field}><label className={styles.fieldLabel}>Estado</label><input className={styles.fieldInput} value={addressDraft.state} onChange={e => setAddressDraft(p => ({ ...p, state: e.target.value }))} /></div>
                                <div className={styles.field}><label className={styles.fieldLabel}>Código Postal</label><input className={styles.fieldInput} value={addressDraft.zip} onChange={e => setAddressDraft(p => ({ ...p, zip: e.target.value }))} maxLength={5} /></div>
                                <div className={styles.field}><label className={styles.fieldLabel}>País</label><input className={styles.fieldInput} value={addressDraft.country} onChange={e => setAddressDraft(p => ({ ...p, country: e.target.value }))} /></div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setShowAddressModal(false)}>Cancelar</button><button className={styles.saveBtn} onClick={saveAddress}>💾 Guardar</button></div>
                    </div>
                </>
            )}

            {toast.message && <div className={`${styles.toast} ${!toast.visible ? styles.toastHidden : ''}`}>{toast.message}</div>}
        </>
    );
}
