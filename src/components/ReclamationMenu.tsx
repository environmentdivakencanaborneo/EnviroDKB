/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sprout, 
  Layers, 
  Plus, 
  Trash2, 
  Search, 
  Compass, 
  TrendingUp, 
  FolderPlus, 
  MapPin, 
  Check, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { NurseryRecord, ReclamationRecord, ReclamationGuaranteeRecord } from '../types';

interface ReclamationMenuProps {
  nurseryRecords: NurseryRecord[];
  reclamationRecords: ReclamationRecord[];
  guaranteeRecords: ReclamationGuaranteeRecord[];
  onAddNursery: (record: Omit<NurseryRecord, 'id' | 'syncStatus'>) => void;
  onDeleteNursery: (id: string) => void;
  onAddReclamation: (record: Omit<ReclamationRecord, 'id' | 'syncStatus'>, linkedNurseryReduction?: { id: string; amount: number }) => void;
  onDeleteReclamation: (id: string) => void;
  onAddGuarantee: (record: Omit<ReclamationGuaranteeRecord, 'id' | 'syncStatus'>) => void;
  onDeleteGuarantee: (id: string) => void;
  userAuthenticated: boolean;
  defaultSubMenu: 'nursery' | 'reclamation';
}

export default function ReclamationMenu({
  nurseryRecords,
  reclamationRecords,
  guaranteeRecords = [],
  onAddNursery,
  onDeleteNursery,
  onAddReclamation,
  onDeleteReclamation,
  onAddGuarantee,
  onDeleteGuarantee,
  userAuthenticated,
  defaultSubMenu
}: ReclamationMenuProps) {
  const [activeTab, setActiveTab] = useState<'nursery' | 'reclamation' | 'guarantee'>(defaultSubMenu as any);

  // --- 1. NURSERY STATE ---
  const [nurseryTanggal, setNurseryTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [nurserySpesiesSelect, setNurserySpesiesSelect] = useState('Sengon (Falcataria moluccana)');
  const [nurserySpesiesCustom, setNurserySpesiesCustom] = useState('');
  const nurserySpesies = nurserySpesiesSelect === 'Lainnya' ? nurserySpesiesCustom : nurserySpesiesSelect;

  const [nurseryJumlah, setNurseryJumlah] = useState<number>(1000);
  const [nurseryKondisi, setNurseryKondisi] = useState<'Sehat' | 'Kurang Sehat' | 'Mati'>('Sehat');
  const [nurserySemai, setNurserySemai] = useState(new Date().toISOString().split('T')[0]);
  const [nurseryTarget, setNurseryTarget] = useState('In-Pit Dump Blok Timur');
  const [nurserySearch, setNurserySearch] = useState('');

  // --- 2. RECLAMATION STATE ---
  const [recTanggal, setRecTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [recArea, setRecArea] = useState('Ex-Mining Pit A - Blok 1');
  const [recLuas, setRecLuas] = useState<number>(5.0);
  const [recTopsoil, setRecTopsoil] = useState<number>(40); // Standard is normally >30cm
  const [recSpesies, setRecSpesies] = useState('Centrosema (Cover), Sengon');
  const [recSlope, setRecSlope] = useState<'Selesai' | 'Dalam Proses' | 'Kritis'>('Dalam Proses');
  const [recProgress, setRecProgress] = useState<number>(50);
  const [recSearch, setRecSearch] = useState('');

  // --- 2B. LINKED NURSERY INTEGRATION STATE ---
  const [ambilDariNursery, setAmbilDariNursery] = useState(false);
  const [selectedNurseryId, setSelectedNurseryId] = useState('');
  const [jumlahAmbil, setJumlahAmbil] = useState<number>(0);

  // --- 3. RECLAMATION GUARANTEE STATE ---
  const [jamTahun, setJamTahun] = useState<number>(new Date().getFullYear());
  const [jamNilai, setJamNilai] = useState<number>(1000000000);
  const [jamTanggal, setJamTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jamBank, setJamBank] = useState('Bank Mandiri');
  const [jamStatus, setJamStatus] = useState<'Aktif' | 'Dicairkan' | 'Kedaluwarsa'>('Aktif');
  const [jamSearch, setJamSearch] = useState('');

  // Generate range tahun secara dinamis (2010 s/d Tahun Sekarang)
  const currentYear = new Date().getFullYear();
  const yearsRange = Array.from(
    { length: currentYear - 2010 + 1 }, 
    (_, i) => currentYear - i // Descending order (terbaru di atas)
  );

  // Submit Nursery
  const handleNurserySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNursery({
      tanggalInput: nurseryTanggal,
      namaSpesies: nurserySpesies,
      jumlahBibit: nurseryJumlah,
      kondisi: nurseryKondisi,
      tanggalSemai: nurserySemai,
      targetPenanaman: nurseryTarget
    });
    setNurseryJumlah(1000);
    setNurserySpesiesCustom('');
  };

  // Submit Reclamation
  const handleReclamationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSpesies = ambilDariNursery && selectedNurseryId 
      ? (() => {
          const selectedRecord = nurseryRecords.find(n => n.id === selectedNurseryId);
          if (selectedRecord) {
            return recSpesies ? `${recSpesies}, ${selectedRecord.namaSpesies}` : selectedRecord.namaSpesies;
          }
          return recSpesies;
        })()
      : recSpesies;

    onAddReclamation({
      tanggalPelaksanaan: recTanggal,
      areaBlok: recArea,
      luas: recLuas,
      ketebalanTopsoil: recTopsoil,
      spesiesDitanam: finalSpesies,
      statusPembentukanLereng: recSlope,
      rencanaKemajuan: recProgress
    }, ambilDariNursery && selectedNurseryId && jumlahAmbil > 0 ? { id: selectedNurseryId, amount: jumlahAmbil } : undefined);

    setRecProgress(50);
    setAmbilDariNursery(false);
    setSelectedNurseryId('');
    setJumlahAmbil(0);
  };

  // Submit Guarantee
  const handleGuaranteeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGuarantee({
      tahun: Number(jamTahun),
      nilaiJaminan: Number(jamNilai),
      tanggalPenyetoran: jamTanggal,
      bankPenjamin: jamBank,
      status: jamStatus
    });
    setJamNilai(1000000000);
    setJamBank('Bank Mandiri');
  };

  // Filter lists
  const filteredNursery = nurseryRecords.filter(r => 
    r.namaSpesies.toLowerCase().includes(nurserySearch.toLowerCase()) ||
    r.targetPenanaman.toLowerCase().includes(nurserySearch.toLowerCase())
  );

  const filteredReclamation = reclamationRecords.filter(r => 
    r.areaBlok.toLowerCase().includes(recSearch.toLowerCase()) ||
    r.spesiesDitanam.toLowerCase().includes(recSearch.toLowerCase())
  );

  const filteredGuarantee = (guaranteeRecords || []).filter(r => 
    String(r.tahun).includes(jamSearch) ||
    r.bankPenjamin.toLowerCase().includes(jamSearch.toLowerCase()) ||
    r.status.toLowerCase().includes(jamSearch.toLowerCase())
  );

  // Stats Nursery
  const totalBibitSehat = nurseryRecords
    .filter(r => r.kondisi === 'Sehat')
    .reduce((sum, r) => sum + r.jumlahBibit, 0);

  // Stats Reclamation
  const totalHectaresClaimed = reclamationRecords.reduce((sum, r) => sum + r.luas, 0);

  // Stats Guarantees
  const totalGuaranteeActive = (guaranteeRecords || [])
    .filter(r => r.status === 'Aktif')
    .reduce((sum, r) => sum + r.nilaiJaminan, 0);

  return (
    <div className="space-y-4 font-sans text-slate-300">
      
      {/* Header with Sub-menu toggles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Reklamasi Lahan Tambang Batubara</h2>
          <p className="text-[11px] text-slate-400">Mencakup pembenihan bibit (Nursery) hingga proses revegetasi, penataan tanah, dan stabilisasi lereng disposal.</p>
        </div>

        {/* Sub-menu Toggle Buttons */}
        <div className="flex bg-[#121620] p-1 rounded-lg border border-slate-800 shrink-0 select-none">
          <button
            onClick={() => setActiveTab('nursery')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded transition-all tracking-wider uppercase cursor-pointer ${
              activeTab === 'nursery'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Nursery</span>
          </button>
          <button
            onClick={() => setActiveTab('reclamation')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded transition-all tracking-wider uppercase cursor-pointer ${
              activeTab === 'reclamation'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Reklamasi</span>
          </button>
          <button
            onClick={() => setActiveTab('guarantee')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded transition-all tracking-wider uppercase cursor-pointer ${
              activeTab === 'guarantee'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Jaminan</span>
          </button>
        </div>
      </div>

      {/* --- SUBMENU 1: MANAGEMENT NURSERY --- */}
      {activeTab === 'nursery' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Nursery Entry Form */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="lg:col-span-1 bg-[#0F131A] p-4 rounded-lg border border-slate-800/85 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Sprout className="w-4.5 h-4.5 text-emerald-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pencatatan Bibit Nursery</h3>
            </div>

            <form onSubmit={handleNurserySubmit} className="space-y-3">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Input</label>
                <input 
                  type="date" 
                  required 
                  value={nurseryTanggal}
                  onChange={(e) => setNurseryTanggal(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spesies Spesifik Tanaman</label>
                <select
                  value={nurserySpesiesSelect}
                  onChange={(e) => setNurserySpesiesSelect(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Sengon (Falcataria moluccana)">Sengon (Falcataria moluccana) - Cepat Tumbuh</option>
                  <option value="Acacia mangium">Acacia mangium - Pionir Pengikat Nitrogen</option>
                  <option value="Kayu Putih (Melaleuca leucadendra)">Kayu Putih (Melaleuca leucadendra) - Daya Tahan Tinggi</option>
                  <option value="Trembesi (Albizia saman)">Trembesi (Albizia saman) - Peneduh Lebar</option>
                  <option value="Mahoni (Swietenia mahagoni)">Mahoni (Swietenia mahagoni) - Kehutanan Keras</option>
                  <option value="Lainnya">Lainnya (Isi Manual)...</option>
                </select>

                {nurserySpesiesSelect === 'Lainnya' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1"
                  >
                    <input
                      type="text"
                      placeholder="Masukkan nama spesies spesifik..."
                      required
                      value={nurserySpesiesCustom}
                      onChange={(e) => setNurserySpesiesCustom(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#0E111A] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Off-Shoot</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={nurseryJumlah}
                    onChange={(e) => setNurseryJumlah(parseInt(e.target.value) || 0)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kondisi Bibit</label>
                  <select
                    value={nurseryKondisi}
                    onChange={(e) => setNurseryKondisi(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 focus:outline-none"
                  >
                    <option value="Sehat">Sehat</option>
                    <option value="Kurang Sehat">Kurang Sehat</option>
                    <option value="Mati">Mati (Kering/Penyakit)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Penyemaian</label>
                <input 
                  type="date" 
                  required 
                  value={nurserySemai}
                  onChange={(e) => setNurserySemai(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Area Penanaman</label>
                <input 
                  type="text" 
                  placeholder="Block / Zone target..." 
                  required 
                  value={nurseryTarget}
                  onChange={(e) => setNurseryTarget(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan ke Nursery</span>
              </button>
            </form>
          </motion.div>

          {/* Nursery Inventory List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Inventaris Bibit Aktif</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Total Bibit Sehat Siap Tanam: <span className="text-emerald-400 font-bold">{totalBibitSehat.toLocaleString()}</span> bibit</p>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-505 absolute left-2.5 top-2" />
                  <input 
                    type="text" 
                    placeholder="Cari jenis bibit / target..." 
                    value={nurserySearch}
                    onChange={(e) => setNurserySearch(e.target.value)}
                    className="pl-8 pr-3 py-1 w-52 rounded-md border border-slate-800 text-[11px] bg-[#121620] text-slate-100 placeholder-slate-505 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-[#141A25]">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#131722] text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-1.5 px-3">Spesies Tanaman</th>
                      <th className="text-right py-1.5 px-3">Jumlah</th>
                      <th className="py-1.5 px-3">Kondisi</th>
                      <th className="py-1.5 px-3">Tanggal Semai</th>
                      <th className="py-1.5 px-3">Target Penanaman</th>
                      <th className="py-1.5 px-3">Tanggal Input</th>
                      {userAuthenticated && <th className="text-center py-1.5 px-2">Cloud</th>}
                      <th className="text-center py-1.5 px-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredNursery.length > 0 ? (
                      filteredNursery.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 text-slate-300 font-mono">
                          <td className="py-1 px-3 font-semibold text-slate-200 font-sans">{r.namaSpesies}</td>
                          <td className="py-1 px-3 text-right font-bold text-white">{r.jumlahBibit.toLocaleString()}</td>
                          <td className="py-1 px-3 font-sans">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              r.kondisi === 'Sehat' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              r.kondisi === 'Kurang Sehat' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {r.kondisi}
                            </span>
                          </td>
                          <td className="py-1 px-3 whitespace-nowrap text-slate-400">{r.tanggalSemai}</td>
                          <td className="py-1 px-3 font-medium whitespace-nowrap text-slate-300 font-sans">{r.targetPenanaman}</td>
                          <td className="py-1 px-3 text-slate-500 whitespace-nowrap">{r.tanggalInput}</td>
                          {userAuthenticated && (
                            <td className="py-1 px-2 text-center font-sans">
                              {r.syncStatus === 'synced' ? (
                                <span className="inline-flex items-center text-emerald-400 font-bold" title="Synced">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              ) : (
                                <span className="text-amber-500 text-[8px] uppercase font-bold">Lokal</span>
                              )}
                            </td>
                          )}
                          <td className="py-1 px-3 text-center font-sans">
                            <button 
                              onClick={() => onDeleteNursery(r.id)} 
                              className="p-1 text-slate-505 hover:text-red-400 hover:bg-red-550/10 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={userAuthenticated ? 8 : 7} className="p-6 text-center text-slate-500 font-sans font-normal">
                          Belum ada bibit terdaftar di nursery.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBMENU 2: MANAGEMENT REKLAMASI --- */}
      {activeTab === 'reclamation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Reclamation Entry Form */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="lg:col-span-1 bg-[#0F131A] p-4 rounded-lg border border-slate-800/85 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Layers className="w-4.5 h-4.5 text-emerald-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Pencatatan Reklamasi Tambang</h3>
            </div>

            <form onSubmit={handleReclamationSubmit} className="space-y-3">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Pelaksanaan</label>
                <input 
                  type="date" 
                  required 
                  value={recTanggal}
                  onChange={(e) => setRecTanggal(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Area / Blok Tambang</label>
                <input 
                  type="text" 
                  placeholder="EX: Ex-Mining Pit A West, disposal Utara..." 
                  required 
                  value={recArea}
                  onChange={(e) => setRecArea(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Luas Area (Hektar)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    required 
                    value={recLuas}
                    onChange={(e) => setRecLuas(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topsoil (cm)</label>
                  <input 
                    type="number" 
                    step="1" 
                    min="0" 
                    required 
                    value={recTopsoil}
                    onChange={(e) => setRecTopsoil(parseInt(e.target.value) || 0)}
                    className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                      recTopsoil < 30 
                        ? 'bg-[#2E2015] border-amber-500/40 text-amber-200' 
                        : 'bg-[#121620] border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="p-3 bg-[#131620] border border-slate-800/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Keluarkan dari Nursery?</span>
                    <span className="text-[9px] text-slate-500 block">Kurangi inventaris semai aktif</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={ambilDariNursery}
                    onChange={(e) => {
                      setAmbilDariNursery(e.target.checked);
                      if (e.target.checked && nurseryRecords.length > 0) {
                        const firstValid = nurseryRecords.find(n => n.jumlahBibit > 0);
                        if (firstValid) {
                          setSelectedNurseryId(firstValid.id);
                          setJumlahAmbil(Math.min(100, firstValid.jumlahBibit));
                        }
                      } else {
                        setSelectedNurseryId('');
                        setJumlahAmbil(0);
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-[#0E111A] cursor-pointer"
                  />
                </div>

                {ambilDariNursery && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 pt-2 border-t border-slate-800/60"
                  >
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Bibit di Nursery</label>
                      <select
                        value={selectedNurseryId}
                        onChange={(e) => {
                          setSelectedNurseryId(e.target.value);
                          const chosen = nurseryRecords.find(n => n.id === e.target.value);
                          if (chosen) {
                            setJumlahAmbil(Math.min(100, chosen.jumlahBibit));
                          }
                        }}
                        className="w-full text-xs px-2 py-1.5 bg-[#0E1117] border border-slate-700 rounded text-slate-200 focus:outline-none"
                      >
                        {nurseryRecords.filter(n => n.jumlahBibit > 0).map(n => (
                          <option key={n.id} value={n.id}>
                            {n.namaSpesies} (Sisa: {n.jumlahBibit} bibit)
                          </option>
                        ))}
                        {nurseryRecords.filter(n => n.jumlahBibit > 0).length === 0 && (
                          <option value="">Tidak ada stok nursery tersedia</option>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">Jumlah Keluar</span>
                        {selectedNurseryId && (
                          <span className="text-slate-505 font-mono">
                            Maks: {nurseryRecords.find(n => n.id === selectedNurseryId)?.jumlahBibit || 0}
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={selectedNurseryId ? (nurseryRecords.find(n => n.id === selectedNurseryId)?.jumlahBibit || 1) : 1}
                        value={jumlahAmbil}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const maxVal = selectedNurseryId ? (nurseryRecords.find(n => n.id === selectedNurseryId)?.jumlahBibit || 1) : 1;
                          setJumlahAmbil(Math.min(maxVal, Math.max(1, val)));
                        }}
                        className="w-full text-xs px-2 py-1 bg-[#0E1117] border border-slate-700 rounded text-white focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Spesies Ditanam</label>
                <input 
                  type="text" 
                  placeholder="EX: Humus Centrosema, Sengon, Mahoni" 
                  required 
                  value={recSpesies}
                  onChange={(e) => setRecSpesies(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelandaian Lereng</label>
                <select
                  value={recSlope}
                  onChange={(e) => setRecSlope(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 focus:outline-none"
                >
                  <option value="Selesai">Selesai (Sudah Rata & Stabil)</option>
                  <option value="Dalam Proses">Dalam Proses (Sedang Di-grading)</option>
                  <option value="Kritis">Kritis (Slope Curam / Erosi)</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Rencana Kemajuan</span>
                  <span className="text-emerald-400 font-mono">{recProgress}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={recProgress}
                  onChange={(e) => setRecProgress(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#12161E] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <button 
                type="submit" 
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Reklamasi</span>
              </button>
            </form>
          </motion.div>

          {/* Reclamation Records List */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Topsoil standard warning panel if some entries are below standard */}
            {reclamationRecords.some(r => r.ketebalanTopsoil < 30) && (
              <div className="bg-[#2E2015] p-3 rounded-lg border border-amber-500/10 text-amber-300 flex items-start gap-2.5 text-[11px] leading-relaxed font-sans">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wide text-amber-200">Audit Ketebalan Tanah Pucuk (Topsoil)</p>
                  <p className="text-amber-400/80 mt-0.5">Sesuai regulasi ESDM batubara, standar minimum ketebalan topsoil penataan tanah adalah &ge;30 cm. Beberapa catatan area operasional terindikasi berada di bawah ambang kepatuhan ini.</p>
                </div>
              </div>
            )}

            <div className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Status Pekerjaan Reklamasi Lahan</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Total Luas Kumulatif: <span className="text-emerald-400 font-bold">{totalHectaresClaimed.toFixed(2)}</span> Hektar</p>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  <input 
                    type="text" 
                    placeholder="Cari area / spesies..." 
                    value={recSearch}
                    onChange={(e) => setRecSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 w-52 rounded-md border border-slate-800 text-[11px] bg-[#121620] text-slate-100 placeholder-slate-505 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-[#141A25]">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#131722] text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-1.5 px-3">Area / Blok</th>
                      <th className="text-right py-1.5 px-3">Luas (Ha)</th>
                      <th className="text-right py-1.5 px-3">Topsoil</th>
                      <th className="py-1.5 px-3">Spesies Penutup</th>
                      <th className="py-1.5 px-3">Status Lereng</th>
                      <th className="py-1.5 px-3">Progress</th>
                      {userAuthenticated && <th className="text-center py-1.5 px-2">Cloud</th>}
                      <th className="text-center py-1.5 px-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredReclamation.length > 0 ? (
                      filteredReclamation.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 text-slate-300 font-mono">
                          <td className="py-1 px-3 font-semibold text-slate-200 font-sans">{r.areaBlok}</td>
                          <td className="py-1 px-3 text-right font-medium text-slate-200">{r.luas.toFixed(2)} Ha</td>
                          <td className={`py-1 px-3 text-right font-bold ${
                            r.ketebalanTopsoil < 30 ? 'text-amber-400 bg-amber-950/20' : 'text-slate-300'
                          }`}>{r.ketebalanTopsoil} cm</td>
                          <td className="py-1 px-3 text-slate-400 max-w-[130px] truncate font-sans" title={r.spesiesDitanam}>{r.spesiesDitanam}</td>
                          <td className="py-1 px-3 whitespace-nowrap font-sans">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              r.statusPembentukanLereng === 'Selesai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              r.statusPembentukanLereng === 'Dalam Proses' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                            }`}>
                              {r.statusPembentukanLereng}
                            </span>
                          </td>
                          <td className="py-1 px-3 whitespace-nowrap font-sans">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 bg-slate-900 h-1.5 rounded overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: `${r.rencanaKemajuan}%` }}></div>
                              </div>
                              <span className="font-bold text-[9px] font-mono">{r.rencanaKemajuan}%</span>
                            </div>
                          </td>
                          {userAuthenticated && (
                            <td className="py-1 px-2 text-center font-sans">
                              {r.syncStatus === 'synced' ? (
                                <span className="inline-flex items-center text-emerald-400 font-bold" title="Synced">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              ) : (
                                <span className="text-amber-500 text-[8px] uppercase font-bold">Lokal</span>
                              )}
                            </td>
                          )}
                          <td className="py-1 px-2 text-center font-sans">
                            <button 
                              onClick={() => onDeleteReclamation(r.id)} 
                              className="p-1 text-slate-505 hover:text-red-400 hover:bg-red-550/10 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={userAuthenticated ? 8 : 7} className="p-6 text-center text-slate-500 font-sans font-normal">
                          Belum ada blok reklamasi terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBMENU 3: MANAGEMENT JAMINAN REKLAMASI --- */}
      {activeTab === 'guarantee' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Guarantee Entry Form */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="lg:col-span-1 bg-[#0F131A] p-4 rounded-lg border border-slate-800/85 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Compass className="w-4.5 h-4.5 text-emerald-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Penyetoran Jaminan Reklamasi</h3>
            </div>

            <form onSubmit={handleGuaranteeSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left block">Tahun Jaminan</label>
                <select
                  value={jamTahun}
                  onChange={(e) => setJamTahun(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 focus:outline-none"
                >
                  {yearsRange.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left block">Nilai Jaminan (Rupiah)</label>
                <input 
                  type="number" 
                  min="0" 
                  required 
                  value={jamNilai}
                  onChange={(e) => setJamNilai(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 font-mono italic">
                  Format rupiah: Rp {jamNilai.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">Tanggal Penyetoran</label>
                  <input 
                    type="date" 
                    required 
                    value={jamTanggal}
                    onChange={(e) => setJamTanggal(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">Bank Penjamin / Penerbit</label>
                <input 
                  type="text" 
                  placeholder="EX: Bank Mandiri (Persero) Tbk, BNI, BCA..." 
                  required 
                  value={jamBank}
                  onChange={(e) => setJamBank(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">Status Jaminan</label>
                <select
                  value={jamStatus}
                  onChange={(e) => setJamStatus(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 focus:outline-none"
                >
                  <option value="Aktif">Aktif (Garansi Berlaku)</option>
                  <option value="Dicairkan">Dicairkan (Untuk Rehabilitasi)</option>
                  <option value="Kedaluwarsa">Kedaluwarsa (Telah Selesai)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Garansi Jaminan</span>
              </button>
            </form>
          </motion.div>

          {/* Guarantee records table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats summary banner */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#10141D] p-3 rounded-lg border border-slate-800/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Total Dana Jaminan Aktif</span>
                <span className="text-sm font-bold text-emerald-400 font-mono tracking-tight block">
                  Rp {totalGuaranteeActive.toLocaleString('id-ID')}
                </span>
                <span className="text-[8px] text-slate-500 block">Penjaminan reklamasi berjalan</span>
              </div>
              <div className="bg-[#10141D] p-3 rounded-lg border border-slate-800/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Keandalan Fiskal Reklamasi</span>
                <span className="text-sm font-bold text-white font-mono block">
                  {guaranteeRecords.length} Garansi
                </span>
                <span className="text-[8px] text-slate-500 block">Kompilasi dana jaminan teraudit</span>
              </div>
            </div>

            <div className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Laporan Neraca Jaminan Reklamasi</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Penetapan dana jaminan penutupan tambang per tahun sesuai izin IUP.</p>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  <input 
                    type="text" 
                    placeholder="Cari tahun / bank / status..." 
                    value={jamSearch}
                    onChange={(e) => setJamSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 w-52 rounded-md border border-slate-800 text-[11px] bg-[#121620] text-slate-100 placeholder-slate-505 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto rounded-lg border border-[#141A25]">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#131722] text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-1.5 px-3">ID Jaminan</th>
                      <th className="py-1.5 px-3">Tahun</th>
                      <th className="py-1.5 px-3 text-right">Nilai Jaminan</th>
                      <th className="py-1.5 px-3">Tanggal Setor</th>
                      <th className="py-1.5 px-3">Bank Penjamin</th>
                      <th className="py-1.5 px-3">Status</th>
                      {userAuthenticated && <th className="text-center py-1.5 px-2">Cloud</th>}
                      <th className="text-center py-1.5 px-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredGuarantee.length > 0 ? (
                      filteredGuarantee.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 text-slate-300 font-mono">
                          <td className="py-1.5 px-2 font-semibold text-slate-400">{r.id}</td>
                          <td className="py-1.5 px-3 text-white font-sans font-bold">{r.tahun}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-400">
                            Rp {r.nilaiJaminan.toLocaleString('id-ID')}
                          </td>
                          <td className="py-1.5 px-3 text-slate-400">{r.tanggalPenyetoran}</td>
                          <td className="py-1.5 px-3 text-slate-300 font-sans font-medium">{r.bankPenjamin}</td>
                          <td className="py-1.5 px-3 font-sans">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              r.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              r.status === 'Dicairkan' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          {userAuthenticated && (
                            <td className="py-1.5 px-2 text-center font-sans">
                              {r.syncStatus === 'synced' ? (
                                <span className="inline-flex items-center text-emerald-400 font-bold" title="Synced">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              ) : (
                                <span className="text-amber-500 text-[8px] uppercase font-bold">Lokal</span>
                              )}
                            </td>
                          )}
                          <td className="py-1.5 px-3 text-center font-sans">
                            <button 
                              onClick={() => onDeleteGuarantee(r.id)} 
                              className="p-1 text-slate-505 hover:text-red-400 hover:bg-red-550/10 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={userAuthenticated ? 8 : 7} className="p-6 text-center text-slate-505 font-sans font-normal">
                          Belum ada garansi jaminan terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}