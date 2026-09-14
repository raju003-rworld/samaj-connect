import fs from "fs";
import path from "path";
import {
  initialDistricts,
  initialTalukas,
  initialVillages,
  initialMainSamaj,
  initialSamaj,
  District,
  Taluka,
  Village,
  MainSamajItem,
  SamajItem
} from "../src/data/gujaratMasterData";

const DATA_DIR = path.join(process.cwd(), "data");
const MASTER_FILE = path.join(DATA_DIR, "masterData.json");

interface MasterDataFile {
  districts: District[];
  talukas: Taluka[];
  villages: Village[];
  mainSamaj: MainSamajItem[];
  samaj: SamajItem[];
  lastUpdated: string;
}

export function seedGujaratMasterData(silent = false): MasterDataFile {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let existing: Partial<MasterDataFile> = {};
  if (fs.existsSync(MASTER_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(MASTER_FILE, "utf-8"));
    } catch (e) {
      if (!silent) console.warn("Could not parse existing masterData.json, re-initializing safe copy...");
    }
  }

  // Idempotent merge helper by ID
  const mergeById = <T extends { id: string }>(currentList: T[] = [], initialList: T[]): { merged: T[]; added: number } => {
    const map = new Map<string, T>();
    // First keep existing records (preserves admin additions/edits)
    for (const item of currentList) {
      if (item && item.id) map.set(item.id, item);
    }
    let added = 0;
    // Then add any missing initial records
    for (const item of initialList) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
        added++;
      }
    }
    return { merged: Array.from(map.values()), added };
  };

  const distRes = mergeById<District>(existing.districts, initialDistricts);
  const talRes = mergeById<Taluka>(existing.talukas, initialTalukas);
  const vilRes = mergeById<Village>(existing.villages, initialVillages);
  const msRes = mergeById<MainSamajItem>(existing.mainSamaj, initialMainSamaj);
  const samRes = mergeById<SamajItem>(existing.samaj, initialSamaj);

  // Referential Integrity check
  const districtIds = new Set(distRes.merged.map((d) => d.id));
  const talukaIds = new Set(talRes.merged.map((t) => t.id));
  const mainSamajIds = new Set(msRes.merged.map((m) => m.id));

  // Validate talukas
  const validTalukas = talRes.merged.filter((t) => {
    const valid = districtIds.has(t.districtId);
    if (!valid && !silent) console.warn(`[SEED INTEGRITY WARNING] Taluka ${t.id} has invalid districtId ${t.districtId}`);
    return valid;
  });

  // Validate villages
  const validVillages = vilRes.merged.filter((v) => {
    const valid = districtIds.has(v.districtId) && talukaIds.has(v.talukaId);
    if (!valid && !silent) console.warn(`[SEED INTEGRITY WARNING] Village ${v.id} has invalid taluka/district`);
    return valid;
  });

  // Validate Samaj
  const validSamaj = samRes.merged.filter((s) => {
    const valid = mainSamajIds.has(s.mainSamajId);
    if (!valid && !silent) console.warn(`[SEED INTEGRITY WARNING] Samaj ${s.id} has invalid mainSamajId ${s.mainSamajId}`);
    return valid;
  });

  const finalData: MasterDataFile = {
    districts: distRes.merged,
    talukas: validTalukas,
    villages: validVillages,
    mainSamaj: msRes.merged,
    samaj: validSamaj,
    lastUpdated: new Date().toISOString(),
  };

  fs.writeFileSync(MASTER_FILE, JSON.stringify(finalData, null, 2), "utf-8");

  if (!silent) {
    console.log("====================================================");
    console.log(" GUJARAT MASTER DATA SEED COMPLETED (IDEMPOTENT)");
    console.log("====================================================");
    console.log(`Districts   : ${finalData.districts.length} (Added new: ${distRes.added})`);
    console.log(`Talukas     : ${finalData.talukas.length} (Added new: ${talRes.added})`);
    console.log(`Villages    : ${finalData.villages.length} (Added new: ${vilRes.added})`);
    console.log(`Main Samaj  : ${finalData.mainSamaj.length} (Added new: ${msRes.added})`);
    console.log(`Verified Samaj: ${finalData.samaj.length} (Added new: ${samRes.added})`);
    console.log(`Storage File: ${MASTER_FILE}`);
    console.log("====================================================");
  }

  return finalData;
}

import { fileURLToPath } from "url";

// Direct execution from CLI
const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && (process.argv[1] === currentFilePath || process.argv[1].includes("seedGujarat"))) {
  seedGujaratMasterData(false);
}

