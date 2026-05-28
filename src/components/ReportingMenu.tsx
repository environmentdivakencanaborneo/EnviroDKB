/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileCheck, 
  Printer, 
  Cpu, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Sparkles,
  ClipboardList,
  RefreshCw,
  Clock
} from 'lucide-react';
import Markdown from 'react-markdown';
import { 
  EnvironmentalRecord, 
  WasteIncomingRecord, 
  WasteOutgoingRecord, 
  NurseryRecord, 
  ReclamationRecord 
} from '../types';
import { uploadFileToDrive } from '../lib/googleApi';

interface ReportingMenuProps {
  environmentalRecords: EnvironmentalRecord[];
  wasteIncoming: WasteIncomingRecord[];
  wasteOutgoing: WasteOutgoingRecord[];
  nursery: NurseryRecord[];
  reclamation: ReclamationRecord[];
  accessToken?: string | null;
}

export default function ReportingMenu({
  environmentalRecords,
  wasteIncoming,
  wasteOutgoing,
  nursery,
  reclamation,
  accessToken
}: ReportingMenuProps) {
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [errorBorder, setErrorBorder] = useState<string | null>(null);

  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const [driveReportUrl, setDriveReportUrl] = useState<string | null>(null);

  const handleUploadReportToDrive = async () => {
    if (!accessToken || !reportText) return;
    setUploadingToDrive(true);
    try {
      const fileName = `DivaMonitor_AuditReport_${new Date().toISOString().slice(0, 10)}.md`;
      const reportFile = new File([reportText], fileName, { type: 'text/markdown' });
      const { id, webViewLink } = await uploadFileToDrive(accessToken, reportFile);
      setDriveReportUrl(webViewLink);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal mengunggah laporan ke Google Drive: ${err.message || err}`);
    } finally {
      setUploadingToDrive(false);
    }
  };

  // Stats
  const hasEnv = environmentalRecords.length > 0;
  const hasWaste = wasteIncoming.length > 0;
  const hasRec = reclamation.length > 0;

  // Run Gemini Audit
  const handleGenerateAuditReport = async () => {
    setLoading(true);
    setReportText(null);
    setErrorBorder(null);
    try {
      const response = await fetch('/api/generate-compliance-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environmentalRecords,
          wasteIncoming,
          wasteOutgoing,
          nursery,
          reclamation
        }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setReportText(data.report);
    } catch (err: any) {
      console.error(err);
      setErrorBorder(`Gagal melakukan audit regulasi: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 font-sans text-slate-300">
      
      {/* Header with printing & generation buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-800/80 gap-3 print:hidden">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Pelaporan & Audit Kepatuhan Lingkungan</h2>
          <p className="text-[11px] text-slate-400">Kompilasi rekapitulasi data lapangan untuk diekspor atau diteruskan ke editor laporan pengawasan pertambangan batubara.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121620] hover:bg-slate-800 text-slate-200 hover:text-white rounded-md text-[11px] font-bold uppercase tracking-wider transition border border-slate-800 cursor-pointer select-none"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* COMPILATION METRICS SHEET (VISIBLE ON MAIN VIEW & PRINTS BEAUTIFULLY) */}
      <div className="bg-[#0F131A] p-4 rounded-lg border border-slate-800/85 space-y-4 print:p-0 print:border-0 print:shadow-none print:bg-white">
        
        {/* Printable Letterhead Header */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="font-sans">
            <h1 className="text-md font-bold text-slate-900 uppercase">PT Diva Kencana Borneo</h1>
            <p className="text-[9px] text-slate-500 tracking-wider">ENVIRONMENTAL MONITORING REPORT (DIVAMONITOR)</p>
          </div>
          <div className="text-right text-[8px] text-slate-500 font-mono">
            <p>Tanggal Cetak: {new Date().toISOString().split('T')[0]}</p>
            <p>Lokasi: Area Tambang Batubara, Kalimantan</p>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <ClipboardList className="w-4 h-4 text-emerald-500" />
            <span>Rekapitulasi Data Lapangan Aktif</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 print:hidden">Rangkuman data pemantauan real-time yang sedang tersimpan dalam database DivaMonitor.</p>
        </div>

        {/* Dynamic Grid Summary Cards for Data Completeness */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
          
          {/* Air & Hujan Card */}
          <div className="p-3 rounded-lg border border-slate-800/80 bg-[#121620] space-y-1.5 print:bg-slate-50 print:border-slate-300">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Data Air & Curah Hujan</h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-white print:text-slate-900">{environmentalRecords.length}</span>
              <span className="text-[10px] text-slate-500">log harian</span>
            </div>
            <div className="text-[9px]">
              {hasEnv ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> TERISI (SIAP AUDIT)
                </span>
              ) : (
                <span className="text-amber-500 font-bold flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> DATA KOSONG
                </span>
              )}
            </div>
          </div>

          {/* Limbah B3 Card */}
          <div className="p-3 rounded-lg border border-slate-800/80 bg-[#121620] space-y-1.5 print:bg-slate-50 print:border-slate-300">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Data Log Limbah B3</h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-white print:text-slate-900">{wasteIncoming.length + wasteOutgoing.length}</span>
              <span className="text-[10px] text-slate-500">manifest terbit</span>
            </div>
            <div className="text-[9px]">
              {hasWaste ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> TERISI (SIAP AUDIT)
                </span>
              ) : (
                <span className="text-amber-500 font-bold flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> DATA KOSONG
                </span>
              )}
            </div>
          </div>

          {/* Reklamasi Card */}
          <div className="p-3 rounded-lg border border-slate-800/80 bg-[#121620] space-y-1.5 print:bg-slate-50 print:border-slate-300">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Data Reklamasi & Nursery</h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-white print:text-slate-900">{nursery.length + reclamation.length}</span>
              <span className="text-[10px] text-slate-500">rekaman re-revegetasi</span>
            </div>
            <div className="text-[9px]">
              {hasRec ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> TERISI (SIAP AUDIT)
                </span>
              ) : (
                <span className="text-amber-500 font-bold flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> DATA KOSONG
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Audit Runner triggers */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-950/20 to-teal-950/15 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
          <div className="space-y-1 text-center md:text-left">
            <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold font-mono border border-emerald-500/10">
              <Sparkles className="w-3 h-3 text-emerald-405" /> Gemini-Powered Auditor
            </span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Jalankan Audit Kepatuhan Regulasi Otomatis</h4>
            <p className="text-[11px] text-slate-400 max-w-xl">Memetakan data efluen sensor, log neraca limbah B3, dan parameter tanah penutup reklamasi Anda langsung ke parameter Kepmen LH No. 113 Tahun 2003.</p>
          </div>

          <button
            onClick={handleGenerateAuditReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 shadow"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                <span>Menganalisis Data...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-emerald-300" />
                <span>Jalankan Audit AI</span>
              </>
            )}
          </button>
        </div>

        {/* Report Display Card */}
        {(loading || reportText || errorBorder) && (
          <div className="border border-slate-800 rounded-lg overflow-hidden font-sans bg-[#0A0C10]">
            
            {/* Display Header */}
            <div className="bg-[#131722] border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-slate-300 text-[11px] font-bold uppercase tracking-wider font-sans">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Laporan Hasil Audit Kepatuhan Regulasi Tambang B3
              </span>
              <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono text-[9px]">
                Dokumen Resmi
              </span>
            </div>

            {/* Content Area */}
            <div className="p-4 bg-[#11151E] min-h-[150px] print:bg-white print:text-slate-900">
              
              {loading && (
                <div className="py-10 flex flex-col items-center justify-center space-y-3 text-slate-400 font-sans">
                  <div className="relative">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                    <Cpu className="w-4 h-4 text-[#ECEEF2] absolute left-2 top-2" />
                  </div>
                  <div className="text-center space-y-1 animate-pulse">
                    <p className="text-xs font-bold text-white">Mengkalkulasi parameter kimia air dan keseimbangan TPS B3...</p>
                    <p className="text-[10px] text-slate-500">Akurasi standardisasi Kepmen LHK Indonesia sedang diproses.</p>
                  </div>
                </div>
              )}

              {errorBorder && (
                <div className="bg-[#2E1819] text-red-300 p-3 rounded-lg border border-red-500/10 flex items-start gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="font-semibold">{errorBorder}</p>
                </div>
              )}

              {reportText && (
                <div id="compliance-markdown" className="markdown-body prose max-w-none text-xs text-slate-300 print:text-slate-900 leading-relaxed font-sans prose-invert print:prose-normal font-normal">
                  <Markdown>{reportText}</Markdown>
                </div>
              )}
            </div>
            
            {/* Display Footer on Preview only */}
            {reportText && (
              <div className="bg-[#121620] border-t border-slate-800/80 p-2.5 flex flex-wrap gap-2 justify-end print:hidden">
                {accessToken ? (
                  driveReportUrl ? (
                    <a
                      href={driveReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950 border border-indigo-700/60 hover:bg-slate-800 text-indigo-300 hover:text-white rounded-md text-[11px] font-bold uppercase transition select-none cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Buka Laporan di Drive</span>
                    </a>
                  ) : (
                    <button
                      onClick={handleUploadReportToDrive}
                      disabled={uploadingToDrive}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md text-[11px] font-bold uppercase transition select-none cursor-pointer"
                    >
                      {uploadingToDrive ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                          <span>Menyimpan ke Drive...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>Simpan ke Google Drive</span>
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono italic self-center mr-auto">
                    *Masuk ke Google untuk otomatis menyimpan laporan hasil audit ini ke Google Drive.
                  </span>
                )}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold uppercase transition select-none cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Laporan</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
