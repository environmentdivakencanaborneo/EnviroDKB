/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EnvironmentalRecord {
  id: string;
  tanggal: string;
  pH: number;
  TSS: number;
  debit: number;
  koagulan: string; // e.g., Alum, PAC, Polymer
  koagulanAmount: number; // in kg
  curahHujan: number; // in mm
  durasiHujan?: number; // in hours
  lokasi: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface WasteIncomingRecord {
  id: string;
  tanggal: string;
  kodeLimbah: string;
  jenisLimbah: string;
  sumber: string;
  jumlah: number; // in kg
  statusPenyimpanan: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface WasteOutgoingRecord {
  id: string;
  tanggal: string;
  kodeLimbah: string;
  jenisLimbah: string;
  jumlah: number; // in kg
  tujuanPengiriman: string; // Third party processor
  nomorManifest: string;
  fileDriveId?: string; // Stored in Google Drive
  fileUrl?: string; // Web View Link from Google Drive
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface NurseryRecord {
  id: string;
  tanggalInput: string;
  namaSpesies: string;
  jumlahBibit: number;
  kondisi: 'Sehat' | 'Kurang Sehat' | 'Mati';
  tanggalSemai: string;
  targetPenanaman: string; // e.g., Blok A, Area Reklamasi Pit B
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface ReclamationRecord {
  id: string;
  tanggalPelaksanaan: string;
  areaBlok: string;
  luas: number; // in Hectares
  ketebalanTopsoil: number; // in cm
  spesiesDitanam: string; // List of species planted
  statusPembentukanLereng: 'Selesai' | 'Dalam Proses' | 'Kritis';
  rencanaKemajuan: number; // percentage (0-100)
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface ReclamationGuaranteeRecord {
  id: string;
  tahun: number;
  nilaiJaminan: number; // in IDR/Rupiah
  tanggalPenyetoran: string;
  bankPenjamin: string;
  status: 'Aktif' | 'Dicairkan' | 'Kedaluwarsa';
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface GoogleSyncConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncing: boolean;
  sheetsCreated: {
    environmental: boolean;
    wasteIncoming: boolean;
    wasteOutgoing: boolean;
    nursery: boolean;
    reclamation: boolean;
  };
}
