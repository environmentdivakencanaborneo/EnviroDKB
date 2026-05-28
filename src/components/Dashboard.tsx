/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Droplet, 
  Trash2, 
  Sprout, 
  Compass, 
  AlertTriangle,
  CheckCircle2, 
  FileCheck,
  TrendingUp,
  CloudRain
} from 'lucide-react';
import {
  EnvironmentalRecord,
  WasteIncomingRecord,
  WasteOutgoingRecord,
  NurseryRecord,
  ReclamationRecord,
  ReclamationGuaranteeRecord
} from '../types';

interface DashboardProps {
  environmentalRecords: EnvironmentalRecord[];
  wasteIncoming: WasteIncomingRecord[];
  wasteOutgoing: WasteOutgoingRecord[];
  nursery: NurseryRecord[];
  reclamation: ReclamationRecord[];
  reclamationGuarantees?: ReclamationGuaranteeRecord[];
}

export default function Dashboard({
  environmentalRecords,
  wasteIncoming,
  wasteOutgoing,
  nursery,
  reclamation,
  reclamationGuarantees = []
}: DashboardProps) {
  // --- CALCULATE KEY METRICS ---
  
  // 1. Water monitoring KPIs
  const waterRecordsOnly = environmentalRecords.filter(r => r.pH !== undefined && r.pH > 0);
  const totalWaterRecords = waterRecordsOnly.length;
  const avgPH = totalWaterRecords 
    ? parseFloat((waterRecordsOnly.reduce((sum, r) => sum + r.pH, 0) / totalWaterRecords).toFixed(2))
    : 0;
  
  const pHViolationCount = waterRecordsOnly.filter(r => r.pH < 6.0 || r.pH > 9.0).length;
  
  const maxTSS = totalWaterRecords
    ? Math.max(...waterRecordsOnly.map(r => r.TSS))
    : 0;
  const tssViolationCount = waterRecordsOnly.filter(r => r.TSS > 200).length;

  const totalCurahHujan = environmentalRecords.reduce((sum, r) => sum + r.curahHujan, 0);

  // 2. B3 Waste stockpile calculations
  const totalIncomingB3 = wasteIncoming.reduce((sum, r) => sum + r.jumlah, 0);
  const totalOutgoingB3 = wasteOutgoing.reduce((sum, r) => sum + r.jumlah, 0);
  const stockpileB3 = Math.max(0, totalIncomingB3 - totalOutgoingB3);

  // Group B3 standing stocks by waste type (kodeLimbah)
  const b3Balances: { [key: string]: { incoming: number; outgoing: number; balance: number; name: string } } = {};
  wasteIncoming.forEach((r) => {
    if (!b3Balances[r.kodeLimbah]) {
      b3Balances[r.kodeLimbah] = { incoming: 0, outgoing: 0, balance: 0, name: r.jenisLimbah };
    }
    b3Balances[r.kodeLimbah].incoming += r.jumlah;
  });
  wasteOutgoing.forEach((r) => {
    if (!b3Balances[r.kodeLimbah]) {
      b3Balances[r.kodeLimbah] = { incoming: 0, outgoing: 0, balance: 0, name: r.jenisLimbah };
    }
    b3Balances[r.kodeLimbah].outgoing += r.jumlah;
  });
  Object.keys(b3Balances).forEach((k) => {
    b3Balances[k].balance = Math.max(0, b3Balances[k].incoming - b3Balances[k].outgoing);
  });

  const b3StockData = Object.entries(b3Balances).map(([key, val]) => ({
    code: key,
    name: val.name.split(' (')[0], // Trim long name
    Stok: val.balance,
    Masuk: val.incoming,
    Keluar: val.outgoing,
  }));

  // 3. Nursery count
  const totalSeedlings = nursery.reduce((sum, r) => sum + (r.kondisi === 'Mati' ? 0 : r.jumlahBibit), 0);
  const seedlingsByKondisi = [
    { name: 'Sehat', value: nursery.filter(r => r.kondisi === 'Sehat').reduce((sum, r) => sum + r.jumlahBibit, 0), color: '#10b981' },
    { name: 'Kurang Sehat', value: nursery.filter(r => r.kondisi === 'Kurang Sehat').reduce((sum, r) => sum + r.jumlahBibit, 0), color: '#f59e0b' },
    { name: 'Mati', value: nursery.filter(r => r.kondisi === 'Mati').reduce((sum, r) => sum + r.jumlahBibit, 0), color: '#ef4444' },
  ].filter(item => item.value > 0);

  // 4. Reclamation hectares
  const totalAreaReclaimed = parseFloat(reclamation.reduce((sum, r) => sum + r.luas, 0).toFixed(2));
  const avgProgressPercent = reclamation.length
    ? Math.round(reclamation.reduce((sum, r) => sum + r.rencanaKemajuan, 0) / reclamation.length)
    : 0;

  // --- RECHARTS FORMATTING ---
  const sortedEnvRecords = [...environmentalRecords].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const phChartData = sortedEnvRecords.filter(r => r.pH !== undefined && r.pH > 0);
  
  // Aggregate data by date for perfect correlation on the TSS/Rainfall chart
  const aggregatedEnvData = Object.values(
    sortedEnvRecords.reduce((acc, r) => {
      const key = r.tanggal;
      if (!acc[key]) {
        acc[key] = {
          tanggal: r.tanggal,
          TSS: 0,
          tssCount: 0,
          curahHujan: 0,
        };
      }
      if (r.pH !== undefined && r.pH > 0) {
        acc[key].TSS = Math.max(acc[key].TSS, r.TSS);
        acc[key].tssCount += 1;
      }
      if (r.curahHujan !== undefined && r.curahHujan > 0) {
        acc[key].curahHujan = Math.max(acc[key].curahHujan, r.curahHujan);
      }
      return acc;
    }, {} as Record<string, { tanggal: string; TSS: number; tssCount: number; curahHujan: number }>)
  ).map(item => ({
    tanggal: item.tanggal,
    TSS: item.tssCount > 0 ? item.TSS : 0,
    curahHujan: item.curahHujan,
  })).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // --- CALCULATE GUARANTEE CHART DATA ---
  const guaranteeList = reclamationGuarantees || [];
  const guaranteeByYearMap = guaranteeList.reduce((acc, curr) => {
    const yr = curr.tahun;
    if (!acc[yr]) {
      acc[yr] = { tahun: String(yr), totalNilai: 0, count: 0 };
    }
    acc[yr].totalNilai += curr.nilaiJaminan;
    acc[yr].count += 1;
    return acc;
  }, {} as Record<number, { tahun: string; totalNilai: number; count: number }>);

  const guaranteeChartData = Object.values(guaranteeByYearMap).sort((a, b) => a.tahun.localeCompare(b.tahun));

  // --- STATION RAINFALL GRAPH CALCULATIONS ---
  const stationColors = [
    '#38bdf8', // Light blue (sky 400)
    '#10b981', // Emerald 500
    '#f59e0b', // Amber 500
    '#a855f7', // Purple 500
    '#ec4899', // Pink 500
    '#06b6d4', // Cyan 500
    '#f97316', // Orange 500
  ];

  // Extract all rain log records (curahHujan > 0)
  const rainRecordsOnly = sortedEnvRecords.filter(r => r.curahHujan !== undefined && r.curahHujan > 0);
  
  // Find all unique weather station locations
  const uniqueStations = Array.from(
    new Set(rainRecordsOnly.map(r => r.lokasi.trim()))
  ).filter(Boolean);

  // Map of date -> station -> curahHujan (mm)
  const rainByDateMap: Record<string, Record<string, number>> = {};
  rainRecordsOnly.forEach(r => {
    const key = r.tanggal;
    const station = r.lokasi.trim();
    if (!rainByDateMap[key]) {
      rainByDateMap[key] = {};
    }
    // Handle potential duplicate entries on the same day by taking the sum (standard for rain accumulation)
    rainByDateMap[key][station] = parseFloat(((rainByDateMap[key][station] || 0) + r.curahHujan).toFixed(2));
  });

  // Convert map to chart-friendly array sorted by date
  const rainByStationChartData = Object.entries(rainByDateMap).map(([tanggal, stationsData]) => ({
    tanggal,
    ...stationsData
  })).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white font-sans uppercase">Dashboard Lingkungan Real-Time</h2>
        <p className="text-xs text-slate-400 font-sans">Visualisasi pemantauan lingkungan, limbah B3, reklamasi, dan kepatuhan regulasi PT Diva Kencana Borneo.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI: ph/Water */}
        <div id="kpi-water" className="bg-[#131722] p-3.5 rounded-lg border border-slate-800/80 shadow-none flex items-start justify-between">
          <div className="space-y-1.5 font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kualitas Air Tambang</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white font-mono">pH {avgPH || '-'}</span>
              <span className="text-[10px] text-slate-400">Rata-rata</span>
            </div>
            {pHViolationCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-ref-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-2.5 h-2.5" />
                {pHViolationCount} Pelanggaran pH
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-2.5 h-2.5" />
                pH Sesuai Baku Mutu
              </span>
            )}
          </div>
          <div className="p-2 bg-slate-800/40 text-blue-400 rounded-md">
            <Droplet className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: TSS / Curah Hujan */}
        <div id="kpi-tss" className="bg-[#131722] p-3.5 rounded-lg border border-slate-800/80 shadow-none flex items-start justify-between">
          <div className="space-y-1.5 font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TSS & Curah Hujan</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white font-mono">{maxTSS ? `${maxTSS} mg/L` : '-'}</span>
              <span className="text-[10px] text-slate-400">Max TSS</span>
            </div>
            {tssViolationCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-2.5 h-2.5" />
                {tssViolationCount} Kali TSS &gt; 200mg/L
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#13231F] text-blue-400 border border-blue-500/20">
                <CloudRain className="w-2.5 h-2.5" />
                Sesuai Baku Mutu
              </span>
            )}
          </div>
          <div className="p-2 bg-slate-800/40 text-indigo-400 rounded-md">
            <CloudRain className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Limbah B3 */}
        <div id="kpi-b3" className="bg-[#131722] p-3.5 rounded-lg border border-slate-800/80 shadow-none flex items-start justify-between">
          <div className="space-y-1.5 font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stok TPS Limbah B3</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white font-mono">{(stockpileB3 / 1000).toFixed(2)} Ton</span>
              <span className="text-[10px] text-slate-400">di Gudang</span>
            </div>
            <p className="text-[9px] text-slate-450 font-mono">
              In: {(totalIncomingB3 / 1000).toFixed(1)}T | Out: {(totalOutgoingB3 / 1000).toFixed(1)}T
            </p>
          </div>
          <div className="p-2 bg-slate-800/40 text-orange-400 rounded-md">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Reklamasi */}
        <div id="kpi-reclamation" className="bg-[#131722] p-3.5 rounded-lg border border-slate-800/80 shadow-none flex items-start justify-between">
          <div className="space-y-1.5 font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reklamasi & Nursery</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white font-mono">{totalAreaReclaimed} Ha</span>
              <span className="text-[10px] text-slate-400">Vegetasi Sukses</span>
            </div>
            <p className="text-[9px] text-slate-455 font-mono">
              Nursery: {totalSeedlings.toLocaleString()} | Progress: {avgProgressPercent}%
            </p>
          </div>
          <div className="p-2 bg-slate-800/40 text-emerald-400 rounded-md">
            <Sprout className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* GRAPH ROW 1: pH AND TSS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Trend pH Air Tambang */}
        <div id="chart-ph" className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between mb-3 font-sans">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Trend pH Air Penyaliran Tambang (Mine Water)</h3>
              <p className="text-[10px] text-slate-400">Kepmen LH No.113 Th 2003 Standar Baku Mutu: pH 6.00 – 9.00</p>
            </div>
            <div className="px-2 py-0.5 bg-slate-800/60 rounded text-[9px] font-bold font-mono text-slate-350 border border-slate-700">
              Baku Mutu (6 - 9)
            </div>
          </div>
          <div className="h-72">
            {phChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={phChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="tanggal" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis domain={[4.0, 10.0]} stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '6px', border: '1px solid #334155', background: '#0F131A', fontSize: '10px', color: '#F8FAFC' }}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                  />
                  <ReferenceLine y={6.0} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Batas Bawah (6.0)', fill: '#EF4444', fontSize: 9, position: 'top' }} />
                  <ReferenceLine y={9.0} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Batas Atas (9.0)', fill: '#EF4444', fontSize: 9, position: 'bottom' }} />
                  <Line type="monotone" dataKey="pH" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1.5 }} activeDot={{ r: 5 }} name="pH Air" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">Tidak ada data untuk ditampilkan</div>
            )}
          </div>
        </div>

        {/* TSS (mg/L) vs Curah Hujan (mm) */}
        <div id="chart-tss-rain" className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between mb-3 font-sans">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Total Suspended Solids (TSS) vs Curah Hujan</h3>
              <p className="text-[10px] text-slate-400">Menganalisis korelasi kelumpuran air tambang dengan curah hujan hariannya.</p>
            </div>
            <div className="px-2 py-0.5 bg-slate-800/60 rounded text-[9px] font-bold font-mono text-slate-350 border border-slate-700">
              Batas TSS (200 mg/L)
            </div>
          </div>
          <div className="h-72">
            {aggregatedEnvData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregatedEnvData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="tanggal" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '6px', border: '1px solid #334155', background: '#0F131A', fontSize: '10px', color: '#F8FAFC' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                  <ReferenceLine y={200} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Limit (200)', fill: '#EF4444', fontSize: 9, position: 'top' }} />
                  <Bar dataKey="TSS" fill="#818cf8" radius={[2, 2, 0, 0]} name="TSS (mg/L)" />
                  <Line type="monotone" dataKey="curahHujan" stroke="#ff8042" strokeWidth={1.5} name="Curah Hujan (mm)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">Tidak ada data untuk ditampilkan</div>
            )}
          </div>
        </div>
      </div>

      {/* STATION RAINFALL CHART SECTION */}
      <div id="chart-station-rain" className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 font-sans gap-2">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-sky-400 shrink-0" />
              Grafik Curah Hujan Harian Berdasarkan Stasiun Kerja (mm)
            </h3>
            <p className="text-[10px] text-slate-400">Distribusi intensitas curah hujan per hari untuk masing-masing stasiun penakar hujan (Rain Gauge).</p>
          </div>
          {uniqueStations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {uniqueStations.slice(0, 7).map((station, idx) => (
                <span 
                  key={station} 
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-tight border uppercase font-bold"
                  style={{ 
                    color: stationColors[idx % stationColors.length], 
                    backgroundColor: `${stationColors[idx % stationColors.length]}15`, 
                    borderColor: `${stationColors[idx % stationColors.length]}35` 
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stationColors[idx % stationColors.length] }}></span>
                  {station.replace('Stasiun Hujan ', '')}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="h-64">
          {rainByStationChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rainByStationChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="tanggal" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '6px', border: '1px solid #334155', background: '#0F131A', fontSize: '10px', color: '#F8FAFC' }}
                  labelFormatter={(lbl) => `Tanggal: ${lbl}`}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                {uniqueStations.map((station, idx) => (
                  <Bar 
                    key={station} 
                    dataKey={station} 
                    fill={stationColors[idx % stationColors.length]} 
                    radius={[2, 2, 0, 0]} 
                    name={station} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs text-center border border-dashed border-slate-800/80 rounded-lg">
              Belum ada data curah hujan terekam untuk ditampilkan pada stasiun.
            </div>
          )}
        </div>
      </div>

      {/* GRAPH ROW 2: LIMBAH B3 & REKLAMASI PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Stok Neraca Limbah B3 */}
        <div id="chart-b3-stock" className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80">
          <div className="font-sans mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Neraca Volume Limbah B3 (Tersimpan di TPS)</h3>
            <p className="text-[10px] text-slate-400">Persediaan aktif limbah B3 di Tempat Penyimpanan Sementara berdasarkan kode manifest.</p>
          </div>
          <div className="h-72">
            {b3StockData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={b3StockData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="code" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '6px', border: '1px solid #334155', background: '#0F131A', fontSize: '10px', color: '#F8FAFC' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                  <Bar dataKey="Stok" fill="#f97316" radius={[2, 2, 0, 0]} name="Stok TPS (kg)" />
                  <Bar dataKey="Masuk" fill="#cbd5e1" radius={[2, 2, 0, 0]} name="Masuk (kg)" />
                  <Bar dataKey="Keluar" fill="#475569" radius={[2, 2, 0, 0]} name="Keluar (kg)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">Belum ada data masuk & keluar Limbah B3</div>
            )}
          </div>
        </div>

        {/* Nursery & Land Restoration Progress */}
        <div id="chart-nursery-reclamation" className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80">
          <div className="font-sans mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rehabilitasi & Kemajuan Vegetasi Reklamasi</h3>
            <p className="text-[10px] text-slate-400">Melihat distribusi kondisi persemaian bibit nursery dan efektivitas blok reklamasi.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-72">
            
            {/* Pie Chart: Bibit Nursery */}
            <div className="relative">
              <h4 className="text-center text-[10px] uppercase font-bold text-slate-300 font-sans mb-1">Kesehatan Persemaian</h4>
              <div className="h-40">
                {seedlingsByKondisi.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={seedlingsByKondisi}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {seedlingsByKondisi.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toLocaleString()} bibit`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-[10px]">Kosong</div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-[9px] font-sans">
                {seedlingsByKondisi.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span className="text-slate-400">{entry.name} ({entry.value.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart: Progress per Blok */}
            <div>
              <h4 className="text-center text-[10px] uppercase font-bold text-slate-300 font-sans mb-1">Kemajuan Blok (%)</h4>
              <div className="h-52">
                {reclamation.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reclamation} layout="vertical" margin={{ top: 5, right: 10, left: -22, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1E293B" />
                      <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={8} />
                      <YAxis type="category" dataKey="areaBlok" stroke="#64748B" fontSize={8} tickLine={false} width={75} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="rencanaKemajuan" fill="#10b981" radius={[0, 2, 2, 0]} name="Progress (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-[10px]">Belum ada blok reklamasi</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRAPH ROW 3: RECLAMATION GUARANTEE TREND */}
      <div className="grid grid-cols-1 gap-4">
        <div id="chart-reclamation-guarantee" className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 font-sans gap-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-500 animate-pulse" />
                Grafik Total Nilai Jaminan Reklamasi Batubara Berdasarkan Tahun
              </h3>
              <p className="text-[10px] text-slate-400">Distribusi kumulatif penjaminan finansial jaminan reklamasi yang disetor ke instansi ESDM sesuai tahun.</p>
            </div>
            <div className="px-2.5 py-1 bg-[#10231F] rounded text-[10px] font-bold font-mono text-emerald-400 border border-emerald-500/20">
              Total Aktif: Rp {guaranteeList.filter(g => g.status === 'Aktif').reduce((sum, g) => sum + g.nilaiJaminan, 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="h-64">
            {guaranteeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={guaranteeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="tahun" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={9} 
                    tickLine={false}
                    tickFormatter={(v) => `Rp ${(v / 1000000).toLocaleString('id-ID')} jt`} 
                  />
                  <Tooltip
                    formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Total Nilai Guarantees']}
                    contentStyle={{ borderRadius: '6px', border: '1px solid #334155', background: '#0F131A', fontSize: '10px', color: '#F8FAFC' }}
                  />
                  <Bar dataKey="totalNilai" fill="#059669" radius={[4, 4, 0, 0]} name="Total Nilai Jaminan (Rp)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs text-center">Belum ada dana jaminan terdaftar di sistem.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
