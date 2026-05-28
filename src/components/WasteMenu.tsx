/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trash2, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Upload, 
  FileCheck, 
  ExternalLink,
  Shield,
  HelpCircle,
  FileText,
  AlertTriangle,
  Check
} from 'lucide-react';
import { WasteIncomingRecord, WasteOutgoingRecord } from '../types';
import { uploadFileToDrive } from '../lib/googleApi';

interface WasteMenuProps {
  incomingRecords: WasteIncomingRecord[];
  outgoingRecords: WasteOutgoingRecord[];
  onAddIncoming: (record: Omit<WasteIncomingRecord, 'id' | 'syncStatus'>) => void;
  onDeleteIncoming: (id: string) => void;
  onAddOutgoing: (record: Omit<WasteOutgoingRecord, 'id' | 'syncStatus'>) => void;
  onDeleteOutgoing: (id: string) => void;
  userAuthenticated: boolean;
  accessToken: string | null;
  defaultSubMenu: 'incoming' | 'outgoing';
}

export default function WasteMenu({
  incomingRecords,
  outgoingRecords,
  onAddIncoming,
  onDeleteIncoming,
  onAddOutgoing,
  onDeleteOutgoing,
  userAuthenticated,
  accessToken,
  defaultSubMenu
}: WasteMenuProps) {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>(defaultSubMenu);

  // --- 1. INCOMING WASTE STATE ---
  const [inTanggal, setInTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [inKode, setInKode] = useState('');
  const [inJenis, setInJenis] = useState('');
  const [inSumber, setInSumber] = useState(''); // Diubah ke string kosong untuk input manual
  const [inJumlah, setInJumlah] = useState<number>(200);
  const [inSatuan, setInSatuan] = useState<'kg' | 'liter' | 'ton'>('kg'); // State satuan baru
  const [inPenyimpanan, setInPenyimpanan] = useState('TPS B3 Sengguruh - Drum A1');
  const [inSearch, setInSearch] = useState('');

  // --- 2. OUTGOING WASTE STATE ---
  const [outTanggal, setOutTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [outKode, setOutKode] = useState('');
  const [outJenis, setOutJenis] = useState('');
  const [outJumlah, setOutJumlah] = useState<number>(200);
  const [outSatuan, setOutSatuan] = useState<'kg' | 'liter' | 'ton'>('kg'); // State satuan baru
  const [outTujuan, setOutTujuan] = useState('');
  const [outManifest, setOutManifest] = useState('MNF-OL-9921820');
  const [outSearch, setOutSearch] = useState('');
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Media upload to Google Drive handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userAuthenticated || !accessToken) {
      // Local fallback: simulate a mock link so user can test the form even without logging in
      setFileError('Koneksi Google belum aktif. Menggunakan link dokumen simulasi (lokal).');
      // Create Object URL for preview
      const localUrl = URL.createObjectURL(file);
      setUploadedFileUrl(localUrl);
      setUploadedFileId('MOCK-DRIVE-ID');
      return;
    }

    setUploadingFile(true);
    setFileError(null);
    try {
      const result = await uploadFileToDrive(accessToken, file);
      setUploadedFileId(result.id);
      setUploadedFileUrl(result.webViewLink);
    } catch (err: any) {
      console.error(err);
      setFileError(`Gagal upload ke Google Drive: ${err.message || err}`);
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit Incoming Form
  const handleIncomingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inKode.trim() || !inJenis.trim() || !inSumber.trim()) {
      alert('Silakan isi kode limbah, jenis limbah, dan sumber.');
      return;
    }
    onAddIncoming({
      tanggal: inTanggal,
      kodeLimbah: inKode.trim(),
      jenisLimbah: inJenis.trim(),
      sumber: inSumber.trim(),
      jumlah: inJumlah,
      satuan: inSatuan, // Mengirimkan satuan baru
      statusPenyimpanan: inPenyimpanan
    } as any);
    // reset form
    setInJumlah(200);
    setInKode('');
    setInJenis('');
    setInSumber('');
    setInSatuan('kg');
  };

  // Submit Outgoing Form
  const handleOutgoingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outKode.trim() || !outJenis.trim() || !outTujuan.trim()) {
      alert('Silakan isi kode limbah, jenis limbah, dan transporter.');
      return;
    }
    onAddOutgoing({
      tanggal: outTanggal,
      kodeLimbah: outKode.trim(),
      jenisLimbah: outJenis.trim(),
      jumlah: outJumlah,
      satuan: outSatuan, // Mengirimkan satuan baru
      tujuanPengiriman: outTujuan.trim(),
      nomorManifest: outManifest,
      fileDriveId: uploadedFileId || undefined,
      fileUrl: uploadedFileUrl || undefined
    } as any);
    // reset outbound states & amounts
    setOutJumlah(200);
    setOutKode('');
    setOutJenis('');
    setOutTujuan('');
    setOutSatuan('kg');
    setUploadedFileUrl(null);
    setUploadedFileId(null);
    setFileError(null);
  };

  // Filter List values
  const filteredIncoming = incomingRecords.filter(r => 
    r.jenisLimbah.toLowerCase().includes(inSearch.toLowerCase()) ||
    r.kodeLimbah.toLowerCase().includes(inSearch.toLowerCase()) ||
    r.sumber.toLowerCase().includes(inSearch.toLowerCase())
  );

  const filteredOutgoing = outgoingRecords.filter(r => 
    r.jenisLimbah.toLowerCase().includes(outSearch.toLowerCase()) ||
    r.nomorManifest.toLowerCase().includes(outSearch.toLowerCase()) ||
    r.tujuanPengiriman.toLowerCase().includes(outSearch.toLowerCase())
  );

  // Helper untuk normalisasi tonase neraca gudang (ke Kg)
  const convertToKg = (val: number, sat?: string) => {
    const s = sat?.toLowerCase() || 'kg';
    if (s === 'ton') return val * 1000;
    return val; // kg & liter diasumsikan setara dalam volume
  };

  // Standing Stocks
  const totalInKg = incomingRecords.reduce((sum, r) => sum + convertToKg(r.jumlah, (r as any).satuan), 0);
  const totalOutKg = outgoingRecords.reduce((sum, r) => sum + convertToKg(r.jumlah, (r as any).satuan), 0);
  const activeStockKg = Math.max(0, totalInKg - totalOutKg);

  return (
    <div className="space-y-4 font-sans text-slate-300">
      
      {/* Header with Submenu tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Pengelolaan Limbah Bahan Berbahaya & Beracun (B3)</h2>
          <p className="text-[11px] text-slate-400">Log masuk, penyimpanan sementara di TPS B3, disposisi keluar kepada pihak ketiga berizin, serta unggah dokumen manifest.</p>
        </div>

        {/* Tabs switcher */}
        <div className="flex bg-[#121620] p-1 rounded-lg border border-slate-800 shrink-0 select-none">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded transition-all tracking-wider uppercase cursor-pointer ${
              activeTab === 'incoming'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Limbah Masuk</span>
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded transition-all tracking-wider uppercase cursor-pointer ${
              activeTab === 'outgoing'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-orange-400" />
            <span>Limbah Keluar</span>
          </button>
        </div>
      </div>

      {/* --- SUBMENU 1: LIMBAH MASUK --- */}
      {activeTab === 'incoming' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Input Form Column */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="lg:col-span-1 bg-[#0F131A] p-4 rounded-lg border border-slate-800/85 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <ArrowDownLeft className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Penerimaan Limbah B3 Tambang</h3>
            </div>

            <form onSubmit={handleIncomingSubmit} className="space-y-3">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Masuk TPS</label>
                <input 
                  type="date" 
                  required 
                  value={inTanggal}
                  onChange={(e) => setInTanggal(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kode Limbah B3</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: B105d..."
                    value={inKode}
                    onChange={(e) => setInKode(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah & Satuan</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      value={inJumlah}
                      onChange={(e) => setInJumlah(parseInt(e.target.value) || 0)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                    />
                    <select
                      value={inSatuan}
                      onChange={(e) => setInSatuan(e.target.value as any)}
                      className="w-18 text-[11px] px-1 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 focus:outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="liter">liter</option>
                      <option value="ton">ton</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Limbah B3</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: Pelumas Bekas (Used Oil)..."
                  value={inJenis}
                  onChange={(e) => setInJenis(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sumber Limbah (Asal Unit)</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: Workshop Heavy Equipment Pit A..."
                  value={inSumber}
                  onChange={(e) => setInSumber(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posisi Penyimpanan TPS</label>
                <input 
                  type="text" 
                  placeholder="EX: TPS Sengguruh - Rak A2..." 
                  required 
                  value={inPenyimpanan}
                  onChange={(e) => setInPenyimpanan(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Log Masuk</span>
              </button>
            </form>
          </motion.div>

          {/* Historical Tables Panel */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Gudang stock banner info */}
            <div className="bg-gradient-to-r from-slate-900 to-[#101725] border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between text-slate-200 font-sans gap-3">
              <div>
                <span className="text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider block mb-0.5">Status Neraca Gudang</span>
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">Volume Penyimpanan Aktif TPS B3</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Total Limbah Masuk: <span className="text-emerald-400 font-bold font-mono">{totalInKg.toLocaleString()} kg</span> | Total Dilepas: <span className="text-orange-400 font-bold font-mono">{totalOutKg.toLocaleString()} kg</span></p>
              </div>
              <div className="bg-slate-950/65 px-3 py-2 rounded border border-slate-800 text-center min-w-[110px] shrink-0 font-mono">
                <span className="text-[8px] text-slate-500 block uppercase font-bold text-slate-450">STOK SAAT INI</span>
                <span className="text-base font-extrabold text-[#ECEEF2] mt-0.5 inline-block">{(activeStockKg / 1000).toFixed(2)} Ton</span>
              </div>
            </div>

            <div className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Log Penerimaan Limbah Masuk</h3>
                
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  <input 
                    type="text" 
                    placeholder="Cari jenis / sumber..." 
                    value={inSearch}
                    onChange={(e) => setInSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 w-52 rounded-md border border-slate-800 text-[11px] bg-[#121620] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto rounded-lg border border-[#141A25]">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#131722] text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-1.5 px-3">Tanggal Masuk</th>
                      <th className="py-1.5 px-3">Kode B3</th>
                      <th className="py-1.5 px-3">Jenis Limbah B3</th>
                      <th className="py-1.5 px-3">Sumber / Asal</th>
                      <th className="text-right py-1.5 px-3">Jumlah</th>
                      <th className="py-1.5 px-3">TPS / Posisi</th>
                      {userAuthenticated && <th className="text-center py-1.5 px-2">Cloud</th>}
                      <th className="text-center py-1.5 px-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredIncoming.length > 0 ? (
                      filteredIncoming.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 text-slate-300 font-mono">
                          <td className="py-1 px-3 whitespace-nowrap text-slate-400">{r.tanggal}</td>
                          <td className="py-1 px-3 font-mono font-bold text-emerald-400">{r.kodeLimbah}</td>
                          <td className="py-1 px-3 font-semibold text-slate-100 font-sans">{r.jenisLimbah}</td>
                          <td className="py-1 px-3 whitespace-nowrap text-slate-400 font-sans">{r.sumber}</td>
                          <td className="py-1 px-3 text-right font-bold text-white whitespace-nowrap">{r.jumlah.toLocaleString()} {(r as any).satuan || 'kg'}</td>
                          <td className="py-1 px-3 whitespace-nowrap font-sans text-slate-400">{r.statusPenyimpanan}</td>
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
                              onClick={() => onDeleteIncoming(r.id)} 
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={userAuthenticated ? 8 : 7} className="p-6 text-center text-slate-500 font-sans font-normal">
                          Belum ada log Limbah B3 masuk yang terdaftar.
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

      {/* --- SUBMENU 2: LIMBAH KELUAR --- */}
      {activeTab === 'outgoing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Dispatch/Outbound Form Column */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="lg:col-span-1 bg-[#0F131A] p-4 rounded-lg border border-slate-800/85 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <ArrowUpRight className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Perilisan / Penyerahan Limbah B3</h3>
            </div>

            <form onSubmit={handleOutgoingSubmit} className="space-y-3">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Keluar TPS</label>
                <input 
                  type="date" 
                  required 
                  value={outTanggal}
                  onChange={(e) => setOutTanggal(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kode B3</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: B105d..."
                    value={outKode}
                    onChange={(e) => setOutKode(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah & Satuan</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      value={outJumlah}
                      onChange={(e) => setOutJumlah(parseInt(e.target.value) || 0)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                    />
                    <select
                      value={outSatuan}
                      onChange={(e) => setOutSatuan(e.target.value as any)}
                      className="w-18 text-[11px] px-1 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-slate-100 focus:outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="liter">liter</option>
                      <option value="ton">ton</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Kode B3</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: Pelumas Bekas (Used Oil)..."
                  value={outJenis}
                  onChange={(e) => setOutJenis(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transporter Pihak Ketiga</label>
                <input 
                  type="text"
                  required
                  placeholder="Masukkan nama transporter..."
                  value={outTujuan}
                  onChange={(e) => setOutTujuan(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor Manifest Resmi (KLHK)</label>
                <input 
                  type="text" 
                  placeholder="EX: MNF-OL-9921820..." 
                  required 
                  value={outManifest}
                  onChange={(e) => setOutManifest(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#121620] text-white focus:outline-none"
                />
              </div>

              {/* Supporting Document Uploader (Pushed to Google Drive) */}
              <div className="space-y-1 bg-[#121620] p-3 rounded-lg border border-slate-800">
                <label className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Manifest Pendukung (Upload)</span>
                </label>
                
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-[9px] text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border file:border-slate-700 file:text-[9px] file:font-semibold file:bg-slate-800 file:text-slate-200 file:cursor-pointer hover:file:bg-slate-750"
                />

                {uploadingFile && (
                  <div className="text-[9px] text-[#A6B2C9] flex items-center gap-2 mt-1.5 font-semibold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                    <span>Mengunggah file ke Google Drive...</span>
                  </div>
                )}

                {uploadedFileUrl && (
                  <div className="flex items-center gap-1.5 mt-1.5 font-mono text-[9px] bg-[#11241C] text-emerald-400 p-1.5 rounded border border-emerald-500/10">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span className="truncate">Tersimpan di Cloud</span>
                  </div>
                )}

                {fileError && (
                  <p className="text-[8px] text-amber-400 mt-1.5 font-medium bg-[#211E1A] p-1.5 rounded leading-tight border border-amber-500/10 font-mono">{fileError}</p>
                )}
              </div>

              <button 
                type="submit" 
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Log Keluar</span>
              </button>
            </form>
          </motion.div>

          {/* Historical release logs list */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Histori Penyerahan Manifest Keluar</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Total Limbah Diserahkan: <span className="text-orange-400 font-bold">{totalOutKg.toLocaleString()}</span> kg</p>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  <input 
                    type="text" 
                    placeholder="Cari manifest / transporter..." 
                    value={outSearch}
                    onChange={(e) => setOutSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 w-52 rounded-md border border-slate-800 text-[11px] bg-[#121620] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto rounded-lg border border-[#141A25]">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#131722] text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-1.5 px-3">Tanggal Keluar</th>
                      <th className="py-1.5 px-3">Kode B3</th>
                      <th className="py-1.5 px-3">Jenis Limbah B3</th>
                      <th className="text-right py-1.5 px-3">Jumlah</th>
                      <th className="py-1.5 px-3">Transporter Berizin</th>
                      <th className="py-1.5 px-3">Nomor Manifest KLHK</th>
                      <th className="text-center py-1.5 px-2 font-medium">Manifest File</th>
                      {userAuthenticated && <th className="text-center py-1.5 px-2">Cloud</th>}
                      <th className="text-center py-1.5 px-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredOutgoing.length > 0 ? (
                      filteredOutgoing.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 text-slate-300 font-mono">
                          <td className="py-1 px-3 whitespace-nowrap text-slate-400">{r.tanggal}</td>
                          <td className="py-1 px-3 font-mono font-bold text-orange-400">{r.kodeLimbah}</td>
                          <td className="py-1 px-3 font-semibold text-slate-100 font-sans">{r.jenisLimbah}</td>
                          <td className="py-1 px-3 text-right font-bold text-white whitespace-nowrap">{r.jumlah.toLocaleString()} {(r as any).satuan || 'kg'}</td>
                          <td className="py-1 px-3 whitespace-nowrap font-sans text-slate-400 truncate max-w-[125px]" title={r.tujuanPengiriman}>{r.tujuanPengiriman}</td>
                          <td className="py-1 px-3 font-mono text-slate-400 whitespace-nowrap">{r.nomorManifest}</td>
                          <td className="py-1 px-2 text-center font-sans">
                            {r.fileUrl ? (
                              <a 
                                href={r.fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20"
                              >
                                <span>Drive</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-slate-500 font-medium">-</span>
                            )}
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
                          <td className="py-1 px-3 text-center font-sans">
                            <button 
                              onClick={() => onDeleteOutgoing(r.id)} 
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-550/10 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={userAuthenticated ? 9 : 8} className="p-6 text-center text-slate-500 font-sans font-normal">
                          Belum ada log Limbah B3 keluar yang diunggah.
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