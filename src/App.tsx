/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken,
  db,
  OperationType,
  handleFirestoreError,
  emailRegister,
  emailSignIn
} from './lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  setDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  findExistingSpreadsheet, 
  createStructuredSpreadsheet, 
  appendRowToSheet 
} from './lib/googleApi';
import {
  EnvironmentalRecord,
  WasteIncomingRecord,
  WasteOutgoingRecord,
  NurseryRecord,
  ReclamationRecord,
  ReclamationGuaranteeRecord
} from './types';
import {
  initialEnvironmentalData,
  initialWasteIncoming,
  initialWasteOutgoing,
  initialNurseryData,
  initialReclamationData,
  initialReclamationGuarantee
} from './mockData';

// Subcomponents import
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EnvironmentalMenu from './components/EnvironmentalMenu';
import ReclamationMenu from './components/ReclamationMenu';
import WasteMenu from './components/WasteMenu';
import ReportingMenu from './components/ReportingMenu';

import { 
  Database,
  CloudLightning,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // --- 1. CORPORATE DATABASES ---
  const [environmentalRecords, setEnvironmentalRecords] = useState<EnvironmentalRecord[]>(() => {
    const local = localStorage.getItem('diva_environmental');
    return local ? JSON.parse(local) : initialEnvironmentalData;
  });

  const [wasteIncoming, setWasteIncoming] = useState<WasteIncomingRecord[]>(() => {
    const local = localStorage.getItem('diva_waste_incoming');
    return local ? JSON.parse(local) : initialWasteIncoming;
  });

  const [wasteOutgoing, setWasteOutgoing] = useState<WasteOutgoingRecord[]>(() => {
    const local = localStorage.getItem('diva_waste_outgoing');
    return local ? JSON.parse(local) : initialWasteOutgoing;
  });

  const [nursery, setNursery] = useState<NurseryRecord[]>(() => {
    const local = localStorage.getItem('diva_nursery');
    return local ? JSON.parse(local) : initialNurseryData;
  });

  const [reclamation, setReclamation] = useState<ReclamationRecord[]>(() => {
    const local = localStorage.getItem('diva_reclamation');
    return local ? JSON.parse(local) : initialReclamationData;
  });

  const [reclamationGuarantees, setReclamationGuarantees] = useState<ReclamationGuaranteeRecord[]>(() => {
    const local = localStorage.getItem('diva_reclamation_guarantees');
    return local ? JSON.parse(local) : initialReclamationGuarantee;
  });

  // --- 2. THEMATIC UI STATE ---
  const [currentMenu, setCurrentMenu] = useState<string>('dashboard');
  
  // --- 3. AUTH & CONFIGS ---
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => localStorage.getItem('diva_spreadsheet_id'));
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => localStorage.getItem('diva_spreadsheet_url'));
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncBanner, setSyncBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showPopupBlockedModal, setShowPopupBlockedModal] = useState(false);

  // Email Register and Login States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Persistence to localstorage on change
  useEffect(() => {
    localStorage.setItem('diva_environmental', JSON.stringify(environmentalRecords));
  }, [environmentalRecords]);

  useEffect(() => {
    localStorage.setItem('diva_waste_incoming', JSON.stringify(wasteIncoming));
  }, [wasteIncoming]);

  useEffect(() => {
    localStorage.setItem('diva_waste_outgoing', JSON.stringify(wasteOutgoing));
  }, [wasteOutgoing]);

  useEffect(() => {
    localStorage.setItem('diva_nursery', JSON.stringify(nursery));
  }, [nursery]);

  useEffect(() => {
    localStorage.setItem('diva_reclamation', JSON.stringify(reclamation));
  }, [reclamation]);

  useEffect(() => {
    localStorage.setItem('diva_reclamation_guarantees', JSON.stringify(reclamationGuarantees));
  }, [reclamationGuarantees]);

  // --- 1B. FIRESTORE SYNC STATUS & CONTROLLER ---
  const [isDbSynced, setIsDbSynced] = useState(false);

  // Function to migrate any local records to firestore on login
  const migrateLocalToFirestore = async (currentUser: User) => {
    try {
      // 1. Environmental
      const localEnv = localStorage.getItem('diva_environmental');
      if (localEnv) {
        const records = JSON.parse(localEnv) as EnvironmentalRecord[];
        for (const r of records) {
          await setDoc(doc(db, 'environmental', r.id), {
            id: r.id,
            tanggal: r.tanggal,
            pH: Number(r.pH),
            TSS: Number(r.TSS),
            debit: Number(r.debit),
            koagulan: r.koagulan,
            koagulanAmount: Number(r.koagulanAmount),
            curahHujan: Number(r.curahHujan),
            durasiHujan: r.durasiHujan !== undefined ? Number(r.durasiHujan) : 0,
            lokasi: r.lokasi,
            userId: currentUser.uid,
            createdAt: serverTimestamp()
          });
        }
      }

      // 2. Waste Incoming
      const localWasteInc = localStorage.getItem('diva_waste_incoming');
      if (localWasteInc) {
        const records = JSON.parse(localWasteInc) as WasteIncomingRecord[];
        for (const r of records) {
          await setDoc(doc(db, 'waste_incoming', r.id), {
            id: r.id,
            tanggal: r.tanggal,
            kodeLimbah: r.kodeLimbah,
            jenisLimbah: r.jenisLimbah,
            sumber: r.sumber,
            jumlah: Number(r.jumlah),
            statusPenyimpanan: r.statusPenyimpanan,
            userId: currentUser.uid,
            createdAt: serverTimestamp()
          });
        }
      }

      // 3. Waste Outgoing
      const localWasteOut = localStorage.getItem('diva_waste_outgoing');
      if (localWasteOut) {
        const records = JSON.parse(localWasteOut) as WasteOutgoingRecord[];
        for (const r of records) {
          await setDoc(doc(db, 'waste_outgoing', r.id), {
            id: r.id,
            tanggal: r.tanggal,
            kodeLimbah: r.kodeLimbah,
            jenisLimbah: r.jenisLimbah,
            jumlah: Number(r.jumlah),
            tujuanPengiriman: r.tujuanPengiriman,
            nomorManifest: r.nomorManifest,
            fileDriveId: r.fileDriveId || '',
            fileUrl: r.fileUrl || '',
            userId: currentUser.uid,
            createdAt: serverTimestamp()
          });
        }
      }

      // 4. Nursery
      const localNursery = localStorage.getItem('diva_nursery');
      if (localNursery) {
        const records = JSON.parse(localNursery) as NurseryRecord[];
        for (const r of records) {
          await setDoc(doc(db, 'nursery', r.id), {
            id: r.id,
            tanggalInput: r.tanggalInput,
            namaSpesies: r.namaSpesies,
            jumlahBibit: Number(r.jumlahBibit),
            kondisi: r.kondisi,
            tanggalSemai: r.tanggalSemai,
            targetPenanaman: r.targetPenanaman,
            userId: currentUser.uid,
            createdAt: serverTimestamp()
          });
        }
      }

      // 5. Reclamation
      const localReclamation = localStorage.getItem('diva_reclamation');
      if (localReclamation) {
        const records = JSON.parse(localReclamation) as ReclamationRecord[];
        for (const r of records) {
          await setDoc(doc(db, 'reclamation', r.id), {
            id: r.id,
            tanggalPelaksanaan: r.tanggalPelaksanaan,
            areaBlok: r.areaBlok,
            luas: Number(r.luas),
            ketebalanTopsoil: Number(r.ketebalanTopsoil),
            spesiesDitanam: r.spesiesDitanam,
            statusPembentukanLereng: r.statusPembentukanLereng,
            rencanaKemajuan: Number(r.rencanaKemajuan),
            userId: currentUser.uid,
            createdAt: serverTimestamp()
          });
        }
      }

      // 6. Guarantees
      const localGuarantees = localStorage.getItem('diva_reclamation_guarantees');
      if (localGuarantees) {
        const records = JSON.parse(localGuarantees) as ReclamationGuaranteeRecord[];
        for (const r of records) {
          await setDoc(doc(db, 'reclamation_guarantees', r.id), {
            id: r.id,
            tahun: Number(r.tahun),
            nilaiJaminan: Number(r.nilaiJaminan),
            tanggalPenyetoran: r.tanggalPenyetoran,
            bankPenjamin: r.bankPenjamin,
            status: r.status,
            userId: currentUser.uid,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      console.error('Data migration error: ', err);
    }
  };

  // Trigger migration upon login
  useEffect(() => {
    if (!user) {
      setIsDbSynced(false);
      return;
    }
    migrateLocalToFirestore(user).then(() => {
      setIsDbSynced(true);
    });
  }, [user]);

  // Real-time synchronization of Firestore data
  useEffect(() => {
    if (!user || !isDbSynced) return;

    const unsubEnv = onSnapshot(
      query(collection(db, 'environmental'), where('userId', '==', user.uid)),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as EnvironmentalRecord[];
        setEnvironmentalRecords(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'environmental')
    );

    const unsubWasteInc = onSnapshot(
      query(collection(db, 'waste_incoming'), where('userId', '==', user.uid)),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as WasteIncomingRecord[];
        setWasteIncoming(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'waste_incoming')
    );

    const unsubWasteOut = onSnapshot(
      query(collection(db, 'waste_outgoing'), where('userId', '==', user.uid)),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as WasteOutgoingRecord[];
        setWasteOutgoing(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'waste_outgoing')
    );

    const unsubNursery = onSnapshot(
      query(collection(db, 'nursery'), where('userId', '==', user.uid)),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as NurseryRecord[];
        setNursery(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'nursery')
    );

    const unsubReclamation = onSnapshot(
      query(collection(db, 'reclamation'), where('userId', '==', user.uid)),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as ReclamationRecord[];
        setReclamation(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'reclamation')
    );

    const unsubGuarantees = onSnapshot(
      query(collection(db, 'reclamation_guarantees'), where('userId', '==', user.uid)),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as ReclamationGuaranteeRecord[];
        setReclamationGuarantees(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'reclamation_guarantees')
    );

    return () => {
      unsubEnv();
      unsubWasteInc();
      unsubWasteOut();
      unsubNursery();
      unsubReclamation();
      unsubGuarantees();
    };
  }, [user, isDbSynced]);

  // Auth Init Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- 4. GOOGLE SPREADSHEET INITIALIZATION ENGINE ---
  const initGoogleSpreadsheet = async (token: string) => {
    setSyncInProgress(true);
    setSyncBanner({ type: 'info', message: 'Mencari berkas spreadsheet DivaMonitor di Google Drive Anda...' });
    
    try {
      // Step A: Search for an existing sheet in Drive
      let spreadsheet = await findExistingSpreadsheet(token);
      
      if (!spreadsheet) {
        setSyncBanner({ type: 'info', message: 'Spreadsheet tidak ditemukan. Membuat spreadsheet baru "DivaMonitor DATA - PT Diva Kencana Borneo"...' });
        // Step B: Create a brand new Google Sheet
        spreadsheet = await createStructuredSpreadsheet(token);
      }

      setSpreadsheetId(spreadsheet.id);
      setSpreadsheetUrl(spreadsheet.url);
      localStorage.setItem('diva_spreadsheet_id', spreadsheet.id);
      localStorage.setItem('diva_spreadsheet_url', spreadsheet.url);

      setSyncBanner({ type: 'success', message: 'Koneksi Spreadsheet Google Berhasil! Sinkronisasi data dimulai...' });
      
      // Step C: Trigger initial sync for any local records not on cloud
      await syncDataToGoogle(token, spreadsheet.id);
    } catch (err: any) {
      console.error('Spreadsheet setup failure', err);
      setSyncBanner({ type: 'error', message: `Gagal setup integrasi Google Sheets: ${err.message || err}` });
    } finally {
      setSyncInProgress(false);
    }
  };

  // Login trigger to open modal
  const handleLogin = () => {
    setShowAuthModal(true);
    setAuthModalMode('login');
    setAuthError(null);
  };

  // Google Sign-In Action
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setShowAuthModal(false);
        await initGoogleSpreadsheet(result.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const errStr = String(err);
      const isPopupBlocked = 
        err?.code === 'auth/popup-blocked' || 
        errStr.includes('popup-blocked') || 
        errStr.includes('popup_blocked_by_browser') ||
        err?.message?.includes('popup-blocked');
        
      if (isPopupBlocked) {
        setShowPopupBlockedModal(true);
      } else {
        setAuthError(`Google Sign-In gagal: ${err?.message || errStr}`);
      }
    } finally {
      setAuthLoading(false);
      setIsLoggingIn(false);
    }
  };

  // Email Register Action
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail.trim() || !authPassword || !authName.trim()) {
      setAuthError('Silakan isi semua kolom data.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Kata sandi harus minimal 6 karakter.');
      return;
    }
    setAuthLoading(true);
    try {
      const newUser = await emailRegister(authEmail.trim(), authPassword, authName.trim());
      setUser(newUser);
      setAccessToken(null); // Local/Firestore storage only (No Google Auth Access Token)
      setShowAuthModal(false);
      
      // Reset inputs
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      
      setSyncBanner({ 
        type: 'success', 
        message: `Pendaftaran berhasil! Selamat datang, ${authName.trim()}. Anda dapat menginput data sekarang.` 
      });
    } catch (err: any) {
      console.error('Email registration error:', err);
      let errMsg = err?.message || 'Gagal mendaftar akun email.';
      if (err?.code === 'auth/email-already-in-use' || errMsg.includes('email-already-in-use')) {
        errMsg = 'Email sudah digunakan. Silakan gunakan email lain atau Login.';
      } else if (err?.code === 'auth/invalid-email' || errMsg.includes('invalid-email')) {
        errMsg = 'Format email tidak valid.';
      }
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Email Login Action
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Silakan masukkan email dan kata sandi Anda.');
      return;
    }
    setAuthLoading(true);
    try {
      const loggedInUser = await emailSignIn(authEmail.trim(), authPassword);
      setUser(loggedInUser);
      setAccessToken(null); // Local/Firestore storage only
      setShowAuthModal(false);
      
      // Reset inputs
      setAuthEmail('');
      setAuthPassword('');
      
      setSyncBanner({ 
        type: 'success', 
        message: `Berhasil masuk! Selamat datang kembali, ${loggedInUser.displayName || 'Pengguna'}.` 
      });
    } catch (err: any) {
      console.error('Email sign in error:', err);
      let errMsg = err?.message || 'Gagal masuk. Periksa kembali email & kata sandi Anda.';
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found' || errMsg.includes('wrong-password') || errMsg.includes('user-not-found')) {
        errMsg = 'Email atau kata sandi salah. Silakan coba lagi.';
      } else if (err?.code === 'auth/invalid-credential' || errMsg.includes('invalid-credential')) {
        errMsg = 'Kredensial tidak valid. Silakan periksa kembali email dan kata sandi Anda.';
      }
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setSpreadsheetId(null);
      setSpreadsheetUrl(null);
      localStorage.removeItem('diva_spreadsheet_id');
      localStorage.removeItem('diva_spreadsheet_url');
      setSyncBanner(null);
    } catch (err) {
      console.error(err);
    }
  };

  // --- 5. SYNCHRONISATION CONTROLLERS ---
  const syncDataToGoogle = async (token: string, sheetId: string) => {
    if (!token || !sheetId) return;

    setSyncInProgress(true);
    let successCount = 0;
    let failedCount = 0;

    // 1. Sync Environmental records
    const unsyncedEnv = environmentalRecords.filter(r => r.syncStatus !== 'synced');
    if (unsyncedEnv.length > 0) {
      const updated = environmentalRecords.map(item => ({ ...item }));
      for (const r of unsyncedEnv) {
        const row = [r.id, r.tanggal, r.pH, r.TSS, r.debit, r.koagulan, r.koagulanAmount, r.curahHujan, r.durasiHujan || 0, r.lokasi];
        const ok = await appendRowToSheet(token, sheetId, 'Environmental', row);
        const idx = updated.findIndex(item => item.id === r.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], syncStatus: ok ? 'synced' : 'failed' };
          if (ok) successCount++; else failedCount++;
        }
      }
      setEnvironmentalRecords(updated);
    }

    // 2. Sync Waste Incoming
    const unsyncedInB3 = wasteIncoming.filter(r => r.syncStatus !== 'synced');
    if (unsyncedInB3.length > 0) {
      const updated = wasteIncoming.map(item => ({ ...item }));
      for (const r of unsyncedInB3) {
        const row = [r.id, r.tanggal, r.kodeLimbah, r.jenisLimbah, r.sumber, r.jumlah, r.statusPenyimpanan];
        const ok = await appendRowToSheet(token, sheetId, 'WasteIncoming', row);
        const idx = updated.findIndex(item => item.id === r.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], syncStatus: ok ? 'synced' : 'failed' };
          if (ok) successCount++; else failedCount++;
        }
      }
      setWasteIncoming(updated);
    }

    // 3. Sync Waste Outgoing
    const unsyncedOutB3 = wasteOutgoing.filter(r => r.syncStatus !== 'synced');
    if (unsyncedOutB3.length > 0) {
      const updated = wasteOutgoing.map(item => ({ ...item }));
      for (const r of unsyncedOutB3) {
        const row = [r.id, r.tanggal, r.kodeLimbah, r.jenisLimbah, r.jumlah, r.tujuanPengiriman, r.nomorManifest, r.fileUrl || ''];
        const ok = await appendRowToSheet(token, sheetId, 'WasteOutgoing', row);
        const idx = updated.findIndex(item => item.id === r.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], syncStatus: ok ? 'synced' : 'failed' };
          if (ok) successCount++; else failedCount++;
        }
      }
      setWasteOutgoing(updated);
    }

    // 4. Sync Nursery
    const unsyncedNursery = nursery.filter(r => r.syncStatus !== 'synced');
    if (unsyncedNursery.length > 0) {
      const updated = nursery.map(item => ({ ...item }));
      for (const r of unsyncedNursery) {
        const row = [r.id, r.tanggalInput, r.namaSpesies, r.jumlahBibit, r.kondisi, r.tanggalSemai, r.targetPenanaman];
        const ok = await appendRowToSheet(token, sheetId, 'Nursery', row);
        const idx = updated.findIndex(item => item.id === r.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], syncStatus: ok ? 'synced' : 'failed' };
          if (ok) successCount++; else failedCount++;
        }
      }
      setNursery(updated);
    }

    // 5. Sync Reclamation
    const unsyncedRec = reclamation.filter(r => r.syncStatus !== 'synced');
    if (unsyncedRec.length > 0) {
      const updated = reclamation.map(item => ({ ...item }));
      for (const r of unsyncedRec) {
        const row = [r.id, r.tanggalPelaksanaan, r.areaBlok, r.luas, r.ketebalanTopsoil, r.spesiesDitanam, r.statusPembentukanLereng, r.rencanaKemajuan];
        const ok = await appendRowToSheet(token, sheetId, 'Reclamation', row);
        const idx = updated.findIndex(item => item.id === r.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], syncStatus: ok ? 'synced' : 'failed' };
          if (ok) successCount++; else failedCount++;
        }
      }
      setReclamation(updated);
    }

    // 6. Sync Guarantees
    const unsyncedGuarantees = reclamationGuarantees.filter(r => r.syncStatus !== 'synced');
    if (unsyncedGuarantees.length > 0) {
      const updated = reclamationGuarantees.map(item => ({ ...item }));
      for (const r of unsyncedGuarantees) {
        const row = [r.id, r.tahun, r.nilaiJaminan, r.tanggalPenyetoran, r.bankPenjamin, r.status];
        const ok = await appendRowToSheet(token, sheetId, 'Guarantees', row);
        const idx = updated.findIndex(item => item.id === r.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], syncStatus: ok ? 'synced' : 'failed' };
          if (ok) successCount++; else failedCount++;
        }
      }
      setReclamationGuarantees(updated);
    }

    setSyncInProgress(false);
    if (successCount > 0) {
      setSyncBanner({ type: 'success', message: `${successCount} data rekapitulasi tambang baru telah berhasil disinkronisasi ke Google Sheet!` });
    } else {
      setSyncBanner({ type: 'success', message: `Data sinkron! Penyimpanan awan DivaMonitor sinkron dengan mutakhir.` });
    }
  };

  const manualSync = () => {
    if (accessToken && spreadsheetId) {
      syncDataToGoogle(accessToken, spreadsheetId);
    } else {
      setSyncBanner({ type: 'info', message: 'Silakan masuk ke Google terlebih dahulu sebelum melakukan sinkronisasi.' });
    }
  };

  // --- 6. ADD & DELETE OPERATIONS ---
  
  // A. Environmental air/water Records
  const handleAddEnvironmental = async (record: Omit<EnvironmentalRecord, 'id' | 'syncStatus'>) => {
    const newId = `ENV-${Date.now().toString().slice(-4)}`;
    const newRecord: EnvironmentalRecord = {
      id: newId,
      ...record,
      syncStatus: 'pending'
    };

    setEnvironmentalRecords(prev => [...prev, newRecord]);

    if (user) {
      try {
        await setDoc(doc(db, 'environmental', newId), {
          id: newId,
          tanggal: record.tanggal,
          pH: Number(record.pH),
          TSS: Number(record.TSS),
          debit: Number(record.debit),
          koagulan: record.koagulan,
          koagulanAmount: Number(record.koagulanAmount),
          curahHujan: Number(record.curahHujan),
          durasiHujan: record.durasiHujan !== undefined ? Number(record.durasiHujan) : 0,
          lokasi: record.lokasi,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `environmental/${newId}`);
      }
    }

    if (accessToken && spreadsheetId) {
      setSyncInProgress(true);
      const row = [newId, record.tanggal, record.pH, record.TSS, record.debit, record.koagulan, record.koagulanAmount, record.curahHujan, record.durasiHujan || 0, record.lokasi];
      const ok = await appendRowToSheet(accessToken, spreadsheetId, 'Environmental', row);
      
      setEnvironmentalRecords(prev => 
        prev.map(r => r.id === newId ? { ...r, syncStatus: ok ? 'synced' : 'failed' } : r)
      );
      setSyncInProgress(false);
    }
  };

  const handleDeleteEnvironmental = async (id: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus data pemantauan lingkungan air ini? Penghapusan di Google Sheet hanya dilakukan manual.');
    if (confirmed) {
      setEnvironmentalRecords(prev => prev.filter(r => r.id !== id));
      if (user) {
        try {
          await deleteDoc(doc(db, 'environmental', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `environmental/${id}`);
        }
      }
    }
  };

  // B. B3 Waste Incoming
  const handleAddWasteIncoming = async (record: Omit<WasteIncomingRecord, 'id' | 'syncStatus'>) => {
    const newId = `B3-IN-${Date.now().toString().slice(-4)}`;
    const newRecord: WasteIncomingRecord = {
      id: newId,
      ...record,
      syncStatus: 'pending'
    };

    setWasteIncoming(prev => [...prev, newRecord]);

    if (user) {
      try {
        await setDoc(doc(db, 'waste_incoming', newId), {
          id: newId,
          tanggal: record.tanggal,
          kodeLimbah: record.kodeLimbah,
          jenisLimbah: record.jenisLimbah,
          sumber: record.sumber,
          jumlah: Number(record.jumlah),
          statusPenyimpanan: record.statusPenyimpanan,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `waste_incoming/${newId}`);
      }
    }

    if (accessToken && spreadsheetId) {
      setSyncInProgress(true);
      const row = [newId, record.tanggal, record.kodeLimbah, record.jenisLimbah, record.sumber, record.jumlah, record.statusPenyimpanan];
      const ok = await appendRowToSheet(accessToken, spreadsheetId, 'WasteIncoming', row);
      
      setWasteIncoming(prev => 
        prev.map(r => r.id === newId ? { ...r, syncStatus: ok ? 'synced' : 'failed' } : r)
      );
      setSyncInProgress(false);
    }
  };

  const handleDeleteIncoming = async (id: string) => {
    const confirmed = window.confirm('Hapus pencatatan limbah masuk ini dari basis data lokal?');
    if (confirmed) {
      setWasteIncoming(prev => prev.filter(r => r.id !== id));
      if (user) {
        try {
          await deleteDoc(doc(db, 'waste_incoming', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `waste_incoming/${id}`);
        }
      }
    }
  };

  // C. B3 Waste Outgoing
  const handleAddWasteOutgoing = async (record: Omit<WasteOutgoingRecord, 'id' | 'syncStatus'>) => {
    const newId = `B3-OUT-${Date.now().toString().slice(-4)}`;
    const newRecord: WasteOutgoingRecord = {
      id: newId,
      ...record,
      syncStatus: 'pending'
    };

    setWasteOutgoing(prev => [...prev, newRecord]);

    if (user) {
      try {
        await setDoc(doc(db, 'waste_outgoing', newId), {
          id: newId,
          tanggal: record.tanggal,
          kodeLimbah: record.kodeLimbah,
          jenisLimbah: record.jenisLimbah,
          jumlah: Number(record.jumlah),
          tujuanPengiriman: record.tujuanPengiriman,
          nomorManifest: record.nomorManifest,
          fileDriveId: record.fileDriveId || '',
          fileUrl: record.fileUrl || '',
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `waste_outgoing/${newId}`);
      }
    }

    if (accessToken && spreadsheetId) {
      setSyncInProgress(true);
      const row = [newId, record.tanggal, record.kodeLimbah, record.jenisLimbah, record.jumlah, record.tujuanPengiriman, record.nomorManifest, record.fileUrl || ''];
      const ok = await appendRowToSheet(accessToken, spreadsheetId, 'WasteOutgoing', row);
      
      setWasteOutgoing(prev => 
        prev.map(r => r.id === newId ? { ...r, syncStatus: ok ? 'synced' : 'failed' } : r)
      );
      setSyncInProgress(false);
    }
  };

  const handleDeleteOutgoing = async (id: string) => {
    const confirmed = window.confirm('Hapus rilis manifest limbah keluar ini?');
    if (confirmed) {
      setWasteOutgoing(prev => prev.filter(r => r.id !== id));
      if (user) {
        try {
          await deleteDoc(doc(db, 'waste_outgoing', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `waste_outgoing/${id}`);
        }
      }
    }
  };

  // D. Nursery Records
  const handleAddNursery = async (record: Omit<NurseryRecord, 'id' | 'syncStatus'>) => {
    const newId = `NUR-${Date.now().toString().slice(-4)}`;
    const newRecord: NurseryRecord = {
      id: newId,
      ...record,
      syncStatus: 'pending'
    };

    setNursery(prev => [...prev, newRecord]);

    if (user) {
      try {
        await setDoc(doc(db, 'nursery', newId), {
          id: newId,
          tanggalInput: record.tanggalInput,
          namaSpesies: record.namaSpesies,
          jumlahBibit: Number(record.jumlahBibit),
          kondisi: record.kondisi,
          tanggalSemai: record.tanggalSemai,
          targetPenanaman: record.targetPenanaman,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `nursery/${newId}`);
      }
    }

    if (accessToken && spreadsheetId) {
      setSyncInProgress(true);
      const row = [newId, record.tanggalInput, record.namaSpesies, record.jumlahBibit, record.kondisi, record.tanggalSemai, record.targetPenanaman];
      const ok = await appendRowToSheet(accessToken, spreadsheetId, 'Nursery', row);
      
      setNursery(prev => 
        prev.map(r => r.id === newId ? { ...r, syncStatus: ok ? 'synced' : 'failed' } : r)
      );
      setSyncInProgress(false);
    }
  };

  const handleDeleteNursery = async (id: string) => {
    const confirmed = window.confirm('Hapus log pembibitan ini?');
    if (confirmed) {
      setNursery(prev => prev.filter(r => r.id !== id));
      if (user) {
        try {
          await deleteDoc(doc(db, 'nursery', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `nursery/${id}`);
        }
      }
    }
  };

  // E. Reclamation Records
  const handleAddReclamation = async (
    record: Omit<ReclamationRecord, 'id' | 'syncStatus'>, 
    linkedNurseryReduction?: { id: string; amount: number }
  ) => {
    const newId = `REC-${Date.now().toString().slice(-4)}`;
    const newRecord: ReclamationRecord = {
      id: newId,
      ...record,
      syncStatus: 'pending'
    };

    setReclamation(prev => [...prev, newRecord]);

    // Apply stock subtraction to Nursery if specified
    if (linkedNurseryReduction) {
      const { id, amount } = linkedNurseryReduction;
      setNursery(prev =>
        prev.map(item => {
          if (item.id === id) {
            const updatedAmount = Math.max(0, item.jumlahBibit - amount);
            
            // Sync reduction to firestore if authenticated
            if (user) {
              setDoc(doc(db, 'nursery', id), {
                jumlahBibit: updatedAmount
              }, { merge: true }).catch(err => {
                console.error("Firestore nursery reduction error:", err);
              });
            }
            return { ...item, jumlahBibit: updatedAmount };
          }
          return item;
        })
      );
    }

    if (user) {
      try {
        await setDoc(doc(db, 'reclamation', newId), {
          id: newId,
          tanggalPelaksanaan: record.tanggalPelaksanaan,
          areaBlok: record.areaBlok,
          luas: Number(record.luas),
          ketebalanTopsoil: Number(record.ketebalanTopsoil),
          spesiesDitanam: record.spesiesDitanam,
          statusPembentukanLereng: record.statusPembentukanLereng,
          rencanaKemajuan: Number(record.rencanaKemajuan),
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `reclamation/${newId}`);
      }
    }

    if (accessToken && spreadsheetId) {
      setSyncInProgress(true);
      const row = [newId, record.tanggalPelaksanaan, record.areaBlok, record.luas, record.ketebalanTopsoil, record.spesiesDitanam, record.statusPembentukanLereng, record.rencanaKemajuan];
      const ok = await appendRowToSheet(accessToken, spreadsheetId, 'Reclamation', row);
      
      setReclamation(prev => 
        prev.map(r => r.id === newId ? { ...r, syncStatus: ok ? 'synced' : 'failed' } : r)
      );
      setSyncInProgress(false);
    }
  };

  const handleDeleteReclamation = async (id: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus data reklamasi blok ini?');
    if (confirmed) {
      setReclamation(prev => prev.filter(r => r.id !== id));
      if (user) {
        try {
          await deleteDoc(doc(db, 'reclamation', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `reclamation/${id}`);
        }
      }
    }
  };

  // F. Reclamation Guarantee Records
  const handleAddGuarantee = async (record: Omit<ReclamationGuaranteeRecord, 'id' | 'syncStatus'>) => {
    const newId = `JAM-${Date.now().toString().slice(-4)}`;
    const newRecord: ReclamationGuaranteeRecord = {
      id: newId,
      ...record,
      syncStatus: 'pending'
    };

    setReclamationGuarantees(prev => [...prev, newRecord]);

    if (user) {
      try {
        await setDoc(doc(db, 'reclamation_guarantees', newId), {
          id: newId,
          tahun: Number(record.tahun),
          nilaiJaminan: Number(record.nilaiJaminan),
          tanggalPenyetoran: record.tanggalPenyetoran,
          bankPenjamin: record.bankPenjamin,
          status: record.status,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `reclamation_guarantees/${newId}`);
      }
    }

    if (accessToken && spreadsheetId) {
      setSyncInProgress(true);
      const row = [newId, record.tahun, record.nilaiJaminan, record.tanggalPenyetoran, record.bankPenjamin, record.status];
      const ok = await appendRowToSheet(accessToken, spreadsheetId, 'Guarantees', row);
      
      setReclamationGuarantees(prev => 
        prev.map(r => r.id === newId ? { ...r, syncStatus: ok ? 'synced' : 'failed' } : r)
      );
      setSyncInProgress(false);
    }
  };

  const handleDeleteGuarantee = async (id: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus data jaminan reklamasi ini?');
    if (confirmed) {
      setReclamationGuarantees(prev => prev.filter(r => r.id !== id));
      if (user) {
        try {
          await deleteDoc(doc(db, 'reclamation_guarantees', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `reclamation_guarantees/${id}`);
        }
      }
    }
  };

  // Switch menus matching active views
  const renderActiveMenu = () => {
    switch (currentMenu) {
      case 'dashboard':
        return (
          <Dashboard 
            environmentalRecords={environmentalRecords}
            wasteIncoming={wasteIncoming}
            wasteOutgoing={wasteOutgoing}
            nursery={nursery}
            reclamation={reclamation}
            reclamationGuarantees={reclamationGuarantees}
          />
        );
      case 'environment':
        return (
          <EnvironmentalMenu 
            records={environmentalRecords}
            onAddRecord={handleAddEnvironmental}
            onDeleteRecord={handleDeleteEnvironmental}
            userAuthenticated={!!user}
          />
        );
      case 'nursery':
        return (
          <ReclamationMenu 
            nurseryRecords={nursery}
            reclamationRecords={reclamation}
            guaranteeRecords={reclamationGuarantees}
            onAddNursery={handleAddNursery}
            onDeleteNursery={handleDeleteNursery}
            onAddReclamation={handleAddReclamation}
            onDeleteReclamation={handleDeleteReclamation}
            onAddGuarantee={handleAddGuarantee}
            onDeleteGuarantee={handleDeleteGuarantee}
            userAuthenticated={!!user}
            defaultSubMenu="nursery"
          />
        );
      case 'reclamation_mgt':
        return (
          <ReclamationMenu 
            nurseryRecords={nursery}
            reclamationRecords={reclamation}
            guaranteeRecords={reclamationGuarantees}
            onAddNursery={handleAddNursery}
            onDeleteNursery={handleDeleteNursery}
            onAddReclamation={handleAddReclamation}
            onDeleteReclamation={handleDeleteReclamation}
            onAddGuarantee={handleAddGuarantee}
            onDeleteGuarantee={handleDeleteGuarantee}
            userAuthenticated={!!user}
            defaultSubMenu="reclamation"
          />
        );
      case 'waste_incoming':
        return (
          <WasteMenu 
            incomingRecords={wasteIncoming}
            outgoingRecords={wasteOutgoing}
            onAddIncoming={handleAddWasteIncoming}
            onDeleteIncoming={handleDeleteIncoming}
            onAddOutgoing={handleAddWasteOutgoing}
            onDeleteOutgoing={handleDeleteOutgoing}
            userAuthenticated={!!user}
            accessToken={accessToken}
            defaultSubMenu="incoming"
          />
        );
      case 'waste_outgoing':
        return (
          <WasteMenu 
            incomingRecords={wasteIncoming}
            outgoingRecords={wasteOutgoing}
            onAddIncoming={handleAddWasteIncoming}
            onDeleteIncoming={handleDeleteIncoming}
            onAddOutgoing={handleAddWasteOutgoing}
            onDeleteOutgoing={handleDeleteOutgoing}
            userAuthenticated={!!user}
            accessToken={accessToken}
            defaultSubMenu="outgoing"
          />
        );
      case 'reporting':
        return (
          <ReportingMenu 
            environmentalRecords={environmentalRecords}
            wasteIncoming={wasteIncoming}
            wasteOutgoing={wasteOutgoing}
            nursery={nursery}
            reclamation={reclamation}
            accessToken={accessToken}
          />
        );
      default:
        return (
          <Dashboard 
            environmentalRecords={environmentalRecords}
            wasteIncoming={wasteIncoming}
            wasteOutgoing={wasteOutgoing}
            nursery={nursery}
            reclamation={reclamation}
            reclamationGuarantees={reclamationGuarantees}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0C10] overflow-hidden font-sans text-slate-200">
      
      {/* 1. App Sidebar */}
      <Sidebar 
        currentMenu={currentMenu}
        setCurrentMenu={setCurrentMenu}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        spreadsheetUrl={spreadsheetUrl}
        syncInProgress={syncInProgress}
        onSync={manualSync}
      />

      {/* 2. Main Workstage Content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header id="app-header" className="bg-[#0F131A] border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between shrink-0 select-none print:hidden">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-slate-100 tracking-tight font-sans uppercase">DivaMonitor System</h2>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
              <span>Online</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {spreadsheetUrl ? (
              <a 
                href={spreadsheetUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Google Sheets Terhubung</span>
              </a>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-350 hover:text-white bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg border border-slate-700 transition"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Modus Lokal (Offline)</span>
              </button>
            )}
          </div>
        </header>

        {/* Sync notification bar if any */}
        {syncBanner && (
          <div className={`px-6 py-2 border-b shrink-0 flex items-center justify-between font-sans text-[11px] print:hidden ${
            syncBanner.type === 'success' ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-350' :
            syncBanner.type === 'error' ? 'bg-red-950/40 border-red-900/60 text-red-350' :
            'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            <span className="font-semibold flex items-center gap-2">
              {syncBanner.type === 'success' ? <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" /> :
               syncBanner.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0" /> :
               <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />}
              <span>{syncBanner.message}</span>
            </span>
            <button 
              onClick={() => setSyncBanner(null)}
              className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic active screen workspace */}
        <div className="flex-1 overflow-y-auto p-5 max-w-[1500px] w-full mx-auto print:p-0 print:overflow-visible">
          {renderActiveMenu()}
        </div>
      </main>

      {/* 4. Google Sign-In Iframe Popup Blocked Modal */}
      {showPopupBlockedModal && (
        <div id="popup-blocked-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#0F131A] border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-[#121620] border-b border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/10">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Sign-In Diblokir</h3>
                  <p className="text-[9px] text-slate-500 font-mono">Firebase: auth/popup-blocked</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPopupBlockedModal(false)}
                className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-4 text-xs select-none">
              <p className="text-slate-350 leading-relaxed font-sans mt-0.5">
                Peramban (browser) Anda memblokir jendela pop-up Google Sign-In. Hal ini terjadi karena aplikasi ini sedang berjalan di dalam <strong className="text-emerald-450 font-semibold">iframe pratinjau Google AI Studio</strong>.
              </p>
              
              <div className="p-3.5 bg-slate-950/50 rounded-lg border border-slate-850/80 space-y-3">
                <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Panduan Solusi:</p>
                
                <div className="space-y-2.5">
                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">1</div>
                    <p className="text-slate-350 leading-snug">
                      <strong className="text-white">Buka di Tab Baru (Disarankan):</strong> Klik tombol di bawah untuk membuka aplikasi di luar sandbox iframe. Proses login akan segera lancar.
                    </p>
                  </div>
                  
                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-550 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">2</div>
                    <p className="text-slate-350 leading-snug">
                      <strong className="text-white">Izinkan Pop-up:</strong> Izinkan pop-up dan redirect secara manual lewat ikon blokir di baris alamat URL peramban Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="bg-[#121620] border-t border-slate-800 px-5 py-4 flex gap-2">
              <button
                onClick={() => setShowPopupBlockedModal(false)}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition cursor-pointer"
              >
                Tutup
              </button>
              <a
                href={window.location.origin}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                onClick={() => setShowPopupBlockedModal(false)}
              >
                <span>Buka di Tab Baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5. Elegant Email SignUp / SignIn Modal */}
      {showAuthModal && (
        <div id="email-auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#0F131A] border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-[#121620] border-b border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/15">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Akses & Sinkronisasi Cloud</h3>
                  <p className="text-[9px] text-slate-500 font-mono">DivaMonitor Cloud Gateway</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!authLoading) {
                    setShowAuthModal(false);
                    setAuthError(null);
                  }
                }}
                disabled={authLoading}
                className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-md text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="px-5 pt-4">
              <div className="flex bg-[#121620] p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthError(null);
                  }}
                  disabled={authLoading}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    authModalMode === 'login'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthError(null);
                  }}
                  disabled={authLoading}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    authModalMode === 'register'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pendaftaran Baru
                </button>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mx-5 mt-4 p-3 bg-red-950/40 border border-red-500/20 text-red-350 text-[11px] rounded-lg flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-tight">{authError}</span>
              </div>
            )}

            {/* Body Form */}
            <form onSubmit={authModalMode === 'login' ? handleEmailSignIn : handleEmailRegister} className="p-5 space-y-4">
              {authModalMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Diva Kencana"
                    value={authName}
                    disabled={authLoading}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-750 bg-[#121620] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alamat Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@divakencana.com"
                  value={authEmail}
                  disabled={authLoading}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-750 bg-[#121620] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi (Min. 6 Karakter)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  disabled={authLoading}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-750 bg-[#121620] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mempersiapkan Koneksi...</span>
                  </>
                ) : (
                  <span>{authModalMode === 'login' ? 'Masuk ke Sistem' : 'Mulai Pendaftaran'}</span>
                )}
              </button>
            </form>

            <div className="relative flex py-2 items-center px-5 font-sans">
              <div className="flex-grow border-t border-slate-800/85"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Pilihan Lain</span>
              <div className="flex-grow border-t border-slate-800/85"></div>
            </div>

            {/* Google Link login inside modal */}
            <div className="px-5 pb-5 pt-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full py-2 rounded-lg bg-slate-850 hover:bg-slate-750 disabled:opacity-50 border border-slate-750 text-slate-200 hover:text-white text-xs font-semibold tracking-wide transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading && isLoggingIn ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                ) : (
                  <svg className="w-3.5 h-3.5 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.5s3.81-8.5 8.503-8.5c2.297 0 4.387.81 6.009 2.148l3.1-3.1C18.665 1.258 15.654 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.702 0 12.186-5.367 12.186-12.24 0-.756-.078-1.485-.227-2.185H12.24z" />
                  </svg>
                )}
                <span>Masuk dengan Akun Google</span>
              </button>
              
              <div className="mt-3.5 p-2.5 bg-slate-950/45 rounded-lg border border-slate-850/80">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-emerald-500 shrink-0" />
                  Keterangan Sinkronisasi:
                </p>
                <p className="text-[9px] text-slate-400 font-sans leading-normal">
                  Pendaftaran email mengaktifkan database awan <strong className="text-emerald-450 font-semibold font-sans">Firestore</strong> agar data aman diakses di mana saja. Untuk otomatis mencatat baris di <strong className="text-sky-400 font-semibold font-sans">Google Sheets</strong>, silakan pilih masuk dengan tombol Google.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
