/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EnvironmentalRecord,
  WasteIncomingRecord,
  WasteOutgoingRecord,
  NurseryRecord,
  ReclamationRecord,
  ReclamationGuaranteeRecord
} from './types';

export const initialEnvironmentalData: EnvironmentalRecord[] = [
  {
    id: 'ENV-001',
    tanggal: '2026-05-20',
    pH: 7.2,
    TSS: 45,
    debit: 1200,
    koagulan: 'PAC & Lime',
    koagulanAmount: 25,
    curahHujan: 12.5,
    lokasi: 'Sediment Pond Pit A West',
    syncStatus: 'synced',
  },
  {
    id: 'ENV-002',
    tanggal: '2026-05-21',
    pH: 6.8,
    TSS: 78,
    debit: 1540,
    koagulan: 'PAC Only',
    koagulanAmount: 30,
    curahHujan: 18.0,
    lokasi: 'Sediment Pond Outflow 2',
    syncStatus: 'synced',
  },
  {
    id: 'ENV-003',
    tanggal: '2026-05-22',
    pH: 5.6, // Warnings (below 6)
    TSS: 210, // Above limit (200)
    debit: 4500, // Torrential rainfall
    koagulan: 'PAC + Alum (Emergency Boost)',
    koagulanAmount: 180,
    curahHujan: 65.2,
    lokasi: 'Sediment Pond Pit A West',
    syncStatus: 'synced',
  },
  {
    id: 'ENV-004',
    tanggal: '2026-05-23',
    pH: 7.0,
    TSS: 110,
    debit: 2800,
    koagulan: 'PAC + Lime (Neutralization)',
    koagulanAmount: 90,
    curahHujan: 22.1,
    lokasi: 'Sediment Pond Pit A West',
    syncStatus: 'synced',
  },
  {
    id: 'ENV-005',
    tanggal: '2026-05-24',
    pH: 7.4,
    TSS: 35,
    debit: 950,
    koagulan: 'PAC Only',
    koagulanAmount: 15,
    curahHujan: 2.0,
    lokasi: 'Sediment Pond Outflow 2',
    syncStatus: 'synced',
  },
  {
    id: 'ENV-006',
    tanggal: '2026-05-25',
    pH: 7.1,
    TSS: 55,
    debit: 1100,
    koagulan: 'PAC & Lime',
    koagulanAmount: 20,
    curahHujan: 8.5,
    lokasi: 'Sediment Pond Pit A West',
    syncStatus: 'synced',
  },
  {
    id: 'ENV-007',
    tanggal: '2026-05-26',
    pH: 7.3,
    TSS: 42,
    debit: 1050,
    koagulan: 'PAC Only',
    koagulanAmount: 15,
    curahHujan: 5.0,
    lokasi: 'Sediment Pond Outflow 2',
    syncStatus: 'synced',
  },
];

export const initialWasteIncoming: WasteIncomingRecord[] = [
  {
    id: 'B3-IN-001',
    tanggal: '2026-05-15',
    kodeLimbah: 'B105d',
    jenisLimbah: 'Pelumas Bekas (Used Oil)',
    sumber: 'Workshop Heavy Equipment Pit A',
    jumlah: 1200, // kg
    statusPenyimpanan: 'TPS B3 Sengguruh - Drum A1',
    syncStatus: 'synced',
  },
  {
    id: 'B3-IN-002',
    tanggal: '2026-05-18',
    kodeLimbah: 'B107d',
    jenisLimbah: 'Aki Bekas (Lead Acid Battery)',
    sumber: 'Vehicle Fleet Maintenance Office',
    jumlah: 350,
    statusPenyimpanan: 'TPS B3 Sengguruh - Pallet B2',
    syncStatus: 'synced',
  },
  {
    id: 'B3-IN-003',
    tanggal: '2026-05-22',
    kodeLimbah: 'A102d',
    jenisLimbah: 'Fluida Rem & Coolant Bekas',
    sumber: 'Workshop Heavy Equipment Pit B',
    jumlah: 450,
    statusPenyimpanan: 'TPS B3 Sengguruh - Drum C1',
    syncStatus: 'synced',
  },
  {
    id: 'B3-IN-004',
    tanggal: '2026-05-25',
    kodeLimbah: 'B105d',
    jenisLimbah: 'Pelumas Bekas (Used Oil)',
    sumber: 'Genset Power House Central',
    jumlah: 800,
    statusPenyimpanan: 'TPS B3 Sengguruh - Drum A2',
    syncStatus: 'synced',
  },
];

export const initialWasteOutgoing: WasteOutgoingRecord[] = [
  {
    id: 'B3-OUT-001',
    tanggal: '2026-05-19',
    kodeLimbah: 'B105d',
    jenisLimbah: 'Pelumas Bekas (Used Oil)',
    jumlah: 1000,
    tujuanPengiriman: 'PT Sinar Jaya Abadi (Licensed Collector)',
    nomorManifest: 'MNF-OL-9921820',
    fileUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600',
    syncStatus: 'synced',
  },
  {
    id: 'B3-OUT-002',
    tanggal: '2026-05-24',
    kodeLimbah: 'B107d',
    jenisLimbah: 'Aki Bekas (Lead Acid Battery)',
    jumlah: 300,
    tujuanPengiriman: 'PT Recyclindo Nusantara (Licensed Recycler)',
    nomorManifest: 'MNF-BT-7719203',
    fileUrl: 'https://images.unsplash.com/photo-1617791160505-6f006e121980?auto=format&fit=crop&q=80&w=600',
    syncStatus: 'synced',
  },
];

export const initialNurseryData: NurseryRecord[] = [
  {
    id: 'NUR-001',
    tanggalInput: '2026-05-10',
    namaSpesies: 'Sengon (Falcataria moluccana)',
    jumlahBibit: 5000,
    kondisi: 'Sehat',
    tanggalSemai: '2026-03-15',
    targetPenanaman: 'In-Pit Dump Blok Timur',
    syncStatus: 'synced',
  },
  {
    id: 'NUR-002',
    tanggalInput: '2026-05-12',
    namaSpesies: 'Acacia mangium',
    jumlahBibit: 8200,
    kondisi: 'Sehat',
    tanggalSemai: '2026-03-01',
    targetPenanaman: 'Out-Of-Pit Dump Southern Area',
    syncStatus: 'synced',
  },
  {
    id: 'NUR-003',
    tanggalInput: '2026-05-15',
    namaSpesies: 'Kayu Putih (Melaleuca leucadendra)',
    jumlahBibit: 3500,
    kondisi: 'Sehat',
    tanggalSemai: '2026-04-01',
    targetPenanaman: 'Buffer Zone Blok Utara',
    syncStatus: 'synced',
  },
  {
    id: 'NUR-004',
    tanggalInput: '2026-05-18',
    namaSpesies: 'Trembesi (Albizia saman)',
    jumlahBibit: 1200,
    kondisi: 'Kurang Sehat', // needs localized nutrition
    tanggalSemai: '2025-11-20',
    targetPenanaman: 'Lereng Ex-Mining Pit A',
    syncStatus: 'synced',
  },
];

export const initialReclamationData: ReclamationRecord[] = [
  {
    id: 'REC-001',
    tanggalPelaksanaan: '2026-05-01',
    areaBlok: 'Ex-Mining Pit A - Blok 1',
    luas: 4.5,
    ketebalanTopsoil: 45, // cm (Excellent)
    spesiesDitanam: 'Cover crops (Centrosema), Sengon, Acacia mangium',
    statusPembentukanLereng: 'Selesai',
    rencanaKemajuan: 90,
    syncStatus: 'synced',
  },
  {
    id: 'REC-002',
    tanggalPelaksanaan: '2026-05-12',
    areaBlok: 'Out-Of-Pit Dump Southern Ridge',
    luas: 12.8,
    ketebalanTopsoil: 35, // Compliant (>30cm)
    spesiesDitanam: 'Acacia mangium, Kayu Putih',
    statusPembentukanLereng: 'Dalam Proses',
    rencanaKemajuan: 60,
    syncStatus: 'synced',
  },
  {
    id: 'REC-003',
    tanggalPelaksanaan: '2026-05-24',
    areaBlok: 'West Disposal Hillside - Slope Stabilisation',
    luas: 2.1,
    ketebalanTopsoil: 25, // Critical (<30cm)
    spesiesDitanam: 'Vetiver Grass (Slope Anchor)',
    statusPembentukanLereng: 'Kritis', // slope stability risk
    rencanaKemajuan: 35,
    syncStatus: 'synced',
  },
];

export const initialReclamationGuarantee: ReclamationGuaranteeRecord[] = [
  {
    id: 'JAM-2024',
    tahun: 2024,
    nilaiJaminan: 1450000000, // 1.45 Milyar
    tanggalPenyetoran: '2024-03-15',
    bankPenjamin: 'Bank Mandiri',
    status: 'Aktif',
    syncStatus: 'synced'
  },
  {
    id: 'JAM-2025',
    tahun: 2025,
    nilaiJaminan: 2300000000, // 2.3 Milyar
    tanggalPenyetoran: '2025-04-10',
    bankPenjamin: 'Bank BNI',
    status: 'Aktif',
    syncStatus: 'synced'
  },
  {
    id: 'JAM-2026',
    tahun: 2026,
    nilaiJaminan: 3100000000, // 3.1 Milyar
    tanggalPenyetoran: '2026-05-02',
    bankPenjamin: 'Bank BRI',
    status: 'Aktif',
    syncStatus: 'synced'
  }
];
