/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EnvironmentalRecord,
  WasteIncomingRecord,
  WasteOutgoingRecord,
  NurseryRecord,
  ReclamationRecord
} from '../types';

const BASE_SHEETS_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const BASE_DRIVE_URL = 'https://www.googleapis.com/drive/v3';

// 1. Search for existing spreadsheet in user's Google Drive
export async function findExistingSpreadsheet(accessToken: string): Promise<{ id: string; url: string } | null> {
  const query = encodeURIComponent("name = 'DivaMonitor DATA - PT Diva Kencana Borneo' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const url = `${BASE_DRIVE_URL}/files?q=${query}&fields=files(id,name,webViewLink)`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check Drive for spreadsheet: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return {
      id: data.files[0].id,
      url: data.files[0].webViewLink,
    };
  }

  return null;
}

// 2. Create a new structured Spreadsheet for PT Diva Kencana Borneo
export async function createStructuredSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  const url = `${BASE_SHEETS_URL}`;
  
  const body = {
    properties: {
      title: 'DivaMonitor DATA - PT Diva Kencana Borneo',
    },
    sheets: [
      {
        properties: {
          title: 'Environmental',
          gridProperties: { rowCount: 1000, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'WasteIncoming',
          gridProperties: { rowCount: 1000, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'WasteOutgoing',
          gridProperties: { rowCount: 1000, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'Nursery',
          gridProperties: { rowCount: 1000, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'Reclamation',
          gridProperties: { rowCount: 1000, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'Guarantees',
          gridProperties: { rowCount: 1000, columnCount: 10 },
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Google Spreadsheet: ${response.statusText}`);
  }

  const spreadsheet = await response.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write headers for all sheets
  await writeHeaders(accessToken, spreadsheetId);

  return { id: spreadsheetId, url: spreadsheetUrl };
}

// 3. Write column headers to each sheet
async function writeHeaders(accessToken: string, spreadsheetId: string) {
  const headersMap = {
    'Environmental!A1:J1': [
      ['ID', 'Tanggal Pemantauan', 'pH Value', 'TSS (mg/L)', 'Debit (m3/hari)', 'Jenis Koagulan', 'Dosis Koagulan (kg)', 'Curah Hujan (mm)', 'Durasi Hujan (jam)', 'Lokasi Pemantauan']
    ],
    'WasteIncoming!A1:G1': [
      ['ID', 'Tanggal Masuk', 'Kode Limbah B3', 'Jenis Limbah', 'Sumber Limbah', 'Jumlah (kg)', 'Status / Tempat Penyimpanan']
    ],
    'WasteOutgoing!A1:H1': [
      ['ID', 'Tanggal Keluar', 'Kode Limbah B3', 'Jenis Limbah', 'Jumlah (kg)', 'Tujuan Pengiriman / Pihak Ketiga', 'Nomor Manifest B3', 'Link Dokumen Manifest']
    ],
    'Nursery!A1:G1': [
      ['ID', 'Tanggal Input', 'Nama Spesies Tanaman', 'Jumlah Bibit', 'Kondisi Bibit', 'Tanggal Semai', 'Target Area Penanaman']
    ],
    'Reclamation!A1:I1': [
      ['ID', 'Tanggal Pelaksanaan', 'Area / Blok Tambang', 'Luas Area (Ha)', 'Ketebalan Topsoil (cm)', 'Spesies Ditabur/Ditanam', 'Status Pembentukan Lereng', 'Rencana Kemajuan (%)', 'Status Evaluasi']
    ],
    'Guarantees!A1:F1': [
      ['ID', 'Tahun', 'Nilai Jaminan (Rupiah)', 'Tanggal Penyetoran', 'Bank Penjamin', 'Status']
    ],
  };

  for (const [range, values] of Object.entries(headersMap)) {
    const url = `${BASE_SHEETS_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });
  }
}

// 4. Append row data to a specific sheet
export async function appendRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  rowData: any[]
): Promise<boolean> {
  const range = `${sheetName}!A:A`;
  const url = `${BASE_SHEETS_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData],
    }),
  });

  return response.ok;
}

// 5. Read all rows from a sheet
export async function readRowsFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<any[][] | null> {
  const range = `${sheetName}!A2:Z`; // skip header
  const url = `${BASE_SHEETS_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to read from Sheet [${sheetName}]: ${response.statusText}`);
  }

  const data = await response.json();
  return data.values || [];
}

// 6. Upload supporting file to Google Drive (e.g. Manifest B3 PDF/Image)
export async function uploadFileToDrive(
  accessToken: string,
  file: File
): Promise<{ id: string; webViewLink: string }> {
  // We perform a multipart upload
  const metadata = {
    name: `DivaMonitor_B3Manifest_${Date.now()}_${file.name}`,
    mimeType: file.type || 'application/octet-stream',
  };

  const boundary = 'foo_bar_boundary_divamonitor';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });

  const fileContent = await fileDataPromise;
  
  // Format metadata
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  
  // Format media data part
  const headerPart = `Content-Type: ${metadata.mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;
  
  // Convert ArrayBuffer to Base64
  const base64Content = btoa(
    new Uint8Array(fileContent).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const body = metadataPart + delimiter + headerPart + base64Content + closeDelimiter;

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error(`Drive upload failed: ${response.statusText}`);
  }

  const uploadedFile = await response.json();

  // Update permissions to make it readable/viewable by anybody who has the link (optional but good for review)
  // Let's call standard permission API to allow viewing by anyone
  try {
    const permissionUrl = `${BASE_DRIVE_URL}/files/${uploadedFile.id}/permissions`;
    await fetch(permissionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (err) {
    console.error('Error sharing uploaded file permissions:', err);
  }

  return {
    id: uploadedFile.id,
    webViewLink: uploadedFile.webViewLink,
  };
}
