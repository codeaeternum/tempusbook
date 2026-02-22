'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Smartphone, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { fetchWithAuth } from '@/providers/AuthProvider';
import Header from '@/components/layout/Header';
import { ROOT_BUSINESS_ID as BUSINESS_ID } from '@aeternasuite/shared-constants';
import Modal from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

export type DeviceType = 'PHONE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'CONSOLE' | 'OTHER';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}

export interface Device {
    id: string;
    businessId: string;
    clientId: string;
    deviceType: DeviceType;
    brand: string;
    model: string;
    serialNumber?: string;
    imei?: string;
    passwordPin?: string;
    color?: string;
    notes?: string;
    client?: User;
}

export default function DevicesPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [clients, setClients] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        clientId: '',
        deviceType: 'PHONE' as DeviceType,
        brand: '',
        model: '',
        serialNumber: '',
        imei: '',
        passwordPin: '',
        color: '',
        notes: ''
    });

    // Masked Password State map (deviceId -> isVisible)
    const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const resDevices = await fetchWithAuth(`http://localhost:3001/api/v1/devices/business/${BUSINESS_ID}`);
            const resClients = await fetchWithAuth(`http://localhost:3001/api/v1/businesses/${BUSINESS_ID}/clients`);

            if (resDevices.ok && resClients.ok) {
                const fetchedDevices = await resDevices.json();
                const fetchedClients = await resClients.json();
                setDevices(fetchedDevices);
                setClients(fetchedClients);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (device?: Device) => {
        if (device) {
            setEditingDevice(device);
            setFormData({
                clientId: device.clientId,
                deviceType: device.deviceType,
                brand: device.brand,
                model: device.model,
                serialNumber: device.serialNumber || '',
                imei: device.imei || '',
                passwordPin: device.passwordPin || '',
                color: device.color || '',
                notes: device.notes || ''
            });
        } else {
            setEditingDevice(null);
            setFormData({
                clientId: '',
                deviceType: 'PHONE',
                brand: '',
                model: '',
                serialNumber: '',
                imei: '',
                passwordPin: '',
                color: '',
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData, businessId: BUSINESS_ID };

            if (editingDevice) {
                const res = await fetchWithAuth(`http://localhost:3001/api/v1/devices/${editingDevice.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) toast.success('Dispositivo actualizado exitosamente');
            } else {
                const res = await fetchWithAuth(`http://localhost:3001/api/v1/devices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) toast.success('Dispositivo registrado exitosamente');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving device:', error);
            toast.error('Error al guardar el dispositivo');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este registro?')) {
            try {
                await fetchWithAuth(`http://localhost:3001/api/v1/devices/${id}`, { method: 'DELETE' });
                toast.success('Dispositivo eliminado');
                fetchData();
            } catch (error) {
                console.error('Error deleting device:', error);
                toast.error('Error al eliminar');
            }
        }
    };

    const togglePinVisibility = (id: string) => {
        setVisiblePins(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredDevices = devices.filter(d =>
        d.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.client?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Header
                title="Equipos en Reparación"
                subtitle="Expedientes técnicos de celulares y computadoras"
                actions={
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Nuevo Equipo</button>
                }
            />
            <div className="p-6">
                <div className="bg-zinc-800/50 rounded-xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente, marca o modelo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dispositivo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Identificadores</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Seguridad (PIN)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Cargando dispositivos...</td>
                                    </tr>
                                ) : filteredDevices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No se encontraron equipos registrados</td>
                                    </tr>
                                ) : (
                                    filteredDevices.map(device => (
                                        <tr key={device.id} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">
                                                    {device.client?.firstName} {device.client?.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500">{device.client?.phone || device.client?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Smartphone size={16} className="text-indigo-400 mr-2" />
                                                    <span className="text-sm text-gray-300">{device.brand} {device.model} <span className="text-xs text-gray-500">({device.color})</span></span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs text-gray-400">SN: {device.serialNumber || 'N/A'}</div>
                                                <div className="text-xs text-gray-400">IMEI: {device.imei || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <div className="px-3 py-1 bg-zinc-900 border border-white/10 rounded font-mono text-sm tracking-widest text-emerald-400">
                                                        {device.passwordPin ? (visiblePins[device.id] ? device.passwordPin : '••••••') : 'N/A'}
                                                    </div>
                                                    {device.passwordPin && (
                                                        <button
                                                            onClick={() => togglePinVisibility(device.id)}
                                                            className="p-1 -ml-1 text-gray-500 hover:text-white transition-colors"
                                                            title={visiblePins[device.id] ? "Ocultar PIN" : "Mostrar PIN"}
                                                        >
                                                            {visiblePins[device.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleOpenModal(device)}
                                                    className="text-indigo-400 hover:text-indigo-300 mr-3"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(device.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDevice ? 'Editar Equipo' : 'Nuevo Equipo en Reparación'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Cliente Propietario</label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">Seleccione un cliente...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.firstName} {client.lastName} {client.phone ? `(${client.phone})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Tipo Identificador</label>
                            <select
                                required
                                value={formData.deviceType}
                                onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as DeviceType })}
                                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="PHONE">Teléfono Celular</option>
                                <option value="TABLET">Tablet / iPad</option>
                                <option value="LAPTOP">Laptop / Portátil</option>
                                <option value="DESKTOP">Computadora Escritorio</option>
                                <option value="CONSOLE">Consola Videojuegos</option>
                                <option value="OTHER">Otro Electrónico</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Marca</label>
                            <input
                                type="text"
                                required
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Ej: Apple, Samsung"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Modelo Exacto</label>
                            <input
                                type="text"
                                required
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Ej: iPhone 14 Pro Max"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Color / Distintivo</label>
                            <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Gris Espacial con funda azul"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">IMEI (Opcional)</label>
                            <input
                                type="text"
                                value={formData.imei}
                                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono"
                                placeholder="15 dígitos..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Número de Serie (Opcional)</label>
                            <input
                                type="text"
                                value={formData.serialNumber}
                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-rose-400 mb-1">PIN / Patrón de Desbloqueo 🔒</label>
                            <input
                                type="text"
                                value={formData.passwordPin}
                                onChange={(e) => setFormData({ ...formData, passwordPin: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-900 border border-rose-500/30 rounded-lg text-white focus:outline-none focus:border-rose-500"
                                placeholder="123456 o 'Z invertida desde arriba'..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Este dato es sensible. Solo utilícelo bajo consentimiento del cliente.</p>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Condiciones Visuales y Notas</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Display quebrado, botones volumen no sirven..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-white/5 space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            {editingDevice ? 'Guardar Cambios' : 'Ingresar Equipo'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
