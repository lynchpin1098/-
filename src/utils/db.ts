import { encryptText, decryptText, encryptBlob, decryptBlob } from "./crypto";

const DB_NAME = "voice-diary-db";
const DB_VERSION = 2;
const STORE_NAME = "diaries";

export interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
}

export interface VoiceDiary {
  id: string;
  audioBlob: Blob;
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  createdAt: string;
  fileSize: number;
}

interface StoredDiary {
  id: string;
  audioBlob: Blob;
  transcriptEncrypted: string;
  segmentsEncrypted: string;
  duration: number;
  createdAt: string;
  fileSize: number;
  audioType: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (oldVersion < 2) {
        // Version 2: schema already handled by store.put with new fields
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withDB<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = callback(store);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function saveDiary(diary: VoiceDiary): Promise<void> {
  const transcriptEncrypted = await encryptText(diary.transcript || "");
  const segmentsEncrypted = await encryptText(JSON.stringify(diary.segments || []));
  const encryptedAudio = await encryptBlob(diary.audioBlob);

  const stored: StoredDiary = {
    id: diary.id,
    audioBlob: encryptedAudio,
    transcriptEncrypted,
    segmentsEncrypted,
    duration: diary.duration,
    createdAt: diary.createdAt,
    fileSize: diary.fileSize,
    audioType: diary.audioBlob.type,
  };

  await withDB("readwrite", (store) => store.put(stored));
}

async function decryptStoredDiary(stored: StoredDiary): Promise<VoiceDiary> {
  const [transcript, segmentsJson, audioBlob] = await Promise.all([
    decryptText(stored.transcriptEncrypted),
    decryptText(stored.segmentsEncrypted),
    decryptBlob(stored.audioBlob, stored.audioType),
  ]);

  return {
    id: stored.id,
    audioBlob,
    transcript,
    segments: JSON.parse(segmentsJson) as TranscriptSegment[],
    duration: stored.duration,
    createdAt: stored.createdAt,
    fileSize: stored.fileSize,
  };
}

export async function getAllDiaries(): Promise<VoiceDiary[]> {
  const storedList = await withDB("readonly", (store) => {
    const index = store.index("createdAt");
    return index.getAll();
  });

  const results = await Promise.all(
    (storedList as StoredDiary[]).map((s) => decryptStoredDiary(s))
  );
  return results.reverse();
}

export async function getDiaryById(id: string): Promise<VoiceDiary | undefined> {
  const stored = await withDB("readonly", (store) => store.get(id));
  if (!stored) return undefined;
  return decryptStoredDiary(stored as StoredDiary);
}

export async function deleteDiary(id: string): Promise<void> {
  await withDB("readwrite", (store) => store.delete(id));
}

export async function getDiaryCount(): Promise<number> {
  return withDB("readonly", (store) => store.count());
}

export function searchDiaries(
  diaries: VoiceDiary[],
  keyword: string
): (VoiceDiary & { matchTime: number })[] {
  if (!keyword.trim()) return [];
  const lowerKeyword = keyword.toLowerCase();
  return diaries
    .filter((d) => d.transcript && d.transcript.toLowerCase().includes(lowerKeyword))
    .map((d) => {
      let matchTime = 0;
      const segment = d.segments?.find(
        (s) => s.text && s.text.toLowerCase().includes(lowerKeyword)
      );
      if (segment) {
        matchTime = Math.floor(segment.startTime);
      }
      return { ...d, matchTime };
    });
}

export async function exportAllDiaries(): Promise<Blob> {
  const diaries = await getAllDiaries();
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    diaries: diaries.map((d) => ({
      id: d.id,
      transcript: d.transcript,
      segments: d.segments,
      duration: d.duration,
      createdAt: d.createdAt,
      fileSize: d.fileSize,
      audioBase64: new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(d.audioBlob);
      }),
    })),
  };

  const resolved = await Promise.all(
    exportData.diaries.map(async (d) => ({
      ...d,
      audioBase64: await d.audioBase64,
    }))
  );

  const finalData = { ...exportData, diaries: resolved };
  const json = JSON.stringify(finalData);
  return new Blob([json], { type: "application/json" });
}
