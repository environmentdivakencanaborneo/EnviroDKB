/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Droplet, 
  Activity, 
  Sprout, 
  Trash2, 
  FileCheck, 
  LogIn, 
  LogOut, 
  CloudRain, 
  Compass, 
  Layers,
  Database,
  CheckCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { User } from 'firebase/auth';
import DivaLogo from './DivaLogo';

interface SidebarProps {
  currentMenu: string;
  setCurrentMenu: (menu: string) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  spreadsheetUrl: string | null;
  syncInProgress: boolean;
  onSync: () => void;
}

export default function Sidebar({
  currentMenu,
  setCurrentMenu,
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  spreadsheetUrl,
  syncInProgress,
  onSync
}: SidebarProps) {
  return (
    <aside id="app-sidebar" className="w-64 bg-[#0F131A] text-slate-100 flex flex-col border-r border-slate-800/80 shrink-0">
      {/* Brand Header */}
      <div className="p-4 px-5 border-b border-slate-800/80 select-none">
        <DivaLogo size="sm" />
        <div className="mt-3.5 inline-flex items-center gap-1 text-[8px] bg-[#121620] text-[#557A51] px-2 py-1 rounded font-bold uppercase tracking-wider font-sans">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          Environmental Division
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto font-sans">
        
        {/* Main Dashboard */}
        <button
          id="btn-nav-dashboard"
          onClick={() => setCurrentMenu('dashboard')}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition text-xs font-medium ${
            currentMenu === 'dashboard'
              ? 'bg-emerald-600 text-white shadow-md font-semibold'
              : 'text-slate-400 hover:bg-[#1E2633] hover:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Grafik</span>
          </div>
        </button>

        <div className="pt-3 pb-1">
          <p className="text-[9px] font-bold text-slate-605 uppercase tracking-widest px-3 font-mono">PEMANTAUAN UTAMA</p>
        </div>

        {/* Lingkungan & Curah Hujan */}
        <button
          id="btn-nav-environment"
          onClick={() => setCurrentMenu('environment')}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition text-xs font-medium ${
            currentMenu === 'environment'
              ? 'bg-emerald-600 text-white shadow-md font-semibold'
              : 'text-slate-400 hover:bg-[#1E2633] hover:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-blue-400 font-bold" />
            <span>Air & Curah Hujan</span>
          </div>
        </button>

        {/* Reklamasi Lahan Group */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400 text-xs font-medium select-none">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>Reklamasi Lahan</span>
          </div>
          <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-5">
            <button
              id="btn-nav-nursery"
              onClick={() => setCurrentMenu('nursery')}
              className={`w-full text-left px-3 py-1 rounded-md transition text-[11px] font-medium ${
                currentMenu === 'nursery' ? 'text-emerald-400 bg-slate-800/80 font-semibold' : 'text-slate-450 hover:text-white hover:bg-[#1E2633]'
              }`}
            >
              Management Nursery
            </button>
            <button
              id="btn-nav-reclamation"
              onClick={() => setCurrentMenu('reclamation_mgt')}
              className={`w-full text-left px-3 py-1 rounded-md transition text-[11px] font-medium ${
                currentMenu === 'reclamation_mgt' ? 'text-emerald-400 bg-slate-800/80 font-semibold' : 'text-slate-450 hover:text-white hover:bg-[#1E2633]'
              }`}
            >
              Management Reklamasi
            </button>
          </div>
        </div>

        {/* Limbah B3 Group */}
        <div className="space-y-0.5 mt-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400 text-xs font-medium select-none">
            <Trash2 className="w-4 h-4 text-orange-400" />
            <span>Limbah B3</span>
          </div>
          <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-5">
            <button
              id="btn-nav-waste-incoming"
              onClick={() => setCurrentMenu('waste_incoming')}
              className={`w-full text-left px-3 py-1 rounded-md transition text-[11px] font-medium ${
                currentMenu === 'waste_incoming' ? 'text-orange-400 bg-slate-800/80 font-semibold' : 'text-slate-450 hover:text-white hover:bg-[#1E2633]'
              }`}
            >
              Limbah B3 Masuk
            </button>
            <button
              id="btn-nav-waste-outgoing"
              onClick={() => setCurrentMenu('waste_outgoing')}
              className={`w-full text-left px-3 py-1 rounded-md transition text-[11px] font-medium ${
                currentMenu === 'waste_outgoing' ? 'text-orange-400 bg-slate-800/80 font-semibold' : 'text-slate-450 hover:text-white hover:bg-[#1E2633]'
              }`}
            >
              Limbah B3 Keluar
            </button>
          </div>
        </div>

        <div className="pt-3 pb-1">
          <p className="text-[9px] font-bold text-slate-605 uppercase tracking-widest px-3 font-mono">REGULASI & AUDIT</p>
        </div>

        {/* Pelaporan */}
        <button
          id="btn-nav-reporting"
          onClick={() => setCurrentMenu('reporting')}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition text-xs font-medium ${
            currentMenu === 'reporting'
              ? 'bg-emerald-600 text-white shadow-md font-semibold'
              : 'text-slate-400 hover:bg-[#1E2633] hover:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-400" />
            <span>Kepatuhan & Laporan</span>
          </div>
        </button>
      </nav>

      {/* Database & Cloud Sync Status */}
      <div className="p-3 bg-[#151B26] border border-slate-800/60 mx-3 mb-3 rounded-lg space-y-2 font-sans select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">G-Sheets Sync</span>
          </div>
          {user && (
            <button
              onClick={onSync}
              disabled={syncInProgress}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
              title="Synchronise now"
            >
              <RefreshCw className={`w-3 h-3 ${syncInProgress ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}
        </div>

        {user ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
              <CheckCircle className="w-3 h-3" />
              <span>Terkoneksi ke Cloud</span>
            </div>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-200 px-2 py-1 rounded border border-slate-700 transition"
              >
                Buka Google Sheets
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-slate-450 text-[10px] leading-snug">
            <p>Data tersimpan di browser. Hubungkan Google Drive & Sheets untuk audit otomatis.</p>
          </div>
        )}
      </div>

      {/* User Login Section */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0A0C10] font-sans">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-slate-700" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-semibold text-emerald-400">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="max-w-[110px] overflow-hidden truncate">
                <p className="text-[11px] font-semibold text-white truncate leading-tight">{user.displayName || 'Administrator'}</p>
                <p className="text-[9px] text-slate-450 truncate leading-tight">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/20 rounded-md transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition duration-150 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isLoggingIn ? 'Menghubungkan...' : 'Masuk / Daftar Akun'}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
