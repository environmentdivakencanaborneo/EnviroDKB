/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Droplet, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  CloudRain, 
  CloudLightning,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { EnvironmentalRecord } from '../types';

interface EnvironmentalMenuProps {
  records: EnvironmentalRecord[];
  onAddRecord: (record: Omit<EnvironmentalRecord, 'id' | 'syncStatus'>) => void;
  onDeleteRecord: (id: string) => void;
  userAuthenticated: boolean;
}

const getRainIntensity = (mm: number) => {
  if (mm <= 0) return { label: 'Cerah / Tanpa Hujan', color: 'bg-slate-900 border-slate-800 text-slate-500' };
  if (mm <= 5) return { label: 'Hujan Sangat Ringan (Gerimis)', color: 'bg-indigo-950/40 border-indigo-950/60 text-indigo-400' };
  if (mm <= 20) return { label: 'Hujan Ringan', color: 'bg-blue-950/40 border-blue-900/65 text-blue-400' };
  if (mm <= 50) return { label: 'Hujan Sedang', color: 'bg-emerald-950/35 border-emerald-900/50 text-emerald-400' };
  if (mm <= 100) return { label: 'Hujan Lebat', color: 'bg-amber-950/40 border-amber-900/55 text-amber-400 animate-pulse' };
  return { label: 'Hujan Sangat Lebat', color: 'bg-red-950/50 border-red-900 text-red-400 animate-pulse' };
};

export default function EnvironmentalMenu({
  records,
  onAddRecord,
  onDeleteRecord,
  userAuthenticated,
}: EnvironmentalMenuProps) {
  // Input states
  const [activeInputTab, setActiveInputTab] = useState<'air_limbah' | 'curah_hujan'>('air_limbah');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [pH, setPH] = useState<number>(7.0);
  const [TSS, setTSS] = useState<number>(50);
  const [debit, setDebit] = useState<number>(1000);
  const [koagulan, setKoagulan] = useState('PAC (Poly Aluminium Chloride)');
  const [koagulanAmount, setKoagulanAmount] = useState<number>(20);
  const [curahHujan, setCurahHujan] = useState<number>(5.0);
  const [durasiHujan, setDurasiHujan] = useState<number>(1.0);
  const [lokasi, setLokasi] = useState(''); 
  const [stasiunHujan, setStasiunHujan] = useState(''); 
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeInputTab === 'air_limbah') {
      if (!lokasi.trim()) {
        alert('Silakan masukkan lokasi pemantauan terlebih dahulu.');
        return;
      }
      onAddRecord({
        tanggal,
        pH,
        TSS,
        debit,
        koagulan,
        koagulanAmount,
        curahHujan: 0,
        durasiHujan: 0,
        lokasi: lokasi.trim(),
      });
      // Reset values to defaults
      setPH(7.0);
      setTSS(50);
      setDebit(1000);
      setKoagulanAmount(20);
      setLokasi('');
    } else {
      if (!stasiunHujan.trim()) {
        alert('Silakan masukkan lokasi stasiun hujan terlebih dahulu.');
        return;
      }
      onAddRecord({
        tanggal,
        pH: 0, // Indicates rainfall/station only, no water chemistry
        TSS: 0,
        debit: 0,
        koagulan: 'Tidak Ada / N/A',
        koagulanAmount: 0,
        curahHujan,
        durasiHujan,
        lokasi: stasiunHujan.trim(),
      });
      // Reset values to defaults
      setCurahHujan(5.0);
      setDurasiHujan(1.0);
      setStasiunHujan('');
    }
  };

  const [activeListTab, setActiveListTab] = useState<'air_limbah' | 'curah_hujan'>('air_limbah');

  // Filter and split records cleanly to separate wastewater chemistry from rain data
  const waterRecordsOnly = records.filter(r => r.pH !== undefined && r.pH > 0);
  const rainRecordsOnly = records.filter(r => r.curahHujan !== undefined && r.curahHujan > 0);

  const filteredWaterRecords = waterRecordsOnly.filter(r => 
    r.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.koagulan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRainRecords = rainRecordsOnly.filter(r => 
    r.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lastWaterRecord = waterRecordsOnly[waterRecordsOnly.length - 1];
  const complianceStatus = lastWaterRecord 
    ? (lastWaterRecord.pH >= 6.0 && lastWaterRecord.pH <= 9.0 && lastWaterRecord.TSS <= 200)
    : true;

  return (
    <div className="space-y-4 font-sans text-slate-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Pengolahan & Pemantauan Lingkungan Air</h2>
          <p className="text-[11px] text-slate-400">Pemantauan kualitas air penyaliran tambang (pH & TSS), debit saluran, dosis koagulan, serta curah hujan.</p>
        </div>
        
        {/* Compliance Guard Indicator */}
        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border text-[11px] font-medium shrink-0 ${
          complianceStatus 
            ? 'bg-[#13231F] text-emerald-400 border-emerald-500/20' 
            : 'bg-[#2D1B22] text-red-400 border-red-500/20'
        }`}>
          {complianceStatus ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[9px] leading-tight">STATUS BAKU MUTU</p>
                <p className="text-[10px] text-emerald-500 font-mono">PATUH KEPMEN LH 113/2003</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[9px] leading-tight text-red-400">TERDAPAT DEVIASI</p>
                <p className="text-[10px] text-red-400 font-mono">MELEBIHI BAKU MUTU</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Input Form Column */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="lg:col-span-1 bg-[#0F131A] p-4 rounded-lg border border-slate-800/80 space-y-4 h-fit"
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Droplet className="w-4.5 h-4.5 text-emerald-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Form Input Lapangan</h3>
            </div>
            
            {/* Elegant Tab Selector */}
            <div className="flex bg-[#121620] p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveInputTab('air_limbah')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeInputTab === 'air_limbah'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Droplet className="w-3.5 h-3.5 shrink-0" />
                Air Limbah
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('curah_hujan')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeInputTab === 'curah_hujan'
                    ? 'bg-[#0284c7] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 shrink-0" />
                Curah Hujan
              </button>
            </div>
          </div>

          <form id="form-env-monitoring" onSubmit={handleSubmit} className="space-y-3">
            
            {/* Shared Field: Tanggal */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Pemantauan</label>
              <input 
                type="date" 
                required 
                value={tanggal} 
                onChange={(e) => setTanggal(e.target.value)}
                className={`w-full text-xs px-2.5 py-1.5 rounded-lg border bg-[#121620] text-white focus:outline-none focus:ring-1 ${
                  activeInputTab === 'air_limbah' 
                    ? 'border-slate-700 focus:ring-emerald-500 focus:border-emerald-500' 
                    : 'border-slate-700 focus:ring-sky-500 focus:border-sky-500'
                }`}
              />
            </div>

            {/* TAB CONTENT 1: AIR LIMBAH */}
            {activeInputTab === 'air_limbah' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Pemantauan</label>
                  <input 
                    type="text"
                    required
                    placeholder="Masukkan lokasi pemantauan..."
                    value={lokasi} 
                    onChange={(e) => setLokasi(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* pH & TSS */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai pH</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="14" 
                      required
                      value={pH} 
                      onChange={(e) => setPH(parseFloat(e.target.value) || 0)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                        pH < 6.0 || pH > 9.0 
                          ? 'bg-red-500/10 border-red-500/40 text-red-200 focus:ring-red-500' 
                          : 'bg-[#121620] border-slate-700 text-white focus:border-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TSS (mg/L)</label>
                    <input 
                      type="number" 
                      step="1" 
                      min="0" 
                      required
                      value={TSS} 
                      onChange={(e) => setTSS(parseInt(e.target.value) || 0)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                        TSS > 200 
                          ? 'bg-[#2D1B22] border-red-500/40 text-red-200 focus:border-red-500' 
                          : 'bg-[#121620] border-slate-700 text-white focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Debit */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Debit (m³/hari)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    required
                    value={debit} 
                    onChange={(e) => setDebit(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Koagulan Type & Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Koagulan yang Dipakai</label>
                  <select 
                    value={koagulan} 
                    onChange={(e) => setKoagulan(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 focus:outline-none"
                  >
                    <option value="PAC (Poly Aluminium Chloride)">PAC (Poly Aluminium Chloride)</option>
                    <option value="Alum (Aluminium Sulfate)">Alum (Aluminium Sulfate)</option>
                    <option value="Polymer anionic">Polymer anionic</option>
                    <option value="Kapur Tohor (Lime)">Kapur Tohor (Lime - Calcium Oxide)</option>
                    <option value="PAC + Kapur Tohor">PAC + Kapur Tohor (Dual Neutralizer)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Koagulan (kg)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    required
                    value={koagulanAmount} 
                    onChange={(e) => setKoagulanAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: CURAH HUJAN */}
            {activeInputTab === 'curah_hujan' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <CloudLightning className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Lokasi Stasiun Hujan
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Masukkan lokasi stasiun hujan..."
                    value={stasiunHujan} 
                    onChange={(e) => setStasiunHujan(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curah Hujan (mm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      required
                      value={curahHujan} 
                      onChange={(e) => setCurahHujan(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durasi Hujan (jam)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      required
                      value={durasiHujan} 
                      onChange={(e) => setDurasiHujan(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Rain Info Badge */}
                <div className="pt-0.5">
                  {(() => {
                    const intensity = getRainIntensity(curahHujan);
                    return (
                      <div className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-medium flex items-center justify-between transition ${intensity.color}`}>
                        <span className="font-bold uppercase tracking-wider">Status Hujan:</span>
                        <span>{intensity.label} ({curahHujan} mm)</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer font-sans shadow-sm ${
                activeInputTab === 'air_limbah'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan Data</span>
            </button>
          </form>
        </motion.div>

        {/* Data List & Regulation Details Column */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Regulatory Information Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-[#101725] p-4 rounded-lg text-slate-200 flex flex-col md:flex-row gap-3 items-start justify-between border border-slate-800">
            <div className="space-y-1 text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Regulasi Kepmen LH 113/2003
              </span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Standar Air Buangan Tambang Batubara</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">Setiap efluen dari sediment pond wajib dipantau dan dikendalikan demi menjaga kelestarian ekosistem sungai sekitar operasional PT Diva Kencana Borneo.</p>
            </div>
            <div className="flex gap-2 shrink-0 font-sans text-center">
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800 min-w-[65px]">
                <p className="text-slate-500 text-[8px] uppercase tracking-wider font-bold">Standard pH</p>
                <p className="text-emerald-400 font-bold text-xs mt-1 font-mono">6.0 - 9.0</p>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800 min-w-[65px]">
                <p className="text-slate-500 text-[8px] uppercase tracking-wider font-bold">Max TSS</p>
                <p className="text-indigo-400 font-bold text-xs mt-1 font-mono">200 mg/L</p>
              </div>
            </div>
          </div>
          {/* Historical Data Table */}
          <div className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-800/80">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Histori Data Lingkungan</h3>
                
                {/* Mini List Tab Switcher */}
                <div className="flex bg-[#121620] p-0.5 rounded-md border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveListTab('air_limbah')}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${
                      activeListTab === 'air_limbah'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Air Limbah
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveListTab('curah_hujan')}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${
                      activeListTab === 'curah_hujan'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Curah Hujan
                  </button>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input 
                  type="text" 
                  placeholder={activeListTab === 'air_limbah' ? "Cari lokasi/koagulan..." : "Cari stasiun hujan..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 w-52 rounded-md border border-slate-800 text-[11px] bg-[#121620] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {activeListTab === 'air_limbah' ? (
              <>
                {/* 1. WATER CHEMISTRY MONITORING TABLE */}
                <div className="overflow-x-auto rounded-lg border border-slate-800/85">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-[#131722] text-slate-400 font-bold border-b border-slate-800/80 font-sans">
                        <th className="py-1.5 px-3">Tanggal</th>
                        <th className="py-1.5 px-3">Lokasi Pemantauan</th>
                        <th className="text-center py-1.5 px-2">pH</th>
                        <th className="text-center py-1.5 px-2">TSS</th>
                        <th className="text-right py-1.5 px-3">Debit</th>
                        <th className="py-1.5 px-3">Koagulan</th>
                        {userAuthenticated && <th className="text-center py-1.5 px-2">Cloud</th>}
                        <th className="text-center py-1.5 px-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredWaterRecords.length > 0 ? (
                        filteredWaterRecords.map((r) => {
                          const isPhCompliant = r.pH >= 6.0 && r.pH <= 9.0;
                          const isTssCompliant = r.TSS <= 200;

                          return (
                            <tr key={r.id} className="hover:bg-slate-800/30 text-slate-300 font-mono">
                              <td className="py-1 px-3 whitespace-nowrap">{r.tanggal}</td>
                              <td className="py-1 px-3 max-w-[200px] text-slate-300" title={r.lokasi}>
                                <div className="flex items-center gap-1.5 py-0.5">
                                  <Droplet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block font-sans">Titik Penaat KPL</span>
                                    <span className="text-[10px] font-semibold text-slate-200 block truncate">{r.lokasi}</span>
                                  </div>
                                </div>
                              </td>
                              <td className={`py-1 px-2 text-center font-bold ${
                                isPhCompliant ? 'text-slate-200' : 'text-red-400 bg-red-950/25 font-extrabold'
                              }`}>
                                {r.pH.toFixed(2)}
                              </td>
                              <td className={`py-1 px-2 text-center font-bold ${
                                isTssCompliant ? 'text-slate-200' : 'text-red-400 bg-orange-950/25 font-extrabold'
                              }`}>
                                {`${r.TSS} mg/L`}
                              </td>
                              <td className="py-1 px-3 text-right whitespace-nowrap text-slate-400">
                                {`${(r.debit).toLocaleString()} m³`}
                              </td>
                              <td className="py-1 px-3 whitespace-nowrap font-sans">
                                <>
                                  <span className="font-medium text-slate-300">{r.koagulan}</span>
                                  <span className="block text-[8px] text-slate-500 font-mono">{r.koagulanAmount} kg</span>
                                </>
                              </td>
                              {userAuthenticated && (
                                <td className="py-1 px-2 text-center font-sans">
                                  {r.syncStatus === 'synced' ? (
                                    <span className="inline-flex items-center text-emerald-400 font-bold" title="Synced to Google Sheet">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <span className="text-amber-500 text-[8px] uppercase font-mono font-bold" title="Pending synchronous flight">
                                      Lokal
                                    </span>
                                  )}
                                </td>
                              )}
                              <td className="py-1 px-3 text-center font-sans">
                                <button 
                                  onClick={() => onDeleteRecord(r.id)} 
                                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-550/10 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={userAuthenticated ? 8 : 7} className="p-6 text-center text-slate-500 font-sans">
                            Tidak ada data kualitas air limbah yang sesuai pencarian.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {waterRecordsOnly.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                    <p>Menampilkan {filteredWaterRecords.length} dari {waterRecordsOnly.length} rekaman kualitas air</p>
                    <div className="flex gap-3 mt-2 sm:mt-0 font-sans">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-950/40 border border-red-500/20 rounded inline-block"></span> Deviasi pH (&lt;6 atau &gt;9)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-950/40 border border-orange-500/20 rounded inline-block"></span> Deviasi TSS (&gt;200 mg/L)</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* 2. PRECIPITATION (RAIN FILTER) TABLE */}
                <div className="overflow-x-auto rounded-lg border border-slate-800/85">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-[#131722] text-slate-400 font-bold border-b border-slate-800/80 font-sans">
                        <th className="py-1.5 px-3">Tanggal</th>
                        <th className="py-1.5 px-3">Stasiun Hujan</th>
                        <th className="text-center py-1.5 px-3">Curah Hujan</th>
                        <th className="text-center py-1.5 px-3">Durasi</th>
                        <th className="py-1.5 px-3">Klasifikasi Intensitas</th>
                        {userAuthenticated && <th className="text-center py-1.5 px-2">Cloud</th>}
                        <th className="text-center py-1.5 px-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredRainRecords.length > 0 ? (
                        filteredRainRecords.map((r) => {
                          const intensity = getRainIntensity(r.curahHujan);

                          return (
                            <tr key={r.id} className="hover:bg-slate-800/30 text-slate-300 font-mono">
                              <td className="py-1 px-3 whitespace-nowrap">{r.tanggal}</td>
                              <td className="py-1 px-3 max-w-[220px] text-slate-300" title={r.lokasi}>
                                <div className="flex items-center gap-1.5 py-0.5">
                                  <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block font-sans">Station Penakar Hujan</span>
                                    <span className="text-[10px] font-semibold text-sky-350 block truncate">{r.lokasi}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-1 px-3 text-center whitespace-nowrap font-bold text-sky-400 font-mono">
                                {r.curahHujan.toFixed(1)} mm
                              </td>
                              <td className="py-1 px-3 text-center whitespace-nowrap text-slate-400">
                                {r.durasiHujan !== undefined && r.durasiHujan > 0 ? `${r.durasiHujan.toFixed(1)} jam` : '-'}
                              </td>
                              <td className="py-1 px-3 font-sans">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${intensity.color.replace('bg-slate-900 border-slate-800', 'bg-slate-850/60 border-slate-800')}`}>
                                  {intensity.label}
                                </span>
                              </td>
                              {userAuthenticated && (
                                <td className="py-1 px-2 text-center font-sans">
                                  {r.syncStatus === 'synced' ? (
                                    <span className="inline-flex items-center text-emerald-400 font-bold" title="Synced to Google Sheet">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <span className="text-amber-500 text-[8px] uppercase font-mono font-bold" title="Pending synchronous flight">
                                      Lokal
                                    </span>
                                  )}
                                </td>
                              )}
                              <td className="py-1 px-3 text-center font-sans">
                                <button 
                                  onClick={() => onDeleteRecord(r.id)} 
                                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-550/10 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={userAuthenticated ? 7 : 6} className="p-6 text-center text-slate-500 font-sans">
                            Tidak ada data curah hujan yang sesuai pencarian.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {rainRecordsOnly.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                    <p>Menampilkan {filteredRainRecords.length} dari {rainRecordsOnly.length} rekaman curah hujan</p>
                    <div className="text-[9px] text-slate-400 font-sans">
                      *Klasifikasi intensitas berdasarkan panduan BMKG
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}