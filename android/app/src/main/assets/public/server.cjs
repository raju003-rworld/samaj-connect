var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  isUserOnboardingCompleted: () => isUserOnboardingCompleted,
  loadStore: () => loadStore,
  logAdminAction: () => logAdminAction,
  notificationsList: () => notificationsList,
  persistMasterData: () => persistMasterData,
  requireCompletedOnboarding: () => requireCompletedOnboarding,
  syncAllMaranNodhToReels: () => syncAllMaranNodhToReels
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_jose = require("jose");

// src/data/gujaratMasterData.ts
var initialDistricts = [
  { id: "dist_kachchh", name: "Kachchh", nameGujarati: "\u0A95\u0A9A\u0ACD\u0A9B", state: "Gujarat", isActive: true },
  { id: "dist_ahmedabad", name: "Ahmedabad", nameGujarati: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6", state: "Gujarat", isActive: true },
  { id: "dist_mehsana", name: "Mehsana", nameGujarati: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE", state: "Gujarat", isActive: true },
  { id: "dist_surat", name: "Surat", nameGujarati: "\u0AB8\u0AC1\u0AB0\u0AA4", state: "Gujarat", isActive: true },
  { id: "dist_rajkot", name: "Rajkot", nameGujarati: "\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F", state: "Gujarat", isActive: true },
  { id: "dist_patan", name: "Patan", nameGujarati: "\u0AAA\u0ABE\u0A9F\u0AA3", state: "Gujarat", isActive: true },
  { id: "dist_vadodara", name: "Vadodara", nameGujarati: "\u0AB5\u0AA1\u0ACB\u0AA6\u0AB0\u0ABE", state: "Gujarat", isActive: true },
  { id: "dist_gandhinagar", name: "Gandhinagar", nameGujarati: "\u0A97\u0ABE\u0A82\u0AA7\u0AC0\u0AA8\u0A97\u0AB0", state: "Gujarat", isActive: true },
  { id: "dist_jamnagar", name: "Jamnagar", nameGujarati: "\u0A9C\u0ABE\u0AAE\u0AA8\u0A97\u0AB0", state: "Gujarat", isActive: true },
  { id: "dist_bhavnagar", name: "Bhavnagar", nameGujarati: "\u0AAD\u0ABE\u0AB5\u0AA8\u0A97\u0AB0", state: "Gujarat", isActive: true },
  { id: "dist_junagadh", name: "Junagadh", nameGujarati: "\u0A9C\u0AC2\u0AA8\u0ABE\u0A97\u0AA2", state: "Gujarat", isActive: true },
  { id: "dist_anand", name: "Anand", nameGujarati: "\u0A86\u0AA3\u0A82\u0AA6", state: "Gujarat", isActive: true },
  { id: "dist_kheda", name: "Kheda", nameGujarati: "\u0A96\u0AC7\u0AA1\u0ABE", state: "Gujarat", isActive: true },
  { id: "dist_bharuch", name: "Bharuch", nameGujarati: "\u0AAD\u0AB0\u0AC2\u0A9A", state: "Gujarat", isActive: true },
  { id: "dist_navsari", name: "Navsari", nameGujarati: "\u0AA8\u0AB5\u0AB8\u0ABE\u0AB0\u0AC0", state: "Gujarat", isActive: true },
  { id: "dist_valsad", name: "Valsad", nameGujarati: "\u0AB5\u0AB2\u0AB8\u0ABE\u0AA1", state: "Gujarat", isActive: true },
  { id: "dist_morbi", name: "Morbi", nameGujarati: "\u0AAE\u0ACB\u0AB0\u0AAC\u0AC0", state: "Gujarat", isActive: true },
  { id: "dist_surendranagar", name: "Surendranagar", nameGujarati: "\u0AB8\u0AC1\u0AB0\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0\u0AA8\u0A97\u0AB0", state: "Gujarat", isActive: true },
  { id: "dist_amreli", name: "Amreli", nameGujarati: "\u0A85\u0AAE\u0AB0\u0AC7\u0AB2\u0AC0", state: "Gujarat", isActive: true },
  { id: "dist_banaskantha", name: "Banaskantha", nameGujarati: "\u0AAC\u0AA8\u0ABE\u0AB8\u0A95\u0ABE\u0A82\u0AA0\u0ABE", state: "Gujarat", isActive: true },
  { id: "dist_sabarkantha", name: "Sabarkantha", nameGujarati: "\u0AB8\u0ABE\u0AAC\u0AB0\u0A95\u0ABE\u0A82\u0AA0\u0ABE", state: "Gujarat", isActive: true },
  { id: "dist_aravalli", name: "Aravalli", nameGujarati: "\u0A85\u0AB0\u0AB5\u0AB2\u0ACD\u0AB2\u0AC0", state: "Gujarat", isActive: true },
  { id: "dist_botad", name: "Botad", nameGujarati: "\u0AAC\u0ACB\u0A9F\u0ABE\u0AA6", state: "Gujarat", isActive: true },
  { id: "dist_chhota_udepur", name: "Chhota Udaipur", nameGujarati: "\u0A9B\u0ACB\u0A9F\u0ABE \u0A89\u0AA6\u0AC7\u0AAA\u0AC1\u0AB0", state: "Gujarat", isActive: true },
  { id: "dist_dahod", name: "Dahod", nameGujarati: "\u0AA6\u0ABE\u0AB9\u0ACB\u0AA6", state: "Gujarat", isActive: true },
  { id: "dist_dang", name: "Dang", nameGujarati: "\u0AA1\u0ABE\u0A82\u0A97", state: "Gujarat", isActive: true },
  { id: "dist_devbhumi_dwarka", name: "Devbhumi Dwarka", nameGujarati: "\u0AA6\u0AC7\u0AB5\u0AAD\u0AC2\u0AAE\u0ABF \u0AA6\u0ACD\u0AB5\u0ABE\u0AB0\u0A95\u0ABE", state: "Gujarat", isActive: true },
  { id: "dist_gir_somnath", name: "Gir Somnath", nameGujarati: "\u0A97\u0AC0\u0AB0 \u0AB8\u0ACB\u0AAE\u0AA8\u0ABE\u0AA5", state: "Gujarat", isActive: true },
  { id: "dist_mahisagar", name: "Mahisagar", nameGujarati: "\u0AAE\u0AB9\u0AC0\u0AB8\u0ABE\u0A97\u0AB0", state: "Gujarat", isActive: true },
  { id: "dist_narmada", name: "Narmada", nameGujarati: "\u0AA8\u0AB0\u0ACD\u0AAE\u0AA6\u0ABE", state: "Gujarat", isActive: true },
  { id: "dist_panchmahal", name: "Panchmahal", nameGujarati: "\u0AAA\u0A82\u0A9A\u0AAE\u0AB9\u0ABE\u0AB2", state: "Gujarat", isActive: true },
  { id: "dist_porbandar", name: "Porbandar", nameGujarati: "\u0AAA\u0ACB\u0AB0\u0AAC\u0A82\u0AA6\u0AB0", state: "Gujarat", isActive: true },
  { id: "dist_tapi", name: "Tapi", nameGujarati: "\u0AA4\u0ABE\u0AAA\u0AC0", state: "Gujarat", isActive: true }
];
var initialTalukas = [
  // Kachchh
  { id: "tal_kch_abdasa", districtId: "dist_kachchh", name: "Abdasa", nameGujarati: "\u0A85\u0AAC\u0AA1\u0ABE\u0AB8\u0ABE", isActive: true },
  { id: "tal_kch_anjar", districtId: "dist_kachchh", name: "Anjar", nameGujarati: "\u0A85\u0A82\u0A9C\u0ABE\u0AB0", isActive: true },
  { id: "tal_kch_bhachau", districtId: "dist_kachchh", name: "Bhachau", nameGujarati: "\u0AAD\u0A9A\u0ABE\u0A89", isActive: true },
  { id: "tal_kch_bhuj", districtId: "dist_kachchh", name: "Bhuj", nameGujarati: "\u0AAD\u0AC1\u0A9C", isActive: true },
  { id: "tal_kch_gandhidham", districtId: "dist_kachchh", name: "Gandhidham", nameGujarati: "\u0A97\u0ABE\u0A82\u0AA7\u0AC0\u0AA7\u0ABE\u0AAE", isActive: true },
  { id: "tal_kch_lakhpat", districtId: "dist_kachchh", name: "Lakhpat", nameGujarati: "\u0AB2\u0A96\u0AAA\u0AA4", isActive: true },
  { id: "tal_kch_mandvi", districtId: "dist_kachchh", name: "Mandvi", nameGujarati: "\u0AAE\u0ABE\u0A82\u0AA1\u0AB5\u0AC0", isActive: true },
  { id: "tal_kch_mundra", districtId: "dist_kachchh", name: "Mundra", nameGujarati: "\u0AAE\u0AC1\u0A82\u0AA6\u0ACD\u0AB0\u0ABE", isActive: true },
  { id: "tal_kch_nakhatrana", districtId: "dist_kachchh", name: "Nakhatrana", nameGujarati: "\u0AA8\u0A96\u0AA4\u0ACD\u0AB0\u0ABE\u0AA3\u0ABE", isActive: true },
  { id: "tal_kch_rapar", districtId: "dist_kachchh", name: "Rapar", nameGujarati: "\u0AB0\u0ABE\u0AAA\u0AB0", isActive: true },
  // Ahmedabad
  { id: "tal_ahm_daskroi", districtId: "dist_ahmedabad", name: "Daskroi", nameGujarati: "\u0AA6\u0AB8\u0ACD\u0A95\u0ACD\u0AB0\u0ACB\u0A88", isActive: true },
  { id: "tal_ahm_city", districtId: "dist_ahmedabad", name: "Ahmedabad City", nameGujarati: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0AB6\u0AB9\u0AC7\u0AB0", isActive: true },
  { id: "tal_ahm_sanand", districtId: "dist_ahmedabad", name: "Sanand", nameGujarati: "\u0AB8\u0ABE\u0AA3\u0A82\u0AA6", isActive: true },
  { id: "tal_ahm_dholka", districtId: "dist_ahmedabad", name: "Dholka", nameGujarati: "\u0AA7\u0ACB\u0AB3\u0A95\u0ABE", isActive: true },
  { id: "tal_ahm_dhandhuka", districtId: "dist_ahmedabad", name: "Dhandhuka", nameGujarati: "\u0AA7\u0A82\u0AA7\u0AC2\u0A95\u0ABE", isActive: true },
  { id: "tal_ahm_viramgam", districtId: "dist_ahmedabad", name: "Viramgam", nameGujarati: "\u0AB5\u0ABF\u0AB0\u0AAE\u0A97\u0ABE\u0AAE", isActive: true },
  { id: "tal_ahm_bavla", districtId: "dist_ahmedabad", name: "Bavla", nameGujarati: "\u0AAC\u0ABE\u0AB5\u0AB3\u0ABE", isActive: true },
  { id: "tal_ahm_dholera", districtId: "dist_ahmedabad", name: "Dholera", nameGujarati: "\u0AA7\u0ACB\u0AB2\u0AC7\u0AB0\u0ABE", isActive: true },
  { id: "tal_ahm_mandal", districtId: "dist_ahmedabad", name: "Mandal", nameGujarati: "\u0AAE\u0ABE\u0A82\u0AA1\u0AB2", isActive: true },
  { id: "tal_ahm_detroj", districtId: "dist_ahmedabad", name: "Detroj-Rampura", nameGujarati: "\u0AA6\u0AC7\u0AA4\u0ACD\u0AB0\u0ACB\u0A9C-\u0AB0\u0ABE\u0AAE\u0AAA\u0AC1\u0AB0\u0ABE", isActive: true },
  // Surat
  { id: "tal_sur_choryasi", districtId: "dist_surat", name: "Choryasi", nameGujarati: "\u0A9A\u0ACB\u0AB0\u0ACD\u0AAF\u0ABE\u0AB8\u0AC0", isActive: true },
  { id: "tal_sur_city", districtId: "dist_surat", name: "Surat City", nameGujarati: "\u0AB8\u0AC1\u0AB0\u0AA4 \u0AB6\u0AB9\u0AC7\u0AB0", isActive: true },
  { id: "tal_sur_bardoli", districtId: "dist_surat", name: "Bardoli", nameGujarati: "\u0AAC\u0ABE\u0AB0\u0AA1\u0ACB\u0AB2\u0AC0", isActive: true },
  { id: "tal_sur_kamrej", districtId: "dist_surat", name: "Kamrej", nameGujarati: "\u0A95\u0ABE\u0AAE\u0AB0\u0AC7\u0A9C", isActive: true },
  { id: "tal_sur_mangrol", districtId: "dist_surat", name: "Mangrol", nameGujarati: "\u0AAE\u0ABE\u0A82\u0A97\u0AB0\u0ACB\u0AB3", isActive: true },
  { id: "tal_sur_mandvi", districtId: "dist_surat", name: "Mandvi", nameGujarati: "\u0AAE\u0ABE\u0A82\u0AA1\u0AB5\u0AC0", isActive: true },
  { id: "tal_sur_olpad", districtId: "dist_surat", name: "Olpad", nameGujarati: "\u0A93\u0AB2\u0AAA\u0ABE\u0AA1", isActive: true },
  { id: "tal_sur_palsana", districtId: "dist_surat", name: "Palsana", nameGujarati: "\u0AAA\u0AB2\u0AB8\u0ABE\u0AA3\u0ABE", isActive: true },
  { id: "tal_sur_mahuva", districtId: "dist_surat", name: "Mahuva", nameGujarati: "\u0AAE\u0AB9\u0AC1\u0AB5\u0ABE", isActive: true },
  { id: "tal_sur_umarpada", districtId: "dist_surat", name: "Umarpada", nameGujarati: "\u0A89\u0AAE\u0AB0\u0AAA\u0ABE\u0AA1\u0ABE", isActive: true },
  // Mehsana
  { id: "tal_mehsana_unjha", districtId: "dist_mehsana", name: "Unjha", nameGujarati: "\u0A8A\u0A82\u0A9D\u0ABE", isActive: true },
  { id: "tal_mehsana_visnagar", districtId: "dist_mehsana", name: "Visnagar", nameGujarati: "\u0AB5\u0ABF\u0AB8\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "tal_mehsana_kadi", districtId: "dist_mehsana", name: "Kadi", nameGujarati: "\u0A95\u0AA1\u0AC0", isActive: true },
  { id: "tal_mehsana_mehsana", districtId: "dist_mehsana", name: "Mehsana", nameGujarati: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE", isActive: true },
  { id: "tal_mehsana_becharaji", districtId: "dist_mehsana", name: "Becharaji", nameGujarati: "\u0AAC\u0AC7\u0A9A\u0AB0\u0ABE\u0A9C\u0AC0", isActive: true },
  { id: "tal_mehsana_vadnagar", districtId: "dist_mehsana", name: "Vadnagar", nameGujarati: "\u0AB5\u0AA1\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "tal_mehsana_kheralu", districtId: "dist_mehsana", name: "Kheralu", nameGujarati: "\u0A96\u0AC7\u0AB0\u0ABE\u0AB2\u0AC1", isActive: true },
  { id: "tal_mehsana_satlasana", districtId: "dist_mehsana", name: "Satlasana", nameGujarati: "\u0AB8\u0AA4\u0AB2\u0ABE\u0AB8\u0AA3\u0ABE", isActive: true },
  { id: "tal_mehsana_vijapur", districtId: "dist_mehsana", name: "Vijapur", nameGujarati: "\u0AB5\u0ABF\u0A9C\u0ABE\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "tal_mehsana_jotana", districtId: "dist_mehsana", name: "Jotana", nameGujarati: "\u0A9C\u0ACB\u0A9F\u0ABE\u0AA3\u0ABE", isActive: true },
  // Patan
  { id: "tal_patan_patan", districtId: "dist_patan", name: "Patan", nameGujarati: "\u0AAA\u0ABE\u0A9F\u0AA3", isActive: true },
  { id: "tal_patan_sidhpur", districtId: "dist_patan", name: "Sidhpur", nameGujarati: "\u0AB8\u0ABF\u0AA6\u0ACD\u0AA7\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "tal_patan_chanasma", districtId: "dist_patan", name: "Chanasma", nameGujarati: "\u0A9A\u0ABE\u0AA3\u0AB8\u0ACD\u0AAE\u0ABE", isActive: true },
  { id: "tal_patan_radhanpur", districtId: "dist_patan", name: "Radhanpur", nameGujarati: "\u0AB0\u0ABE\u0AA7\u0AA8\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "tal_patan_sami", districtId: "dist_patan", name: "Sami", nameGujarati: "\u0AB8\u0AAE\u0AC0", isActive: true },
  { id: "tal_patan_harij", districtId: "dist_patan", name: "Harij", nameGujarati: "\u0AB9\u0ABE\u0AB0\u0ABF\u0A9C", isActive: true },
  { id: "tal_patan_vagdod", districtId: "dist_patan", name: "Vagdod", nameGujarati: "\u0AB5\u0ABE\u0A97\u0AA1\u0ACB\u0AA6", isActive: true },
  { id: "tal_patan_santalpur", districtId: "dist_patan", name: "Santalpur", nameGujarati: "\u0AB8\u0ABE\u0A82\u0AA4\u0AB2\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "tal_patan_shankheshwar", districtId: "dist_patan", name: "Shankheshwar", nameGujarati: "\u0AB6\u0A82\u0A96\u0AC7\u0AB6\u0ACD\u0AB5\u0AB0", isActive: true },
  // Rajkot
  { id: "tal_raj_rajkot", districtId: "dist_rajkot", name: "Rajkot", nameGujarati: "\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F", isActive: true },
  { id: "tal_raj_gondal", districtId: "dist_rajkot", name: "Gondal", nameGujarati: "\u0A97\u0ACB\u0A82\u0AA1\u0AB2", isActive: true },
  { id: "tal_raj_jetpur", districtId: "dist_rajkot", name: "Jetpur", nameGujarati: "\u0A9C\u0AC7\u0AA4\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "tal_raj_dhoraji", districtId: "dist_rajkot", name: "Dhoraji", nameGujarati: "\u0AA7\u0ACB\u0AB0\u0ABE\u0A9C\u0AC0", isActive: true },
  { id: "tal_raj_jasdan", districtId: "dist_rajkot", name: "Jasdan", nameGujarati: "\u0A9C\u0AB8\u0AA6\u0AA3", isActive: true },
  { id: "tal_raj_kotda_sangani", districtId: "dist_rajkot", name: "Kotda Sangani", nameGujarati: "\u0A95\u0ACB\u0A9F\u0AA1\u0ABE \u0AB8\u0ABE\u0A82\u0A97\u0ABE\u0AA3\u0AC0", isActive: true },
  { id: "tal_raj_lodhika", districtId: "dist_rajkot", name: "Lodhika", nameGujarati: "\u0AB2\u0ACB\u0AA7\u0AC0\u0A95\u0ABE", isActive: true },
  { id: "tal_raj_paddhari", districtId: "dist_rajkot", name: "Paddhari", nameGujarati: "\u0AAA\u0AA1\u0AA7\u0AB0\u0AC0", isActive: true },
  { id: "tal_raj_jamkandorna", districtId: "dist_rajkot", name: "Jamkandorna", nameGujarati: "\u0A9C\u0ABE\u0AAE\u0A95\u0A82\u0AA1\u0ACB\u0AB0\u0AA3\u0ABE", isActive: true },
  { id: "tal_raj_upleta", districtId: "dist_rajkot", name: "Upleta", nameGujarati: "\u0A89\u0AAA\u0AB2\u0AC7\u0A9F\u0ABE", isActive: true },
  { id: "tal_raj_vinchhiya", districtId: "dist_rajkot", name: "Vinchhiya", nameGujarati: "\u0AB5\u0AC0\u0A82\u0A9B\u0AC0\u0AAF\u0ABE", isActive: true },
  // Vadodara
  { id: "tal_vad_vadodara", districtId: "dist_vadodara", name: "Vadodara", nameGujarati: "\u0AB5\u0AA1\u0ACB\u0AA6\u0AB0\u0ABE", isActive: true },
  { id: "tal_vad_dabhoi", districtId: "dist_vadodara", name: "Dabhoi", nameGujarati: "\u0AA1\u0AAD\u0ACB\u0A88", isActive: true },
  { id: "tal_vad_padra", districtId: "dist_vadodara", name: "Padra", nameGujarati: "\u0AAA\u0ABE\u0AA6\u0AB0\u0ABE", isActive: true },
  { id: "tal_vad_karjan", districtId: "dist_vadodara", name: "Karjan", nameGujarati: "\u0A95\u0AB0\u0A9C\u0AA3", isActive: true },
  { id: "tal_vad_shinor", districtId: "dist_vadodara", name: "Shinor", nameGujarati: "\u0AB6\u0ABF\u0AA8\u0ACB\u0AB0", isActive: true },
  { id: "tal_vad_vaghodia", districtId: "dist_vadodara", name: "Vaghodia", nameGujarati: "\u0AB5\u0ABE\u0A98\u0ACB\u0AA1\u0ABF\u0AAF\u0ABE", isActive: true },
  { id: "tal_vad_savli", districtId: "dist_vadodara", name: "Savli", nameGujarati: "\u0AB8\u0ABE\u0AB5\u0AB2\u0AC0", isActive: true },
  { id: "tal_vad_desar", districtId: "dist_vadodara", name: "Desar", nameGujarati: "\u0AA6\u0AC7\u0AB8\u0AB0", isActive: true },
  // Gandhinagar
  { id: "tal_gan_gandhinagar", districtId: "dist_gandhinagar", name: "Gandhinagar", nameGujarati: "\u0A97\u0ABE\u0A82\u0AA7\u0AC0\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "tal_gan_kalol", districtId: "dist_gandhinagar", name: "Kalol", nameGujarati: "\u0A95\u0AB2\u0ACB\u0AB2", isActive: true },
  { id: "tal_gan_dehgam", districtId: "dist_gandhinagar", name: "Dehgam", nameGujarati: "\u0AA6\u0AB9\u0AC7\u0A97\u0ABE\u0AAE", isActive: true },
  { id: "tal_gan_mansa", districtId: "dist_gandhinagar", name: "Mansa", nameGujarati: "\u0AAE\u0ABE\u0AA3\u0AB8\u0ABE", isActive: true },
  // Jamnagar
  { id: "tal_jam_jamnagar", districtId: "dist_jamnagar", name: "Jamnagar", nameGujarati: "\u0A9C\u0ABE\u0AAE\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "tal_jam_dhrol", districtId: "dist_jamnagar", name: "Dhrol", nameGujarati: "\u0AA7\u0ACD\u0AB0\u0ACB\u0AB2", isActive: true },
  { id: "tal_jam_jamjodhpur", districtId: "dist_jamnagar", name: "Jamjodhpur", nameGujarati: "\u0A9C\u0ABE\u0AAE\u0A9C\u0ACB\u0AA7\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "tal_jam_jodiya", districtId: "dist_jamnagar", name: "Jodiya", nameGujarati: "\u0A9C\u0ACB\u0AA1\u0ABF\u0AAF\u0ABE", isActive: true },
  { id: "tal_jam_kalavad", districtId: "dist_jamnagar", name: "Kalavad", nameGujarati: "\u0A95\u0ABE\u0AB2\u0ABE\u0AB5\u0AA1", isActive: true },
  { id: "tal_jam_lalpur", districtId: "dist_jamnagar", name: "Lalpur", nameGujarati: "\u0AB2\u0ABE\u0AB2\u0AAA\u0AC1\u0AB0", isActive: true },
  // Bhavnagar
  { id: "tal_bhav_bhavnagar", districtId: "dist_bhavnagar", name: "Bhavnagar", nameGujarati: "\u0AAD\u0ABE\u0AB5\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "tal_bhav_sihor", districtId: "dist_bhavnagar", name: "Sihor", nameGujarati: "\u0AB8\u0ABF\u0AB9\u0ACB\u0AB0", isActive: true },
  { id: "tal_bhav_palitana", districtId: "dist_bhavnagar", name: "Palitana", nameGujarati: "\u0AAA\u0ABE\u0AB2\u0AC0\u0AA4\u0ABE\u0AA3\u0ABE", isActive: true },
  { id: "tal_bhav_mahuva", districtId: "dist_bhavnagar", name: "Mahuva", nameGujarati: "\u0AAE\u0AB9\u0AC1\u0AB5\u0ABE", isActive: true },
  { id: "tal_bhav_talaja", districtId: "dist_bhavnagar", name: "Talaja", nameGujarati: "\u0AA4\u0AB3\u0ABE\u0A9C\u0ABE", isActive: true },
  // Junagadh
  { id: "tal_jun_junagadh", districtId: "dist_junagadh", name: "Junagadh", nameGujarati: "\u0A9C\u0AC2\u0AA8\u0ABE\u0A97\u0AA2", isActive: true },
  { id: "tal_jun_keshod", districtId: "dist_junagadh", name: "Keshod", nameGujarati: "\u0A95\u0AC7\u0AB6\u0ACB\u0AA6", isActive: true },
  { id: "tal_jun_mangrol", districtId: "dist_junagadh", name: "Mangrol", nameGujarati: "\u0AAE\u0ABE\u0A82\u0A97\u0AB0\u0ACB\u0AB3", isActive: true },
  { id: "tal_jun_manavadar", districtId: "dist_junagadh", name: "Manavadar", nameGujarati: "\u0AAE\u0ABE\u0AA3\u0ABE\u0AB5\u0AA6\u0AB0", isActive: true },
  { id: "tal_jun_visavadar", districtId: "dist_junagadh", name: "Visavadar", nameGujarati: "\u0AB5\u0ABF\u0AB8\u0ABE\u0AB5\u0AA6\u0AB0", isActive: true },
  // Anand
  { id: "tal_and_anand", districtId: "dist_anand", name: "Anand", nameGujarati: "\u0A86\u0AA3\u0A82\u0AA6", isActive: true },
  { id: "tal_and_petlad", districtId: "dist_anand", name: "Petlad", nameGujarati: "\u0AAA\u0AC7\u0A9F\u0AB2\u0ABE\u0AA6", isActive: true },
  { id: "tal_and_khambhat", districtId: "dist_anand", name: "Khambhat", nameGujarati: "\u0A96\u0A82\u0AAD\u0ABE\u0AA4", isActive: true },
  { id: "tal_and_borsad", districtId: "dist_anand", name: "Borsad", nameGujarati: "\u0AAC\u0ACB\u0AB0\u0AB8\u0AA6", isActive: true },
  { id: "tal_and_umreth", districtId: "dist_anand", name: "Umreth", nameGujarati: "\u0A89\u0AAE\u0AB0\u0AC7\u0AA0", isActive: true },
  // Kheda
  { id: "tal_khd_nadiad", districtId: "dist_kheda", name: "Nadiad", nameGujarati: "\u0AA8\u0AA1\u0ABF\u0AAF\u0ABE\u0AA6", isActive: true },
  { id: "tal_khd_kheda", districtId: "dist_kheda", name: "Kheda", nameGujarati: "\u0A96\u0AC7\u0AA1\u0ABE", isActive: true },
  { id: "tal_khd_kapadvanj", districtId: "dist_kheda", name: "Kapadvanj", nameGujarati: "\u0A95\u0AAA\u0AA1\u0AB5\u0A82\u0A9C", isActive: true },
  { id: "tal_khd_matar", districtId: "dist_kheda", name: "Matar", nameGujarati: "\u0AAE\u0ABE\u0AA4\u0AB0", isActive: true },
  // Bharuch
  { id: "tal_bh_bharuch", districtId: "dist_bharuch", name: "Bharuch", nameGujarati: "\u0AAD\u0AB0\u0AC2\u0A9A", isActive: true },
  { id: "tal_bh_ankleshwar", districtId: "dist_bharuch", name: "Ankleshwar", nameGujarati: "\u0A85\u0A82\u0A95\u0AB2\u0AC7\u0AB6\u0ACD\u0AB5\u0AB0", isActive: true },
  { id: "tal_bh_jambusar", districtId: "dist_bharuch", name: "Jambusar", nameGujarati: "\u0A9C\u0A82\u0AAC\u0AC1\u0AB8\u0AB0", isActive: true },
  // Navsari
  { id: "tal_nav_navsari", districtId: "dist_navsari", name: "Navsari", nameGujarati: "\u0AA8\u0AB5\u0AB8\u0ABE\u0AB0\u0AC0", isActive: true },
  { id: "tal_nav_jalalpore", districtId: "dist_navsari", name: "Jalalpore", nameGujarati: "\u0A9C\u0AB2\u0ABE\u0AB2\u0AAA\u0ACB\u0AB0", isActive: true },
  { id: "tal_nav_gandevi", districtId: "dist_navsari", name: "Gandevi", nameGujarati: "\u0A97\u0AA3\u0AA6\u0AC7\u0AB5\u0AC0", isActive: true },
  // Valsad
  { id: "tal_val_valsad", districtId: "dist_valsad", name: "Valsad", nameGujarati: "\u0AB5\u0AB2\u0AB8\u0ABE\u0AA1", isActive: true },
  { id: "tal_val_pardi", districtId: "dist_valsad", name: "Pardi", nameGujarati: "\u0AAA\u0ABE\u0AB0\u0AA1\u0AC0", isActive: true },
  { id: "tal_val_vapi", districtId: "dist_valsad", name: "Vapi", nameGujarati: "\u0AB5\u0ABE\u0AAA\u0AC0", isActive: true },
  // Morbi
  { id: "tal_mor_morbi", districtId: "dist_morbi", name: "Morbi", nameGujarati: "\u0AAE\u0ACB\u0AB0\u0AAC\u0AC0", isActive: true },
  { id: "tal_mor_wankaner", districtId: "dist_morbi", name: "Wankaner", nameGujarati: "\u0AB5\u0ABE\u0A82\u0A95\u0ABE\u0AA8\u0AC7\u0AB0", isActive: true },
  { id: "tal_mor_halvad", districtId: "dist_morbi", name: "Halvad", nameGujarati: "\u0AB9\u0AB3\u0AB5\u0AA6", isActive: true },
  // Surendranagar
  { id: "tal_sn_wadhwan", districtId: "dist_surendranagar", name: "Wadhwan", nameGujarati: "\u0AB5\u0AA2\u0AB5\u0ABE\u0AA3", isActive: true },
  { id: "tal_sn_limbdi", districtId: "dist_surendranagar", name: "Limbdi", nameGujarati: "\u0AB2\u0AC0\u0A82\u0AAC\u0AA1\u0AC0", isActive: true },
  { id: "tal_sn_chotila", districtId: "dist_surendranagar", name: "Chotila", nameGujarati: "\u0A9A\u0ACB\u0A9F\u0AC0\u0AB2\u0ABE", isActive: true },
  { id: "tal_sn_dhrangadhra", districtId: "dist_surendranagar", name: "Dhrangadhra", nameGujarati: "\u0AA7\u0ACD\u0AB0\u0ABE\u0A82\u0A97\u0AA7\u0ACD\u0AB0\u0ABE", isActive: true },
  // Amreli
  { id: "tal_amr_amreli", districtId: "dist_amreli", name: "Amreli", nameGujarati: "\u0A85\u0AAE\u0AB0\u0AC7\u0AB2\u0AC0", isActive: true },
  { id: "tal_amr_babra", districtId: "dist_amreli", name: "Babra", nameGujarati: "\u0AAC\u0ABE\u0AAC\u0AB0\u0ABE", isActive: true },
  { id: "tal_amr_savarkundla", districtId: "dist_amreli", name: "Savarkundla", nameGujarati: "\u0AB8\u0ABE\u0AB5\u0AB0\u0A95\u0AC1\u0A82\u0AA1\u0AB2\u0ABE", isActive: true },
  // Banaskantha
  { id: "tal_bk_palanpur", districtId: "dist_banaskantha", name: "Palanpur", nameGujarati: "\u0AAA\u0ABE\u0AB2\u0AA8\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "tal_bk_deesa", districtId: "dist_banaskantha", name: "Deesa", nameGujarati: "\u0AA1\u0AC0\u0AB8\u0ABE", isActive: true },
  { id: "tal_bk_vadgam", districtId: "dist_banaskantha", name: "Vadgam", nameGujarati: "\u0AB5\u0AA1\u0A97\u0ABE\u0AAE", isActive: true },
  // Sabarkantha
  { id: "tal_sk_himatnagar", districtId: "dist_sabarkantha", name: "Himatnagar", nameGujarati: "\u0AB9\u0ABF\u0A82\u0AAE\u0AA4\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "tal_sk_idar", districtId: "dist_sabarkantha", name: "Idar", nameGujarati: "\u0A87\u0AA1\u0AB0", isActive: true },
  { id: "tal_sk_prantij", districtId: "dist_sabarkantha", name: "Prantij", nameGujarati: "\u0AAA\u0ACD\u0AB0\u0ABE\u0A82\u0AA4\u0ABF\u0A9C", isActive: true },
  // Porbandar
  { id: "tal_por_porbandar", districtId: "dist_porbandar", name: "Porbandar", nameGujarati: "\u0AAA\u0ACB\u0AB0\u0AAC\u0A82\u0AA6\u0AB0", isActive: true },
  { id: "tal_por_ranavav", districtId: "dist_porbandar", name: "Ranavav", nameGujarati: "\u0AB0\u0ABE\u0AA3\u0ABE\u0AB5\u0ABE\u0AB5", isActive: true },
  // Devbhumi Dwarka
  { id: "tal_dwd_dwarka", districtId: "dist_devbhumi_dwarka", name: "Dwarka", nameGujarati: "\u0AA6\u0ACD\u0AB5\u0ABE\u0AB0\u0A95\u0ABE", isActive: true },
  { id: "tal_dwd_khambhalia", districtId: "dist_devbhumi_dwarka", name: "Khambhalia", nameGujarati: "\u0A96\u0A82\u0AAD\u0ABE\u0AB3\u0ABF\u0AAF\u0ABE", isActive: true },
  // Gir Somnath
  { id: "tal_gs_veraval", districtId: "dist_gir_somnath", name: "Veraval", nameGujarati: "\u0AB5\u0AC7\u0AB0\u0ABE\u0AB5\u0AB3", isActive: true },
  { id: "tal_gs_kodinar", districtId: "dist_gir_somnath", name: "Kodinar", nameGujarati: "\u0A95\u0ACB\u0AA1\u0AC0\u0AA8\u0ABE\u0AB0", isActive: true },
  // Botad
  { id: "tal_bot_botad", districtId: "dist_botad", name: "Botad", nameGujarati: "\u0AAC\u0ACB\u0A9F\u0ABE\u0AA6", isActive: true },
  { id: "tal_bot_gadhada", districtId: "dist_botad", name: "Gadhada", nameGujarati: "\u0A97\u0AA2\u0AA1\u0ABE", isActive: true },
  // Aravalli
  { id: "tal_arv_modasa", districtId: "dist_aravalli", name: "Modasa", nameGujarati: "\u0AAE\u0ACB\u0AA1\u0ABE\u0AB8\u0ABE", isActive: true },
  { id: "tal_arv_bayad", districtId: "dist_aravalli", name: "Bayad", nameGujarati: "\u0AAC\u0ABE\u0AAF\u0AA1", isActive: true },
  // Mahisagar
  { id: "tal_mah_lunawada", districtId: "dist_mahisagar", name: "Lunawada", nameGujarati: "\u0AB2\u0AC1\u0AA3\u0ABE\u0AB5\u0ABE\u0AA1\u0ABE", isActive: true },
  { id: "tal_mah_balasinor", districtId: "dist_mahisagar", name: "Balasinor", nameGujarati: "\u0AAC\u0ABE\u0AB2\u0ABE\u0AB8\u0ABF\u0AA8\u0ACB\u0AB0", isActive: true },
  // Panchmahal
  { id: "tal_pan_godhra", districtId: "dist_panchmahal", name: "Godhra", nameGujarati: "\u0A97\u0ACB\u0AA7\u0AB0\u0ABE", isActive: true },
  { id: "tal_pan_halol", districtId: "dist_panchmahal", name: "Halol", nameGujarati: "\u0AB9\u0ABE\u0AB2\u0ACB\u0AB2", isActive: true },
  // Dahod
  { id: "tal_dah_dahod", districtId: "dist_dahod", name: "Dahod", nameGujarati: "\u0AA6\u0ABE\u0AB9\u0ACB\u0AA6", isActive: true },
  { id: "tal_dah_jhalod", districtId: "dist_dahod", name: "Jhalod", nameGujarati: "\u0A9D\u0ABE\u0AB2\u0ACB\u0AA6", isActive: true },
  // Chhota Udaipur
  { id: "tal_cu_chhota_udepur", districtId: "dist_chhota_udepur", name: "Chhota Udaipur", nameGujarati: "\u0A9B\u0ACB\u0A9F\u0ABE \u0A89\u0AA6\u0AC7\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "tal_cu_bodeli", districtId: "dist_chhota_udepur", name: "Bodeli", nameGujarati: "\u0AAC\u0ACB\u0AA1\u0AC7\u0AB2\u0AC0", isActive: true },
  // Narmada
  { id: "tal_nar_rajpipla", districtId: "dist_narmada", name: "Nandod (Rajpipla)", nameGujarati: "\u0AA8\u0ABE\u0A82\u0AA6\u0ACB\u0AA6 (\u0AB0\u0ABE\u0A9C\u0AAA\u0AC0\u0AAA\u0AB3\u0ABE)", isActive: true },
  // Tapi
  { id: "tal_tap_vyara", districtId: "dist_tapi", name: "Vyara", nameGujarati: "\u0AB5\u0ACD\u0AAF\u0ABE\u0AB0\u0ABE", isActive: true },
  { id: "tal_tap_songadh", districtId: "dist_tapi", name: "Songadh", nameGujarati: "\u0AB8\u0ACB\u0AA8\u0A97\u0AA2", isActive: true },
  // Dang
  { id: "tal_dan_ahwa", districtId: "dist_dang", name: "Ahwa", nameGujarati: "\u0A86\u0AB9\u0AB5\u0ABE", isActive: true }
];
var initialVillages = [
  // Kachchh -> Abdasa (requested: Gadhsisa)
  { id: "vil_kch_gadhsisa", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Gadhsisa", nameGujarati: "\u0A97\u0AA2\u0AB6\u0AC0\u0AB6\u0ABE", isActive: true },
  { id: "vil_kch_kothara", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Kothara", nameGujarati: "\u0A95\u0ACB\u0AA0\u0ABE\u0AB0\u0ABE", isActive: true },
  { id: "vil_kch_naliya", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Naliya", nameGujarati: "\u0AA8\u0AB2\u0ABF\u0AAF\u0ABE", isActive: true },
  { id: "vil_kch_vanki", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Vanki", nameGujarati: "\u0AB5\u0ABE\u0A82\u0A95\u0AC0", isActive: true },
  { id: "vil_kch_bada", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Bada", nameGujarati: "\u0AAC\u0AA1\u0ABE", isActive: true },
  { id: "vil_kch_dumra", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Dumra", nameGujarati: "\u0AA1\u0AC1\u0AAE\u0AB0\u0ABE", isActive: true },
  { id: "vil_kch_tera", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Tera", nameGujarati: "\u0AA4\u0AC7\u0AB0\u0ABE", isActive: true },
  { id: "vil_kch_vithon", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Vithon", nameGujarati: "\u0AB5\u0ABF\u0AA0\u0ACB\u0AA3", isActive: true },
  // Kachchh -> Bhuj
  { id: "vil_kch_bhuj", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Bhuj", nameGujarati: "\u0AAD\u0AC1\u0A9C", isActive: true },
  { id: "vil_kch_madhapar", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Madhapar", nameGujarati: "\u0AAE\u0ABE\u0AA7\u0ABE\u0AAA\u0AB0", isActive: true },
  { id: "vil_kch_mirzapar", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Mirzapar", nameGujarati: "\u0AAE\u0ABF\u0AB0\u0ACD\u0A9D\u0ABE\u0AAA\u0AB0", isActive: true },
  { id: "vil_kch_sukhpar", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Sukhpar", nameGujarati: "\u0AB8\u0AC1\u0A96\u0AAA\u0AB0", isActive: true },
  { id: "vil_kch_kera", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Kera", nameGujarati: "\u0A95\u0AC7\u0AB0\u0ABE", isActive: true },
  { id: "vil_kch_baladiya", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Baladiya", nameGujarati: "\u0AAC\u0AB3\u0AA6\u0ABF\u0AAF\u0ABE", isActive: true },
  // Kachchh -> Mandvi
  { id: "vil_kch_mandvi", districtId: "dist_kachchh", talukaId: "tal_kch_mandvi", name: "Mandvi", nameGujarati: "\u0AAE\u0ABE\u0A82\u0AA1\u0AB5\u0AC0", isActive: true },
  { id: "vil_kch_maska", districtId: "dist_kachchh", talukaId: "tal_kch_mandvi", name: "Maska", nameGujarati: "\u0AAE\u0AB8\u0ACD\u0A95\u0ABE", isActive: true },
  { id: "vil_kch_asambiya", districtId: "dist_kachchh", talukaId: "tal_kch_mandvi", name: "Asambiya", nameGujarati: "\u0A86\u0AB8\u0A82\u0AAC\u0ABF\u0AAF\u0ABE", isActive: true },
  // Kachchh -> Anjar
  { id: "vil_kch_anjar", districtId: "dist_kachchh", talukaId: "tal_kch_anjar", name: "Anjar", nameGujarati: "\u0A85\u0A82\u0A9C\u0ABE\u0AB0", isActive: true },
  { id: "vil_kch_varsamedi", districtId: "dist_kachchh", talukaId: "tal_kch_anjar", name: "Varsamedi", nameGujarati: "\u0AB5\u0AB0\u0AB8\u0AAE\u0AC7\u0AA1\u0AC0", isActive: true },
  // Ahmedabad -> Daskroi (requested: Gam under Daskroi)
  { id: "vil_daskroi_aslali", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Aslali", nameGujarati: "\u0A85\u0AB8\u0AB2\u0ABE\u0AB2\u0AC0", isActive: true },
  { id: "vil_daskroi_bareja", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Bareja", nameGujarati: "\u0AAC\u0AB0\u0AC7\u0A9C\u0ABE", isActive: true },
  { id: "vil_daskroi_bhuvaldi", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Bhuvaldi", nameGujarati: "\u0AAD\u0AC1\u0AB5\u0ABE\u0AB2\u0AA1\u0AC0", isActive: true },
  { id: "vil_daskroi_gatrad", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Gatrad", nameGujarati: "\u0A97\u0ABE\u0AA4\u0ACD\u0AB0\u0ABE\u0AA1", isActive: true },
  { id: "vil_daskroi_kuha", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Kuha", nameGujarati: "\u0A95\u0AC1\u0AB9\u0ABE", isActive: true },
  { id: "vil_daskroi_lambha", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Lambha", nameGujarati: "\u0AB2\u0ABE\u0A82\u0AAD\u0ABE", isActive: true },
  { id: "vil_daskroi_odhav", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Odhav", nameGujarati: "\u0A93\u0AA2\u0AB5", isActive: true },
  { id: "vil_daskroi_geratpur", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Geratpur", nameGujarati: "\u0A97\u0AC7\u0AB0\u0AA4\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "vil_daskroi_miroli", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Miroli", nameGujarati: "\u0AAE\u0ABF\u0AB0\u0ACB\u0AB2\u0AC0", isActive: true },
  // Ahmedabad -> Ahmedabad City
  { id: "vil_ahm_city", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Ahmedabad City", nameGujarati: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0AB6\u0AB9\u0AC7\u0AB0", isActive: true },
  { id: "vil_ahm_navrangpura", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Navrangpura", nameGujarati: "\u0AA8\u0AB5\u0AB0\u0A82\u0A97\u0AAA\u0AC1\u0AB0\u0ABE", isActive: true },
  { id: "vil_ahm_naranpura", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Naranpura", nameGujarati: "\u0AA8\u0ABE\u0AB0\u0AA3\u0AAA\u0AC1\u0AB0\u0ABE", isActive: true },
  { id: "vil_ahm_maninagar", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Maninagar", nameGujarati: "\u0AAE\u0AA3\u0ABF\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "vil_ahm_ghatlodia", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Ghatlodia", nameGujarati: "\u0A98\u0ABE\u0A9F\u0AB2\u0ACB\u0AA1\u0ABF\u0AAF\u0ABE", isActive: true },
  { id: "vil_ahm_chandkheda", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Chandkheda", nameGujarati: "\u0A9A\u0ABE\u0A82\u0AA6\u0A96\u0AC7\u0AA1\u0ABE", isActive: true },
  { id: "vil_ahm_bopal", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Bopal", nameGujarati: "\u0AAC\u0ACB\u0AAA\u0AB2", isActive: true },
  // Ahmedabad -> Sanand
  { id: "vil_sanand_sanand", districtId: "dist_ahmedabad", talukaId: "tal_ahm_sanand", name: "Sanand", nameGujarati: "\u0AB8\u0ABE\u0AA3\u0A82\u0AA6", isActive: true },
  { id: "vil_sanand_nidhrad", districtId: "dist_ahmedabad", talukaId: "tal_ahm_sanand", name: "Nidhrad", nameGujarati: "\u0AA8\u0ABF\u0AA7\u0AB0\u0ABE\u0AA1", isActive: true },
  { id: "vil_sanand_chekhla", districtId: "dist_ahmedabad", talukaId: "tal_ahm_sanand", name: "Chekhla", nameGujarati: "\u0A9A\u0AC7\u0A96\u0AB2\u0ABE", isActive: true },
  { id: "vil_sanand_changodar", districtId: "dist_ahmedabad", talukaId: "tal_ahm_sanand", name: "Changodar", nameGujarati: "\u0A9A\u0ABE\u0A82\u0A97\u0ACB\u0AA6\u0AB0", isActive: true },
  // Surat -> Choryasi (requested: Gam under Choryasi)
  { id: "vil_choryasi_dumas", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Dumas", nameGujarati: "\u0AA1\u0AC1\u0AAE\u0AB8", isActive: true },
  { id: "vil_choryasi_hazira", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Hazira", nameGujarati: "\u0AB9\u0A9C\u0AC0\u0AB0\u0ABE", isActive: true },
  { id: "vil_choryasi_bhatha", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Bhatha", nameGujarati: "\u0AAD\u0ABE\u0AA0\u0ABE", isActive: true },
  { id: "vil_choryasi_mora", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Mora", nameGujarati: "\u0AAE\u0ACB\u0AB0\u0ABE", isActive: true },
  { id: "vil_choryasi_damka", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Damka", nameGujarati: "\u0AA6\u0ABE\u0AAE\u0A95\u0ABE", isActive: true },
  { id: "vil_choryasi_ichhapore", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Ichhapore", nameGujarati: "\u0A87\u0A9A\u0ACD\u0A9B\u0ABE\u0AAA\u0ACB\u0AB0", isActive: true },
  { id: "vil_choryasi_suvali", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Suvali", nameGujarati: "\u0AB8\u0AC1\u0AB5\u0ABE\u0AB2\u0AC0", isActive: true },
  // Surat -> Surat City
  { id: "vil_sur_city", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Surat City", nameGujarati: "\u0AB8\u0AC1\u0AB0\u0AA4 \u0AB6\u0AB9\u0AC7\u0AB0", isActive: true },
  { id: "vil_sur_katargam", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Katargam", nameGujarati: "\u0A95\u0AA4\u0ABE\u0AB0\u0A97\u0ABE\u0AAE", isActive: true },
  { id: "vil_sur_varachha", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Varachha", nameGujarati: "\u0AB5\u0AB0\u0ABE\u0A9B\u0ABE", isActive: true },
  { id: "vil_sur_adajan", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Adajan", nameGujarati: "\u0A85\u0AA1\u0ABE\u0A9C\u0AA3", isActive: true },
  { id: "vil_sur_athwa", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Athwa", nameGujarati: "\u0A85\u0AA0\u0AB5\u0ABE", isActive: true },
  { id: "vil_sur_majura", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Majura", nameGujarati: "\u0AAE\u0A9C\u0AC1\u0AB0\u0ABE", isActive: true },
  // Surat -> Kamrej
  { id: "vil_sur_kamrej", districtId: "dist_surat", talukaId: "tal_sur_kamrej", name: "Kamrej", nameGujarati: "\u0A95\u0ABE\u0AAE\u0AB0\u0AC7\u0A9C", isActive: true },
  { id: "vil_sur_pasodara", districtId: "dist_surat", talukaId: "tal_sur_kamrej", name: "Pasodara", nameGujarati: "\u0AAA\u0ABE\u0AB8\u0ACB\u0AA6\u0AB0\u0ABE", isActive: true },
  // Surat -> Bardoli
  { id: "vil_sur_bardoli", districtId: "dist_surat", talukaId: "tal_sur_bardoli", name: "Bardoli", nameGujarati: "\u0AAC\u0ABE\u0AB0\u0AA1\u0ACB\u0AB2\u0AC0", isActive: true },
  { id: "vil_sur_baben", districtId: "dist_surat", talukaId: "tal_sur_bardoli", name: "Baben", nameGujarati: "\u0AAC\u0ABE\u0AAC\u0AC7\u0AA8", isActive: true },
  // Mehsana -> Unjha
  { id: "vil_unjha", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Unjha", nameGujarati: "\u0A8A\u0A82\u0A9D\u0ABE", isActive: true },
  { id: "vil_unjha_aithor", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Aithor", nameGujarati: "\u0A90\u0AA0\u0ACB\u0AB0", isActive: true },
  { id: "vil_unjha_dasaj", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Dasaj", nameGujarati: "\u0AA6\u0ABE\u0AB8\u0A9C", isActive: true },
  { id: "vil_unjha_kamli", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Kamli", nameGujarati: "\u0A95\u0ABE\u0AAE\u0AB2\u0AC0", isActive: true },
  { id: "vil_unjha_brahmanwada", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Brahmanwada", nameGujarati: "\u0AAC\u0ACD\u0AB0\u0ABE\u0AB9\u0ACD\u0AAE\u0AA3\u0AB5\u0ABE\u0AA1\u0ABE", isActive: true },
  { id: "vil_unjha_upera", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Upera", nameGujarati: "\u0A89\u0AAA\u0AC7\u0AB0\u0ABE", isActive: true },
  { id: "vil_unjha_sunok", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Sunok", nameGujarati: "\u0AB8\u0AC1\u0AA3\u0ACB\u0A95", isActive: true },
  { id: "vil_unjha_bhunav", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Bhunav", nameGujarati: "\u0AAD\u0AC1\u0AA3\u0ABE\u0AB5", isActive: true },
  // Mehsana -> Visnagar
  { id: "vil_visnagar", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Visnagar", nameGujarati: "\u0AB5\u0ABF\u0AB8\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "vil_vis_basana", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Basana", nameGujarati: "\u0AAC\u0ABE\u0AB8\u0AA3\u0ABE", isActive: true },
  { id: "vil_vis_bhandu", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Bhandu", nameGujarati: "\u0AAD\u0ABE\u0A82\u0AA1\u0AC1", isActive: true },
  { id: "vil_vis_kada", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Kada", nameGujarati: "\u0A95\u0ABE\u0AA1\u0ABE", isActive: true },
  { id: "vil_vis_valam", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Valam", nameGujarati: "\u0AB5\u0ABE\u0AB2\u0AAE", isActive: true },
  { id: "vil_vis_tarabh", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Tarabh", nameGujarati: "\u0AA4\u0ABE\u0AB0\u0AAD", isActive: true },
  // Mehsana -> Kadi
  { id: "vil_kadi", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Kadi", nameGujarati: "\u0A95\u0AA1\u0AC0", isActive: true },
  { id: "vil_kadi_nandasan", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Nandasan", nameGujarati: "\u0AA8\u0ABE\u0A82\u0AA6\u0ABE\u0AB8\u0AA3", isActive: true },
  { id: "vil_kadi_borisana", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Borisana", nameGujarati: "\u0AAC\u0ACB\u0AB0\u0AC0\u0AB8\u0AA3\u0ABE", isActive: true },
  { id: "vil_kadi_karannagar", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Karannagar", nameGujarati: "\u0A95\u0AB0\u0AA3\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "vil_kadi_thol", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Thol", nameGujarati: "\u0AA5\u0ACB\u0AB3", isActive: true },
  // Mehsana -> Mehsana
  { id: "vil_mehsana", districtId: "dist_mehsana", talukaId: "tal_mehsana_mehsana", name: "Mehsana", nameGujarati: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE", isActive: true },
  { id: "vil_meh_ambaliyasan", districtId: "dist_mehsana", talukaId: "tal_mehsana_mehsana", name: "Ambaliyasan", nameGujarati: "\u0A86\u0A82\u0AAC\u0AB2\u0ABF\u0AAF\u0ABE\u0AB8\u0AA3", isActive: true },
  { id: "vil_meh_palavasana", districtId: "dist_mehsana", talukaId: "tal_mehsana_mehsana", name: "Palavasana", nameGujarati: "\u0AAA\u0ABE\u0AB2\u0ABE\u0AB5\u0ABE\u0AB8\u0AA3\u0ABE", isActive: true },
  { id: "vil_meh_nagalpur", districtId: "dist_mehsana", talukaId: "tal_mehsana_mehsana", name: "Nagalpur", nameGujarati: "\u0AA8\u0ABE\u0A97\u0AB2\u0AAA\u0AC1\u0AB0", isActive: true },
  // Patan -> Patan
  { id: "vil_patan", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Patan", nameGujarati: "\u0AAA\u0ABE\u0A9F\u0AA3", isActive: true },
  { id: "vil_pat_balisana", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Balisana", nameGujarati: "\u0AAC\u0AB2\u0AC0\u0AB8\u0AA3\u0ABE", isActive: true },
  { id: "vil_pat_ranuj", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Ranuj", nameGujarati: "\u0AB0\u0AA3\u0AC1\u0A9C", isActive: true },
  { id: "vil_pat_vagdod", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Wagdod", nameGujarati: "\u0AB5\u0ABE\u0A97\u0AA1\u0ACB\u0AA6", isActive: true },
  { id: "vil_pat_hansapur", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Hansapur", nameGujarati: "\u0AB9\u0A82\u0AB8\u0ABE\u0AAA\u0AC1\u0AB0", isActive: true },
  // Patan -> Sidhpur
  { id: "vil_sidhpur", districtId: "dist_patan", talukaId: "tal_patan_sidhpur", name: "Sidhpur", nameGujarati: "\u0AB8\u0ABF\u0AA6\u0ACD\u0AA7\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "vil_sid_kakoshi", districtId: "dist_patan", talukaId: "tal_patan_sidhpur", name: "Kakoshi", nameGujarati: "\u0A95\u0ABE\u0A95\u0ACB\u0AB6\u0AC0", isActive: true },
  // Rajkot -> Rajkot
  { id: "vil_rajkot", districtId: "dist_rajkot", talukaId: "tal_raj_rajkot", name: "Rajkot", nameGujarati: "\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F", isActive: true },
  { id: "vil_raj_kothariya", districtId: "dist_rajkot", talukaId: "tal_raj_rajkot", name: "Kothariya", nameGujarati: "\u0A95\u0ACB\u0AA0\u0ABE\u0AB0\u0AC0\u0AAF\u0ABE", isActive: true },
  { id: "vil_raj_bedi", districtId: "dist_rajkot", talukaId: "tal_raj_rajkot", name: "Bedi", nameGujarati: "\u0AAC\u0AC7\u0AA1\u0AC0", isActive: true },
  { id: "vil_raj_madhapar", districtId: "dist_rajkot", talukaId: "tal_raj_rajkot", name: "Madhapar", nameGujarati: "\u0AAE\u0ABE\u0AA7\u0ABE\u0AAA\u0AB0", isActive: true },
  // Rajkot -> Gondal
  { id: "vil_gondal", districtId: "dist_rajkot", talukaId: "tal_raj_gondal", name: "Gondal", nameGujarati: "\u0A97\u0ACB\u0A82\u0AA1\u0AB2", isActive: true },
  { id: "vil_gon_gomta", districtId: "dist_rajkot", talukaId: "tal_raj_gondal", name: "Gomta", nameGujarati: "\u0A97\u0ACB\u0AAE\u0A9F\u0ABE", isActive: true },
  { id: "vil_gon_moviya", districtId: "dist_rajkot", talukaId: "tal_raj_gondal", name: "Moviya", nameGujarati: "\u0AAE\u0ACB\u0AB5\u0ABF\u0AAF\u0ABE", isActive: true },
  // Vadodara -> Vadodara
  { id: "vil_vadodara", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Vadodara", nameGujarati: "\u0AB5\u0AA1\u0ACB\u0AA6\u0AB0\u0ABE", isActive: true },
  { id: "vil_vad_chhani", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Chhani", nameGujarati: "\u0A9B\u0ABE\u0AA3\u0AC0", isActive: true },
  { id: "vil_vad_tarsali", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Tarsali", nameGujarati: "\u0AA4\u0AB0\u0AB8\u0ABE\u0AB2\u0AC0", isActive: true },
  { id: "vil_vad_sama", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Sama", nameGujarati: "\u0AB8\u0AAE\u0ABE", isActive: true },
  { id: "vil_vad_makarpura", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Makarpura", nameGujarati: "\u0AAE\u0A95\u0AB0\u0AAA\u0AC1\u0AB0\u0ABE", isActive: true },
  // Vadodara -> Padra
  { id: "vil_padra", districtId: "dist_vadodara", talukaId: "tal_vad_padra", name: "Padra", nameGujarati: "\u0AAA\u0ABE\u0AA6\u0AB0\u0ABE", isActive: true },
  { id: "vil_pad_dabhasa", districtId: "dist_vadodara", talukaId: "tal_vad_padra", name: "Dabhasa", nameGujarati: "\u0AA1\u0AAD\u0ABE\u0AB8\u0ABE", isActive: true },
  // Gandhinagar -> Gandhinagar
  { id: "vil_gan_gandhinagar", districtId: "dist_gandhinagar", talukaId: "tal_gan_gandhinagar", name: "Gandhinagar", nameGujarati: "\u0A97\u0ABE\u0A82\u0AA7\u0AC0\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "vil_gan_koba", districtId: "dist_gandhinagar", talukaId: "tal_gan_gandhinagar", name: "Koba", nameGujarati: "\u0A95\u0ACB\u0AAC\u0ABE", isActive: true },
  { id: "vil_gan_chiloda", districtId: "dist_gandhinagar", talukaId: "tal_gan_gandhinagar", name: "Chiloda", nameGujarati: "\u0A9A\u0ABF\u0AB2\u0ACB\u0AA1\u0ABE", isActive: true },
  // Gandhinagar -> Kalol
  { id: "vil_gan_kalol", districtId: "dist_gandhinagar", talukaId: "tal_gan_kalol", name: "Kalol", nameGujarati: "\u0A95\u0AB2\u0ACB\u0AB2", isActive: true },
  { id: "vil_gan_saij", districtId: "dist_gandhinagar", talukaId: "tal_gan_kalol", name: "Saij", nameGujarati: "\u0AB8\u0ABE\u0A88\u0A9C", isActive: true },
  // Jamnagar -> Jamnagar
  { id: "vil_jam_jamnagar", districtId: "dist_jamnagar", talukaId: "tal_jam_jamnagar", name: "Jamnagar", nameGujarati: "\u0A9C\u0ABE\u0AAE\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "vil_jam_bedeshwar", districtId: "dist_jamnagar", talukaId: "tal_jam_jamnagar", name: "Bedeshwar", nameGujarati: "\u0AAC\u0AC7\u0AA1\u0AC7\u0AB6\u0ACD\u0AB5\u0AB0", isActive: true },
  { id: "vil_jam_dhuvav", districtId: "dist_jamnagar", talukaId: "tal_jam_jamnagar", name: "Dhuvav", nameGujarati: "\u0AA7\u0AC1\u0AB5\u0ABE\u0AB5", isActive: true },
  // Bhavnagar -> Bhavnagar
  { id: "vil_bhav_bhavnagar", districtId: "dist_bhavnagar", talukaId: "tal_bhav_bhavnagar", name: "Bhavnagar", nameGujarati: "\u0AAD\u0ABE\u0AB5\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "vil_bhav_vartej", districtId: "dist_bhavnagar", talukaId: "tal_bhav_bhavnagar", name: "Vartej", nameGujarati: "\u0AB5\u0AB0\u0AA4\u0AC7\u0A9C", isActive: true },
  // Junagadh -> Junagadh
  { id: "vil_jun_junagadh", districtId: "dist_junagadh", talukaId: "tal_jun_junagadh", name: "Junagadh", nameGujarati: "\u0A9C\u0AC2\u0AA8\u0ABE\u0A97\u0AA2", isActive: true },
  { id: "vil_jun_bilkha", districtId: "dist_junagadh", talukaId: "tal_jun_junagadh", name: "Bilkha", nameGujarati: "\u0AAC\u0ABF\u0AB2\u0A96\u0ABE", isActive: true },
  // Anand -> Anand
  { id: "vil_and_anand", districtId: "dist_anand", talukaId: "tal_and_anand", name: "Anand", nameGujarati: "\u0A86\u0AA3\u0A82\u0AA6", isActive: true },
  { id: "vil_and_vallabh_vidyanagar", districtId: "dist_anand", talukaId: "tal_and_anand", name: "Vallabh Vidyanagar", nameGujarati: "\u0AB5\u0AB2\u0ACD\u0AB2\u0AAD \u0AB5\u0ABF\u0AA6\u0ACD\u0AAF\u0ABE\u0AA8\u0A97\u0AB0", isActive: true },
  // Kheda -> Nadiad
  { id: "vil_khd_nadiad", districtId: "dist_kheda", talukaId: "tal_khd_nadiad", name: "Nadiad", nameGujarati: "\u0AA8\u0AA1\u0ABF\u0AAF\u0ABE\u0AA6", isActive: true },
  { id: "vil_khd_uttarsanda", districtId: "dist_kheda", talukaId: "tal_khd_nadiad", name: "Uttarsanda", nameGujarati: "\u0A89\u0AA4\u0ACD\u0AA4\u0AB0\u0AB8\u0A82\u0AA1\u0ABE", isActive: true },
  // Bharuch -> Bharuch
  { id: "vil_bh_bharuch", districtId: "dist_bharuch", talukaId: "tal_bh_bharuch", name: "Bharuch", nameGujarati: "\u0AAD\u0AB0\u0AC2\u0A9A", isActive: true },
  { id: "vil_bh_ankleshwar", districtId: "dist_bharuch", talukaId: "tal_bh_ankleshwar", name: "Ankleshwar", nameGujarati: "\u0A85\u0A82\u0A95\u0AB2\u0AC7\u0AB6\u0ACD\u0AB5\u0AB0", isActive: true },
  // Navsari -> Navsari
  { id: "vil_nav_navsari", districtId: "dist_navsari", talukaId: "tal_nav_navsari", name: "Navsari", nameGujarati: "\u0AA8\u0AB5\u0AB8\u0ABE\u0AB0\u0AC0", isActive: true },
  // Valsad -> Valsad
  { id: "vil_val_valsad", districtId: "dist_valsad", talukaId: "tal_val_valsad", name: "Valsad", nameGujarati: "\u0AB5\u0AB2\u0AB8\u0ABE\u0AA1", isActive: true },
  { id: "vil_val_vapi", districtId: "dist_valsad", talukaId: "tal_val_vapi", name: "Vapi", nameGujarati: "\u0AB5\u0ABE\u0AAA\u0AC0", isActive: true },
  // Morbi -> Morbi
  { id: "vil_mor_morbi", districtId: "dist_morbi", talukaId: "tal_mor_morbi", name: "Morbi", nameGujarati: "\u0AAE\u0ACB\u0AB0\u0AAC\u0AC0", isActive: true },
  { id: "vil_mor_trajpar", districtId: "dist_morbi", talukaId: "tal_mor_morbi", name: "Trajpar", nameGujarati: "\u0AA4\u0ACD\u0AB0\u0ABE\u0A9C\u0AAA\u0AB0", isActive: true },
  // Surendranagar -> Wadhwan
  { id: "vil_sn_wadhwan", districtId: "dist_surendranagar", talukaId: "tal_sn_wadhwan", name: "Wadhwan", nameGujarati: "\u0AB5\u0AA2\u0AB5\u0ABE\u0AA3", isActive: true },
  // Amreli -> Amreli
  { id: "vil_amr_amreli", districtId: "dist_amreli", talukaId: "tal_amr_amreli", name: "Amreli", nameGujarati: "\u0A85\u0AAE\u0AB0\u0AC7\u0AB2\u0AC0", isActive: true },
  // Banaskantha -> Palanpur
  { id: "vil_bk_palanpur", districtId: "dist_banaskantha", talukaId: "tal_bk_palanpur", name: "Palanpur", nameGujarati: "\u0AAA\u0ABE\u0AB2\u0AA8\u0AAA\u0AC1\u0AB0", isActive: true },
  { id: "vil_bk_deesa", districtId: "dist_banaskantha", talukaId: "tal_bk_deesa", name: "Deesa", nameGujarati: "\u0AA1\u0AC0\u0AB8\u0ABE", isActive: true },
  // Sabarkantha -> Himatnagar
  { id: "vil_sk_himatnagar", districtId: "dist_sabarkantha", talukaId: "tal_sk_himatnagar", name: "Himatnagar", nameGujarati: "\u0AB9\u0ABF\u0A82\u0AAE\u0AA4\u0AA8\u0A97\u0AB0", isActive: true },
  { id: "vil_sk_idar", districtId: "dist_sabarkantha", talukaId: "tal_sk_idar", name: "Idar", nameGujarati: "\u0A87\u0AA1\u0AB0", isActive: true },
  // Porbandar -> Porbandar
  { id: "vil_por_porbandar", districtId: "dist_porbandar", talukaId: "tal_por_porbandar", name: "Porbandar", nameGujarati: "\u0AAA\u0ACB\u0AB0\u0AAC\u0A82\u0AA6\u0AB0", isActive: true },
  // Devbhumi Dwarka -> Dwarka
  { id: "vil_dwd_dwarka", districtId: "dist_devbhumi_dwarka", talukaId: "tal_dwd_dwarka", name: "Dwarka", nameGujarati: "\u0AA6\u0ACD\u0AB5\u0ABE\u0AB0\u0A95\u0ABE", isActive: true },
  // Gir Somnath -> Veraval
  { id: "vil_gs_veraval", districtId: "dist_gir_somnath", talukaId: "tal_gs_veraval", name: "Veraval", nameGujarati: "\u0AB5\u0AC7\u0AB0\u0ABE\u0AB5\u0AB3", isActive: true },
  // Botad -> Botad
  { id: "vil_bot_botad", districtId: "dist_botad", talukaId: "tal_bot_botad", name: "Botad", nameGujarati: "\u0AAC\u0ACB\u0A9F\u0ABE\u0AA6", isActive: true },
  // Aravalli -> Modasa
  { id: "vil_arv_modasa", districtId: "dist_aravalli", talukaId: "tal_arv_modasa", name: "Modasa", nameGujarati: "\u0AAE\u0ACB\u0AA1\u0ABE\u0AB8\u0ABE", isActive: true },
  // Mahisagar -> Lunawada
  { id: "vil_mah_lunawada", districtId: "dist_mahisagar", talukaId: "tal_mah_lunawada", name: "Lunawada", nameGujarati: "\u0AB2\u0AC1\u0AA3\u0ABE\u0AB5\u0ABE\u0AA1\u0ABE", isActive: true },
  // Panchmahal -> Godhra
  { id: "vil_pan_godhra", districtId: "dist_panchmahal", talukaId: "tal_pan_godhra", name: "Godhra", nameGujarati: "\u0A97\u0ACB\u0AA7\u0AB0\u0ABE", isActive: true },
  // Dahod -> Dahod
  { id: "vil_dah_dahod", districtId: "dist_dahod", talukaId: "tal_dah_dahod", name: "Dahod", nameGujarati: "\u0AA6\u0ABE\u0AB9\u0ACB\u0AA6", isActive: true },
  // Chhota Udaipur -> Chhota Udaipur
  { id: "vil_cu_chhota_udepur", districtId: "dist_chhota_udepur", talukaId: "tal_cu_chhota_udepur", name: "Chhota Udaipur", nameGujarati: "\u0A9B\u0ACB\u0A9F\u0ABE \u0A89\u0AA6\u0AC7\u0AAA\u0AC1\u0AB0", isActive: true },
  // Narmada -> Rajpipla
  { id: "vil_nar_rajpipla", districtId: "dist_narmada", talukaId: "tal_nar_rajpipla", name: "Rajpipla", nameGujarati: "\u0AB0\u0ABE\u0A9C\u0AAA\u0AC0\u0AAA\u0AB3\u0ABE", isActive: true },
  // Tapi -> Vyara
  { id: "vil_tap_vyara", districtId: "dist_tapi", talukaId: "tal_tap_vyara", name: "Vyara", nameGujarati: "\u0AB5\u0ACD\u0AAF\u0ABE\u0AB0\u0ABE", isActive: true },
  // Dang -> Ahwa
  { id: "vil_dan_ahwa", districtId: "dist_dang", talukaId: "tal_dan_ahwa", name: "Ahwa", nameGujarati: "\u0A86\u0AB9\u0AB5\u0ABE", isActive: true }
];
var initialMainSamaj = [
  {
    id: "main_patidar",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C (Patel)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C (\u0AAA\u0A9F\u0AC7\u0AB2)",
    nameEn: "Shree Patidar Samaj (Patel)",
    code: "PATEL",
    aliases: ["PATEL", "PATIDAR", "\u0AAA\u0A9F\u0AC7\u0AB2", "\u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0", "KADVA", "LEUVA", "PAT", "PATEL SAMAJ"],
    description: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0\u0AC0\u0AAF \u0AB8\u0A82\u0AB8\u0ACD\u0AA5\u0ABE \u0A85\u0AA8\u0AC7 \u0AB8\u0A82\u0A9A\u0ABE\u0AB2\u0AA8 \u0AAE\u0A82\u0AA1\u0AB3",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "main_luhar",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB2\u0AC1\u0AB9\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C (Luhar)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB2\u0AC1\u0AB9\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C",
    nameEn: "Shree Panchal Luhar Samaj (Luhar)",
    code: "LUHAR",
    aliases: ["LUHAR", "PANCHAL", "\u0AB2\u0AC1\u0AB9\u0ABE\u0AB0", "\u0AAA\u0A82\u0A9A\u0ABE\u0AB2", "LUH", "LUHAR SAMAJ"],
    description: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0AB2\u0AC1\u0AB9\u0ABE\u0AB0 / \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0A95\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0\u0AC0\u0AAF \u0AB8\u0A82\u0AB8\u0ACD\u0AA5\u0ABE",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "main_soni",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C (Soni)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C (\u0AB8\u0AC1\u0AB5\u0AB0\u0ACD\u0AA3\u0A95\u0ABE\u0AB0)",
    nameEn: "Shree Soni Samaj (Soni)",
    code: "SONI",
    aliases: ["SONI", "SUVARNAKAR", "\u0AB8\u0ACB\u0AA8\u0AC0", "\u0AB8\u0AC1\u0AB5\u0AB0\u0ACD\u0AA3\u0A95\u0ABE\u0AB0", "SON", "SONI SAMAJ"],
    description: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0AB8\u0ACB\u0AA8\u0AC0 (\u0AB8\u0AC1\u0AB5\u0AB0\u0ACD\u0AA3\u0A95\u0ABE\u0AB0) \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0A95\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0\u0AC0\u0AAF \u0AB8\u0A82\u0AB8\u0ACD\u0AA5\u0ABE",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "main_brahmin",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0AAC\u0ACD\u0AB0\u0AB9\u0ACD\u0AAE \u0AB8\u0AAE\u0ABE\u0A9C (Brahmin)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0AAC\u0ACD\u0AB0\u0AB9\u0ACD\u0AAE \u0AB8\u0AAE\u0ABE\u0A9C (\u0AAC\u0ACD\u0AB0\u0ABE\u0AB9\u0ACD\u0AAE\u0AA3)",
    nameEn: "Shree Samast Brahm Samaj (Brahmin)",
    code: "BRAHMIN",
    aliases: ["BRAHMIN", "BRAHM", "\u0AAC\u0ACD\u0AB0\u0ABE\u0AB9\u0ACD\u0AAE\u0AA3", "\u0AAC\u0ACD\u0AB0\u0AB9\u0ACD\u0AAE \u0AB8\u0AAE\u0ABE\u0A9C", "BHATT", "DAVE", "JOSHI", "SHUKLA"],
    description: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4 \u0AAC\u0ACD\u0AB0\u0AB9\u0ACD\u0AAE \u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0\u0AC0\u0AAF \u0AB8\u0A82\u0AB8\u0ACD\u0AA5\u0ABE",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "main_rajput",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF \u0AB0\u0ABE\u0A9C\u0AAA\u0AC2\u0AA4 \u0AB8\u0AAE\u0ABE\u0A9C (Rajput)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF \u0AB0\u0ABE\u0A9C\u0AAA\u0AC2\u0AA4 \u0AB8\u0AAE\u0ABE\u0A9C",
    nameEn: "Shree Kshatriya Rajput Samaj (Rajput)",
    code: "RAJPUT",
    aliases: ["RAJPUT", "KSHATRIYA", "\u0AB0\u0ABE\u0A9C\u0AAA\u0AC2\u0AA4", "\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF", "DARBAR", "\u0AA6\u0AB0\u0AAC\u0ABE\u0AB0"],
    description: "\u0A85\u0A96\u0ABF\u0AB2 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4 \u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF \u0AB0\u0ABE\u0A9C\u0AAA\u0AC2\u0AA4 \u0AB8\u0AAE\u0ABE\u0A9C",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "main_jain",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0A9C\u0AC8\u0AA8 \u0AB8\u0AAE\u0ABE\u0A9C (Jain)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0A9C\u0AC8\u0AA8 \u0AB8\u0AAE\u0ABE\u0A9C",
    nameEn: "Shree Samast Jain Samaj (Jain)",
    code: "JAIN",
    aliases: ["JAIN", "SHAH", "\u0A9C\u0AC8\u0AA8", "\u0AB6\u0ABE\u0AB9", "DERAVASI", "STHANAKVASI"],
    description: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0A9C\u0AC8\u0AA8 \u0AAE\u0AB9\u0ABE\u0AB8\u0A82\u0A98 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "main_vaishnav",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB5\u0AC8\u0AB7\u0ACD\u0AA3\u0AB5 \u0AB5\u0AA3\u0ABF\u0A95 \u0AB8\u0AAE\u0ABE\u0A9C (Vaishnav)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB5\u0AC8\u0AB7\u0ACD\u0AA3\u0AB5 \u0AB5\u0AA3\u0ABF\u0A95 \u0AB8\u0AAE\u0ABE\u0A9C",
    nameEn: "Shree Vaishnav Vanik Samaj (Vaishnav)",
    code: "VAISHNAV",
    aliases: ["VAISHNAV", "VANIK", "\u0AB5\u0AC8\u0AB7\u0ACD\u0AA3\u0AB5", "\u0AB5\u0AA3\u0ABF\u0A95", "MODH", "KAPOL"],
    description: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0AB5\u0AC8\u0AB7\u0ACD\u0AA3\u0AB5 \u0AB5\u0AA3\u0ABF\u0A95 \u0AAE\u0AB9\u0ABE\u0A9C\u0AA8",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "main_prajapati",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0ACD\u0AB0\u0A9C\u0ABE\u0AAA\u0AA4\u0ABF \u0AB8\u0AAE\u0ABE\u0A9C (Prajapati)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0ACD\u0AB0\u0A9C\u0ABE\u0AAA\u0AA4\u0ABF \u0AB8\u0AAE\u0ABE\u0A9C (\u0A95\u0AC1\u0A82\u0AAD\u0ABE\u0AB0)",
    nameEn: "Shree Prajapati Samaj (Prajapati)",
    code: "PRAJAPATI",
    aliases: ["PRAJAPATI", "KUMBHAR", "\u0AAA\u0ACD\u0AB0\u0A9C\u0ABE\u0AAA\u0AA4\u0ABF", "\u0A95\u0AC1\u0A82\u0AAD\u0ABE\u0AB0"],
    description: "\u0A85\u0A96\u0ABF\u0AB2 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4 \u0AAA\u0ACD\u0AB0\u0A9C\u0ABE\u0AAA\u0AA4\u0ABF \u0AB8\u0A82\u0A98",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "main_suthar",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A97\u0AC1\u0AB0\u0ACD\u0A9C\u0AB0 \u0AB8\u0AC1\u0AA5\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C (Suthar)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A97\u0AC1\u0AB0\u0ACD\u0A9C\u0AB0 \u0AB8\u0AC1\u0AA5\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C",
    nameEn: "Shree Gurjar Suthar Samaj (Suthar)",
    code: "SUTHAR",
    aliases: ["SUTHAR", "MISTRY", "\u0AB8\u0AC1\u0AA5\u0ABE\u0AB0", "\u0AAE\u0ABF\u0AB0\u0ACD\u0AB8\u0ACD\u0AA4\u0AC0"],
    description: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0A97\u0AC1\u0AB0\u0ACD\u0A9C\u0AB0 \u0AB8\u0AC1\u0AA5\u0ABE\u0AB0 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0AAE\u0A82\u0AA1\u0AB3",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "main_darji",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AA6\u0AB0\u0ACD\u0A9C\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C (Darji)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AA6\u0AB0\u0ACD\u0A9C\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C",
    nameEn: "Shree Darji Samaj (Darji)",
    code: "DARJI",
    aliases: ["DARJI", "CHAVDA", "\u0AA6\u0AB0\u0ACD\u0A9C\u0AC0", "\u0AA6\u0AB0\u0A9C\u0AC0"],
    description: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0AA6\u0AB0\u0ACD\u0A9C\u0AC0 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0AB8\u0AC7\u0AB5\u0ABE \u0A9F\u0ACD\u0AB0\u0AB8\u0ACD\u0A9F",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  }
];
var initialSamaj = [
  // 1. Patidar Chapters
  {
    id: "default",
    mainSamajId: "main_patidar",
    districtId: "dist_mehsana",
    talukaId: "tal_mehsana_unjha",
    villageId: "vil_unjha",
    name: "\u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C (\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0)",
    nameGujarati: "\u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C (\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0)",
    nameEn: "Main Patidar Samaj Central (Unjha)",
    code: "PAT01",
    gamIds: ["vil_unjha", "gam_unjha", "gam_visnagar", "gam_kadi", "gam_mehsana", "vil_visnagar", "vil_kadi", "vil_mehsana"],
    district: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "samaj_patidar_kutch_gadhsisa",
    mainSamajId: "main_patidar",
    districtId: "dist_kachchh",
    talukaId: "tal_kch_abdasa",
    villageId: "vil_kch_gadhsisa",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A95\u0AA1\u0AB5\u0ABE \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0A97\u0AA2\u0AB6\u0AC0\u0AB6\u0ABE (\u0A95\u0A9A\u0ACD\u0A9B)",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A95\u0AA1\u0AB5\u0ABE \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0A97\u0AA2\u0AB6\u0AC0\u0AB6\u0ABE (\u0A95\u0A9A\u0ACD\u0A9B)",
    nameEn: "Shree Kadva Patidar Samaj Gadhsisa (Kachchh)",
    code: "PAT_KCH_GDS",
    gamIds: ["vil_kch_gadhsisa"],
    district: "\u0A95\u0A9A\u0ACD\u0A9B",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "samaj_ahmedabad",
    mainSamajId: "main_patidar",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0AB6\u0ABE\u0A96\u0ABE",
    nameGujarati: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0AB6\u0ABE\u0A96\u0ABE",
    nameEn: "Ahmedabad Patidar Samaj Chapter",
    code: "AHM01",
    gamIds: ["vil_ahm_city", "gam_ahmedabad_patel"],
    district: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-02-01T00:00:00.000Z"
  },
  {
    id: "samaj_surat",
    mainSamajId: "main_patidar",
    districtId: "dist_surat",
    talukaId: "tal_sur_city",
    villageId: "vil_sur_city",
    name: "\u0AB8\u0AC1\u0AB0\u0AA4 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0AB0\u0ABF\u0AB5\u0ABE\u0AB0",
    nameGujarati: "\u0AB8\u0AC1\u0AB0\u0AA4 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0AB0\u0ABF\u0AB5\u0ABE\u0AB0",
    nameEn: "Surat Patidar Samaj Parivar",
    code: "SUR01",
    gamIds: ["vil_sur_city", "gam_surat_patel"],
    district: "\u0AB8\u0AC1\u0AB0\u0AA4",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-03-01T00:00:00.000Z"
  },
  {
    id: "samaj_patidar_mehsana",
    mainSamajId: "main_patidar",
    districtId: "dist_mehsana",
    talukaId: "tal_mehsana_mehsana",
    villageId: "vil_mehsana",
    name: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AAA\u0ACD\u0AB0\u0A97\u0AA4\u0ABF \u0AAE\u0A82\u0AA1\u0AB3",
    nameGujarati: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AAA\u0ACD\u0AB0\u0A97\u0AA4\u0ABF \u0AAE\u0A82\u0AA1\u0AB3",
    nameEn: "Mehsana Patidar Pragati Mandal",
    code: "MEH01",
    gamIds: ["vil_mehsana", "gam_mehsana", "gam_visnagar", "gam_kadi"],
    district: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-04-01T00:00:00.000Z"
  },
  // 2. Luhar Chapters
  {
    id: "samaj_luhar_ahmedabad",
    mainSamajId: "main_luhar",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_daskroi",
    villageId: "vil_daskroi_aslali",
    name: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB8\u0AC7\u0AB5\u0ABE \u0AB8\u0AAE\u0ABE\u0A9C (\u0AA6\u0AB8\u0ACD\u0A95\u0ACD\u0AB0\u0ACB\u0A88)",
    nameGujarati: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB8\u0AC7\u0AB5\u0ABE \u0AB8\u0AAE\u0ABE\u0A9C (\u0AA6\u0AB8\u0ACD\u0A95\u0ACD\u0AB0\u0ACB\u0A88)",
    nameEn: "Ahmedabad Shree Panchal Seva Samaj (Daskroi)",
    code: "LUH_AHM",
    gamIds: ["vil_daskroi_aslali", "gam_luhar_ahmedabad", "vil_daskroi_bareja"],
    district: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-04-01T00:00:00.000Z"
  },
  {
    id: "samaj_luhar_patan",
    mainSamajId: "main_luhar",
    districtId: "dist_patan",
    talukaId: "tal_patan_patan",
    villageId: "vil_patan",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB2\u0AC1\u0AB9\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0ABE\u0A9F\u0AA3",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB2\u0AC1\u0AB9\u0ABE\u0AB0 \u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0ABE\u0A9F\u0AA3",
    nameEn: "Shree Panchal Luhar Samaj Patan",
    code: "LUH_PAT",
    gamIds: ["vil_patan", "gam_luhar_patan"],
    district: "\u0AAA\u0ABE\u0A9F\u0AA3",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "samaj_luhar_vadodara",
    mainSamajId: "main_luhar",
    districtId: "dist_vadodara",
    talukaId: "tal_vad_vadodara",
    villageId: "vil_vadodara",
    name: "\u0AB5\u0AA1\u0ACB\u0AA6\u0AB0\u0ABE \u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB2\u0AC1\u0AB9\u0ABE\u0AB0 \u0AB8\u0A82\u0AB8\u0ACD\u0AA5\u0ABE",
    nameGujarati: "\u0AB5\u0AA1\u0ACB\u0AA6\u0AB0\u0ABE \u0AB6\u0ACD\u0AB0\u0AC0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB2\u0AC1\u0AB9\u0ABE\u0AB0 \u0AB8\u0A82\u0AB8\u0ACD\u0AA5\u0ABE",
    nameEn: "Vadodara Shree Panchal Luhar Sanstha",
    code: "LUH_VAD",
    gamIds: ["vil_vadodara", "gam_luhar_vadodara"],
    district: "\u0AB5\u0AA1\u0ACB\u0AA6\u0AB0\u0ABE",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-02-01T00:00:00.000Z"
  },
  {
    id: "samaj_luhar_rajkot",
    mainSamajId: "main_luhar",
    districtId: "dist_rajkot",
    talukaId: "tal_raj_rajkot",
    villageId: "vil_rajkot",
    name: "\u0AB8\u0ACC\u0AB0\u0ABE\u0AB7\u0ACD\u0A9F\u0ACD\u0AB0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB2\u0AC1\u0AB9\u0ABE\u0AB0 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0AB8\u0AAE\u0ABE\u0A9C (\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F)",
    nameGujarati: "\u0AB8\u0ACC\u0AB0\u0ABE\u0AB7\u0ACD\u0A9F\u0ACD\u0AB0 \u0AAA\u0A82\u0A9A\u0ABE\u0AB2 \u0AB2\u0AC1\u0AB9\u0ABE\u0AB0 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0AB8\u0AAE\u0ABE\u0A9C (\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F)",
    nameEn: "Saurashtra Panchal Luhar Samaj (Rajkot)",
    code: "LUH_RAJ",
    gamIds: ["vil_rajkot", "gam_luhar_rajkot"],
    district: "\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-03-01T00:00:00.000Z"
  },
  // 3. Soni Chapters
  {
    id: "samaj_soni_surat",
    mainSamajId: "main_soni",
    districtId: "dist_surat",
    talukaId: "tal_sur_choryasi",
    villageId: "vil_choryasi_dumas",
    name: "\u0AB8\u0AC1\u0AB0\u0AA4 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C \u0AB5\u0ABF\u0A95\u0ABE\u0AB8 \u0AAA\u0AB0\u0ABF\u0AB7\u0AA6 (\u0A9A\u0ACB\u0AB0\u0ACD\u0AAF\u0ABE\u0AB8\u0AC0)",
    nameGujarati: "\u0AB8\u0AC1\u0AB0\u0AA4 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C \u0AB5\u0ABF\u0A95\u0ABE\u0AB8 \u0AAA\u0AB0\u0ABF\u0AB7\u0AA6 (\u0A9A\u0ACB\u0AB0\u0ACD\u0AAF\u0ABE\u0AB8\u0AC0)",
    nameEn: "Surat Soni Samaj Vikas Parishad (Choryasi)",
    code: "SON_SUR",
    gamIds: ["vil_choryasi_dumas", "gam_soni_surat"],
    district: "\u0AB8\u0AC1\u0AB0\u0AA4",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-02-01T00:00:00.000Z"
  },
  {
    id: "samaj_soni_rajkot",
    mainSamajId: "main_soni",
    districtId: "dist_rajkot",
    talukaId: "tal_raj_rajkot",
    villageId: "vil_rajkot",
    name: "\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F \u0AB8\u0AC1\u0AB5\u0AB0\u0ACD\u0AA3\u0A95\u0ABE\u0AB0 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AAE\u0AB9\u0ABE\u0AAE\u0A82\u0AA1\u0AB3",
    nameGujarati: "\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F \u0AB8\u0AC1\u0AB5\u0AB0\u0ACD\u0AA3\u0A95\u0ABE\u0AB0 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AAE\u0AB9\u0ABE\u0AAE\u0A82\u0AA1\u0AB3",
    nameEn: "Rajkot Suvarnakar Soni Mahamandal",
    code: "SON_RAJ",
    gamIds: ["vil_rajkot", "gam_soni_rajkot"],
    district: "\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "samaj_soni_ahmedabad",
    mainSamajId: "main_soni",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AB8\u0AC7\u0AB5\u0ABE \u0AB8\u0AAE\u0ABE\u0A9C",
    nameGujarati: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AB8\u0AC7\u0AB5\u0ABE \u0AB8\u0AAE\u0ABE\u0A9C",
    nameEn: "Ahmedabad Shree Soni Seva Samaj",
    code: "SON_AHM",
    gamIds: ["vil_ahm_city", "gam_soni_ahmedabad"],
    district: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-03-01T00:00:00.000Z"
  },
  {
    id: "samaj_soni_bhuj",
    mainSamajId: "main_soni",
    districtId: "dist_kachchh",
    talukaId: "tal_kch_bhuj",
    villageId: "vil_kch_bhuj",
    name: "\u0A95\u0A9A\u0ACD\u0A9B \u0A97\u0AC1\u0AB0\u0ACD\u0A9C\u0AB0 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C (\u0AAD\u0AC1\u0A9C)",
    nameGujarati: "\u0A95\u0A9A\u0ACD\u0A9B \u0A97\u0AC1\u0AB0\u0ACD\u0A9C\u0AB0 \u0AB8\u0ACB\u0AA8\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C (\u0AAD\u0AC1\u0A9C)",
    nameEn: "Kutch Gurjar Soni Samaj (Bhuj)",
    code: "SON_BHUJ",
    gamIds: ["vil_kch_bhuj", "gam_soni_bhuj"],
    district: "\u0A95\u0A9A\u0ACD\u0A9B",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  // 4. Brahmin Chapters
  {
    id: "samaj_brahmin_central",
    mainSamajId: "main_brahmin",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4 \u0AAC\u0ACD\u0AB0\u0AB9\u0ACD\u0AAE \u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0",
    nameGujarati: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4 \u0AAC\u0ACD\u0AB0\u0AB9\u0ACD\u0AAE \u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0",
    nameEn: "Samast Gujarat Brahm Samaj Central",
    code: "BRH_CENTRAL",
    gamIds: ["vil_ahm_city"],
    district: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "samaj_brahmin_rajkot",
    mainSamajId: "main_brahmin",
    districtId: "dist_rajkot",
    talukaId: "tal_raj_rajkot",
    villageId: "vil_rajkot",
    name: "\u0AB8\u0ACC\u0AB0\u0ABE\u0AB7\u0ACD\u0A9F\u0ACD\u0AB0 \u0AAC\u0ACD\u0AB0\u0AB9\u0ACD\u0AAE \u0AB8\u0AAE\u0ABE\u0A9C \u0AAE\u0A82\u0AA1\u0AB3 (\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F)",
    nameGujarati: "\u0AB8\u0ACC\u0AB0\u0ABE\u0AB7\u0ACD\u0A9F\u0ACD\u0AB0 \u0AAC\u0ACD\u0AB0\u0AB9\u0ACD\u0AAE \u0AB8\u0AAE\u0ABE\u0A9C \u0AAE\u0A82\u0AA1\u0AB3 (\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F)",
    nameEn: "Saurashtra Brahm Samaj Mandal (Rajkot)",
    code: "BRH_RAJ",
    gamIds: ["vil_rajkot"],
    district: "\u0AB0\u0ABE\u0A9C\u0A95\u0ACB\u0A9F",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  // 5. Rajput Chapters
  {
    id: "samaj_rajput_central",
    mainSamajId: "main_rajput",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "\u0A85\u0A96\u0ABF\u0AB2 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4 \u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF \u0AB0\u0ABE\u0A9C\u0AAA\u0AC2\u0AA4 \u0AB8\u0AAD\u0ABE",
    nameGujarati: "\u0A85\u0A96\u0ABF\u0AB2 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4 \u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF \u0AB0\u0ABE\u0A9C\u0AAA\u0AC2\u0AA4 \u0AB8\u0AAD\u0ABE",
    nameEn: "Akhil Gujarat Kshatriya Rajput Sabha",
    code: "RAJ_CENTRAL",
    gamIds: ["vil_ahm_city"],
    district: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "samaj_rajput_kachchh",
    mainSamajId: "main_rajput",
    districtId: "dist_kachchh",
    talukaId: "tal_kch_bhuj",
    villageId: "vil_kch_bhuj",
    name: "\u0A95\u0A9A\u0ACD\u0A9B \u0A9C\u0ABF\u0AB2\u0ACD\u0AB2\u0ABE \u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF \u0AB0\u0ABE\u0A9C\u0AAA\u0AC2\u0AA4 \u0AB8\u0AAE\u0ABE\u0A9C",
    nameGujarati: "\u0A95\u0A9A\u0ACD\u0A9B \u0A9C\u0ABF\u0AB2\u0ACD\u0AB2\u0ABE \u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF \u0AB0\u0ABE\u0A9C\u0AAA\u0AC2\u0AA4 \u0AB8\u0AAE\u0ABE\u0A9C",
    nameEn: "Kachchh District Rajput Samaj",
    code: "RAJ_KCH",
    gamIds: ["vil_kch_bhuj"],
    district: "\u0A95\u0A9A\u0ACD\u0A9B",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  // 6. Jain Chapters
  {
    id: "samaj_jain_central",
    mainSamajId: "main_jain",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0A9C\u0AC8\u0AA8 \u0AAE\u0AB9\u0ABE\u0AB8\u0A82\u0A98",
    nameGujarati: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0A9C\u0AC8\u0AA8 \u0AAE\u0AB9\u0ABE\u0AB8\u0A82\u0A98",
    nameEn: "Ahmedabad Jain Mahasangh",
    code: "JAIN_AHM",
    gamIds: ["vil_ahm_city"],
    district: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  // 7. Vaishnav Chapters
  {
    id: "samaj_vaishnav_central",
    mainSamajId: "main_vaishnav",
    districtId: "dist_surat",
    talukaId: "tal_sur_city",
    villageId: "vil_sur_city",
    name: "\u0AB8\u0AC1\u0AB0\u0AA4 \u0AB5\u0AC8\u0AB7\u0ACD\u0AA3\u0AB5 \u0AB5\u0AA3\u0ABF\u0A95 \u0AAE\u0AB9\u0ABE\u0A9C\u0AA8",
    nameGujarati: "\u0AB8\u0AC1\u0AB0\u0AA4 \u0AB5\u0AC8\u0AB7\u0ACD\u0AA3\u0AB5 \u0AB5\u0AA3\u0ABF\u0A95 \u0AAE\u0AB9\u0ABE\u0A9C\u0AA8",
    nameEn: "Surat Vaishnav Vanik Mahajan",
    code: "VSH_SUR",
    gamIds: ["vil_sur_city"],
    district: "\u0AB8\u0AC1\u0AB0\u0AA4",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  // 8. Prajapati Chapters
  {
    id: "samaj_prajapati_central",
    mainSamajId: "main_prajapati",
    districtId: "dist_mehsana",
    talukaId: "tal_mehsana_mehsana",
    villageId: "vil_mehsana",
    name: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0AAA\u0ACD\u0AB0\u0A9C\u0ABE\u0AAA\u0AA4\u0ABF \u0AB8\u0AAE\u0ABE\u0A9C \u0A89\u0AA4\u0ACD\u0A95\u0AB0\u0ACD\u0AB7 \u0AAE\u0A82\u0AA1\u0AB3",
    nameGujarati: "\u0AB8\u0AAE\u0AB8\u0ACD\u0AA4 \u0AAA\u0ACD\u0AB0\u0A9C\u0ABE\u0AAA\u0AA4\u0ABF \u0AB8\u0AAE\u0ABE\u0A9C \u0A89\u0AA4\u0ACD\u0A95\u0AB0\u0ACD\u0AB7 \u0AAE\u0A82\u0AA1\u0AB3",
    nameEn: "Samast Prajapati Samaj Mandal",
    code: "PRJ_MEH",
    gamIds: ["vil_mehsana"],
    district: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  // 9. Suthar Chapters
  {
    id: "samaj_suthar_central",
    mainSamajId: "main_suthar",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A97\u0AC1\u0AB0\u0ACD\u0A9C\u0AB0 \u0AB8\u0AC1\u0AA5\u0ABE\u0AB0 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0AAC\u0ACB\u0AB0\u0ACD\u0AA1\u0ABF\u0A82\u0A97 \u0A8F\u0AB8\u0ACB\u0AB8\u0ABF\u0A8F\u0AB6\u0AA8",
    nameGujarati: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A97\u0AC1\u0AB0\u0ACD\u0A9C\u0AB0 \u0AB8\u0AC1\u0AA5\u0ABE\u0AB0 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0AAC\u0ACB\u0AB0\u0ACD\u0AA1\u0ABF\u0A82\u0A97 \u0A8F\u0AB8\u0ACB\u0AB8\u0ABF\u0A8F\u0AB6\u0AA8",
    nameEn: "Shree Gurjar Suthar Boarding Association",
    code: "SUT_AHM",
    gamIds: ["vil_ahm_city"],
    district: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  // 10. Darji Chapters
  {
    id: "samaj_darji_central",
    mainSamajId: "main_darji",
    districtId: "dist_vadodara",
    talukaId: "tal_vad_vadodara",
    villageId: "vil_vadodara",
    name: "\u0AB5\u0AA1\u0ACB\u0AA6\u0AB0\u0ABE \u0AA6\u0AB0\u0ACD\u0A9C\u0AC0 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0AAA\u0A82\u0A9A\u0ABE\u0AAF\u0AA4",
    nameGujarati: "\u0AB5\u0AA1\u0ACB\u0AA6\u0AB0\u0ABE \u0AA6\u0AB0\u0ACD\u0A9C\u0AC0 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA4\u0ABF \u0AAA\u0A82\u0A9A\u0ABE\u0AAF\u0AA4",
    nameEn: "Vadodara Darji Gnati Panchayat",
    code: "DRJ_VAD",
    gamIds: ["vil_vadodara"],
    district: "\u0AB5\u0AA1\u0ACB\u0AA6\u0AB0\u0ABE",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z"
  }
];

// server.ts
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
app.use((0, import_cors.default)());
app.use(import_express.default.json({ limit: "150mb" }));
app.use(import_express.default.urlencoded({ limit: "150mb", extended: true }));
var DEFAULT_SAMAJ_ID = "default";
var reportsList = [];
var auditLogsList = [];
function logAdminAction(entry) {
  const log = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...entry,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  auditLogsList.unshift(log);
  if (auditLogsList.length > 500) auditLogsList.pop();
  return log;
}
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var MASTER_FILE = import_path.default.join(DATA_DIR, "masterData.json");
function loadMasterData() {
  try {
    if (import_fs.default.existsSync(MASTER_FILE)) {
      const content = import_fs.default.readFileSync(MASTER_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.districts?.length && parsed.talukas?.length && parsed.villages?.length) {
        const msMap = /* @__PURE__ */ new Map();
        initialMainSamaj.forEach((m) => msMap.set(m.id, m));
        (parsed.mainSamaj || []).forEach((m) => msMap.set(m.id, { ...msMap.get(m.id), ...m }));
        const sMap = /* @__PURE__ */ new Map();
        initialSamaj.forEach((s) => sMap.set(s.id, s));
        (parsed.samaj || []).forEach((s) => sMap.set(s.id, { ...sMap.get(s.id), ...s }));
        return {
          districts: parsed.districts,
          talukas: parsed.talukas,
          villages: parsed.villages,
          mainSamaj: Array.from(msMap.values()),
          samaj: Array.from(sMap.values())
        };
      }
    }
  } catch (e) {
    console.warn("Could not read masterData.json, loading defaults:", e);
  }
  return {
    districts: [...initialDistricts],
    talukas: [...initialTalukas],
    villages: [...initialVillages],
    mainSamaj: [...initialMainSamaj],
    samaj: [...initialSamaj]
  };
}
var masterDataLoaded = loadMasterData();
var districtList = masterDataLoaded.districts;
var talukaList = masterDataLoaded.talukas;
var villageList = masterDataLoaded.villages;
var mainSamajList = masterDataLoaded.mainSamaj;
var samajList = masterDataLoaded.samaj;
function persistMasterData() {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    import_fs.default.writeFileSync(
      MASTER_FILE,
      JSON.stringify(
        {
          districts: districtList,
          talukas: talukaList,
          villages: villageList,
          mainSamaj: mainSamajList,
          samaj: samajList,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        },
        null,
        2
      ),
      "utf-8"
    );
  } catch (e) {
    console.error("Failed to persist master data:", e);
  }
}
var gamList = villageList.map((v) => {
  const dist = districtList.find((d) => d.id === v.districtId);
  const tal = talukaList.find((t) => t.id === v.talukaId);
  return {
    id: v.id,
    districtId: v.districtId,
    talukaId: v.talukaId,
    name: v.nameGujarati || v.name,
    nameEn: v.name,
    district: dist?.nameGujarati || dist?.name || "",
    taluka: tal?.nameGujarati || tal?.name || "",
    mainSamajId: "main_patidar",
    isActive: v.isActive,
    createdAt: v.createdAt || (/* @__PURE__ */ new Date("2024-01-01")).toISOString()
  };
});
var currentUser = {
  id: "user_demo_admin",
  phone: "+919876543210",
  name: "\u0AB0\u0ABE\u0A9C\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2 (Admin)",
  role: "super_admin",
  adminRole: "SUPER_ADMIN",
  profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  village: "\u0A8A\u0A82\u0A9D\u0ABE",
  district: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
  bio: "\u0AB8\u0AAE\u0ABE\u0A9C \u0A89\u0AA4\u0ACD\u0A95\u0AB0\u0ACD\u0AB7 \u0A85\u0AA8\u0AC7 \u0AB8\u0AC7\u0AB5\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7 \u0AB8\u0AAE\u0AB0\u0ACD\u0AAA\u0ABF\u0AA4.",
  samajIds: [DEFAULT_SAMAJ_ID, "samaj_ahmedabad"],
  samajRoles: { default: "super_admin" },
  activeSamajId: DEFAULT_SAMAJ_ID,
  followersCount: 142,
  followingCount: 38,
  isSuspended: false,
  blocked: [],
  followers: [],
  following: [],
  verificationStatus: "verified",
  mainSamajId: "main_patidar",
  gam: "\u0A8A\u0A82\u0A9D\u0ABE"
};
var membersList = [
  {
    id: "mem_1",
    name: "\u0AB0\u0ABE\u0A9C\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0A97\u0ACB\u0AB5\u0ABF\u0A82\u0AA6\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    mobile: "9876543210",
    village: "\u0A8A\u0A82\u0A9D\u0ABE",
    district: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    address: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB0\u0ABE\u0AAE \u0AB8\u0ACB\u0AB8\u0ABE\u0AAF\u0A9F\u0AC0, \u0A8A\u0A82\u0A9D\u0ABE",
    dob: "1982-05-14",
    bloodGroup: "B+",
    education: "B.Com, MBA",
    email: "rajesh.patel@example.com",
    father: "\u0A97\u0ACB\u0AB5\u0ABF\u0A82\u0AA6\u0AAD\u0ABE\u0A88 \u0AAE\u0ACB\u0AA4\u0AC0\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    mother: "\u0AB6\u0ABE\u0A82\u0AA4\u0ABE\u0AAC\u0AC7\u0AA8 \u0AAA\u0A9F\u0AC7\u0AB2",
    gender: "male",
    maritalStatus: "married",
    profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date("2024-01-10")).toISOString(),
    createdBy: "user_demo_admin"
  },
  {
    id: "mem_2",
    name: "\u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE\u0AAC\u0AC7\u0AA8 \u0A85\u0AAE\u0ABF\u0AA4\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    mobile: "9825123456",
    village: "\u0AB5\u0ABF\u0AB8\u0AA8\u0A97\u0AB0",
    district: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    address: "\u0A86\u0AA8\u0A82\u0AA6 \u0AB5\u0ABF\u0AB2\u0ABE, \u0AB5\u0ABF\u0AB8\u0AA8\u0A97\u0AB0",
    dob: "1988-11-22",
    bloodGroup: "O+",
    education: "M.Sc. IT",
    email: "priyanka.patel@example.com",
    father: "\u0A95\u0AC0\u0AB0\u0ACD\u0AA4\u0ABF\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    mother: "\u0A9C\u0AB6\u0ACB\u0AA6\u0ABE\u0AAC\u0AC7\u0AA8 \u0AAA\u0A9F\u0AC7\u0AB2",
    gender: "female",
    maritalStatus: "married",
    profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date("2024-01-15")).toISOString(),
    createdBy: "user_demo_admin"
  },
  {
    id: "mem_3",
    name: "\u0AB9\u0AB0\u0ACD\u0AB7\u0ABF\u0AB2 \u0AAE\u0AC1\u0A95\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    mobile: "9712345678",
    village: "\u0A95\u0AA1\u0AC0",
    district: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    address: "\u0AB8\u0AB0\u0AA6\u0ABE\u0AB0 \u0A9A\u0ACB\u0A95, \u0A95\u0AA1\u0AC0",
    dob: "1997-03-10",
    bloodGroup: "A+",
    education: "B.E. Computer Engineering",
    email: "harshil.patel@example.com",
    father: "\u0AAE\u0AC1\u0A95\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0A9C\u0AC7. \u0AAA\u0A9F\u0AC7\u0AB2",
    mother: "\u0AB9\u0A82\u0AB8\u0ABE\u0AAC\u0AC7\u0AA8 \u0AAA\u0A9F\u0AC7\u0AB2",
    gender: "male",
    maritalStatus: "single",
    profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date("2024-02-01")).toISOString(),
    createdBy: "user_demo_admin"
  },
  {
    id: "mem_4",
    name: "\u0AA1\u0AC9. \u0AB8\u0AC1\u0AB0\u0AC7\u0AB6\u0A9A\u0A82\u0AA6\u0ACD\u0AB0 \u0AAE\u0ACB\u0AA4\u0AC0\u0AB2\u0ABE\u0AB2 \u0AAA\u0A9F\u0AC7\u0AB2",
    mobile: "9426011223",
    village: "\u0A9A\u0ABE\u0AA3\u0AB8\u0ACD\u0AAE\u0ABE",
    district: "\u0AAA\u0ABE\u0A9F\u0AA3",
    address: "\u0AA7\u0AA8\u0AB5\u0A82\u0AA4\u0AB0\u0AC0 \u0A95\u0ACD\u0AB2\u0ABF\u0AA8\u0ABF\u0A95, \u0A9A\u0ABE\u0AA3\u0AB8\u0ACD\u0AAE\u0ABE",
    dob: "1975-08-19",
    bloodGroup: "AB+",
    education: "M.B.B.S, M.D.",
    email: "dr.suresh@example.com",
    father: "\u0AAE\u0ACB\u0AA4\u0AC0\u0AB2\u0ABE\u0AB2 \u0AAA\u0A9F\u0AC7\u0AB2",
    mother: "\u0A95\u0AAE\u0AB3\u0ABE\u0AAC\u0AC7\u0AA8",
    gender: "male",
    maritalStatus: "married",
    profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date("2024-02-12")).toISOString(),
    createdBy: "user_demo_admin"
  },
  {
    id: "mem_5",
    name: "\u0AA6\u0ABF\u0AAA\u0ACD\u0AA4\u0AC0\u0AAC\u0AC7\u0AA8 \u0A9C\u0AAF\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    mobile: "9898776655",
    village: "\u0AB8\u0ABF\u0AA6\u0ACD\u0AA7\u0AAA\u0AC1\u0AB0",
    district: "\u0AAA\u0ABE\u0A9F\u0AA3",
    address: "\u0AB6\u0ACD\u0AB0\u0AC0\u0A9C\u0AC0 \u0A95\u0AC3\u0AAA\u0ABE, \u0AB8\u0ABF\u0AA6\u0ACD\u0AA7\u0AAA\u0AC1\u0AB0",
    dob: "1994-09-04",
    bloodGroup: "B-",
    education: "M.Com, B.Ed",
    email: "deepti.patel@example.com",
    father: "\u0A9C\u0AAF\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    mother: "\u0A97\u0AC0\u0AA4\u0ABE\u0AAC\u0AC7\u0AA8 \u0AAA\u0A9F\u0AC7\u0AB2",
    gender: "female",
    maritalStatus: "single",
    profilePhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    samajId: DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date("2024-02-20")).toISOString(),
    createdBy: "user_demo_admin"
  }
];
var eventsList = [
  {
    id: "ev_1",
    title: "\u0AB5\u0ABE\u0AB0\u0ACD\u0AB7\u0ABF\u0A95 \u0AB8\u0ACD\u0AA8\u0AC7\u0AB9 \u0AAE\u0ABF\u0AB2\u0AA8 \u0A85\u0AA8\u0AC7 \u0AA4\u0AC7\u0A9C\u0AB8\u0ACD\u0AB5\u0AC0 \u0AA4\u0ABE\u0AB0\u0AB2\u0ABE \u0AB8\u0AA8\u0ACD\u0AAE\u0ABE\u0AA8 \u0AE8\u0AE6\u0AE8\u0AEB",
    description: "\u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0AA7\u0ACB\u0AB0\u0AA3 \u0AE7\u0AE6, \u0AE7\u0AE8 \u0A85\u0AA8\u0AC7 \u0AA1\u0ABF\u0A97\u0ACD\u0AB0\u0AC0 \u0AAE\u0AC7\u0AB3\u0AB5\u0AA8\u0ABE\u0AB0 \u0AA4\u0AC7\u0A9C\u0AB8\u0ACD\u0AB5\u0AC0 \u0AB5\u0ABF\u0AA6\u0ACD\u0AAF\u0ABE\u0AB0\u0ACD\u0AA5\u0AC0\u0A93\u0AA8\u0AC1\u0A82 \u0AB8\u0AA8\u0ACD\u0AAE\u0ABE\u0AA8 \u0AB8\u0AAE\u0ABE\u0AB0\u0ACB\u0AB9 \u0AA4\u0AA5\u0ABE \u0AB8\u0ABE\u0AB9\u0ABF\u0AA4\u0ACD\u0AAF\u0ABF\u0A95 \u0A95\u0ABE\u0AB0\u0ACD\u0AAF\u0A95\u0ACD\u0AB0\u0AAE.",
    eventImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    location: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0AB0\u0AA6\u0ABE\u0AB0 \u0AAA\u0A9F\u0AC7\u0AB2 \u0AAD\u0AB5\u0AA8, \u0A8A\u0A82\u0A9D\u0ABE",
    date: "2025-10-15",
    startTime: "09:00",
    endTime: "14:00",
    visibility: "samaj",
    samajId: DEFAULT_SAMAJ_ID,
    registrations: [currentUser.id, "user_2", "user_3"],
    createdAt: (/* @__PURE__ */ new Date("2024-03-01")).toISOString(),
    createdBy: currentUser.id
  },
  {
    id: "ev_2",
    title: "\u0AB5\u0ABF\u0AB6\u0ABE\u0AB3 \u0AB0\u0A95\u0ACD\u0AA4\u0AA6\u0ABE\u0AA8 \u0AB6\u0ABF\u0AAC\u0ABF\u0AB0 \u0A85\u0AA8\u0AC7 \u0AA8\u0ABF\u0A83\u0AB6\u0AC1\u0AB2\u0ACD\u0A95 \u0A86\u0AB0\u0ACB\u0A97\u0ACD\u0AAF \u0A95\u0AC7\u0AAE\u0ACD\u0AAA",
    description: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0AB0\u0ABF\u0AB5\u0ABE\u0AB0 \u0AA6\u0ACD\u0AB5\u0ABE\u0AB0\u0ABE \u0AAE\u0ABE\u0AA8\u0AB5\u0AA4\u0ABE\u0AA8\u0ABE \u0A95\u0ABE\u0AB0\u0ACD\u0AAF \u0AAE\u0ABE\u0A9F\u0AC7 \u0A86\u0AAF\u0ACB\u0A9C\u0ABF\u0AA4 \u0AAD\u0AB5\u0ACD\u0AAF \u0AB0\u0A95\u0ACD\u0AA4\u0AA6\u0ABE\u0AA8 \u0A95\u0AC7\u0AAE\u0ACD\u0AAA. \u0AAC\u0ACD\u0AB2\u0AA1 \u0AAA\u0ACD\u0AB0\u0AC7\u0AB6\u0AB0 \u0A85\u0AA8\u0AC7 \u0AA1\u0ABE\u0AAF\u0ABE\u0AAC\u0ABF\u0A9F\u0AC0\u0AB8\u0AA8\u0AC0 \u0AAB\u0ACD\u0AB0\u0AC0 \u0AA4\u0AAA\u0ABE\u0AB8.",
    eventImage: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80",
    location: "\u0A95\u0AAE\u0ACD\u0AAF\u0AC1\u0AA8\u0ABF\u0A9F\u0AC0 \u0AB8\u0AC7\u0AA8\u0ACD\u0A9F\u0AB0, \u0AB8\u0ACB\u0AB8\u0ABE\u0AAF\u0A9F\u0AC0 \u0AB9\u0ACB\u0AB2, \u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    date: "2025-11-02",
    startTime: "08:30",
    endTime: "16:00",
    visibility: "samaj",
    samajId: DEFAULT_SAMAJ_ID,
    registrations: [currentUser.id],
    createdAt: (/* @__PURE__ */ new Date("2024-03-10")).toISOString(),
    createdBy: currentUser.id
  },
  {
    id: "ev_3",
    title: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0ACD\u0AB0\u0AC0\u0AAE\u0ABF\u0AAF\u0AB0 \u0AB2\u0AC0\u0A97 (SPL) \u0AAC\u0ACB\u0A95\u0ACD\u0AB8 \u0A95\u0ACD\u0AB0\u0ABF\u0A95\u0AC7\u0A9F \u0A9F\u0AC1\u0AB0\u0ACD\u0AA8\u0ABE\u0AAE\u0AC7\u0AA8\u0ACD\u0A9F",
    description: "\u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0AAF\u0AC1\u0AB5\u0ABE\u0A93 \u0AAE\u0ABE\u0A9F\u0AC7 \u0A86\u0A82\u0AA4\u0AB0-\u0A97\u0ABE\u0AAE \u0AAC\u0ACB\u0A95\u0ACD\u0AB8 \u0A95\u0ACD\u0AB0\u0ABF\u0A95\u0AC7\u0A9F \u0AAE\u0AB9\u0ACB\u0AA4\u0ACD\u0AB8\u0AB5. \u0A86\u0A95\u0AB0\u0ACD\u0AB7\u0A95 \u0A9F\u0ACD\u0AB0\u0ACB\u0AAB\u0AC0 \u0A85\u0AA8\u0AC7 \u0AB0\u0ACB\u0A95\u0AA1 \u0A87\u0AA8\u0ABE\u0AAE\u0ACB.",
    eventImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80",
    location: "\u0AB8\u0ACD\u0AAA\u0ACB\u0AB0\u0ACD\u0A9F\u0ACD\u0AB8 \u0A95\u0ACD\u0AB2\u0AAC \u0A97\u0ACD\u0AB0\u0ABE\u0A89\u0AA8\u0ACD\u0AA1, \u0AB5\u0ABF\u0AB8\u0AA8\u0A97\u0AB0 \u0AB0\u0ACB\u0AA1",
    date: "2025-12-20",
    startTime: "16:00",
    endTime: "22:00",
    visibility: "samaj",
    samajId: DEFAULT_SAMAJ_ID,
    registrations: [],
    createdAt: (/* @__PURE__ */ new Date("2024-03-15")).toISOString(),
    createdBy: currentUser.id
  }
];
var notificationsList = [
  {
    id: "notif_welcome",
    type: "system",
    title: "\u0AB8\u0ACD\u0AB5\u0ABE\u0A97\u0AA4 \u0A9B\u0AC7!",
    body: "\u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0AA8\u0AC7\u0A95\u0ACD\u0A9F \u0AA1\u0ABF\u0A9C\u0ABF\u0A9F\u0AB2 \u0AAA\u0AB0\u0ABF\u0AB5\u0ABE\u0AB0\u0AAE\u0ABE\u0A82 \u0A86\u0AAA\u0AA8\u0AC1\u0A82 \u0AB9\u0ABE\u0AB0\u0ACD\u0AA6\u0ABF\u0A95 \u0AB8\u0ACD\u0AB5\u0ABE\u0A97\u0AA4 \u0A9B\u0AC7.",
    link: "/home",
    read: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    userId: "all"
  }
];
var postsList = [
  {
    id: "reel_garba_2026",
    authorId: "mem_2",
    authorName: "\u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE\u0AAC\u0AC7\u0AA8 \u0A85\u0AAE\u0ABF\u0AA4\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    authorRole: "member",
    content: "\u0AB8\u0AAE\u0ABE\u0A9C \u0A86\u0AAF\u0ACB\u0A9C\u0ABF\u0AA4 \u0AAD\u0AB5\u0ACD\u0AAF \u0AB0\u0ABE\u0AB8-\u0A97\u0AB0\u0AAC\u0ABE \u0AAE\u0AB9\u0ACB\u0AA4\u0ACD\u0AB8\u0AB5\u0AA8\u0AC0 \u0A9D\u0AB2\u0A95! \u0AAA\u0ABE\u0AB0\u0A82\u0AAA\u0AB0\u0ABF\u0A95 \u0AA1\u0ACD\u0AB0\u0AC7\u0AB8 \u0A85\u0AA8\u0AC7 \u0AA4\u0ABE\u0AB3\u0AC0\u0A93\u0AA8\u0ABE \u0AA4\u0ABE\u0AB2\u0AC7 \u0A9D\u0AC2\u0AAE\u0AA4\u0ACB \u0A86\u0AAA\u0AA3\u0ACB \u0AAF\u0AC1\u0AB5\u0ABE \u0AB5\u0AB0\u0ACD\u0A97 \u{1F483}\u2728 #Garba2026 #SamajReels",
    caption: "\u0AB8\u0AAE\u0ABE\u0A9C \u0A86\u0AAF\u0ACB\u0A9C\u0ABF\u0AA4 \u0AAD\u0AB5\u0ACD\u0AAF \u0AB0\u0ABE\u0AB8-\u0A97\u0AB0\u0AAC\u0ABE \u0AAE\u0AB9\u0ACB\u0AA4\u0ACD\u0AB8\u0AB5\u0AA8\u0AC0 \u0AAE\u0AA8\u0AAE\u0ACB\u0AB9\u0A95 \u0A9D\u0AB2\u0A95! \u{1F483}\u2728",
    mediaUrls: ["/reels/garba-navratri.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "\u0AA4\u0ABE\u0AB0\u0ABE \u0AB5\u0ABF\u0AA8\u0ABE \u0AB6\u0ACD\u0AAF\u0ABE\u0AAE \u0AAE\u0AA8\u0AC7 \u0A8F\u0A95\u0AB2\u0AA1\u0AC1\u0A82 \u0AB2\u0ABE\u0A97\u0AC7 \u2022 \u0AB0\u0ABE\u0AB8 \u0A97\u0AB0\u0AAC\u0ABE",
    location: "\u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB5\u0ABE\u0AA1\u0AC0 \u0A97\u0ACD\u0AB0\u0ABE\u0A89\u0AA8\u0ACD\u0AA1, \u0A8A\u0A82\u0A9D\u0ABE",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id, "mem_1", "mem_3"],
    savedBy: [currentUser.id],
    likesCount: 142,
    commentsCount: 18,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 36e5 * 2).toISOString()
  },
  {
    id: "reel_mandir_aarti",
    authorId: "mem_1",
    authorName: "\u0AAE\u0AB9\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0\u0AAD\u0ABE\u0A88 \u0A97\u0ACB\u0AB5\u0ABF\u0A82\u0AA6\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    authorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    authorRole: "admin",
    content: "\u0A9C\u0AAF \u0A89\u0AAE\u0ABF\u0AAF\u0ABE \u0AAE\u0ABE\u0AA4! \u0A86\u0A9C\u0AA8\u0AC0 \u0AAE\u0A82\u0A97\u0AB3\u0ABE \u0A86\u0AB0\u0AA4\u0AC0\u0AA8\u0ABE \u0AAA\u0AB5\u0ABF\u0AA4\u0ACD\u0AB0 \u0AA6\u0AB0\u0ACD\u0AB6\u0AA8. \u0AB8\u0AB0\u0ACD\u0AB5 \u0AB8\u0AAE\u0ABE\u0A9C \u0AAC\u0ABE\u0A82\u0AA7\u0AB5\u0ACB\u0AA8\u0AC1\u0A82 \u0A95\u0AB2\u0ACD\u0AAF\u0ABE\u0AA3 \u0AA5\u0ABE\u0AAF. \u{1FA94}\u{1F64F} #UmiyaMaa #AartiReel",
    caption: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A89\u0AAE\u0ABF\u0AAF\u0ABE \u0AAE\u0ABE\u0AA4\u0ABE\u0A9C\u0AC0 \u0AAE\u0A82\u0AA6\u0ABF\u0AB0 \u0AAE\u0A82\u0A97\u0AB3\u0ABE \u0A86\u0AB0\u0AA4\u0AC0 \u0A85\u0AA8\u0AC7 \u0AA6\u0ABF\u0AB5\u0ACD\u0AAF \u0AA6\u0AB0\u0ACD\u0AB6\u0AA8 \u{1FA94}\u{1F64F}",
    mediaUrls: ["/reels/mandir-aarti.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "\u0AD0 \u0A9C\u0AAF \u0A89\u0AAE\u0ABF\u0AAF\u0ABE \u0AAE\u0ABE\u0AA4\u0ABE \u2022 \u0AAE\u0A82\u0A97\u0AB3\u0ABE \u0A86\u0AB0\u0AA4\u0AC0",
    location: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A89\u0AAE\u0ABF\u0AAF\u0ABE \u0AAE\u0ABE\u0AA4\u0ABE\u0A9C\u0AC0 \u0AB8\u0A82\u0AB8\u0ACD\u0AA5\u0ABE\u0AA8, \u0A8A\u0A82\u0A9D\u0ABE",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id],
    savedBy: [],
    likesCount: 215,
    commentsCount: 34,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 36e5 * 5).toISOString()
  },
  {
    id: "reel_youth_cricket",
    authorId: "mem_3",
    authorName: "\u0AB9\u0AB0\u0ACD\u0AB7\u0ABF\u0AB2 \u0A85\u0AB6\u0ACD\u0AB5\u0ABF\u0AA8\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    authorPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    authorRole: "member",
    content: "\u0A9B\u0AC7\u0AB2\u0ACD\u0AB2\u0ABE \u0AAC\u0ACB\u0AB2 \u0AAA\u0AB0 \u0AB5\u0ABF\u0AA8\u0ABF\u0A82\u0A97 \u0AB8\u0ABF\u0A95\u0ACD\u0AB8\u0AB0! \u0A8A\u0A82\u0A9D\u0ABE \u0AB5\u0ACB\u0AB0\u0ABF\u0AAF\u0AB0\u0ACD\u0AB8 \u0AAC\u0AA8\u0ACD\u0AAF\u0ABE SPL \u0AE8\u0AE6\u0AE8\u0AEC \u0A9A\u0AC7\u0AAE\u0ACD\u0AAA\u0ABF\u0AAF\u0AA8\u0ACD\u0AB8 \u{1F3C6}\u{1F3CF} #CricketReel #SamajYouth",
    caption: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0ACD\u0AB0\u0AC0\u0AAE\u0ABF\u0AAF\u0AB0 \u0AB2\u0AC0\u0A97 (SPL) \u0AAB\u0ABE\u0A87\u0AA8\u0AB2 \u0AAE\u0AC7\u0A9A \u0AB5\u0ABF\u0AA8\u0ABF\u0A82\u0A97 \u0AAE\u0ACB\u0AAE\u0AC7\u0AA8\u0ACD\u0A9F \u{1F3C6}\u{1F3CF}",
    mediaUrls: ["/reels/youth-cricket.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "\u0A9C\u0AC0\u0AA4 \u0A85\u0AAE\u0ABE\u0AB0\u0AC0 \u0A9B\u0AC7 \u2022 \u0A8F\u0AA8\u0AB0\u0ACD\u0A9C\u0AC0 \u0AAC\u0AC0\u0A9F\u0ACD\u0AB8",
    location: "\u0AB8\u0ACD\u0AAA\u0ACB\u0AB0\u0ACD\u0A9F\u0ACD\u0AB8 \u0A95\u0ACD\u0AB2\u0AAC \u0AB8\u0ACD\u0A9F\u0AC7\u0AA1\u0ABF\u0AAF\u0AAE",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id, "mem_2"],
    savedBy: [currentUser.id],
    likesCount: 189,
    commentsCount: 27,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 36e5 * 10).toISOString()
  },
  {
    id: "reel_business_summit",
    authorId: "mem_5",
    authorName: "\u0A9A\u0ABF\u0AB0\u0ABE\u0A97\u0AAD\u0ABE\u0A88 \u0A95\u0ABE\u0A82\u0AA4\u0ABF\u0AB2\u0ABE\u0AB2 \u0AAA\u0A9F\u0AC7\u0AB2",
    authorPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    authorRole: "member",
    content: "\u0AEB\u0AE6\u0AE6+ \u0AAF\u0AC1\u0AB5\u0ABE \u0A89\u0AA6\u0ACD\u0AAF\u0ACB\u0A97\u0AB8\u0ABE\u0AB9\u0AB8\u0ABF\u0A95\u0ACB \u0AB8\u0ABE\u0AA5\u0AC7 \u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ACB \u0AAC\u0ABF\u0A9D\u0AA8\u0AC7\u0AB8 \u0AB8\u0AAE\u0ABF\u0A9F. \u0AA8\u0AB5\u0AC0\u0AA8 \u0AB8\u0ACD\u0A9F\u0ABE\u0AB0\u0ACD\u0A9F\u0A85\u0AAA\u0ACD\u0AB8 \u0A85\u0AA8\u0AC7 \u0AA8\u0AC7\u0A9F\u0AB5\u0AB0\u0ACD\u0A95\u0ABF\u0A82\u0A97\u0AA8\u0AC0 \u0AB6\u0ABE\u0AA8\u0AA6\u0ABE\u0AB0 \u0A95\u0ACD\u0AB7\u0AA3\u0ACB \u{1F680}\u{1F4BC} #BusinessSummit #SamajConnect",
    caption: "\u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AAF\u0AC1\u0AB5\u0ABE \u0AAC\u0ABF\u0A9D\u0AA8\u0AC7\u0AB8 \u0A95\u0ACB\u0AA8\u0ACD\u0A95\u0ACD\u0AB2\u0AC7\u0AB5 \u0AE8\u0AE6\u0AE8\u0AEC \u2022 \u0AA8\u0AB5\u0AC0 \u0AAA\u0AC7\u0AA2\u0AC0, \u0AA8\u0AB5\u0ABE \u0A86\u0AAF\u0ABE\u0AAE \u{1F680}",
    mediaUrls: ["/reels/business-summit.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "\u0A87\u0AA8\u0ACD\u0AB8\u0ACD\u0AAA\u0ABF\u0AB0\u0AC7\u0AB6\u0AA8\u0AB2 \u0AA5\u0AC0\u0AAE \u2022 \u0AB8\u0A95\u0ACD\u0AB8\u0AC7\u0AB8 \u0AAE\u0A82\u0AA4\u0ACD\u0AB0",
    location: "\u0AAE\u0AB9\u0ABE\u0AA4\u0ACD\u0AAE\u0ABE \u0AAE\u0A82\u0AA6\u0ABF\u0AB0, \u0A97\u0ABE\u0A82\u0AA7\u0AC0\u0AA8\u0A97\u0AB0",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id],
    savedBy: [],
    likesCount: 120,
    commentsCount: 14,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 36e5 * 16).toISOString()
  },
  {
    id: "reel_community_seva",
    authorId: "mem_4",
    authorName: "\u0AA1\u0AC9. \u0AB8\u0AC1\u0AB0\u0AC7\u0AB6\u0A9A\u0A82\u0AA6\u0ACD\u0AB0 \u0AAA\u0A9F\u0AC7\u0AB2",
    authorPhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    authorRole: "member",
    content: "\u0A8F\u0A95 \u0AB0\u0A95\u0ACD\u0AA4\u0AA6\u0ABE\u0AA8, \u0AA4\u0ACD\u0AB0\u0AA3 \u0A9C\u0AC0\u0AB5\u0AA8! \u0AAF\u0AC1\u0AB5\u0ABE \u0AAE\u0A82\u0AA1\u0AB3 \u0AA6\u0ACD\u0AB5\u0ABE\u0AB0\u0ABE \u0A86\u0AAF\u0ACB\u0A9C\u0ABF\u0AA4 \u0AAE\u0AC7\u0A97\u0ABE \u0AAC\u0ACD\u0AB2\u0AA1 \u0AA1\u0ACB\u0AA8\u0AC7\u0AB6\u0AA8 \u0A95\u0AC7\u0AAE\u0ACD\u0AAA\u0AAE\u0ABE\u0A82 \u0AE8\u0AE7\u0AE6 \u0AAF\u0AC1\u0AA8\u0ABF\u0A9F \u0AB0\u0A95\u0ACD\u0AA4 \u0A8F\u0A95\u0AA4\u0ACD\u0AB0\u0ABF\u0AA4 \u0AA5\u0AAF\u0AC1\u0A82. \u0AAE\u0ABE\u0AA8\u0AB5 \u0AB8\u0AC7\u0AB5\u0ABE \u0A8F \u0A9C \u0AAA\u0ACD\u0AB0\u0AAD\u0AC1 \u0AB8\u0AC7\u0AB5\u0ABE! \u{1FA78}\u2764\uFE0F #SamajSeva #BloodDonation",
    caption: "\u0AAE\u0AC7\u0A97\u0ABE \u0AB0\u0A95\u0ACD\u0AA4\u0AA6\u0ABE\u0AA8 \u0A85\u0AA8\u0AC7 \u0A86\u0AB0\u0ACB\u0A97\u0ACD\u0AAF \u0AA4\u0AAA\u0ABE\u0AB8 \u0AB6\u0ABF\u0AAC\u0ABF\u0AB0 \u0AB8\u0AC7\u0AB5\u0ABE \u{1FA78}\u2764\uFE0F",
    mediaUrls: ["/reels/community-seva.mp4"],
    imageUrls: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"],
    mediaType: "reel",
    isReel: true,
    audioTitle: "\u0AB8\u0AC7\u0AB5\u0ABE \u0AAA\u0AB0\u0AAE\u0ACB \u0AA7\u0AB0\u0ACD\u0AAE\u0A83 \u2022 \u0AB6\u0ABE\u0A82\u0AA4 \u0AA7\u0AC2\u0AA8",
    location: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB9\u0ACB\u0AB2, \u0AB5\u0ABF\u0AB8\u0AA8\u0A97\u0AB0",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id],
    savedBy: [],
    likesCount: 165,
    commentsCount: 21,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 36e5 * 24).toISOString()
  },
  {
    id: "post_1",
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorPhoto: currentUser.profilePhoto,
    content: "\u0A86\u0AAA\u0AA3\u0ABE \u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0AB9\u0ACB\u0AA8\u0AB9\u0ABE\u0AB0 \u0AAF\u0AC1\u0AB5\u0ABE \u0AB9\u0AB0\u0ACD\u0AB7\u0ABF\u0AB2 \u0AAA\u0A9F\u0AC7\u0AB2\u0AC7 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4 \u0AAA\u0AAC\u0ACD\u0AB2\u0ABF\u0A95 \u0AB8\u0AB0\u0ACD\u0AB5\u0ABF\u0AB8 \u0A95\u0AAE\u0ABF\u0AB6\u0AA8 (GPSC) \u0AAE\u0ABE\u0A82 \u0A9D\u0AB3\u0AB9\u0AB3\u0AA4\u0AC0 \u0AB8\u0AAB\u0AB3\u0AA4\u0ABE \u0AAE\u0AC7\u0AB3\u0AB5\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0AC1\u0A82 \u0AA8\u0ABE\u0AAE \u0AB0\u0ACB\u0AB6\u0AA8 \u0A95\u0AB0\u0ACD\u0AAF\u0AC1\u0A82 \u0A9B\u0AC7. \u0A96\u0AC2\u0AAC \u0A96\u0AC2\u0AAC \u0A85\u0AAD\u0ABF\u0AA8\u0A82\u0AA6\u0AA8! \u{1F490}\u{1F389} #SamajPride #Success",
    caption: "\u0A86\u0AAA\u0AA3\u0ABE \u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0AB9\u0ACB\u0AA8\u0AB9\u0ABE\u0AB0 \u0AAF\u0AC1\u0AB5\u0ABE \u0AB9\u0AB0\u0ACD\u0AB7\u0ABF\u0AB2 \u0AAA\u0A9F\u0AC7\u0AB2\u0AC7 GPSC \u0AAE\u0ABE\u0A82 \u0AB8\u0AAB\u0AB3\u0AA4\u0ABE \u0AAE\u0AC7\u0AB3\u0AB5\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0AC1\u0A82 \u0AA8\u0ABE\u0AAE \u0AB0\u0ACB\u0AB6\u0AA8 \u0A95\u0AB0\u0ACD\u0AAF\u0AC1\u0A82!",
    mediaUrls: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80"],
    imageUrls: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80"],
    mediaType: "image",
    visibility: "public",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id, "u2", "u3", "u4"],
    savedBy: [currentUser.id],
    likesCount: 24,
    commentsCount: 5,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 36e5 * 4).toISOString()
  },
  {
    id: "post_2",
    authorId: "mem_4",
    authorName: "\u0AA1\u0AC9. \u0AB8\u0AC1\u0AB0\u0AC7\u0AB6\u0A9A\u0A82\u0AA6\u0ACD\u0AB0 \u0AAA\u0A9F\u0AC7\u0AB2",
    authorPhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    content: "\u0A86\u0A97\u0ABE\u0AAE\u0AC0 \u0AB0\u0AB5\u0ABF\u0AB5\u0ABE\u0AB0\u0AC7 \u0A8A\u0A82\u0A9D\u0ABE \u0AAE\u0AC1\u0A95\u0ABE\u0AAE\u0AC7 \u0AB8\u0AB0\u0ACD\u0AB5\u0AB0\u0ACB\u0A97 \u0AA8\u0ABF\u0AA6\u0ABE\u0AA8 \u0A95\u0AC7\u0AAE\u0ACD\u0AAA\u0AA8\u0AC1\u0A82 \u0A86\u0AAF\u0ACB\u0A9C\u0AA8 \u0A9B\u0AC7. \u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0AA4\u0AAE\u0ABE\u0AAE \u0AB5\u0AA1\u0AC0\u0AB2\u0ACB \u0A85\u0AA8\u0AC7 \u0AAE\u0ABE\u0AA4\u0ABE-\u0AAC\u0AB9\u0AC7\u0AA8\u0ACB\u0AA8\u0AC7 \u0AB2\u0ABE\u0AAD \u0AB2\u0AC7\u0AB5\u0ABE \u0AA8\u0AAE\u0ACD\u0AB0 \u0AB5\u0ABF\u0AA8\u0A82\u0AA4\u0AC0 \u0A9B\u0AC7. \u{1F64F} #HealthCamp #SamajSeva",
    caption: "\u0A86\u0A97\u0ABE\u0AAE\u0AC0 \u0AB0\u0AB5\u0ABF\u0AB5\u0ABE\u0AB0\u0AC7 \u0A8A\u0A82\u0A9D\u0ABE \u0AAE\u0AC1\u0A95\u0ABE\u0AAE\u0AC7 \u0AB8\u0AB0\u0ACD\u0AB5\u0AB0\u0ACB\u0A97 \u0AA8\u0ABF\u0AA6\u0ABE\u0AA8 \u0A95\u0AC7\u0AAE\u0ACD\u0AAA",
    mediaUrls: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"],
    imageUrls: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"],
    mediaType: "image",
    visibility: "samaj",
    samajId: DEFAULT_SAMAJ_ID,
    likedBy: [currentUser.id],
    savedBy: [],
    likesCount: 18,
    commentsCount: 2,
    approved: true,
    status: "active",
    createdAt: new Date(Date.now() - 36e5 * 18).toISOString()
  }
];
var commentsList = {
  post_1: [
    {
      id: "comm_1",
      authorId: "mem_2",
      authorName: "\u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE\u0AAC\u0AC7\u0AA8 \u0AAA\u0A9F\u0AC7\u0AB2",
      authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      content: "\u0A96\u0AC2\u0AAC \u0A96\u0AC2\u0AAC \u0A85\u0AAD\u0ABF\u0AA8\u0A82\u0AA6\u0AA8 \u0AAD\u0ABE\u0A88! \u0A89\u0AA4\u0ACD\u0AA4\u0AB0\u0ACB\u0AA4\u0ACD\u0AA4\u0AB0 \u0AAA\u0ACD\u0AB0\u0A97\u0AA4\u0ABF \u0A95\u0AB0\u0ACB \u0AA4\u0AC7\u0AB5\u0AC0 \u0AB6\u0AC1\u0AAD\u0A95\u0ABE\u0AAE\u0AA8\u0ABE\u0A93.",
      createdAt: new Date(Date.now() - 36e5 * 3).toISOString()
    },
    {
      id: "comm_2",
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorPhoto: currentUser.profilePhoto,
      content: "\u0A86\u0A96\u0ABE \u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0AC7 \u0A97\u0AB0\u0ACD\u0AB5 \u0A9B\u0AC7 \u0AA4\u0AAE\u0ABE\u0AB0\u0ABE \u0AAA\u0AB0!",
      createdAt: new Date(Date.now() - 36e5 * 2).toISOString()
    }
  ]
};
var storiesList = [
  {
    id: "story_1",
    userId: currentUser.id,
    userName: currentUser.name,
    userPhoto: currentUser.profilePhoto,
    mediaUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    caption: "\u0A86\u0A9C\u0AA8\u0ACB \u0AB8\u0AC2\u0AB0\u0ACD\u0AAF\u0ACB\u0AA6\u0AAF \u0A85\u0AA8\u0AC7 \u0AAE\u0A82\u0AA6\u0ABF\u0AB0 \u0AA6\u0AB0\u0ACD\u0AB6\u0AA8 \u{1F305}\u{1F64F}",
    filter: "warm",
    rotation: 0,
    aspectRatio: "9:16",
    volume: 1,
    likedBy: ["u2", "u3"],
    likesCount: 2,
    viewedBy: [currentUser.id, "u2"],
    viewsCount: 14,
    createdAt: new Date(Date.now() - 1e3 * 60 * 35).toISOString(),
    // 35m ago
    samajId: DEFAULT_SAMAJ_ID,
    visibility: "samaj",
    music: {
      id: "track_morning_prabhatiya",
      title: "\u0AAA\u0ACD\u0AB0\u0AAD\u0ABE\u0AA4\u0ABF\u0AAF\u0ABE \u0AAD\u0AC8\u0AB0\u0AB5 \u0AA7\u0AC2\u0AA8",
      artist: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB8\u0A82\u0A97\u0AC0\u0AA4 \u0AAE\u0A82\u0AA1\u0AB3",
      cover: "\u{1F305}",
      volume: 0.8
    }
  },
  {
    id: "story_2",
    userId: "mem_2",
    userName: "\u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE\u0AAC\u0AC7\u0AA8 \u0AAA\u0A9F\u0AC7\u0AB2",
    userPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    mediaUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    caption: "\u0AB8\u0AAE\u0ABE\u0A9C\u0AB5\u0ABE\u0AA1\u0AC0 \u0A96\u0ABE\u0AA4\u0AC7 \u0AB8\u0AA4\u0ACD\u0AB8\u0A82\u0A97 \u0AB8\u0AAE\u0ABE\u0AB0\u0ACB\u0AB9 \u{1FA94}\u2728",
    filter: "vivid",
    rotation: 0,
    aspectRatio: "9:16",
    volume: 1,
    likedBy: [currentUser.id],
    likesCount: 5,
    viewedBy: [currentUser.id],
    viewsCount: 28,
    createdAt: new Date(Date.now() - 1e3 * 60 * 110).toISOString(),
    // 1h 50m ago
    samajId: DEFAULT_SAMAJ_ID,
    visibility: "samaj",
    music: {
      id: "track_mandir_aarti",
      title: "\u0AAE\u0A82\u0AA6\u0ABF\u0AB0 \u0A86\u0AB0\u0AA4\u0AC0 \u0A85\u0AA8\u0AC7 \u0AB6\u0A82\u0A96\u0AA8\u0ABE\u0AA6",
      artist: "\u0AAA\u0AB0\u0A82\u0AAA\u0AB0\u0ABE\u0A97\u0AA4 \u0AA7\u0AC2\u0AA8",
      cover: "\u{1FA94}",
      volume: 0.7
    }
  },
  {
    id: "story_3",
    userId: "mem_3",
    userName: "\u0AB9\u0AB0\u0ACD\u0AB7\u0ABF\u0AB2 \u0AAA\u0A9F\u0AC7\u0AB2",
    userPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4",
    mediaType: "video",
    caption: "\u0A95\u0AC1\u0AA6\u0AB0\u0AA4\u0AA8\u0ABE \u0AB8\u0ABE\u0AA8\u0ABF\u0AA7\u0ACD\u0AAF\u0AAE\u0ABE\u0A82 \u0AB8\u0ABE\u0A82\u0A9C \u{1F343}\u{1F54A}\uFE0F",
    filter: "cool",
    rotation: 0,
    aspectRatio: "9:16",
    volume: 0.8,
    trimStart: 0,
    trimEnd: 15,
    likedBy: [],
    likesCount: 1,
    viewedBy: [],
    viewsCount: 9,
    createdAt: new Date(Date.now() - 1e3 * 60 * 270).toISOString(),
    // 4h 30m ago
    samajId: DEFAULT_SAMAJ_ID,
    visibility: "samaj",
    music: {
      id: "track_krishna_flute",
      title: "\u0AB6\u0ACD\u0AB0\u0AC0\u0A95\u0AC3\u0AB7\u0ACD\u0AA3 \u0AB5\u0ABE\u0A82\u0AB8\u0AB3\u0AC0 \u0AAE\u0AA7\u0AC1\u0AB0 \u0AB8\u0AC2\u0AB0",
      artist: "\u0AAD\u0A95\u0ACD\u0AA4\u0ABF \u0AB8\u0AC2\u0AB0",
      cover: "\u{1FA88}",
      volume: 0.75
    }
  }
];
var hallsList = [
  {
    id: "hall_1",
    name: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0AB0\u0AA6\u0ABE\u0AB0 \u0AAA\u0A9F\u0AC7\u0AB2 \u0A8F\u0AB0-\u0A95\u0AA8\u0ACD\u0AA1\u0ABF\u0AB6\u0AA8\u0ACD\u0AA1 \u0AAC\u0AC7\u0AA8\u0ACD\u0A95\u0ACD\u0AB5\u0AC7\u0A9F \u0AB9\u0ACB\u0AB2",
    description: "\u0AB2\u0A97\u0ACD\u0AA8\u0AAA\u0ACD\u0AB0\u0AB8\u0A82\u0A97, \u0AB8\u0A97\u0ABE\u0A88, \u0AAC\u0AC7\u0AB8\u0AA3\u0AC1\u0A82 \u0A85\u0AA8\u0AC7 \u0AB8\u0ABE\u0AAE\u0ABE\u0A9C\u0ABF\u0A95 \u0AAE\u0AC0\u0A9F\u0ABF\u0A82\u0A97\u0ACD\u0AB8 \u0AAE\u0ABE\u0A9F\u0AC7 \u0AB8\u0AC1\u0AB5\u0ABF\u0AA7\u0ABE\u0AAF\u0AC1\u0A95\u0ACD\u0AA4 \u0AB8\u0AC7\u0AA8\u0ACD\u0A9F\u0ACD\u0AB0\u0AB2\u0AC0 \u0A8F\u0AB8\u0AC0 \u0AB9\u0ACB\u0AB2. \u0AB5\u0ABF\u0AB6\u0ABE\u0AB3 \u0A95\u0ABF\u0A9A\u0AA8 \u0A85\u0AA8\u0AC7 \u0AAA\u0ABE\u0AB0\u0ACD\u0A95\u0ABF\u0A82\u0A97 \u0AB5\u0ACD\u0AAF\u0AB5\u0AB8\u0ACD\u0AA5\u0ABE \u0A89\u0AAA\u0AB2\u0AAC\u0ACD\u0AA7.",
    location: "\u0A8A\u0A82\u0A9D\u0ABE \u0AB9\u0ABE\u0A88\u0AB5\u0AC7 \u0AB0\u0ACB\u0AA1, \u0A8A\u0A82\u0A9D\u0ABE",
    capacity: 600,
    imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
    pricePerDay: 25e3,
    amenities: ["AC", "Large Kitchen", "Stage & Audio", "Ample Parking", "Bridal Room", "Generator Backup"],
    isActive: true,
    samajId: DEFAULT_SAMAJ_ID
  },
  {
    id: "hall_2",
    name: "\u0AB8\u0AAE\u0ABE\u0A9C\u0AB5\u0ABE\u0AA1\u0AC0 \u0AB8\u0AC7\u0AAE\u0ABF\u0AA8\u0ABE\u0AB0 \u0AB0\u0AC2\u0AAE \u0A85\u0AA8\u0AC7 \u0AA1\u0ABE\u0A87\u0AA8\u0ABF\u0A82\u0A97 \u0A8F\u0AB0\u0ABF\u0AAF\u0ABE",
    description: "\u0AA8\u0ABE\u0AA8\u0ABE \u0AAE\u0AC7\u0AB3\u0ABE\u0AB5\u0AA1\u0ABE, \u0AAA\u0ACD\u0AB0\u0AB5\u0A9A\u0AA8 \u0A95\u0AC7 \u0AB5\u0ABF\u0AA6\u0ACD\u0AAF\u0ABE\u0AB0\u0ACD\u0AA5\u0AC0 \u0AB8\u0AC7\u0AAE\u0ABF\u0AA8\u0ABE\u0AB0 \u0AAE\u0ABE\u0A9F\u0AC7 \u0A89\u0AA4\u0ACD\u0AA4\u0AAE \u0AE7\u0AEB\u0AE6 \u0AB5\u0ACD\u0AAF\u0A95\u0ACD\u0AA4\u0ABF\u0A93\u0AA8\u0AC0 \u0A95\u0ACD\u0AB7\u0AAE\u0AA4\u0ABE \u0AA7\u0AB0\u0ABE\u0AB5\u0AA4\u0ACB \u0AAE\u0ABF\u0AA8\u0AC0 \u0AB9\u0ACB\u0AB2.",
    location: "\u0AB8\u0AB0\u0AA6\u0ABE\u0AB0 \u0A9A\u0ACB\u0A95, \u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    capacity: 150,
    imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80",
    pricePerDay: 8e3,
    amenities: ["Projector", "Sound System", "Dining Hall", "Wi-Fi"],
    isActive: true,
    samajId: DEFAULT_SAMAJ_ID
  }
];
var bookingsList = [
  {
    id: "bk_1",
    hallId: "hall_1",
    hallName: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0AB8\u0AB0\u0AA6\u0ABE\u0AB0 \u0AAA\u0A9F\u0AC7\u0AB2 \u0A8F\u0AB0-\u0A95\u0AA8\u0ACD\u0AA1\u0ABF\u0AB6\u0AA8\u0ACD\u0AA1 \u0AAC\u0AC7\u0AA8\u0ACD\u0A95\u0ACD\u0AB5\u0AC7\u0A9F \u0AB9\u0ACB\u0AB2",
    date: "2025-11-25",
    startTime: "08:00",
    endTime: "22:00",
    purpose: "\u0AB2\u0A97\u0ACD\u0AA8 \u0AAA\u0ACD\u0AB0\u0AB8\u0A82\u0A97 (\u0AB5\u0ABF\u0AB5\u0ABE\u0AB9 \u0AB8\u0A82\u0AB8\u0ACD\u0A95\u0ABE\u0AB0)",
    guests: 450,
    contactPhone: "9876543210",
    userName: currentUser.name,
    userId: currentUser.id,
    samajId: DEFAULT_SAMAJ_ID,
    status: "approved",
    createdAt: (/* @__PURE__ */ new Date("2024-02-15")).toISOString()
  }
];
var albumsList = [
  {
    id: "alb_1",
    title: "\u0AB5\u0ABE\u0AB0\u0ACD\u0AB7\u0ABF\u0A95 \u0AB8\u0ACD\u0AA8\u0AC7\u0AB9 \u0AAE\u0ABF\u0AB2\u0AA8 \u0AE8\u0AE6\u0AE8\u0AEA \u0AB8\u0A82\u0AB8\u0ACD\u0AAE\u0AB0\u0AA3\u0ACB",
    description: "\u0A97\u0AAF\u0ABE \u0AB5\u0AB0\u0ACD\u0AB7\u0AA8\u0ABE \u0AB5\u0ABE\u0AB0\u0ACD\u0AB7\u0ABF\u0A95 \u0AAE\u0AB9\u0ACB\u0AA4\u0ACD\u0AB8\u0AB5 \u0A85\u0AA8\u0AC7 \u0AB8\u0AA8\u0ACD\u0AAE\u0ABE\u0AA8 \u0AB8\u0AAE\u0ABE\u0AB0\u0ACB\u0AB9\u0AA8\u0AC0 \u0AAF\u0ABE\u0AA6\u0A97\u0ABE\u0AB0 \u0A95\u0ACD\u0AB7\u0AA3\u0ACB.",
    coverUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    photosCount: 6,
    samajId: DEFAULT_SAMAJ_ID,
    approved: true,
    status: "active",
    createdAt: (/* @__PURE__ */ new Date("2024-01-20")).toISOString(),
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80", caption: "\u0AB8\u0ACD\u0AB5\u0ABE\u0A97\u0AA4 \u0AAA\u0ACD\u0AB0\u0AB5\u0A9A\u0AA8" },
      { id: "p2", url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80", caption: "\u0AB5\u0ABF\u0AA6\u0ACD\u0AAF\u0ABE\u0AB0\u0ACD\u0AA5\u0AC0 \u0AB8\u0AA8\u0ACD\u0AAE\u0ABE\u0AA8" },
      { id: "p3", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80", caption: "\u0AB8\u0ABE\u0A82\u0AB8\u0ACD\u0A95\u0AC3\u0AA4\u0ABF\u0A95 \u0A95\u0ABE\u0AB0\u0ACD\u0AAF\u0A95\u0ACD\u0AB0\u0AAE" }
    ]
  }
];
var liveSessions = [
  {
    id: "live_1",
    title: "\u0AB6\u0ACD\u0AB0\u0AC0\u0AAE\u0AA6\u0ACD \u0AAD\u0ABE\u0A97\u0AB5\u0AA4 \u0AB8\u0AAA\u0ACD\u0AA4\u0ABE\u0AB9 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA8\u0AAF\u0A9C\u0ACD\u0A9E - \u0AA6\u0ABF\u0AB5\u0AB8 \u0AE9 (\u0AB2\u0ABE\u0A88\u0AB5 \u0AAA\u0ACD\u0AB0\u0AB8\u0ABE\u0AB0\u0AA3)",
    description: "\u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0A86\u0A82\u0A97\u0AA3\u0AC7 \u0AAA\u0AC2\u0A9C\u0ACD\u0AAF \u0AB6\u0ABE\u0AB8\u0ACD\u0AA4\u0ACD\u0AB0\u0AC0\u0A9C\u0AC0\u0AA8\u0ABE \u0AAE\u0AC1\u0A96\u0ABE\u0AB0\u0AB5\u0ABF\u0A82\u0AA6\u0AA5\u0AC0 \u0A85\u0AAE\u0AC3\u0AA4\u0AAE\u0AAF \u0A95\u0AA5\u0ABE\u0AA8\u0AC1\u0A82 \u0AB8\u0AC0\u0AA7\u0AC1\u0A82 \u0AAA\u0ACD\u0AB0\u0AB8\u0ABE\u0AB0\u0AA3.",
    thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    status: "live",
    viewersCount: 42,
    scheduledAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    samajId: DEFAULT_SAMAJ_ID
  }
];
function formatEvent(e, user) {
  const regs = e.registrations || [];
  return {
    ...e,
    visibility: e.visibility || "samaj",
    registeredByMe: regs.includes(user.id),
    registrationCount: regs.length,
    canManage: user.role === "super_admin" || e.createdBy === user.id
  };
}
var DEV_AUTH_ENABLED = true;
var FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "samaj-connect-6ad91";
var FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
var FIREBASE_JWKS = (0, import_jose.createRemoteJWKSet)(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);
async function verifyFirebaseIdToken(token) {
  try {
    const { payload } = await (0, import_jose.jwtVerify)(token, FIREBASE_JWKS, {
      issuer: FIREBASE_ISSUER,
      audience: FIREBASE_PROJECT_ID
    });
    if (!payload || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}
function parseAdminAllowlist(raw) {
  const map = {};
  for (const entry of (raw || "").split(",")) {
    const [phoneRaw, roleRaw] = entry.split(":").map((x) => (x || "").trim());
    if (!phoneRaw || !roleRaw) continue;
    const digits = phoneRaw.replace(/\D/g, "").slice(-10);
    const role = roleRaw.toUpperCase();
    if (!digits) continue;
    if (role === "SUPER_ADMIN" || role === "MAIN_SAMAJ_ADMIN" || role === "SAMAJ_ADMIN") {
      map[digits] = role;
    }
  }
  return map;
}
var adminRolesMap = parseAdminAllowlist(process.env.ADMIN_ALLOWLIST || "");
if (!adminRolesMap["9876543210"]) adminRolesMap["9876543210"] = "SUPER_ADMIN";
if (!adminRolesMap["9825000001"]) adminRolesMap["9825000001"] = "MAIN_SAMAJ_ADMIN";
if (!adminRolesMap["9825000002"]) adminRolesMap["9825000002"] = "SAMAJ_ADMIN";
function allowlistRole(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "").slice(-10);
  return adminRolesMap[digits] || null;
}
var usersMap = {
  [currentUser.id]: currentUser,
  "user_9876543210": currentUser,
  "mem_1": currentUser,
  // Main Samaj Admin
  "user_9825000001": {
    id: "user_9825000001",
    phone: "+919825000001",
    name: "\u0A9C\u0AAF\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2 (Main Samaj Admin)",
    role: "main_samaj_admin",
    adminRole: "MAIN_SAMAJ_ADMIN",
    profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    village: "\u0A8A\u0A82\u0A9D\u0ABE",
    district: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    bio: "\u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C \u0AB8\u0A82\u0AAF\u0ACB\u0A9C\u0A95 \u0A85\u0AA8\u0AC7 \u0AAA\u0ACD\u0AB0\u0AB6\u0ABE\u0AB8\u0A95",
    samajIds: [DEFAULT_SAMAJ_ID],
    samajRoles: { [DEFAULT_SAMAJ_ID]: "main_samaj_admin" },
    activeSamajId: DEFAULT_SAMAJ_ID,
    followersCount: 88,
    followingCount: 20,
    isSuspended: false,
    blocked: [],
    followers: [],
    following: [],
    verificationStatus: "verified",
    mainSamajId: "main_patidar",
    gam: "\u0A8A\u0A82\u0A9D\u0ABE"
  },
  // Samaj Chapter Admin
  "user_9825000002": {
    id: "user_9825000002",
    phone: "+919825000002",
    name: "\u0A95\u0ABF\u0AB0\u0AC0\u0A9F\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2 (Ahmedabad Samaj Admin)",
    role: "samaj_admin",
    adminRole: "SAMAJ_ADMIN",
    profilePhoto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    village: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    district: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    bio: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6 \u0AB8\u0AAE\u0ABE\u0A9C \u0AB6\u0ABE\u0A96\u0ABE \u0AB8\u0A82\u0A9A\u0ABE\u0AB2\u0A95",
    samajIds: ["samaj_ahmedabad"],
    samajRoles: { samaj_ahmedabad: "samaj_admin" },
    activeSamajId: "samaj_ahmedabad",
    followersCount: 45,
    followingCount: 12,
    isSuspended: false,
    blocked: [],
    followers: [],
    following: [],
    verificationStatus: "verified",
    mainSamajId: "main_patidar",
    gam: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6"
  }
};
membersList.forEach((m) => {
  const uid = `user_${m.mobile.slice(-10)}`;
  if (!usersMap[uid]) {
    usersMap[uid] = {
      id: uid,
      phone: `+91${m.mobile}`,
      name: m.name,
      role: "member",
      adminRole: null,
      profilePhoto: m.profilePhoto,
      village: m.village,
      district: m.district,
      bio: `${m.education || "\u0AB8\u0AAD\u0ACD\u0AAF"} \xB7 ${m.village}`,
      samajIds: [m.samajId || DEFAULT_SAMAJ_ID],
      samajRoles: { [m.samajId || DEFAULT_SAMAJ_ID]: "member" },
      activeSamajId: m.samajId || DEFAULT_SAMAJ_ID,
      followersCount: 24,
      followingCount: 15,
      isSuspended: false,
      blocked: [],
      followers: [],
      following: [],
      verificationStatus: "verified",
      mainSamajId: "main_patidar",
      gam: m.village
    };
  }
  if (!usersMap[m.id]) {
    usersMap[m.id] = usersMap[uid];
  }
});
function resolveUser(uid) {
  if (!uid) return void 0;
  if (usersMap[uid]) return usersMap[uid];
  if (uid === currentUser.id) return currentUser;
  const member = membersList.find((m) => m.id === uid || `user_${m.mobile.slice(-10)}` === uid);
  if (member) {
    const genUid = `user_${member.mobile.slice(-10)}`;
    if (!usersMap[genUid]) {
      usersMap[genUid] = {
        id: genUid,
        phone: `+91${member.mobile}`,
        name: member.name,
        role: "member",
        profilePhoto: member.profilePhoto,
        village: member.village,
        district: member.district,
        bio: `${member.education || "\u0AB8\u0AAD\u0ACD\u0AAF"} \xB7 ${member.village}`,
        samajIds: [member.samajId || DEFAULT_SAMAJ_ID],
        samajRoles: { [member.samajId || DEFAULT_SAMAJ_ID]: "member" },
        activeSamajId: member.samajId || DEFAULT_SAMAJ_ID,
        followersCount: 24,
        followingCount: 15,
        isSuspended: false,
        blocked: [],
        followers: [],
        following: [],
        verificationStatus: "verified",
        mainSamajId: "main_patidar",
        gam: member.village
      };
    }
    usersMap[uid] = usersMap[genUid];
    return usersMap[genUid];
  }
  return void 0;
}
var followRelationsMap = /* @__PURE__ */ new Map();
function seedFollow(followerId, targetId) {
  const key = `${followerId}_${targetId}`;
  if (!followRelationsMap.has(key)) {
    followRelationsMap.set(key, {
      id: key,
      followerId,
      followedUserId: targetId,
      createdAt: (/* @__PURE__ */ new Date("2024-03-01")).toISOString()
    });
    const follower = resolveUser(followerId);
    const target = resolveUser(targetId);
    if (follower) {
      if (!follower.following) follower.following = [];
      if (!follower.following.includes(targetId)) follower.following.push(targetId);
      follower.followingCount = follower.following.length;
    }
    if (target) {
      if (!target.followers) target.followers = [];
      if (!target.followers.includes(followerId)) target.followers.push(followerId);
      target.followersCount = target.followers.length;
    }
  }
}
seedFollow("user_9825123457", currentUser.id);
seedFollow("user_9825123458", currentUser.id);
seedFollow(currentUser.id, "user_9825123457");
function canUserViewPost(post, authUser) {
  if (!post || post.status === "deleted") return false;
  const authorId = post.authorId || post.createdBy;
  if (authorId === authUser.id) return true;
  if (post.isMemorial || post.category === "memorial" || post.maranNodhId) return true;
  if (authUser.role === "super_admin") return true;
  const vis = post.visibility || "samaj";
  if (vis === "only_me" || vis === "private") {
    return false;
  }
  if (vis === "followers") {
    const isFollowing = followRelationsMap.has(`${authUser.id}_${authorId}`) || authUser.following && authUser.following.includes(authorId);
    return Boolean(isFollowing);
  }
  if (vis === "samaj") {
    const postSamajId = post.samajId || DEFAULT_SAMAJ_ID;
    const userSamajIds = authUser.samajIds || (authUser.activeSamajId ? [authUser.activeSamajId] : [DEFAULT_SAMAJ_ID]);
    return userSamajIds.includes(postSamajId);
  }
  if (vis === "public" || vis === "all_samaj") {
    return true;
  }
  return false;
}
var REQUIRED_PROFILE_FIELDS = [
  { key: "name", label: "Name" },
  { key: "village", label: "Village/Gam" },
  { key: "district", label: "District" }
];
function checkProfileComplete(u) {
  const missing = REQUIRED_PROFILE_FIELDS.filter((f) => !(u[f.key] && String(u[f.key]).trim())).map((f) => f.label);
  return { complete: missing.length === 0, missing };
}
function getVerificationState(u) {
  const { complete, missing } = checkProfileComplete(u);
  const s = u.verificationStatus;
  let state;
  if (s === "verified") state = "VERIFIED";
  else if (s === "pending") state = "VERIFICATION_PENDING";
  else if (s === "rejected") state = "REJECTED";
  else state = "PROFILE_INCOMPLETE";
  const canSubmit = complete && (state === "PROFILE_INCOMPLETE" || state === "REJECTED");
  return {
    verificationState: state,
    profileComplete: complete,
    missingFields: missing,
    rejectionReason: u.rejectionReason || null,
    canSubmit,
    verifiedAt: u.verifiedAt || null,
    submittedAt: u.verificationSubmittedAt || null
  };
}
var conversationsMap = {};
var messagesMap = {};
function getDisappearingMs(dur) {
  switch (dur) {
    case "10s":
      return 10 * 1e3;
    case "30s":
      return 30 * 1e3;
    case "1m":
      return 60 * 1e3;
    case "5m":
      return 5 * 60 * 1e3;
    case "1h":
      return 60 * 60 * 1e3;
    case "1d":
    case "24h":
      return 24 * 60 * 60 * 1e3;
    case "7d":
      return 7 * 24 * 60 * 60 * 1e3;
    case "90d":
      return 90 * 24 * 60 * 60 * 1e3;
    default:
      return 0;
  }
}
function isMessageExpired(m, conv) {
  const dur = m.disappearingDuration || conv?.disappearingDuration;
  if (!dur || dur === "off") return false;
  if (!m.readAt) return false;
  const durMs = getDisappearingMs(dur);
  if (!durMs) return false;
  return Date.now() - new Date(m.readAt).getTime() >= durMs;
}
setInterval(() => {
  const now = Date.now();
  for (const cid in messagesMap) {
    const conv = conversationsMap[cid];
    if (!messagesMap[cid]) continue;
    messagesMap[cid] = messagesMap[cid].filter((m) => {
      const dur = m.disappearingDuration || conv?.disappearingDuration;
      if (!dur || dur === "off") return true;
      if (!m.readAt) return true;
      const durMs = getDisappearingMs(dur);
      if (!durMs) return true;
      return now - new Date(m.readAt).getTime() < durMs;
    });
    if (conv?.lastMessage) {
      const exists = messagesMap[cid].some((m) => m.id === conv.lastMessage?.id);
      if (!exists) {
        const remaining = messagesMap[cid];
        if (remaining.length > 0) {
          const newest = remaining[remaining.length - 1];
          conv.lastMessage = {
            id: newest.id,
            text: newest.type === "text" ? newest.text.slice(0, 60) : "\u0AAE\u0AC0\u0AA1\u0ABF\u0AAF\u0ABE",
            senderId: newest.senderId,
            senderName: newest.senderName,
            type: newest.type,
            createdAt: newest.createdAt
          };
        } else {
          conv.lastMessage = null;
        }
      }
    }
  }
}, 1e4);
var initialOtherUid = "user_9825123456";
var initialConvId = `d_${[currentUser.id, initialOtherUid].sort().join("_")}`;
conversationsMap[initialConvId] = {
  id: initialConvId,
  type: "direct",
  memberIds: [currentUser.id, initialOtherUid],
  members: {
    [currentUser.id]: { id: currentUser.id, name: currentUser.name, photo: currentUser.profilePhoto },
    [initialOtherUid]: { id: initialOtherUid, name: "\u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE\u0AAC\u0AC7\u0AA8 \u0A85\u0AAE\u0ABF\u0AA4\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" }
  },
  samajId: DEFAULT_SAMAJ_ID,
  createdBy: currentUser.id,
  createdAt: (/* @__PURE__ */ new Date("2025-01-01T10:00:00Z")).toISOString(),
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  lastMessage: {
    id: "msg_init_2",
    text: "\u0A9C\u0AAF \u0AB6\u0ACD\u0AB0\u0AC0 \u0A95\u0AC3\u0AB7\u0ACD\u0AA3! \u0A86\u0A97\u0ABE\u0AAE\u0AC0 \u0AB8\u0ACD\u0AA8\u0AC7\u0AB9\u0AAE\u0ABF\u0AB2\u0AA8 \u0AAE\u0ABE\u0A9F\u0AC7 \u0A95\u0ACD\u0AAF\u0ABE\u0AB0\u0AC7 \u0AAE\u0AB3\u0AB5\u0AC1\u0A82?",
    senderId: initialOtherUid,
    senderName: "\u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE\u0AAC\u0AC7\u0AA8 \u0A85\u0AAE\u0ABF\u0AA4\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    type: "text",
    createdAt: new Date(Date.now() - 36e5).toISOString()
  },
  unread: { [currentUser.id]: 0, [initialOtherUid]: 0 },
  muted: [],
  typing: {},
  theme: "default",
  disappearingDuration: "off",
  activeCall: null
};
messagesMap[initialConvId] = [
  {
    id: "msg_init_1",
    conversationId: initialConvId,
    senderId: currentUser.id,
    senderName: currentUser.name,
    type: "text",
    text: "\u0AA8\u0AAE\u0AB8\u0ACD\u0AA4\u0AC7 \u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE\u0AAC\u0AC7\u0AA8, \u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0AAE\u0ABF\u0A9F\u0AC0\u0AA8\u0AC0 \u0AAE\u0ABF\u0A9F\u0ABF\u0A82\u0A97 \u0AB5\u0ABF\u0AB6\u0AC7 \u0A85\u0AAA\u0AA1\u0AC7\u0A9F \u0A86\u0AAA\u0AB6\u0ACB?",
    status: "read",
    deliveredTo: [initialOtherUid],
    readBy: [currentUser.id, initialOtherUid],
    deletedFor: [],
    deleted: false,
    createdAt: new Date(Date.now() - 72e5).toISOString()
  },
  {
    id: "msg_init_2",
    conversationId: initialConvId,
    senderId: initialOtherUid,
    senderName: "\u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE\u0AAC\u0AC7\u0AA8 \u0A85\u0AAE\u0ABF\u0AA4\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    type: "text",
    text: "\u0A9C\u0AAF \u0AB6\u0ACD\u0AB0\u0AC0 \u0A95\u0AC3\u0AB7\u0ACD\u0AA3! \u0A86\u0A97\u0ABE\u0AAE\u0AC0 \u0AB8\u0ACD\u0AA8\u0AC7\u0AB9\u0AAE\u0ABF\u0AB2\u0AA8 \u0AAE\u0ABE\u0A9F\u0AC7 \u0A95\u0ACD\u0AAF\u0ABE\u0AB0\u0AC7 \u0AAE\u0AB3\u0AB5\u0AC1\u0A82?",
    status: "read",
    deliveredTo: [currentUser.id],
    readBy: [currentUser.id, initialOtherUid],
    deletedFor: [],
    deleted: false,
    createdAt: new Date(Date.now() - 36e5).toISOString()
  }
];
function getAuthUser(req) {
  return req._authUser || null;
}
function isUserOnboardingCompleted(u) {
  if (!u) return false;
  const isAdmin = ["SUPER_ADMIN", "MAIN_SAMAJ_ADMIN", "SAMAJ_ADMIN"].includes((u.adminRole || "").toUpperCase()) || ["super_admin", "admin", "main_samaj_admin", "samaj_admin"].includes(u.role);
  if (isAdmin) return true;
  if (u.onboardingCompleted === false) return false;
  const hasMain = Boolean(u.mainSamajId && mainSamajList.some((m) => m.id === u.mainSamajId && m.isActive));
  const hasDist = Boolean(u.districtId && districtList.some((d) => d.id === u.districtId && d.isActive));
  const hasTal = Boolean(u.talukaId && talukaList.some((t) => t.id === u.talukaId && t.isActive));
  const vId = u.villageId || u.gamId;
  const hasVil = Boolean(vId && villageList.some((v) => v.id === vId && v.isActive));
  const sId = u.activeSamajId || u.samajId;
  const hasSamaj = Boolean(sId && samajList.some((s) => s.id === sId && s.isActive));
  return Boolean(u.onboardingCompleted === true && hasMain && hasDist && hasTal && hasVil && hasSamaj);
}
function buildNewUser(uid, phone, name) {
  return {
    id: uid,
    phone,
    name: name || `\u0AB8\u0AAD\u0ACD\u0AAF (${phone ? phone.replace(/\D/g, "").slice(-4) : "\u0AA8\u0AB5\u0ABE"})`,
    role: "member",
    adminRole: null,
    profilePhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    village: "",
    district: "",
    bio: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB8\u0AAD\u0ACD\u0AAF",
    samajIds: [],
    samajRoles: {},
    activeSamajId: "",
    followersCount: 0,
    followingCount: 0,
    isSuspended: false,
    blocked: [],
    followers: [],
    following: [],
    verificationStatus: "none",
    rejectionReason: null,
    mainSamajId: "",
    districtId: "",
    talukaId: "",
    villageId: "",
    gamId: "",
    gam: "",
    samajId: "",
    onboardingCompleted: false
  };
}
function resolveMockUser(token) {
  const phoneDigits = token.replace("mock-token-", "").replace(/\D/g, "").slice(-10);
  if (!phoneDigits || phoneDigits === "demo") return currentUser;
  const uid = `user_${phoneDigits}`;
  if (usersMap[uid]) return usersMap[uid];
  for (const u of Object.values(usersMap)) {
    if (u.phone.replace(/\D/g, "").slice(-10) === phoneDigits) return u;
  }
  const isSpecialAdmin = uid === "user_9876543210" || uid === "user_demo_admin" || phoneDigits === "9876543210";
  if (isSpecialAdmin) {
    usersMap[uid] = {
      ...buildNewUser(uid, `+91${phoneDigits}`, "\u0AB0\u0ABE\u0A9C\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2 (Admin)"),
      role: "super_admin",
      adminRole: "SUPER_ADMIN",
      mainSamajId: "main_patidar",
      districtId: "dist_mehsana",
      talukaId: "tal_mehsana_unjha",
      villageId: "vil_unjha",
      gamId: "vil_unjha",
      village: "\u0A8A\u0A82\u0A9D\u0ABE",
      gam: "\u0A8A\u0A82\u0A9D\u0ABE",
      district: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
      activeSamajId: DEFAULT_SAMAJ_ID,
      samajId: DEFAULT_SAMAJ_ID,
      samajIds: [DEFAULT_SAMAJ_ID],
      samajRoles: { [DEFAULT_SAMAJ_ID]: "super_admin" },
      onboardingCompleted: true,
      verificationStatus: "verified"
    };
    return usersMap[uid];
  }
  usersMap[uid] = buildNewUser(uid, `+91${phoneDigits}`, `\u0AB8\u0AAD\u0ACD\u0AAF (${phoneDigits.slice(-4)})`);
  return usersMap[uid];
}
function applyAdminRole(u) {
  if (!u) return u;
  const r = allowlistRole(u.phone);
  u.adminRole = r;
  if (r) {
    u.role = r === "SUPER_ADMIN" ? "super_admin" : r === "MAIN_SAMAJ_ADMIN" ? "main_samaj_admin" : "samaj_admin";
  } else if (["super_admin", "main_samaj_admin", "samaj_admin", "admin"].includes(u.role)) {
    u.role = "member";
  }
  return u;
}
async function resolveAuthUser(req) {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["x-demo-user"]) {
    token = String(req.headers["x-demo-user"]).trim();
  }
  if (!token) return null;
  if (token.startsWith("mock-token-") || token === "demo-token" || token === "admin-token" || token.startsWith("+91") || /^\d{10}$/.test(token)) {
    return applyAdminRole(resolveMockUser(token));
  }
  const payload = await verifyFirebaseIdToken(token);
  if (!payload) return null;
  const uid = String(payload.user_id || payload.sub || "");
  if (!uid) return null;
  const rawPhone = String(payload.phone_number || payload.phone || "");
  const phoneDigits = rawPhone.replace(/\D/g, "").slice(-10);
  const name = payload.name ? String(payload.name) : "";
  let u = usersMap[uid];
  if (!u && phoneDigits) {
    u = Object.values(usersMap).find((x) => x.phone.replace(/\D/g, "").slice(-10) === phoneDigits);
  }
  if (!u) {
    u = buildNewUser(uid, rawPhone || `+91${phoneDigits}`, name);
    usersMap[uid] = u;
  } else {
    if (!usersMap[uid]) {
      usersMap[uid] = u;
    }
    if (name && (!u.name || u.name.startsWith("\u0AB8\u0AAD\u0ACD\u0AAF") || u.name.startsWith("Member"))) {
      u.name = name;
    }
  }
  return applyAdminRole(u);
}
function requireAdmin(req, res, next) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required", message: "\u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AAA\u0AB9\u0AC7\u0AB2\u0ABE \u0AB2\u0ACB\u0A97\u0ABF\u0AA8 \u0A95\u0AB0\u0ACB." });
  }
  const rawRole = (user.adminRole || user.role || "").toUpperCase();
  let normalizedRole = null;
  if (rawRole === "SUPER_ADMIN" || rawRole === "ADMIN") normalizedRole = "SUPER_ADMIN";
  else if (rawRole === "MAIN_SAMAJ_ADMIN") normalizedRole = "MAIN_SAMAJ_ADMIN";
  else if (rawRole === "SAMAJ_ADMIN") normalizedRole = "SAMAJ_ADMIN";
  if (!normalizedRole || user.isSuspended) {
    return res.status(403).json({
      error: "Forbidden",
      message: "\u0AA4\u0AAE\u0AC7 \u0A8F\u0AA1\u0AAE\u0ABF\u0AA8 \u0AAA\u0AC7\u0AA8\u0AB2 \u0AAE\u0ABE\u0A9F\u0AC7 \u0A85\u0AA7\u0ABF\u0A95\u0AC3\u0AA4 \u0AA8\u0AA5\u0AC0. (Access Denied: Admin privileges required)",
      userRole: user.role
    });
  }
  req.adminUser = user;
  req.adminRole = normalizedRole;
  req.adminScope = {
    mainSamajId: user.mainSamajId || null,
    samajId: user.activeSamajId || user.samajIds?.[0] || null
  };
  next();
}
app.use("/api", async (req, _res, next) => {
  try {
    req._authUser = await resolveAuthUser(req);
  } catch {
    req._authUser = null;
  }
  next();
});
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        saveStore(false);
      }
    });
  }
  next();
});
app.post("/api/log-client-error", (req, res) => {
  console.error("[CLIENT ERROR REPORT]", JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});
app.get("/api/auth/config", (req, res) => {
  res.json({
    devAuth: DEV_AUTH_ENABLED,
    publicAccessEnabled: true
  });
});
app.post("/api/auth/dev-login", (req, res) => {
  if (!DEV_AUTH_ENABLED) {
    return res.status(403).json({ error: "Forbidden", message: "Dev login disabled in production." });
  }
  const { phone, name } = req.body;
  const targetPhone = phone || currentUser.phone;
  const phoneDigits = targetPhone.replace(/\D/g, "").slice(-10);
  const uid = `user_${phoneDigits || "demo"}`;
  if (!usersMap[uid]) {
    const isSpecialAdmin = uid === "user_9876543210" || uid === "user_demo_admin" || targetPhone === "+919876543210";
    usersMap[uid] = {
      id: uid,
      phone: targetPhone,
      name: name || (isSpecialAdmin ? "\u0AB0\u0ABE\u0A9C\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2 (Admin)" : `\u0AB8\u0AAD\u0ACD\u0AAF (${targetPhone.slice(-4)})`),
      role: isSpecialAdmin ? "super_admin" : "member",
      adminRole: isSpecialAdmin ? "SUPER_ADMIN" : null,
      profilePhoto: isSpecialAdmin ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      village: isSpecialAdmin ? "\u0A8A\u0A82\u0A9D\u0ABE" : "",
      district: isSpecialAdmin ? "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE" : "",
      bio: isSpecialAdmin ? "\u0AB8\u0AAE\u0ABE\u0A9C \u0A89\u0AA4\u0ACD\u0A95\u0AB0\u0ACD\u0AB7 \u0A85\u0AA8\u0AC7 \u0AB8\u0AC7\u0AB5\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7 \u0AB8\u0AAE\u0AB0\u0ACD\u0AAA\u0ABF\u0AA4." : "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB8\u0AAD\u0ACD\u0AAF",
      samajIds: isSpecialAdmin ? [DEFAULT_SAMAJ_ID] : [],
      samajRoles: isSpecialAdmin ? { [DEFAULT_SAMAJ_ID]: "super_admin" } : {},
      activeSamajId: isSpecialAdmin ? DEFAULT_SAMAJ_ID : "",
      followersCount: 0,
      followingCount: 0,
      isSuspended: false,
      blocked: [],
      followers: [],
      following: [],
      verificationStatus: isSpecialAdmin ? "verified" : "none",
      rejectionReason: null,
      mainSamajId: isSpecialAdmin ? "main_patidar" : "",
      gamId: isSpecialAdmin ? "gam_unjha" : "",
      gam: isSpecialAdmin ? "\u0A8A\u0A82\u0A9D\u0ABE" : "",
      samajId: isSpecialAdmin ? DEFAULT_SAMAJ_ID : "",
      onboardingCompleted: isSpecialAdmin ? true : false
    };
  } else if (name) {
    usersMap[uid].name = name;
  }
  res.json({
    customToken: `mock-token-${phoneDigits}`
  });
});
app.post("/api/auth/admin-login", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", message: "Please sign in with Firebase OTP first." });
  }
  const role = user.adminRole || null;
  if (!role || user.isSuspended) {
    logAdminAction({
      adminUserId: user.id,
      adminName: user.name,
      role: "SAMAJ_ADMIN",
      action: "UNAUTHORIZED_ADMIN_LOGIN_ATTEMPT",
      details: { phone: user.phone, ip: req.ip }
    });
    return res.status(403).json({
      error: "Forbidden",
      message: "Access Denied: not an authorized admin account."
    });
  }
  logAdminAction({
    adminUserId: user.id,
    adminName: user.name,
    role,
    scope: { mainSamajId: user.mainSamajId || null, samajId: user.activeSamajId || user.samajIds?.[0] || null },
    action: "ADMIN_LOGIN_SUCCESS",
    details: { ip: req.ip, authMethod: "firebase_otp" }
  });
  res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      adminRole: role,
      mainSamajId: user.mainSamajId,
      samajId: user.activeSamajId,
      profilePhoto: user.profilePhoto
    }
  });
});
app.get("/api/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  user.onboardingCompleted = isUserOnboardingCompleted(user);
  res.json(user);
});
app.get("/api/main-samaj", (_req, res) => {
  res.json({
    items: mainSamajList.filter((m) => m.isActive)
  });
});
app.get("/api/location/districts", (_req, res) => {
  res.json({ items: districtList.filter((d) => d.isActive) });
});
app.get("/api/location/talukas", (req, res) => {
  const districtId = req.query.districtId || "";
  let list = talukaList.filter((t) => t.isActive);
  if (districtId) {
    list = list.filter((t) => t.districtId === districtId);
  }
  res.json({ items: list });
});
app.get("/api/location/villages", (req, res) => {
  const districtId = req.query.districtId || "";
  const talukaId = req.query.talukaId || "";
  let list = villageList.filter((v) => v.isActive);
  if (districtId) {
    list = list.filter((v) => v.districtId === districtId);
  }
  if (talukaId) {
    list = list.filter((v) => v.talukaId === talukaId);
  }
  res.json({ items: list });
});
app.get("/api/gam", (req, res) => {
  const mainSamajId = req.query.mainSamajId || "";
  const districtId = req.query.districtId || "";
  const talukaId = req.query.talukaId || "";
  let list = villageList.filter((v) => v.isActive).map((v) => {
    const dist = districtList.find((d) => d.id === v.districtId);
    const tal = talukaList.find((t) => t.id === v.talukaId);
    return {
      id: v.id,
      name: v.nameGujarati || v.name,
      nameEn: v.name,
      district: dist?.nameGujarati || dist?.name || "",
      taluka: tal?.nameGujarati || tal?.name || "",
      districtId: v.districtId,
      talukaId: v.talukaId,
      mainSamajId: mainSamajId || "main_patidar",
      isActive: v.isActive,
      createdAt: v.createdAt || (/* @__PURE__ */ new Date("2024-01-01")).toISOString()
    };
  });
  if (districtId) {
    list = list.filter((g) => g.districtId === districtId);
  }
  if (talukaId) {
    list = list.filter((g) => g.talukaId === talukaId);
  }
  res.json({ items: list });
});
app.get("/api/onboarding/status", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  const isComplete = isUserOnboardingCompleted(user);
  let missingStep = null;
  const vId = user.villageId || user.gamId;
  if (!isComplete) {
    if (!user.mainSamajId || !mainSamajList.some((m) => m.id === user.mainSamajId && m.isActive)) {
      missingStep = "main_samaj";
    } else if (!user.districtId || !districtList.some((d) => d.id === user.districtId && d.isActive)) {
      missingStep = "district";
    } else if (!user.talukaId || !talukaList.some((t) => t.id === user.talukaId && t.isActive)) {
      missingStep = "taluka";
    } else if (!vId || !villageList.some((v) => v.id === vId && v.isActive)) {
      missingStep = "gam";
    } else {
      missingStep = "samaj";
    }
  }
  res.json({
    onboardingCompleted: isComplete,
    missingStep,
    mainSamajId: user.mainSamajId || null,
    districtId: user.districtId || null,
    talukaId: user.talukaId || null,
    villageId: vId || null,
    gamId: vId || null,
    gam: user.gam || user.village || null,
    village: user.village || user.gam || null,
    district: user.district || null,
    samajId: user.activeSamajId || user.samajId || null,
    activeSamajId: user.activeSamajId || null,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      mainSamajId: user.mainSamajId || null,
      districtId: user.districtId || null,
      talukaId: user.talukaId || null,
      villageId: vId || null,
      gamId: vId || null,
      gam: user.gam || user.village || null,
      village: user.village || user.gam || null,
      district: user.district || null,
      samajId: user.activeSamajId || null,
      activeSamajId: user.activeSamajId || null,
      onboardingCompleted: isComplete
    }
  });
});
app.post("/api/onboarding/step", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  const { mainSamajId, districtId, talukaId, villageId, gamId, samajId } = req.body;
  const targetVillageId = villageId || gamId;
  if (mainSamajId !== void 0) {
    const mainSamaj = mainSamajList.find((m) => m.id === mainSamajId && m.isActive);
    if (!mainSamaj) {
      return res.status(400).json({ detail: "\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0AB8\u0A82\u0AA6\u0A97\u0AC0 (Invalid Main Samaj)" });
    }
    if (user.mainSamajId !== mainSamajId) {
      user.districtId = "";
      user.district = "";
      user.talukaId = "";
      user.villageId = "";
      user.gamId = "";
      user.gam = "";
      user.village = "";
      user.samajId = "";
      user.activeSamajId = "";
      user.samajIds = [];
      user.samajRoles = {};
      user.onboardingCompleted = false;
    }
    user.mainSamajId = mainSamajId;
  }
  if (districtId !== void 0) {
    if (!user.mainSamajId) {
      return res.status(400).json({ detail: "\u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AAA\u0AB9\u0AC7\u0AB2\u0ABE \u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0ACB (Select Main Samaj first)" });
    }
    const dist = districtList.find((d) => d.id === districtId && d.isActive);
    if (!dist) {
      return res.status(400).json({ detail: "\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0A9C\u0ABF\u0AB2\u0ACD\u0AB2\u0ACB \u0AAA\u0AB8\u0A82\u0AA6\u0A97\u0AC0 (Invalid District)" });
    }
    if (user.districtId !== districtId) {
      user.talukaId = "";
      user.villageId = "";
      user.gamId = "";
      user.gam = "";
      user.village = "";
      user.samajId = "";
      user.activeSamajId = "";
      user.samajIds = [];
      user.samajRoles = {};
      user.onboardingCompleted = false;
    }
    user.districtId = districtId;
    user.district = dist.nameGujarati || dist.name;
  }
  if (talukaId !== void 0) {
    if (!user.mainSamajId || !user.districtId) {
      return res.status(400).json({ detail: "\u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AAA\u0AB9\u0AC7\u0AB2\u0ABE \u0A9C\u0ABF\u0AB2\u0ACD\u0AB2\u0ACB \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0ACB (Select District first)" });
    }
    const taluka = talukaList.find((t) => t.id === talukaId && t.districtId === user.districtId && t.isActive);
    if (!taluka) {
      return res.status(400).json({ detail: "\u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0AC7\u0AB2 \u0AA4\u0ABE\u0AB2\u0AC1\u0A95\u0ACB \u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AA8\u0AA5\u0AC0 (Invalid Taluka for selected District)" });
    }
    if (user.talukaId !== talukaId) {
      user.villageId = "";
      user.gamId = "";
      user.gam = "";
      user.village = "";
      user.samajId = "";
      user.activeSamajId = "";
      user.samajIds = [];
      user.samajRoles = {};
      user.onboardingCompleted = false;
    }
    user.talukaId = talukaId;
  }
  if (targetVillageId !== void 0 || req.body.customVillageName) {
    if (!user.mainSamajId || !user.districtId || !user.talukaId) {
      return res.status(400).json({ detail: "\u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AAA\u0AB9\u0AC7\u0AB2\u0ABE \u0A9C\u0ABF\u0AB2\u0ACD\u0AB2\u0ACB \u0A85\u0AA8\u0AC7 \u0AA4\u0ABE\u0AB2\u0AC1\u0A95\u0ACB \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0ACB (Select District and Taluka first)" });
    }
    const customName = (req.body.customVillageName || "").trim();
    let village = villageList.find((v) => (v.id === targetVillageId || v.name === targetVillageId || v.nameGujarati === targetVillageId) && v.talukaId === user.talukaId && v.isActive);
    if (!village && customName) {
      const newVId = `vil_custom_${Date.now()}`;
      village = {
        id: newVId,
        districtId: user.districtId,
        talukaId: user.talukaId,
        name: customName,
        nameGujarati: customName,
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      villageList.push(village);
      persistMasterData();
    }
    if (!village) {
      return res.status(400).json({ detail: "\u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0AC7\u0AB2 \u0A97\u0ABE\u0AAE \u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AA8\u0AA5\u0AC0 (Invalid Village for selected Taluka)" });
    }
    if (user.villageId !== village.id) {
      user.samajId = "";
      user.activeSamajId = "";
      user.samajIds = [];
      user.samajRoles = {};
      user.onboardingCompleted = false;
    }
    user.villageId = village.id;
    user.gamId = village.id;
    user.gam = village.nameGujarati || village.name;
    user.village = village.nameGujarati || village.name;
  }
  if (samajId !== void 0) {
    const vId2 = user.villageId || user.gamId;
    if (!user.mainSamajId || !user.districtId || !user.talukaId || !vId2) {
      return res.status(400).json({ detail: "\u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AAA\u0AB9\u0AC7\u0AB2\u0ABE \u0A97\u0ABE\u0AAE \u0AB8\u0AC1\u0AA7\u0AC0\u0AA8\u0AC0 \u0AAA\u0AB8\u0A82\u0AA6\u0A97\u0AC0 \u0AAA\u0AC2\u0AB0\u0ACD\u0AA3 \u0A95\u0AB0\u0ACB (Complete prior selections first)" });
    }
    let validSamaj = void 0;
    if (samajId === "auto") {
      validSamaj = samajList.find((s) => s.isActive && s.villageId === vId2 && (!s.mainSamajId || s.mainSamajId === user.mainSamajId)) || samajList.find((s) => s.isActive && s.talukaId === user.talukaId && (!s.mainSamajId || s.mainSamajId === user.mainSamajId)) || samajList.find((s) => s.isActive && s.districtId === user.districtId && (!s.mainSamajId || s.mainSamajId === user.mainSamajId)) || samajList.find((s) => s.isActive && (!s.mainSamajId || s.mainSamajId === user.mainSamajId)) || samajList[0];
    } else {
      validSamaj = samajList.find((s) => s.id === samajId && s.isActive && (!s.mainSamajId || s.mainSamajId === user.mainSamajId)) || samajList.find((s) => s.id === samajId && s.isActive) || samajList.find((s) => s.isActive && (!s.mainSamajId || s.mainSamajId === user.mainSamajId)) || samajList[0];
    }
    if (!validSamaj) {
      return res.status(400).json({ detail: "\u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0AC7\u0AB2 \u0AB8\u0AAE\u0ABE\u0A9C \u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AA8\u0AA5\u0AC0 (Invalid Samaj for this Main Samaj)" });
    }
    user.samajId = validSamaj.id;
    user.activeSamajId = validSamaj.id;
    if (!user.samajIds) user.samajIds = [];
    if (!user.samajIds.includes(validSamaj.id)) {
      user.samajIds.push(validSamaj.id);
    }
    if (!user.samajRoles) user.samajRoles = {};
    user.samajRoles[validSamaj.id] = user.samajRoles[validSamaj.id] || "member";
  }
  const hasMain = Boolean(user.mainSamajId && mainSamajList.some((m) => m.id === user.mainSamajId && m.isActive));
  const hasDist = Boolean(user.districtId && districtList.some((d) => d.id === user.districtId && d.isActive));
  const hasTal = Boolean(user.talukaId && talukaList.some((t) => t.id === user.talukaId && t.isActive));
  const vId = user.villageId || user.gamId;
  const hasVil = Boolean(vId && villageList.some((v) => v.id === vId && v.isActive));
  const hasSamaj = Boolean(user.activeSamajId && samajList.some((s) => s.id === user.activeSamajId && s.isActive));
  if (hasMain && hasDist && hasTal && hasVil && hasSamaj) {
    user.onboardingCompleted = true;
  } else {
    user.onboardingCompleted = false;
  }
  let missingStep = null;
  if (!hasMain) missingStep = "main_samaj";
  else if (!hasDist) missingStep = "district";
  else if (!hasTal) missingStep = "taluka";
  else if (!hasVil) missingStep = "gam";
  else if (!hasSamaj) missingStep = "samaj";
  res.json({
    ok: true,
    user,
    onboardingCompleted: user.onboardingCompleted,
    missingStep
  });
});
function requireCompletedOnboarding(req, res, next) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", detail: "\u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AAA\u0AB9\u0AC7\u0AB2\u0ABE \u0AB2\u0ACB\u0A97\u0ABF\u0AA8 \u0A95\u0AB0\u0ACB." });
  }
  if (!isUserOnboardingCompleted(user)) {
    const vId = user.villageId || user.gamId;
    let missingStep = "main_samaj";
    if (!user.mainSamajId) missingStep = "main_samaj";
    else if (!user.districtId) missingStep = "district";
    else if (!user.talukaId) missingStep = "taluka";
    else if (!vId) missingStep = "gam";
    else missingStep = "samaj";
    return res.status(403).json({
      error: "ONBOARDING_REQUIRED",
      detail: "\u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0AA8\u0AC7\u0A95\u0ACD\u0A9F\u0AA8\u0ABE \u0AAE\u0ACB\u0AA1\u0ACD\u0AAF\u0AC1\u0AB2 \u0AB5\u0ABE\u0AAA\u0AB0\u0AB5\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7 \u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AAA\u0AB9\u0AC7\u0AB2\u0ABE \u0AA4\u0AAE\u0ABE\u0AB0\u0ACB \u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C, \u0A9C\u0ABF\u0AB2\u0ACD\u0AB2\u0ACB, \u0AA4\u0ABE\u0AB2\u0AC1\u0A95\u0ACB, \u0A97\u0ABE\u0AAE \u0A85\u0AA8\u0AC7 \u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0ACB.",
      onboardingCompleted: false,
      missingStep
    });
  }
  next();
}
app.patch("/api/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const allowed = ["name", "profilePhoto", "village", "district", "bio"];
  for (const k of allowed) {
    if (req.body[k] !== void 0) {
      user[k] = req.body[k];
    }
  }
  res.json(user);
});
app.get("/api/verification/status", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json(getVerificationState(user));
});
app.post("/api/verification/submit", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.verificationStatus === "verified") {
    return res.status(400).json({ detail: "\u0AA4\u0AAE\u0ABE\u0AB0\u0AC0 \u0AAA\u0ACD\u0AB0\u0ACB\u0AAB\u0ABE\u0A87\u0AB2 \u0AAA\u0AB9\u0AC7\u0AB2\u0AC7\u0AA5\u0AC0 \u0A9C \u0A9A\u0A95\u0ABE\u0AB8\u0ABE\u0AAF\u0AC7\u0AB2 \u0A9B\u0AC7 (Already verified)", ...getVerificationState(user) });
  }
  if (user.verificationStatus === "pending") {
    return res.status(400).json({ detail: "\u0A9A\u0A95\u0ABE\u0AB8\u0AA3\u0AC0 \u0AAA\u0AB9\u0AC7\u0AB2\u0AC7\u0AA5\u0AC0 \u0A9C \u0AB8\u0AAE\u0AC0\u0A95\u0ACD\u0AB7\u0ABE \u0AB9\u0AC7\u0AA0\u0AB3 \u0A9B\u0AC7 (Already pending review)", ...getVerificationState(user) });
  }
  const { complete, missing } = checkProfileComplete(user);
  if (!complete) {
    return res.status(400).json({
      detail: "\u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0A9C\u0AB0\u0AC2\u0AB0\u0AC0 \u0AAA\u0ACD\u0AB0\u0ACB\u0AAB\u0ABE\u0A87\u0AB2 \u0AAE\u0ABE\u0AB9\u0ABF\u0AA4\u0AC0 \u0AAA\u0AC2\u0AB0\u0ACD\u0AA3 \u0A95\u0AB0\u0ACB (Profile incomplete)",
      missingFields: missing,
      ...getVerificationState(user)
    });
  }
  user.verificationStatus = "pending";
  user.verificationSubmittedAt = (/* @__PURE__ */ new Date()).toISOString();
  user.rejectionReason = null;
  res.json(getVerificationState(user));
});
app.get("/api/samaj", (req, res) => {
  const authUser = getAuthUser(req);
  const mainSamajId = req.query.mainSamajId || "";
  const districtId = req.query.districtId || "";
  const talukaId = req.query.talukaId || "";
  const villageId = req.query.villageId || req.query.gamId || "";
  let activeList = samajList.filter((s) => s.isActive);
  if (mainSamajId) {
    activeList = activeList.filter((s) => !s.mainSamajId || s.mainSamajId === mainSamajId);
  }
  let filtered = activeList;
  if (villageId) {
    const directMatches = activeList.filter(
      (s) => s.villageId === villageId || s.gamIds && s.gamIds.includes(villageId)
    );
    if (directMatches.length > 0) {
      filtered = directMatches;
    } else if (talukaId) {
      const talukaMatches = activeList.filter((s) => s.talukaId === talukaId);
      if (talukaMatches.length > 0) {
        filtered = talukaMatches;
      } else if (districtId) {
        const distMatches = activeList.filter((s) => s.districtId === districtId);
        if (distMatches.length > 0) {
          filtered = distMatches;
        }
      }
    } else if (districtId) {
      const distMatches = activeList.filter((s) => s.districtId === districtId);
      if (distMatches.length > 0) {
        filtered = distMatches;
      }
    }
  } else if (talukaId) {
    const talukaMatches = activeList.filter((s) => s.talukaId === talukaId);
    if (talukaMatches.length > 0) {
      filtered = talukaMatches;
    } else if (districtId) {
      const distMatches = activeList.filter((s) => s.districtId === districtId);
      if (distMatches.length > 0) {
        filtered = distMatches;
      }
    }
  } else if (districtId) {
    const distMatches = activeList.filter((s) => s.districtId === districtId);
    if (distMatches.length > 0) {
      filtered = distMatches;
    }
  }
  if (filtered.length === 0 && activeList.length > 0) {
    filtered = activeList;
  }
  res.json({
    items: filtered,
    allItems: activeList,
    mine: authUser?.samajIds || [],
    active: authUser?.activeSamajId || ""
  });
});
app.post("/api/samaj", (req, res) => {
  const authUser = getAuthUser(req);
  const { name, nameEn, code } = req.body;
  const newSid = `samaj_${Date.now()}`;
  const newSamaj = {
    id: newSid,
    name: name || "\u0AA8\u0AB5\u0ACB \u0AB8\u0AAE\u0ABE\u0A9C",
    nameEn: nameEn || name || "New Samaj",
    code: code || newSid.substring(0, 6).toUpperCase(),
    isActive: true,
    requirePostApproval: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  samajList.push(newSamaj);
  if (authUser) {
    if (!authUser.samajIds) authUser.samajIds = [];
    if (!authUser.samajIds.includes(newSid)) authUser.samajIds.push(newSid);
  }
  res.json(newSamaj);
});
app.post("/api/samaj/:sid/join", (req, res) => {
  const authUser = getAuthUser(req);
  const sid = req.params.sid;
  if (!authUser) return res.status(401).json({ detail: "Not authenticated" });
  if (!authUser.samajIds) authUser.samajIds = [];
  if (!authUser.samajIds.includes(sid)) {
    authUser.samajIds.push(sid);
  }
  authUser.activeSamajId = sid;
  res.json(authUser);
});
app.post("/api/samaj/:sid/activate", (req, res) => {
  const authUser = getAuthUser(req);
  const sid = req.params.sid;
  if (!authUser) return res.status(401).json({ detail: "Not authenticated" });
  if (!(authUser.samajIds || []).includes(sid)) {
    return res.status(403).json({ detail: "Not a member of this Samaj" });
  }
  authUser.activeSamajId = sid;
  res.json(authUser);
});
var samajChangeRequests = [];
app.get("/api/samaj/change-request", (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Not authenticated" });
  const userReqs = samajChangeRequests.filter((r) => r.userId === authUser.id);
  const latest = userReqs.length ? userReqs[userReqs.length - 1] : null;
  res.json({ request: latest });
});
app.post("/api/samaj/change-request", (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Not authenticated" });
  const { requestedSamajId, reason = "" } = req.body;
  if (!requestedSamajId) {
    return res.status(400).json({ detail: "\u0AA8\u0AB5\u0ACB \u0AB8\u0AAE\u0ABE\u0A9C \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0AB5\u0ACB \u0A9C\u0AB0\u0AC2\u0AB0\u0AC0 \u0A9B\u0AC7 (Please select a Samaj)" });
  }
  const targetSamaj = samajList.find((s) => s.id === requestedSamajId);
  if (!targetSamaj) {
    return res.status(404).json({ detail: "\u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0AC7\u0AB2 \u0AB8\u0AAE\u0ABE\u0A9C \u0AAE\u0AB3\u0ACD\u0AAF\u0ACB \u0AA8\u0AA5\u0AC0 (Samaj not found)" });
  }
  if (targetSamaj.id === authUser.activeSamajId) {
    return res.status(400).json({ detail: "\u0AA4\u0AAE\u0AC7 \u0AAA\u0AB9\u0AC7\u0AB2\u0AC7\u0AA5\u0AC0 \u0A86 \u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0AB8\u0A95\u0ACD\u0AB0\u0ABF\u0AAF \u0AB8\u0AAD\u0ACD\u0AAF \u0A9B\u0ACB (Already active in this Samaj)" });
  }
  const existingPending = samajChangeRequests.find(
    (r) => r.userId === authUser.id && r.status === "PENDING"
  );
  if (existingPending) {
    return res.status(400).json({
      detail: "\u0AA4\u0AAE\u0ABE\u0AB0\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C \u0AAC\u0AA6\u0AB2\u0AB5\u0ABE\u0AA8\u0AC0 \u0A8F\u0A95 \u0AB5\u0ABF\u0AA8\u0A82\u0AA4\u0AC0 \u0AAA\u0AB9\u0AC7\u0AB2\u0AC7\u0AA5\u0AC0 \u0AAA\u0AC7\u0AA8\u0ACD\u0AA1\u0ABF\u0A82\u0A97 \u0A9B\u0AC7 (You already have a pending change request)",
      request: existingPending
    });
  }
  const currentSamaj = samajList.find((s) => s.id === authUser.activeSamajId);
  const targetMainSamaj = mainSamajList.find((m) => m.id === targetSamaj.mainSamajId);
  const newRequest = {
    id: `scr_${Date.now()}`,
    userId: authUser.id,
    userName: authUser.name,
    userPhone: authUser.phone,
    currentSamajId: authUser.activeSamajId || DEFAULT_SAMAJ_ID,
    currentSamajName: currentSamaj?.name || "\u0AB5\u0AB0\u0ACD\u0AA4\u0AAE\u0ABE\u0AA8 \u0AB8\u0AAE\u0ABE\u0A9C",
    requestedSamajId: targetSamaj.id,
    requestedSamajName: targetSamaj.name,
    requestedMainSamajId: targetSamaj.mainSamajId || "",
    requestedMainSamajName: targetMainSamaj?.name || "",
    requestedGam: targetSamaj.village || targetSamaj.gam || "",
    status: "PENDING",
    reason: (reason || "").trim(),
    rejectionReason: "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    reviewedAt: null,
    reviewedBy: null
  };
  samajChangeRequests.push(newRequest);
  res.json({
    ok: true,
    request: newRequest,
    message: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AAC\u0AA6\u0AB2\u0AB5\u0ABE\u0AA8\u0AC0 \u0AB5\u0ABF\u0AA8\u0A82\u0AA4\u0AC0 \u0AB8\u0AAB\u0AB3\u0AA4\u0ABE\u0AAA\u0AC2\u0AB0\u0ACD\u0AB5\u0A95 \u0AAE\u0ACB\u0A95\u0AB2\u0ABE\u0A88 \u0A97\u0A88. \u0AB8\u0AAE\u0ABE\u0A9C \u0A8F\u0AA1\u0AAE\u0ABF\u0AA8\u0AA8\u0AC0 \u0AAE\u0A82\u0A9C\u0AC2\u0AB0\u0AC0 \u0AAC\u0ABE\u0AA6 \u0AB8\u0A95\u0ACD\u0AB0\u0ABF\u0AAF \u0AA5\u0AB6\u0AC7."
  });
});
app.get("/api/users/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  const authUser = getAuthUser(req);
  const userPhone = authUser?.phone ? authUser.phone.replace(/\D/g, "").slice(-10) : "";
  const items = Object.values(usersMap).filter((u) => {
    if (!u) return false;
    if (authUser && u.id === authUser.id) return false;
    if (userPhone && u.phone && u.phone.replace(/\D/g, "").slice(-10) === userPhone) return false;
    if (!q) return true;
    return u.name && u.name.toLowerCase().includes(q) || u.phone && u.phone.includes(q) || u.village && u.village.toLowerCase().includes(q) || u.district && u.district.toLowerCase().includes(q);
  });
  res.json({ items });
});
app.post("/api/users/:uid/block", (req, res) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  if (!authUser.blocked) authUser.blocked = [];
  if (!authUser.blocked.includes(targetUid)) {
    authUser.blocked.push(targetUid);
  }
  res.json({ ok: true, blocked: authUser.blocked });
});
app.post("/api/users/:uid/unblock", (req, res) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  if (authUser.blocked) {
    authUser.blocked = authUser.blocked.filter((id) => id !== targetUid);
  }
  res.json({ ok: true, blocked: authUser.blocked || [] });
});
app.get("/api/users/:uid", (req, res) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }
  const isFollowing = followRelationsMap.has(`${authUser.id}_${targetUser.id}`);
  const isBlocked = (authUser.blocked || []).includes(targetUser.id);
  res.json({
    ...targetUser,
    followersCount: targetUser.followers?.length ?? targetUser.followersCount ?? 0,
    followingCount: targetUser.following?.length ?? targetUser.followingCount ?? 0,
    followedByMe: isFollowing,
    blockedByMe: isBlocked,
    isSelf: authUser.id === targetUser.id
  });
});
app.post("/api/users/:uid/follow", (req, res) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }
  if (authUser.id === targetUser.id) {
    res.status(400).json({ detail: "\u0AA4\u0AAE\u0AC7 \u0AA4\u0AAE\u0ABE\u0AB0\u0AC0 \u0A9C\u0ABE\u0AA4\u0AA8\u0AC7 \u0AAB\u0ACB\u0AB2\u0ACB \u0AA8 \u0A95\u0AB0\u0AC0 \u0AB6\u0A95\u0ACB (Cannot follow yourself)" });
    return;
  }
  const key = `${authUser.id}_${targetUser.id}`;
  const isAlreadyFollowing = followRelationsMap.has(key);
  if (isAlreadyFollowing) {
    followRelationsMap.delete(key);
    targetUser.followers = (targetUser.followers || []).filter((id) => id !== authUser.id);
    targetUser.followersCount = targetUser.followers.length;
    authUser.following = (authUser.following || []).filter((id) => id !== targetUser.id);
    authUser.followingCount = authUser.following.length;
    res.json({
      following: false,
      followersCount: targetUser.followersCount,
      followingCount: targetUser.followingCount,
      message: "\u0A85\u0AA8\u0AAB\u0ACB\u0AB2\u0ACB \u0A95\u0AB0\u0AB5\u0ABE\u0AAE\u0ABE\u0A82 \u0A86\u0AB5\u0ACD\u0AAF\u0ABE (Unfollowed)"
    });
  } else {
    followRelationsMap.set(key, {
      id: key,
      followerId: authUser.id,
      followedUserId: targetUser.id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (!targetUser.followers) targetUser.followers = [];
    if (!targetUser.followers.includes(authUser.id)) {
      targetUser.followers.push(authUser.id);
    }
    targetUser.followersCount = targetUser.followers.length;
    if (!authUser.following) authUser.following = [];
    if (!authUser.following.includes(targetUser.id)) {
      authUser.following.push(targetUser.id);
    }
    authUser.followingCount = authUser.following.length;
    res.json({
      following: true,
      followersCount: targetUser.followersCount,
      followingCount: targetUser.followingCount,
      message: "\u0AAB\u0ACB\u0AB2\u0ACB \u0A95\u0AB0\u0AB5\u0ABE\u0AAE\u0ABE\u0A82 \u0A86\u0AB5\u0ACD\u0AAF\u0ABE (Following)"
    });
  }
});
app.post("/api/users/:uid/unfollow", (req, res) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }
  const key = `${authUser.id}_${targetUser.id}`;
  followRelationsMap.delete(key);
  targetUser.followers = (targetUser.followers || []).filter((id) => id !== authUser.id);
  targetUser.followersCount = targetUser.followers.length;
  authUser.following = (authUser.following || []).filter((id) => id !== targetUser.id);
  authUser.followingCount = authUser.following.length;
  res.json({
    following: false,
    followersCount: targetUser.followersCount,
    followingCount: targetUser.followingCount,
    message: "\u0A85\u0AA8\u0AAB\u0ACB\u0AB2\u0ACB \u0A95\u0AB0\u0AB5\u0ABE\u0AAE\u0ABE\u0A82 \u0A86\u0AB5\u0ACD\u0AAF\u0ABE (Unfollowed)"
  });
});
app.get("/api/users/:uid/followers", (req, res) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }
  const followerIds = targetUser.followers || [];
  const items = followerIds.map((id) => resolveUser(id)).filter(Boolean).map((u) => ({
    id: u.id,
    name: u.name,
    profilePhoto: u.profilePhoto,
    village: u.village,
    bio: u.bio,
    followedByMe: followRelationsMap.has(`${authUser.id}_${u.id}`),
    isSelf: u.id === authUser.id
  }));
  res.json({ items });
});
app.get("/api/users/:uid/following", (req, res) => {
  const authUser = getAuthUser(req);
  const targetUid = req.params.uid;
  const targetUser = resolveUser(targetUid);
  if (!targetUser) {
    res.status(404).json({ detail: "User not found" });
    return;
  }
  const followingIds = targetUser.following || [];
  const items = followingIds.map((id) => resolveUser(id)).filter(Boolean).map((u) => ({
    id: u.id,
    name: u.name,
    profilePhoto: u.profilePhoto,
    village: u.village,
    bio: u.bio,
    followedByMe: followRelationsMap.has(`${authUser.id}_${u.id}`),
    isSelf: u.id === authUser.id
  }));
  res.json({ items });
});
function sanitizeConversations() {
  delete conversationsMap["undefined"];
  for (const [cid, conv] of Object.entries(conversationsMap)) {
    if (!cid || cid === "undefined" || !conv) {
      delete conversationsMap[cid];
      continue;
    }
    if (conv.type === "direct" && cid.startsWith("d_")) {
      const afterD = cid.slice(2);
      let id1 = "";
      let id2 = "";
      for (const uid of Object.keys(usersMap)) {
        if (afterD.startsWith(uid + "_")) {
          id1 = uid;
          id2 = afterD.slice(uid.length + 1);
          break;
        }
      }
      if (!id1 || !id2) {
        const parts = afterD.split("_");
        if (parts.length === 4 && parts[0] === "user" && parts[2] === "user") {
          id1 = `user_${parts[1]}`;
          id2 = `user_${parts[3]}`;
        } else if (parts.length === 2) {
          id1 = parts[0];
          id2 = parts[1];
        }
      }
      if (id1 && id2) {
        conv.memberIds = [id1, id2];
        const newMembers = {};
        for (const mid of [id1, id2]) {
          const u = usersMap[mid];
          newMembers[mid] = {
            id: mid,
            name: u?.name || conv.members?.[mid]?.name || (mid.startsWith("user_") ? `+91 ${mid.replace(/^user_/, "")}` : "\u0AB8\u0AAD\u0ACD\u0AAF"),
            photo: u?.profilePhoto || conv.members?.[mid]?.photo || "",
            phone: u?.phone || (mid.startsWith("user_") ? mid.replace(/^user_/, "") : "")
          };
        }
        conv.members = newMembers;
      }
    }
  }
}
function isConvMember(conv, user) {
  if (!user || !conv || conv.id === "undefined") return false;
  const userPhone = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
  if (conv.type === "direct") {
    if (conv.memberIds?.includes(user.id)) return true;
    if (conv.id.startsWith("d_")) {
      const parts = conv.id.replace(/^d_/, "").split("_");
      const matches = parts.some((p) => {
        if (p === user.id) return true;
        if (userPhone && p.includes(userPhone)) return true;
        const uObj = usersMap[p];
        if (uObj?.phone && userPhone && uObj.phone.replace(/\D/g, "").slice(-10) === userPhone) return true;
        return false;
      });
      if (matches) {
        if (!conv.memberIds.includes(user.id)) conv.memberIds.push(user.id);
        return true;
      }
    }
    return false;
  }
  if (conv.memberIds?.includes(user.id)) return true;
  if (conv.createdBy === user.id) return true;
  if (conv.members?.[user.id]) return true;
  if (userPhone && conv.memberIds) {
    for (const mid of conv.memberIds) {
      const memUser = usersMap[mid];
      if (memUser?.phone && memUser.phone.replace(/\D/g, "").slice(-10) === userPhone) {
        if (!conv.memberIds.includes(user.id)) conv.memberIds.push(user.id);
        return true;
      }
    }
  }
  return false;
}
function requireConvMember(cid, user) {
  const activeUser = user || currentUser;
  let conv = conversationsMap[cid];
  if (!conv && cid.startsWith("d_")) {
    const afterD = cid.slice(2);
    let id1 = "";
    let id2 = "";
    for (const uid of Object.keys(usersMap)) {
      if (afterD.startsWith(uid + "_")) {
        id1 = uid;
        id2 = afterD.slice(uid.length + 1);
        break;
      }
    }
    if (!id1 || !id2) {
      const parts = afterD.split("_");
      if (parts.length === 4 && parts[0] === "user" && parts[2] === "user") {
        id1 = `user_${parts[1]}`;
        id2 = `user_${parts[3]}`;
      } else {
        const secondUserIdx = afterD.indexOf("_user_", 4);
        const secondMemIdx = afterD.indexOf("_mem_", 4);
        const splitIdx = secondUserIdx !== -1 ? secondUserIdx : secondMemIdx;
        if (splitIdx !== -1) {
          id1 = afterD.slice(0, splitIdx);
          id2 = afterD.slice(splitIdx + 1);
        } else if (afterD.startsWith(activeUser.id + "_")) {
          id1 = activeUser.id;
          id2 = afterD.slice(activeUser.id.length + 1);
        } else if (afterD.endsWith("_" + activeUser.id)) {
          id1 = afterD.slice(0, -(activeUser.id.length + 1));
          id2 = activeUser.id;
        } else {
          id1 = parts[0] ? parts[0] === "user" && parts[1] ? `user_${parts[1]}` : parts[0] : activeUser.id;
          id2 = parts[2] ? parts[2] === "user" && parts[3] ? `user_${parts[3]}` : parts[2] : "user_other";
        }
      }
    }
    const u1 = usersMap[id1] || (id1 === activeUser.id ? activeUser : null);
    const u2 = usersMap[id2] || (id2 === activeUser.id ? activeUser : null);
    const name1 = u1?.name || (id1 === activeUser.id ? activeUser.name : "\u0AB8\u0AAD\u0ACD\u0AAF");
    const name2 = u2?.name || (id2 === activeUser.id ? activeUser.name : "\u0AB8\u0AAD\u0ACD\u0AAF");
    const photo1 = u1?.profilePhoto || (id1 === activeUser.id ? activeUser.profilePhoto : "");
    const photo2 = u2?.profilePhoto || (id2 === activeUser.id ? activeUser.profilePhoto : "");
    const memberIds = [id1, id2, activeUser.id].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    conv = {
      id: cid,
      type: "direct",
      memberIds,
      members: {
        [id1]: { id: id1, name: name1, photo: photo1 },
        [id2]: { id: id2, name: name2, photo: photo2 },
        [activeUser.id]: { id: activeUser.id, name: activeUser.name, photo: activeUser.profilePhoto }
      },
      samajId: activeUser.activeSamajId || DEFAULT_SAMAJ_ID,
      createdBy: activeUser.id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastMessage: null,
      unread: { [id1]: 0, [id2]: 0, [activeUser.id]: 0 },
      muted: [],
      typing: {},
      theme: "default",
      disappearingDuration: "off",
      activeCall: null
    };
    conversationsMap[cid] = conv;
    if (!messagesMap[cid]) messagesMap[cid] = [];
  }
  if (!conv) {
    conv = {
      id: cid,
      type: cid.startsWith("d_") ? "direct" : "group",
      memberIds: [activeUser.id],
      members: {
        [activeUser.id]: { id: activeUser.id, name: activeUser.name, photo: activeUser.profilePhoto }
      },
      samajId: activeUser.activeSamajId || DEFAULT_SAMAJ_ID,
      createdBy: activeUser.id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastMessage: null,
      unread: { [activeUser.id]: 0 },
      muted: [],
      typing: {},
      theme: "default",
      disappearingDuration: "off",
      activeCall: null
    };
    conversationsMap[cid] = conv;
    if (!messagesMap[cid]) messagesMap[cid] = [];
  }
  isConvMember(conv, activeUser);
  return conv;
}
app.get("/api/conversations", requireCompletedOnboarding, (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  sanitizeConversations();
  const q = (req.query.q || "").toLowerCase().trim();
  let list = Object.values(conversationsMap).filter((c) => isConvMember(c, user));
  if (q) {
    list = list.filter((c) => {
      if (c.type === "group") return (c.name || "").toLowerCase().includes(q);
      const other = Object.entries(c.members || {}).filter(([k]) => k !== user.id).map(([, m]) => m.name || "").join(" ");
      return other.toLowerCase().includes(q);
    });
  }
  list.sort((a, b) => {
    const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
  res.json({ items: list });
});
app.post("/api/conversations/direct", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  let { userId, phone } = req.body;
  const userPhone = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
  if (phone) {
    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ detail: "\u0A95\u0AC3\u0AAA\u0ABE \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AE7\u0AE6 \u0A85\u0A82\u0A95\u0AA8\u0ACB \u0AAE\u0ACB\u0AAC\u0ABE\u0A88\u0AB2 \u0AA8\u0A82\u0AAC\u0AB0 \u0AA6\u0ABE\u0A96\u0AB2 \u0A95\u0AB0\u0ACB" });
    }
    if (userPhone && cleanPhone === userPhone) {
      return res.status(400).json({ detail: "\u0AA4\u0AAE\u0ABE\u0AB0\u0ABE \u0AAA\u0ACB\u0AA4\u0ABE\u0AA8\u0ABE \u0AA8\u0A82\u0AAC\u0AB0 \u0AB8\u0ABE\u0AA5\u0AC7 \u0A9A\u0AC7\u0A9F \u0AB6\u0AB0\u0AC2 \u0AA8 \u0A95\u0AB0\u0AC0 \u0AB6\u0A95\u0ABE\u0AAF" });
    }
    const existing = Object.values(usersMap).find(
      (u) => u?.phone && u.phone.replace(/\D/g, "").slice(-10) === cleanPhone
    );
    if (existing) {
      userId = existing.id;
    } else {
      const newUid = `user_${cleanPhone}`;
      if (!usersMap[newUid]) {
        usersMap[newUid] = {
          id: newUid,
          name: `+91 ${cleanPhone}`,
          phone: cleanPhone,
          role: "member",
          profilePhoto: "",
          samajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
          activeSamajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          blocked: [],
          onboardingCompleted: true
        };
      }
      userId = newUid;
    }
  }
  if (!userId || userId === user.id) {
    return res.status(400).json({ detail: "\u0AAA\u0ACB\u0AA4\u0ABE\u0AA8\u0ABE \u0A96\u0ABE\u0AA4\u0ABE \u0AB8\u0ABE\u0AA5\u0AC7 \u0A9A\u0AC7\u0A9F \u0AB6\u0AB0\u0AC2 \u0AA8 \u0A95\u0AB0\u0AC0 \u0AB6\u0A95\u0ABE\u0AAF" });
  }
  let other = usersMap[userId];
  if (!other) {
    if (userId.startsWith("user_")) {
      const ph = userId.replace("user_", "");
      other = {
        id: userId,
        name: `+91 ${ph}`,
        phone: ph,
        role: "member",
        profilePhoto: "",
        samajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
        activeSamajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        blocked: [],
        onboardingCompleted: true
      };
      usersMap[userId] = other;
    } else {
      return res.status(404).json({ detail: "\u0AB8\u0AAD\u0ACD\u0AAF \u0AAE\u0AB3\u0ACD\u0AAF\u0ABE \u0AA8\u0AA5\u0AC0" });
    }
  }
  if ((user.blocked || []).includes(userId) || (other.blocked || []).includes(user.id)) {
    return res.status(403).json({ detail: "\u0A86 \u0AAF\u0AC1\u0A9D\u0AB0 \u0AAC\u0ACD\u0AB2\u0ACB\u0A95 \u0A95\u0AB0\u0AC7\u0AB2 \u0A9B\u0AC7: \u0A9A\u0AC7\u0A9F \u0AB6\u0AB0\u0AC2 \u0AA5\u0A88 \u0AB6\u0A95\u0AA4\u0AC0 \u0AA8\u0AA5\u0AC0" });
  }
  const key = `d_${[user.id, userId].sort().join("_")}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (!conversationsMap[key]) {
    conversationsMap[key] = {
      id: key,
      type: "direct",
      memberIds: [user.id, userId],
      members: {
        [user.id]: { id: user.id, name: user.name, photo: user.profilePhoto, phone: user.phone || "" },
        [userId]: { id: userId, name: other.name, photo: other.profilePhoto, phone: other.phone || "" }
      },
      samajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
      lastMessage: null,
      unread: { [user.id]: 0, [userId]: 0 },
      muted: [],
      typing: {},
      theme: "default",
      disappearingDuration: "off",
      activeCall: null
    };
    messagesMap[key] = [];
  } else {
    conversationsMap[key].updatedAt = now;
    conversationsMap[key].memberIds = [user.id, userId];
    conversationsMap[key].members = {
      [user.id]: { id: user.id, name: user.name, photo: user.profilePhoto, phone: user.phone || "" },
      [userId]: { id: userId, name: other.name, photo: other.profilePhoto, phone: other.phone || "" }
    };
  }
  saveStore();
  res.json(conversationsMap[key]);
});
app.post("/api/conversations/group", (req, res) => {
  const user = getAuthUser(req);
  const { name, memberIds = [], photo = "" } = req.body;
  const uniqueIds = Array.from(/* @__PURE__ */ new Set([user.id, ...memberIds])).filter((id) => usersMap[id]);
  if (uniqueIds.length < 2) {
    return res.status(400).json({ detail: "Group must have at least 2 members" });
  }
  const cid = `grp_${Date.now()}`;
  const members = {};
  const unread = {};
  uniqueIds.forEach((id) => {
    const u = usersMap[id];
    members[id] = { id, name: u?.name || "Member", photo: u?.profilePhoto || "" };
    unread[id] = 0;
  });
  const newGroup = {
    id: cid,
    type: "group",
    name: (name || "\u0AB8\u0AAE\u0ABE\u0A9C \u0A97\u0ACD\u0AB0\u0AC1\u0AAA").trim(),
    photo,
    memberIds: uniqueIds,
    members,
    admins: [user.id],
    samajId: user.activeSamajId || DEFAULT_SAMAJ_ID,
    createdBy: user.id,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastMessage: null,
    unread,
    muted: [],
    typing: {},
    theme: "default",
    disappearingDuration: "off",
    activeCall: null
  };
  conversationsMap[cid] = newGroup;
  messagesMap[cid] = [];
  res.json(newGroup);
});
app.get("/api/conversations/:cid", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall && conv.activeCall.receiverId === user.id && conv.activeCall.status === "calling") {
      conv.activeCall.status = "ringing";
    }
    let isBlockedByMe = false;
    let isBlockedByOther = false;
    if (conv.type === "direct") {
      const otherId = conv.memberIds.find((id) => id !== user.id);
      if (otherId) {
        isBlockedByMe = (user.blocked || []).includes(otherId);
        const other = usersMap[otherId];
        isBlockedByOther = (other?.blocked || []).includes(user.id);
      }
    }
    res.json({ ...conv, isBlockedByMe, isBlockedByOther });
  } catch (err) {
    const status = err?.status || (err?.message === "NOT_A_MEMBER" ? 403 : err?.message === "CONVERSATION_NOT_FOUND" ? 404 : 500);
    const detail = err?.message === "NOT_A_MEMBER" ? "Not a conversation member" : err?.message === "CONVERSATION_NOT_FOUND" ? "Conversation not found" : err?.message || "Internal server error";
    res.status(status).json({ detail });
  }
});
app.patch("/api/conversations/:cid/theme", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    const { theme } = req.body;
    const allowed = ["default", "indigo", "emerald", "rose", "amber", "slate"];
    if (theme && allowed.includes(theme)) {
      conv.theme = theme;
      conv.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    res.json({ ok: true, theme: conv.theme });
  } catch (err) {
    const status = err?.status || (err?.message === "NOT_A_MEMBER" ? 403 : err?.message === "CONVERSATION_NOT_FOUND" ? 404 : 500);
    const detail = err?.message === "NOT_A_MEMBER" ? "Not a conversation member" : err?.message === "CONVERSATION_NOT_FOUND" ? "Conversation not found" : err?.message || "Failed to update theme";
    res.status(status).json({ detail });
  }
});
app.patch("/api/conversations/:cid/disappearing", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    const { duration } = req.body;
    const allowed = ["off", "1m", "5m", "1h", "1d"];
    if (duration && allowed.includes(duration)) {
      conv.disappearingDuration = duration;
      const durationLabels = {
        off: "\u0AAC\u0A82\u0AA7 (Off)",
        "1m": "1 \u0AAE\u0ABF\u0AA8\u0ABF\u0A9F (1 Minute)",
        "5m": "5 \u0AAE\u0ABF\u0AA8\u0ABF\u0A9F (5 Minutes)",
        "1h": "1 \u0A95\u0AB2\u0ABE\u0A95 (1 Hour)",
        "1d": "1 \u0AA6\u0ABF\u0AB5\u0AB8 (1 Day)"
      };
      const sysMsg = {
        id: `sys_${Date.now()}`,
        conversationId: conv.id,
        senderId: "system",
        senderName: "\u0AB8\u0ABF\u0AB8\u0ACD\u0A9F\u0AAE",
        type: "text",
        text: `\u23F1\uFE0F ${user.name || "\u0AB8\u0AAD\u0ACD\u0AAF"} \u0A8F \u0A85\u0AA6\u0ACD\u0AB0\u0AB6\u0ACD\u0AAF \u0AA5\u0AA4\u0ABE \u0AB8\u0A82\u0AA6\u0AC7\u0AB6\u0ABE \u0AAC\u0AA6\u0AB2\u0ACD\u0AAF\u0ABE: ${durationLabels[duration] || duration}`,
        status: "read",
        deliveredTo: [...conv.memberIds],
        readBy: [...conv.memberIds],
        deletedFor: [],
        deleted: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
      messagesMap[conv.id].push(sysMsg);
      conv.updatedAt = sysMsg.createdAt;
    }
    res.json({ ok: true, disappearingDuration: conv.disappearingDuration });
  } catch (err) {
    const status = err?.status || (err?.message === "NOT_A_MEMBER" ? 403 : err?.message === "CONVERSATION_NOT_FOUND" ? 404 : 500);
    const detail = err?.message === "NOT_A_MEMBER" ? "Not a conversation member" : err?.message === "CONVERSATION_NOT_FOUND" ? "Conversation not found" : err?.message || "Failed to update disappearing messages";
    res.status(status).json({ detail });
  }
});
app.get("/api/conversations/:cid/messages", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    const list = messagesMap[conv.id] || [];
    const visible = list.filter((m) => {
      if (m.deleted) return false;
      if (m.deletedFor && m.deletedFor.includes(user.id)) return false;
      if (isMessageExpired(m, conv)) return false;
      return true;
    });
    res.json({ items: visible });
  } catch (err) {
    const status = err?.status || (err?.message === "NOT_A_MEMBER" ? 403 : err?.message === "CONVERSATION_NOT_FOUND" ? 404 : 500);
    const detail = err?.message === "NOT_A_MEMBER" ? "Not a conversation member" : err?.message === "CONVERSATION_NOT_FOUND" ? "Conversation not found" : err?.message || "Internal server error";
    res.status(status).json({ detail });
  }
});
app.post("/api/conversations/:cid/messages", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Authentication required" });
  }
  try {
    const conv = requireConvMember(req.params.cid, user);
    const {
      type = "text",
      text = "",
      mediaUrl = "",
      fileName = "",
      replyTo = null,
      disappearingDuration
    } = req.body;
    if (conv.type === "direct") {
      const otherId = conv.memberIds.find((id) => id !== user.id);
      if (otherId) {
        const other = usersMap[otherId];
        if ((other?.blocked || []).includes(user.id)) {
          return res.status(403).json({ detail: "\u0A86 \u0AAF\u0AC1\u0A9D\u0AB0\u0AC7 \u0AA4\u0AAE\u0AA8\u0AC7 \u0AAC\u0ACD\u0AB2\u0ACB\u0A95 \u0A95\u0AB0\u0AC7\u0AB2 \u0A9B\u0AC7. \u0AA4\u0AAE\u0AC7 \u0AAE\u0AC7\u0AB8\u0AC7\u0A9C \u0AAE\u0ACB\u0A95\u0AB2\u0AC0 \u0AB6\u0A95\u0AA4\u0ABE \u0AA8\u0AA5\u0AC0." });
        }
        if ((user?.blocked || []).includes(otherId)) {
          return res.status(403).json({ detail: "\u0AA4\u0AAE\u0AC7 \u0A86 \u0AAF\u0AC1\u0A9D\u0AB0\u0AA8\u0AC7 \u0AAC\u0ACD\u0AB2\u0ACB\u0A95 \u0A95\u0AB0\u0AC7\u0AB2 \u0A9B\u0AC7. \u0AAE\u0AC7\u0AB8\u0AC7\u0A9C \u0AAE\u0ACB\u0A95\u0AB2\u0AB5\u0ABE \u0AAA\u0AB9\u0AC7\u0AB2\u0ABE \u0A85\u0AA8\u0AAC\u0ACD\u0AB2\u0ACB\u0A95 \u0A95\u0AB0\u0ACB." });
        }
      }
    }
    if (!text.trim() && !mediaUrl) {
      return res.status(400).json({ detail: "\u0AB8\u0A82\u0AA6\u0AC7\u0AB6 \u0A96\u0ABE\u0AB2\u0AC0 \u0AA8 \u0AB9\u0ACB\u0A88 \u0AB6\u0A95\u0AC7" });
    }
    const effectiveDur = disappearingDuration && disappearingDuration !== "off" ? disappearingDuration : conv.disappearingDuration || "off";
    if (disappearingDuration && disappearingDuration !== "off" && conv.disappearingDuration !== disappearingDuration) {
      conv.disappearingDuration = disappearingDuration;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: conv.id,
      senderId: user.id,
      senderName: user.name,
      type,
      text: text.trim(),
      mediaUrl,
      fileName,
      replyTo,
      status: "sent",
      deliveredTo: [],
      readBy: [user.id],
      deletedFor: [],
      deleted: false,
      disappearingDuration: effectiveDur,
      createdAt: now
    };
    if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
    messagesMap[conv.id].push(newMsg);
    if (conv.type === "direct") {
      const otherId = conv.memberIds.find((id) => id !== user.id);
      if (otherId === "user_9825123456" || otherId === "other") {
        setTimeout(() => {
          if (newMsg && !newMsg.readAt) {
            const readTime = (/* @__PURE__ */ new Date()).toISOString();
            newMsg.status = "read";
            if (!newMsg.readBy.includes(otherId)) newMsg.readBy.push(otherId);
            if (!newMsg.deliveredTo.includes(otherId)) newMsg.deliveredTo.push(otherId);
            const dur = newMsg.disappearingDuration || conv.disappearingDuration;
            if (dur && dur !== "off") {
              newMsg.readAt = readTime;
            }
          }
        }, 1200);
      }
    }
    const preview = type === "text" ? text.slice(0, 60) : type === "image" ? "\u{1F4F7} \u0AAB\u0ACB\u0A9F\u0ACB" : type === "video" ? "\u{1F3A5} \u0AB5\u0ABF\u0AA1\u0ABF\u0A93" : type === "voice" ? "\u{1F3A4} \u0A85\u0AB5\u0ABE\u0A9C" : "\u{1F4C4} \u0AA1\u0ACB\u0A95\u0ACD\u0AAF\u0AC1\u0AAE\u0AC7\u0AA8\u0ACD\u0A9F";
    conv.lastMessage = {
      id: newMsg.id,
      text: preview,
      senderId: user.id,
      senderName: user.name,
      type,
      createdAt: now
    };
    conv.updatedAt = now;
    if (conv.typing) conv.typing[user.id] = false;
    conv.memberIds.forEach((id) => {
      if (id !== user.id) {
        conv.unread[id] = (conv.unread[id] || 0) + 1;
        notificationsList.unshift({
          id: `notif_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: "message",
          title: `\u{1F4AC} \u0AA8\u0AB5\u0ACB \u0AAE\u0AC7\u0AB8\u0AC7\u0A9C: ${user.name || "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB8\u0AAD\u0ACD\u0AAF"}`,
          body: preview || "\u0AA8\u0AB5\u0ACB \u0AB8\u0A82\u0AA6\u0AC7\u0AB6 \u0AAE\u0AB3\u0ACD\u0AAF\u0ACB \u0A9B\u0AC7",
          link: `/messages/${conv.id}`,
          read: false,
          createdAt: now,
          userId: id,
          authorId: user.id,
          authorName: user.name,
          authorPhoto: user.profilePhoto,
          conversationId: conv.id
        });
      }
    });
    res.json(newMsg);
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});
app.patch("/api/conversations/:cid/messages/:mid", (req, res) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const msgs = messagesMap[conv.id] || [];
    const msg = msgs.find((m) => m.id === req.params.mid);
    if (!msg) {
      return res.status(404).json({ detail: "Message not found" });
    }
    if (msg.senderId !== user.id) {
      return res.status(403).json({ detail: "\u0AAB\u0A95\u0ACD\u0AA4 \u0AAE\u0ACB\u0A95\u0AB2\u0AA8\u0ABE\u0AB0 \u0A9C \u0AAE\u0AC7\u0AB8\u0AC7\u0A9C \u0AB8\u0AC1\u0AA7\u0ABE\u0AB0\u0AC0 \u0AB6\u0A95\u0AC7 \u0A9B\u0AC7" });
    }
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ detail: "Text cannot be empty" });
    }
    msg.text = text.trim();
    msg.edited = true;
    msg.editedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (conv.lastMessage && conv.lastMessage.id === msg.id) {
      conv.lastMessage.text = msg.text.slice(0, 60);
    }
    res.json({ ok: true, message: msg });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});
app.delete("/api/conversations/:cid/messages/:mid", (req, res) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const msgs = messagesMap[conv.id] || [];
    const msg = msgs.find((m) => m.id === req.params.mid);
    if (!msg) {
      return res.status(404).json({ detail: "Message not found" });
    }
    const forEveryone = req.query.forEveryone === "true" || req.query.forEveryone === true;
    if (forEveryone) {
      msg.deleted = true;
      msg.text = "";
      msg.mediaUrl = "";
      if (conv.lastMessage && conv.lastMessage.id === msg.id) {
        conv.lastMessage.text = "\u{1F6AB} \u0A86 \u0AAE\u0AC7\u0AB8\u0AC7\u0A9C \u0AA1\u0ABF\u0AB2\u0AC0\u0A9F \u0AA5\u0AAF\u0ACB \u0A9B\u0AC7";
      }
    } else {
      if (!msg.deletedFor.includes(user.id)) {
        msg.deletedFor.push(user.id);
      }
    }
    res.json({ ok: true });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});
app.post("/api/conversations/:cid/read", (req, res) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    conv.unread[user.id] = 0;
    const msgs = messagesMap[conv.id] || [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    msgs.forEach((m) => {
      if (m.senderId !== user.id) {
        if (!m.readBy.includes(user.id)) {
          m.readBy.push(user.id);
        }
        if (!m.deliveredTo.includes(user.id)) {
          m.deliveredTo.push(user.id);
        }
        m.status = "read";
        const dur = m.disappearingDuration || conv.disappearingDuration;
        if (!m.readAt && dur && dur !== "off") {
          m.readAt = now;
        }
      }
    });
    res.json({ ok: true });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});
app.post("/api/conversations/:cid/delivered", (req, res) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const msgs = messagesMap[conv.id] || [];
    msgs.forEach((m) => {
      if (m.senderId !== user.id && !m.deliveredTo.includes(user.id)) {
        m.deliveredTo.push(user.id);
        if (m.status === "sent") m.status = "delivered";
      }
    });
    res.json({ ok: true });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});
app.post("/api/conversations/:cid/typing", (req, res) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.typing) conv.typing = {};
    conv.typing[user.id] = !!req.body.typing;
    res.json({ ok: true });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});
app.post("/api/conversations/:cid/mute", (req, res) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    const isMuted = conv.muted.includes(user.id);
    conv.muted = isMuted ? conv.muted.filter((id) => id !== user.id) : [...conv.muted, user.id];
    res.json({ muted: !isMuted });
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});
app.post("/api/conversations/:cid/members", (req, res) => {
  const user = getAuthUser(req);
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.type !== "group") {
      return res.status(400).json({ detail: "Only groups can add members" });
    }
    const { memberIds = [] } = req.body;
    memberIds.forEach((id) => {
      if (!conv.memberIds.includes(id) && usersMap[id]) {
        conv.memberIds.push(id);
        const u = usersMap[id];
        conv.members[id] = { id, name: u.name, photo: u.profilePhoto };
        conv.unread[id] = 0;
      }
    });
    conv.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    res.json(conv);
  } catch {
    res.status(403).json({ detail: "Not a conversation member" });
  }
});
app.get("/api/call/ice-servers", (_req, res) => {
  const iceServers = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] }
  ];
  const turnUrl = process.env.TURN_SERVER_URL;
  if (turnUrl) {
    const turnConfig = { urls: turnUrl.split(",").map((s) => s.trim()) };
    if (process.env.TURN_USERNAME) turnConfig.username = process.env.TURN_USERNAME;
    if (process.env.TURN_CREDENTIAL) turnConfig.credential = process.env.TURN_CREDENTIAL;
    iceServers.push(turnConfig);
  }
  res.json({ iceServers });
});
app.post("/api/conversations/:cid/call/start", (req, res) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    const { callType = "voice" } = req.body;
    const userDigits = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
    const isMe = (idStr) => {
      if (!idStr) return false;
      if (idStr === user.id) return true;
      if (userDigits && (idStr === `user_${userDigits}` || idStr.includes(userDigits))) return true;
      const u = usersMap[idStr];
      if (u?.phone && userDigits && u.phone.replace(/\D/g, "").slice(-10) === userDigits) return true;
      return false;
    };
    if (conv.type === "direct") {
      const otherId2 = conv.memberIds.find((id) => !isMe(id));
      if (otherId2) {
        const other = usersMap[otherId2];
        if ((other?.blocked || []).includes(user.id)) {
          return res.status(403).json({ detail: "Cannot call: You have been blocked by this user" });
        }
        if ((user.blocked || []).includes(otherId2)) {
          return res.status(400).json({ detail: "Cannot call: You have blocked this user. Please unblock first." });
        }
      }
    }
    let otherId = conv.memberIds.find((id) => !isMe(id));
    if (!otherId && conv.type === "direct") {
      const afterD = req.params.cid.replace(/^d_/, "");
      const parts = afterD.split("_");
      for (let i = 0; i < parts.length; i++) {
        const candidate = parts[i] === "user" && parts[i + 1] ? `user_${parts[i + 1]}` : parts[i];
        if (!isMe(candidate)) {
          otherId = candidate;
          break;
        }
      }
      if (!otherId) otherId = "user_other";
    }
    conv.activeCall = {
      callId: `call_${Date.now()}`,
      callType: callType === "video" ? "video" : "voice",
      callerId: user.id,
      callerName: user.name,
      receiverId: otherId,
      status: "calling",
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      signals: []
    };
    res.json({ ok: true, call: conv.activeCall });
  } catch (err) {
    res.status(400).json({ detail: err?.message || "\u0A95\u0AC9\u0AB2 \u0AB6\u0AB0\u0AC2 \u0AA5\u0A88 \u0AB6\u0A95\u0ACD\u0AAF\u0ACB \u0AA8\u0AB9\u0AC0\u0A82" });
  }
});
app.get("/api/conversations/:cid/call", (req, res) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall) {
      if (conv.activeCall.receiverId === user.id && conv.activeCall.status === "calling") {
        conv.activeCall.status = "ringing";
      }
    }
    res.json({ call: conv.activeCall || null });
  } catch {
    res.json({ call: null });
  }
});
app.post("/api/conversations/:cid/call/ring", (req, res) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall && conv.activeCall.receiverId === user.id) {
      conv.activeCall.status = "ringing";
    }
    res.json({ ok: true, call: conv.activeCall || null });
  } catch {
    res.json({ ok: true, call: null });
  }
});
app.post("/api/conversations/:cid/call/answer", (req, res) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall) {
      return res.status(404).json({ detail: "No active call found" });
    }
    conv.activeCall.status = "active";
    conv.activeCall.answeredAt = (/* @__PURE__ */ new Date()).toISOString();
    res.json({ ok: true, call: conv.activeCall });
  } catch (err) {
    res.status(400).json({ detail: err?.message || "\u0A95\u0AC9\u0AB2 \u0A95\u0AA8\u0AC7\u0A95\u0ACD\u0A9F \u0AA5\u0A88 \u0AB6\u0A95\u0ACD\u0AAF\u0ACB \u0AA8\u0AB9\u0AC0\u0A82" });
  }
});
app.post("/api/conversations/:cid/call/reject", (req, res) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall) {
      const call = conv.activeCall;
      call.status = "rejected";
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const callMsg = {
        id: `call_${Date.now()}`,
        conversationId: conv.id,
        senderId: call.callerId,
        senderName: call.callerName,
        type: "call",
        text: call.callType === "video" ? "\u{1F4F9} \u0AB5\u0ABF\u0AA1\u0ABF\u0A93 \u0A95\u0AC9\u0AB2 \u0A85\u0AB8\u0ACD\u0AB5\u0AC0\u0A95\u0ABE\u0AB0 \u0A95\u0AB0\u0ACD\u0AAF\u0ACB" : "\u{1F4DE} \u0AB5\u0AC9\u0A87\u0AB8 \u0A95\u0AC9\u0AB2 \u0A85\u0AB8\u0ACD\u0AB5\u0AC0\u0A95\u0ABE\u0AB0 \u0A95\u0AB0\u0ACD\u0AAF\u0ACB",
        status: "read",
        deliveredTo: conv.memberIds,
        readBy: conv.memberIds,
        deletedFor: [],
        deleted: false,
        callInfo: {
          callType: call.callType,
          status: "rejected",
          durationSec: 0
        },
        createdAt: now
      };
      if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
      messagesMap[conv.id].push(callMsg);
      conv.lastMessage = {
        id: callMsg.id,
        text: callMsg.text,
        senderId: call.callerId,
        senderName: call.callerName,
        type: "call",
        createdAt: now
      };
      conv.updatedAt = now;
      conv.activeCall = null;
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});
app.post("/api/conversations/:cid/call/end", (req, res) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (conv.activeCall) {
      const call = conv.activeCall;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const wasAnswered = call.status === "active" || !!call.answeredAt;
      let durationSec = req.body.durationSec || 0;
      if (wasAnswered && !durationSec && call.answeredAt) {
        durationSec = Math.max(1, Math.floor((Date.now() - new Date(call.answeredAt).getTime()) / 1e3));
      }
      const durText = durationSec > 0 ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}` : "0:00";
      const callStatus = wasAnswered ? "ended" : "missed";
      const callText = wasAnswered ? `${call.callType === "video" ? "\u{1F4F9} \u0AB5\u0ABF\u0AA1\u0ABF\u0A93 \u0A95\u0AC9\u0AB2" : "\u{1F4DE} \u0AB5\u0AC9\u0A87\u0AB8 \u0A95\u0AC9\u0AB2"} \u0AAA\u0AC2\u0AB0\u0ACD\u0AA3 \u0AA5\u0AAF\u0ACB (${durText})` : call.callType === "video" ? "\u{1F4F9} \u0AAE\u0ABF\u0AB8\u0ACD\u0AA1 \u0AB5\u0ABF\u0AA1\u0ABF\u0A93 \u0A95\u0AC9\u0AB2" : "\u{1F4DE} \u0AAE\u0ABF\u0AB8\u0ACD\u0AA1 \u0AB5\u0AC9\u0A87\u0AB8 \u0A95\u0AC9\u0AB2";
      const callMsg = {
        id: `call_${Date.now()}`,
        conversationId: conv.id,
        senderId: call.callerId,
        senderName: call.callerName,
        type: "call",
        text: callText,
        status: "read",
        deliveredTo: conv.memberIds,
        readBy: conv.memberIds,
        deletedFor: [],
        deleted: false,
        callInfo: {
          callType: call.callType,
          status: callStatus,
          durationSec: wasAnswered ? durationSec : 0
        },
        createdAt: now
      };
      if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
      messagesMap[conv.id].push(callMsg);
      conv.lastMessage = {
        id: callMsg.id,
        text: callMsg.text,
        senderId: call.callerId,
        senderName: call.callerName,
        type: "call",
        createdAt: now
      };
      conv.updatedAt = now;
      conv.activeCall = null;
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});
app.post("/api/conversations/:cid/call/signal", (req, res) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall) {
      return res.status(404).json({ detail: "No active call" });
    }
    const { to, signal, type, candidate, sdp } = req.body;
    const recipientId = to || (conv.activeCall.callerId === user.id ? conv.activeCall.receiverId : conv.activeCall.callerId);
    if (!conv.activeCall.signals) conv.activeCall.signals = [];
    const signalData = signal || (type ? { type, candidate, sdp } : req.body);
    const newSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      from: user.id,
      to: recipientId,
      signal: signalData,
      type: signalData.type || type || "unknown",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      timestamp: Date.now()
    };
    conv.activeCall.signals.push(newSignal);
    if (conv.activeCall.signals.length > 100) {
      conv.activeCall.signals = conv.activeCall.signals.slice(-100);
    }
    res.json({ ok: true, id: newSignal.id });
  } catch (err) {
    res.status(400).json({ detail: err?.message || "\u0AB8\u0ABF\u0A97\u0ACD\u0AA8\u0AB2 \u0AAE\u0ACB\u0A95\u0AB2\u0AC0 \u0AB6\u0A95\u0ABE\u0AAF\u0AC1\u0A82 \u0AA8\u0AB9\u0AC0\u0A82" });
  }
});
app.get("/api/conversations/:cid/call/signals", (req, res) => {
  const user = getAuthUser(req) || currentUser;
  try {
    const conv = requireConvMember(req.params.cid, user);
    if (!conv.activeCall || !conv.activeCall.signals) {
      return res.json({ signals: [] });
    }
    const since = req.query.since ? Number(req.query.since) : 0;
    const userPhone = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
    const isForMe = (s) => {
      if (!s.to) return true;
      if (s.to === user.id) return true;
      if (userPhone && (s.to === `user_${userPhone}` || s.to.includes(userPhone))) return true;
      if (conv.activeCall?.callerId === user.id && s.to === "caller") return true;
      if (conv.activeCall?.receiverId === user.id && s.to === "receiver") return true;
      return false;
    };
    const mySignals = conv.activeCall.signals.filter(
      (s) => isForMe(s) && (!since || s.timestamp && s.timestamp > since)
    );
    res.json({ signals: mySignals });
  } catch {
    res.json({ signals: [] });
  }
});
app.get("/api/calls/my-active-call", (req, res) => {
  const user = getAuthUser(req) || currentUser;
  if (!user) return res.json({ call: null });
  const userDigits = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
  const isUserMatch = (targetId) => {
    if (!targetId) return false;
    if (targetId === user.id) return true;
    if (userDigits && (targetId === `user_${userDigits}` || targetId.includes(userDigits))) return true;
    const targetUser = usersMap[targetId];
    if (targetUser?.phone && userDigits && targetUser.phone.replace(/\D/g, "").slice(-10) === userDigits) return true;
    return false;
  };
  for (const conv of Object.values(conversationsMap)) {
    if (conv.activeCall) {
      const call = conv.activeCall;
      if ((isUserMatch(call.receiverId) || isUserMatch(call.callerId)) && call.status !== "ended" && call.status !== "rejected") {
        const otherId = isUserMatch(call.callerId) ? call.receiverId : call.callerId;
        const otherUser = otherId ? usersMap[otherId] : null;
        return res.json({
          call,
          conversationId: conv.id,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            photo: otherUser.profilePhoto || otherUser.avatar,
            phone: otherUser.phone
          } : { id: otherId, name: call.callerName || "\u0AB8\u0AAD\u0ACD\u0AAF" }
        });
      }
    }
  }
  res.json({ call: null });
});
var familyTreeList = [
  {
    id: "fam_1",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "\u0AB8\u0ACD\u0AB5. \u0AAA\u0AB0\u0AB7\u0ACB\u0AA4\u0ACD\u0AA4\u0AAE\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    relation: "grandfather",
    relationLabel: "\u0AA6\u0ABE\u0AA6\u0ABE (Grandfather)",
    generation: -2,
    gender: "male",
    isLate: true,
    age: 82,
    village: "\u0A89\u0A82\u0A9D\u0ABE",
    occupation: "\u0A96\u0AC7\u0AA4\u0AC0 & \u0AB5\u0AC7\u0AAA\u0ABE\u0AB0",
    education: "\u0AAE\u0AC7\u0A9F\u0ACD\u0AB0\u0ABF\u0A95",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    notes: "\u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0A86\u0A9C\u0AC0\u0AB5\u0AA8 \u0AB8\u0AC7\u0AB5\u0A95 \u0A85\u0AA8\u0AC7 \u0AAA\u0AB0\u0ABF\u0AB5\u0ABE\u0AB0\u0AA8\u0ABE \u0A86\u0AA7\u0ABE\u0AB0\u0AB8\u0ACD\u0AA4\u0A82\u0AAD",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "fam_2",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "\u0AB8\u0ACD\u0AB5. \u0AAE\u0AA3\u0ABF\u0AAC\u0AC7\u0AA8 \u0AAA\u0A9F\u0AC7\u0AB2",
    relation: "grandmother",
    relationLabel: "\u0AA6\u0ABE\u0AA6\u0AC0 (Grandmother)",
    generation: -2,
    gender: "female",
    isLate: true,
    age: 78,
    village: "\u0A89\u0A82\u0A9D\u0ABE",
    occupation: "\u0A97\u0AC3\u0AB9\u0AA3\u0AC0",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "fam_3",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "\u0AB0\u0AAE\u0AA3\u0ABF\u0A95\u0AAD\u0ABE\u0A88 \u0AAA\u0AB0\u0AB7\u0ACB\u0AA4\u0ACD\u0AA4\u0AAE\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    relation: "father",
    relationLabel: "\u0AAA\u0ABF\u0AA4\u0ABE (Father)",
    generation: -1,
    gender: "male",
    isLate: false,
    age: 58,
    village: "\u0A89\u0A82\u0A9D\u0ABE",
    currentCity: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    phone: "9825012345",
    occupation: "\u0A9F\u0AC7\u0A95\u0ACD\u0AB8\u0A9F\u0ABE\u0A87\u0AB2 \u0AAC\u0ABF\u0A9D\u0AA8\u0AC7\u0AB8",
    education: "B.Com",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "fam_4",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "\u0A97\u0AC0\u0AA4\u0ABE\u0AAC\u0AC7\u0AA8 \u0AB0\u0AAE\u0AA3\u0ABF\u0A95\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    relation: "mother",
    relationLabel: "\u0AAE\u0ABE\u0AA4\u0ABE (Mother)",
    generation: -1,
    gender: "female",
    isLate: false,
    age: 54,
    village: "\u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE",
    currentCity: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    phone: "9825012346",
    occupation: "\u0A97\u0AC3\u0AB9\u0AA3\u0AC0 & \u0AB8\u0ABE\u0AAE\u0ABE\u0A9C\u0ABF\u0A95 \u0A95\u0ABE\u0AB0\u0ACD\u0AAF\u0A95\u0AB0",
    education: "B.A.",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "fam_5",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "\u0AAD\u0ABE\u0AB5\u0ABF\u0AA8\u0AAD\u0ABE\u0A88 \u0AB0\u0AAE\u0AA3\u0ABF\u0A95\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    relation: "self",
    relationLabel: "\u0AB8\u0ACD\u0AB5\u0AAF\u0A82 (Self)",
    generation: 0,
    gender: "male",
    isLate: false,
    age: 32,
    village: "\u0A89\u0A82\u0A9D\u0ABE",
    currentCity: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    phone: "9876543210",
    occupation: "\u0AB8\u0ACB\u0AAB\u0ACD\u0A9F\u0AB5\u0AC7\u0AB0 \u0A8F\u0AA8\u0ACD\u0A9C\u0ABF\u0AA8\u0ABF\u0AAF\u0AB0",
    education: "B.Tech IT",
    photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "fam_6",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "\u0AAA\u0AC2\u0A9C\u0ABE\u0AAC\u0AC7\u0AA8 \u0AAD\u0ABE\u0AB5\u0ABF\u0AA8\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    relation: "spouse",
    relationLabel: "\u0AA7\u0AB0\u0ACD\u0AAE\u0AAA\u0AA4\u0ACD\u0AA8\u0AC0 (Spouse)",
    generation: 0,
    gender: "female",
    isLate: false,
    age: 29,
    village: "\u0A95\u0AA1\u0AC0",
    currentCity: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    phone: "9876543211",
    occupation: "\u0AAC\u0AC7\u0A82\u0A95 \u0A93\u0AAB\u0ABF\u0AB8\u0AB0",
    education: "M.Com, MBA",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "fam_7",
    userId: "user_dev_default",
    samajId: DEFAULT_SAMAJ_ID,
    name: "\u0A86\u0AB0\u0AB5 \u0AAD\u0ABE\u0AB5\u0ABF\u0AA8\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    relation: "son",
    relationLabel: "\u0AAA\u0AC1\u0AA4\u0ACD\u0AB0 (Son)",
    generation: 1,
    gender: "male",
    isLate: false,
    age: 4,
    village: "\u0A89\u0A82\u0A9D\u0ABE",
    currentCity: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    education: "\u0A9C\u0AC1\u0AA8\u0ABF\u0AAF\u0AB0 \u0A95\u0AC7.\u0A9C\u0AC0.",
    photo: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=150&auto=format&fit=crop&q=80",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
app.get("/api/family-tree", requireCompletedOnboarding, (req, res) => {
  const user = getAuthUser(req);
  const userList = familyTreeList.filter(
    (m) => m.userId === (user?.id || "user_dev_default") || m.userId === "user_dev_default"
  );
  res.json({ members: userList });
});
app.post("/api/family-tree", (req, res) => {
  const user = getAuthUser(req);
  const body = req.body;
  if (!body.name) {
    return res.status(400).json({ error: "\u0AA8\u0ABE\u0AAE \u0A9C\u0AB0\u0AC2\u0AB0\u0AC0 \u0A9B\u0AC7" });
  }
  const newMember = {
    id: `fam_${Date.now()}`,
    userId: user?.id || "user_dev_default",
    samajId: user?.activeSamajId || DEFAULT_SAMAJ_ID,
    name: body.name,
    relation: body.relation || "other",
    relationLabel: body.relationLabel || body.relation || "\u0AB8\u0AAD\u0ACD\u0AAF",
    generation: typeof body.generation === "number" ? body.generation : 0,
    gender: body.gender === "female" ? "female" : "male",
    isLate: !!body.isLate,
    age: body.age ? Number(body.age) : void 0,
    dob: body.dob || "",
    phone: body.phone || "",
    village: body.village || "",
    currentCity: body.currentCity || "",
    occupation: body.occupation || "",
    education: body.education || "",
    photo: body.photo || "",
    notes: body.notes || "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  familyTreeList.push(newMember);
  res.json({ ok: true, member: newMember });
});
app.put("/api/family-tree/:id", (req, res) => {
  const idx = familyTreeList.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "\u0AB8\u0AAD\u0ACD\u0AAF \u0AAE\u0AB3\u0ACD\u0AAF\u0ACB \u0AA8\u0AA5\u0AC0" });
  }
  familyTreeList[idx] = {
    ...familyTreeList[idx],
    ...req.body
  };
  res.json({ ok: true, member: familyTreeList[idx] });
});
app.delete("/api/family-tree/:id", (req, res) => {
  familyTreeList = familyTreeList.filter((m) => m.id !== req.params.id);
  res.json({ ok: true });
});
var maranNodhList = [
  {
    id: "mn_1",
    samajId: DEFAULT_SAMAJ_ID,
    deceasedName: "\u0AB8\u0ACD\u0AB5. \u0A95\u0ABE\u0A82\u0AA4\u0ABF\u0AB2\u0ABE\u0AB2 \u0A85\u0AAE\u0AC3\u0AA4\u0AB2\u0ABE\u0AB2 \u0AAA\u0A9F\u0AC7\u0AB2",
    age: 79,
    gender: "male",
    village: "\u0A89\u0A82\u0A9D\u0ABE (\u0A9C\u0ABF. \u0AAE\u0AB9\u0AC7\u0AB8\u0ABE\u0AA3\u0ABE)",
    currentCity: "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    passedDate: "\u0AE7\u0AE6 \u0AB8\u0AAA\u0ACD\u0A9F\u0AC7\u0AAE\u0ACD\u0AAC\u0AB0 \u0AE8\u0AE6\u0AE8\u0AEC",
    besnuDate: "\u0AE7\u0AE9 \u0AB8\u0AAA\u0ACD\u0A9F\u0AC7\u0AAE\u0ACD\u0AAC\u0AB0 \u0AE8\u0AE6\u0AE8\u0AEC, \u0AB0\u0AB5\u0ABF\u0AB5\u0ABE\u0AB0",
    besnuTime: "\u0AB8\u0AB5\u0ABE\u0AB0\u0AC7 \u0AEE:\u0AE9\u0AE6 \u0AA5\u0AC0 \u0AE7\u0AE7:\u0AE6\u0AE6 \u0AB5\u0ABE\u0A97\u0ACD\u0AAF\u0ABE \u0AB8\u0AC1\u0AA7\u0AC0",
    besnuVenue: "\u0AB6\u0ACD\u0AB0\u0AC0 \u0A89\u0AAE\u0ABF\u0AAF\u0ABE \u0AAE\u0ABE\u0AA4\u0ABE\u0A9C\u0AC0 \u0AAA\u0ABE\u0A9F\u0AC0\u0AA6\u0ABE\u0AB0 \u0AB5\u0ABE\u0AA1\u0AC0, \u0AA8\u0ABE\u0AB0\u0AA3\u0AAA\u0AC1\u0AB0\u0ABE, \u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    grievingFamily: "\u0AB8\u0AC1\u0AAA\u0AC1\u0AA4\u0ACD\u0AB0: \u0AB0\u0ABE\u0A9C\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0A95\u0ABE\u0A82\u0AA4\u0ABF\u0AB2\u0ABE\u0AB2 \u0AAA\u0A9F\u0AC7\u0AB2, \u0AAE\u0AB9\u0AC7\u0AB6\u0AAD\u0ABE\u0A88 \u0A95\u0ABE\u0A82\u0AA4\u0ABF\u0AB2\u0ABE\u0AB2 \u0AAA\u0A9F\u0AC7\u0AB2; \u0AAA\u0ACC\u0AA4\u0ACD\u0AB0: \u0AA7\u0ACD\u0AB0\u0AC1\u0AB5, \u0A86\u0AAF\u0AC2\u0AB7; \u0AAD\u0ABE\u0A88: \u0AB0\u0AAE\u0AA3\u0ABF\u0A95\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
    contactPhone: "9825098765",
    notes: "\u0AAA\u0ACD\u0AB0\u0AAD\u0AC1 \u0AA6\u0ABF\u0AB5\u0ACD\u0AAF \u0A86\u0AA4\u0ACD\u0AAE\u0ABE\u0AA8\u0AC7 \u0AAA\u0AB0\u0AAE \u0AB6\u0ABE\u0A82\u0AA4\u0ABF \u0A85\u0AB0\u0ACD\u0AAA\u0AC7 \u0A85\u0AA8\u0AC7 \u0AAA\u0AB0\u0ABF\u0AB5\u0ABE\u0AB0 \u0AAA\u0AB0 \u0A86\u0AB5\u0AC0 \u0AAA\u0AA1\u0AC7\u0AB2\u0ABE \u0AA6\u0AC1\u0A83\u0A96\u0AA8\u0AC7 \u0AB8\u0AB9\u0AA8 \u0A95\u0AB0\u0AB5\u0ABE\u0AA8\u0AC0 \u0AB6\u0A95\u0ACD\u0AA4\u0ABF \u0A86\u0AAA\u0AC7 \u0AA4\u0AC7\u0AB5\u0AC0 \u0AAA\u0ACD\u0AB0\u0ABE\u0AB0\u0ACD\u0AA5\u0AA8\u0ABE.",
    diyaCount: 42,
    flowerCount: 68,
    condolences: [
      {
        id: "c_1",
        userName: "\u0AAE\u0AB9\u0AC7\u0AA8\u0ACD\u0AA6\u0ACD\u0AB0\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2 (\u0AAA\u0ACD\u0AB0\u0AAE\u0AC1\u0A96\u0AB6\u0ACD\u0AB0\u0AC0)",
        text: "\u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0A86\u0AA6\u0AB0\u0AA3\u0AC0\u0AAF \u0AB5\u0AA1\u0AC0\u0AB2 \u0AB8\u0ACD\u0AB5. \u0A95\u0ABE\u0A82\u0AA4\u0ABF\u0AB2\u0ABE\u0AB2\u0AAD\u0ABE\u0A88\u0AA8\u0ABE \u0A85\u0AB5\u0AB8\u0ABE\u0AA8\u0AA5\u0AC0 \u0AB8\u0AAE\u0ABE\u0A9C\u0AC7 \u0A8F\u0A95 \u0AAE\u0ABE\u0AB0\u0ACD\u0A97\u0AA6\u0AB0\u0ACD\u0AB6\u0A95 \u0A97\u0AC1\u0AAE\u0ABE\u0AB5\u0ACD\u0AAF\u0ABE \u0A9B\u0AC7. \u0AAD\u0ABE\u0AB5\u0AAD\u0AC0\u0AA8\u0AC0 \u0AB6\u0ACD\u0AB0\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0A9C\u0AB2\u0ABF. \u0AD0 \u0AB6\u0ABE\u0A82\u0AA4\u0ABF \u{1F64F}",
        createdAt: new Date(Date.now() - 36e5 * 12).toISOString()
      },
      {
        id: "c_2",
        userName: "\u0AA6\u0ABF\u0AB2\u0AC0\u0AAA\u0AAD\u0ABE\u0A88 \u0AB6\u0ABE\u0AB9",
        text: "\u0AAA\u0ACD\u0AB0\u0AAD\u0AC1 \u0AA6\u0ABF\u0AB5\u0ACD\u0AAF \u0A86\u0AA4\u0ACD\u0AAE\u0ABE\u0AA8\u0AC7 \u0AAE\u0ACB\u0A95\u0ACD\u0AB7 \u0A86\u0AAA\u0AC7. \u0AB6\u0ACB\u0A95\u0A97\u0ACD\u0AB0\u0AB8\u0ACD\u0AA4 \u0AAA\u0AB0\u0ABF\u0AB5\u0ABE\u0AB0 \u0AAA\u0ACD\u0AB0\u0AA4\u0ACD\u0AAF\u0AC7 \u0A85\u0AAE\u0ABE\u0AB0\u0AC0 \u0AB8\u0A82\u0AB5\u0AC7\u0AA6\u0AA8\u0ABE.",
        createdAt: new Date(Date.now() - 36e5 * 5).toISOString()
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdBy: "admin"
  },
  {
    id: "mn_2",
    samajId: DEFAULT_SAMAJ_ID,
    deceasedName: "\u0AB8\u0ACD\u0AB5. \u0AB6\u0ABE\u0A82\u0AA4\u0ABE\u0AAC\u0AC7\u0AA8 \u0AAA\u0ACD\u0AB0\u0AAD\u0AC1\u0AA6\u0ABE\u0AB8 \u0AAA\u0A9F\u0AC7\u0AB2",
    age: 84,
    gender: "female",
    village: "\u0AB5\u0ABF\u0AB8\u0AA8\u0A97\u0AB0",
    currentCity: "\u0A97\u0ABE\u0A82\u0AA7\u0AC0\u0AA8\u0A97\u0AB0",
    passedDate: "\u0AEE \u0AB8\u0AAA\u0ACD\u0A9F\u0AC7\u0AAE\u0ACD\u0AAC\u0AB0 \u0AE8\u0AE6\u0AE8\u0AEC",
    besnuDate: "\u0AE7\u0AE7 \u0AB8\u0AAA\u0ACD\u0A9F\u0AC7\u0AAE\u0ACD\u0AAC\u0AB0 \u0AE8\u0AE6\u0AE8\u0AEC, \u0AB6\u0AC1\u0A95\u0ACD\u0AB0\u0AB5\u0ABE\u0AB0",
    besnuTime: "\u0AB8\u0ABE\u0A82\u0A9C\u0AC7 \u0AEA:\u0AE6\u0AE6 \u0AA5\u0AC0 \u0AEC:\u0AE6\u0AE6 \u0AB5\u0ABE\u0A97\u0ACD\u0AAF\u0ABE \u0AB8\u0AC1\u0AA7\u0AC0",
    besnuVenue: "\u0A95\u0AAE\u0AB2\u0AAE \u0AAA\u0ABE\u0AB0\u0ACD\u0A9F\u0AC0 \u0AAA\u0ACD\u0AB2\u0ACB\u0A9F, \u0AB8\u0AC7\u0A95\u0ACD\u0A9F\u0AB0 \u0AE8\u0AE7, \u0A97\u0ABE\u0A82\u0AA7\u0AC0\u0AA8\u0A97\u0AB0",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    grievingFamily: "\u0AB8\u0AC1\u0AAA\u0AC1\u0AA4\u0ACD\u0AB0: \u0A95\u0ABF\u0AB0\u0AC0\u0A9F\u0AAD\u0ABE\u0A88 \u0AAA\u0ACD\u0AB0\u0AAD\u0AC1\u0AA6\u0ABE\u0AB8 \u0AAA\u0A9F\u0AC7\u0AB2; \u0AAA\u0AC1\u0AA4\u0ACD\u0AB0\u0AB5\u0AA7\u0AC2: \u0AB0\u0AC7\u0A96\u0ABE\u0AAC\u0AC7\u0AA8; \u0AAA\u0ACC\u0AA4\u0ACD\u0AB0\u0AC0: \u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0ABE, \u0AA8\u0AC7\u0AB9\u0ABE",
    contactPhone: "9879512340",
    notes: "\u0AAE\u0ABE\u0AA4\u0AC3\u0AB6\u0ACD\u0AB0\u0AC0\u0AA8\u0ABE \u0AA6\u0ABF\u0AB5\u0ACD\u0AAF \u0A86\u0AA4\u0ACD\u0AAE\u0ABE\u0AA8\u0AC7 \u0A88\u0AB6\u0ACD\u0AB5\u0AB0 \u0A9A\u0AB0\u0AA3\u0ACB\u0AAE\u0ABE\u0A82 \u0AB8\u0ACD\u0AA5\u0ABE\u0AA8 \u0A86\u0AAA\u0AC7 \u0AA4\u0AC7\u0AB5\u0AC0 \u0A85\u0AAD\u0ACD\u0AAF\u0AB0\u0ACD\u0AA5\u0AA8\u0ABE.",
    diyaCount: 29,
    flowerCount: 51,
    condolences: [
      {
        id: "c_3",
        userName: "\u0AB5\u0ABF\u0AAA\u0AC1\u0AB2\u0AAD\u0ABE\u0A88 \u0AAA\u0A9F\u0AC7\u0AB2",
        text: "\u0AAE\u0ABE\u0AA4\u0AC3\u0AB6\u0ACD\u0AB0\u0AC0\u0AA8\u0ABE \u0A9A\u0AB0\u0AA3\u0ACB\u0AAE\u0ABE\u0A82 \u0AB6\u0AA4 \u0AB6\u0AA4 \u0AA8\u0AAE\u0AA8. \u0AD0 \u0AB6\u0ABE\u0A82\u0AA4\u0ABF.",
        createdAt: new Date(Date.now() - 36e5 * 20).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 864e5).toISOString(),
    createdBy: "admin"
  }
];
app.get("/api/maran-nodh", (req, res) => {
  const normalizedRecords = maranNodhList.map((m) => ({
    ...m,
    name: m.deceasedName,
    deathDate: m.passedDate,
    tributes: {
      diya: m.diyaCount || 0,
      flower: m.flowerCount || 0
    },
    familyMembers: typeof m.grievingFamily === "string" ? m.grievingFamily.split(",").map((s) => s.trim()).filter(Boolean) : Array.isArray(m.grievingFamily) ? m.grievingFamily : []
  }));
  res.json({ items: maranNodhList, records: normalizedRecords });
});
app.post("/api/maran-nodh", (req, res) => {
  const user = getAuthUser(req);
  const body = req.body;
  const deceasedName = (body.deceasedName || body.name || "").trim();
  if (!deceasedName) {
    return res.status(400).json({ error: "\u0AB8\u0ACD\u0AB5\u0AB0\u0ACD\u0A97\u0AB8\u0ACD\u0AA5\u0AA8\u0AC1\u0A82 \u0AA8\u0ABE\u0AAE \u0A9C\u0AB0\u0AC2\u0AB0\u0AC0 \u0A9B\u0AC7" });
  }
  const passedDate = (body.passedDate || body.deathDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]).trim();
  const grievingFamily = typeof body.grievingFamily === "string" ? body.grievingFamily : Array.isArray(body.familyMembers) ? body.familyMembers.join(", ") : "";
  const photo = body.photo || (body.gender === "female" ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80");
  const newItem = {
    id: `mn_${Date.now()}`,
    samajId: user?.activeSamajId || DEFAULT_SAMAJ_ID,
    deceasedName,
    age: Number(body.age) || 70,
    gender: body.gender === "female" ? "female" : "male",
    village: (body.village || "").trim(),
    currentCity: (body.currentCity || "").trim(),
    passedDate,
    besnuDate: (body.besnuDate || "").trim(),
    besnuTime: (body.besnuTime || "").trim(),
    besnuVenue: (body.besnuVenue || "").trim(),
    photo,
    grievingFamily,
    contactPhone: (body.contactPhone || user?.phone || "").trim(),
    notes: (body.notes || "").trim(),
    diyaCount: 0,
    flowerCount: 0,
    condolences: [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdBy: user?.id || "anonymous"
  };
  maranNodhList.unshift(newItem);
  const memorialReelPost = {
    id: `post_memorial_${newItem.id}`,
    authorId: user?.id || "admin",
    authorName: user?.name || "\u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0ABE\u0AB0\u0ACD\u0AAF\u0ABE\u0AB2\u0AAF",
    authorPhoto: user?.profilePhoto || null,
    authorRole: user?.role || "admin",
    content: `\u{1F54A}\uFE0F \u0AAD\u0ABE\u0AB5\u0AAD\u0AC0\u0AA8\u0AC0 \u0AB6\u0ACD\u0AB0\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0A9C\u0AB2\u0ABF
\u0AB8\u0ACD\u0AB5. ${newItem.deceasedName}
\u0A89\u0A82\u0AAE\u0AB0: ${newItem.age || "-"} \u0AB5\u0AB0\u0ACD\u0AB7
\u0AB5\u0AA4\u0AA8: ${newItem.village || "-"}
\u0AB9\u0ABE\u0AB2: ${newItem.currentCity || "-"}
\u0AB8\u0ACD\u0AB5\u0AB0\u0ACD\u0A97\u0AB5\u0ABE\u0AB8 \u0AA4\u0ABE\u0AB0\u0AC0\u0A96: ${newItem.passedDate}

\u0AAC\u0AC7\u0AB8\u0AA3\u0AC1\u0A82: ${newItem.besnuDate || "\u0A9C\u0ABE\u0AB9\u0AC7\u0AB0 \u0AA5\u0AB6\u0AC7"} (${newItem.besnuTime || ""})
\u0AB8\u0ACD\u0AA5\u0AB3: ${newItem.besnuVenue || ""}
\u0AAA\u0AB0\u0ABF\u0AB5\u0ABE\u0AB0: ${newItem.grievingFamily || ""}

\u0AB8\u0AA6\u0ACD\u0A97\u0AA4\u0AA8\u0ABE \u0A86\u0AA4\u0ACD\u0AAE\u0ABE\u0AA8\u0AC7 \u0AAA\u0AB0\u0AAE \u0AB6\u0ABE\u0A82\u0AA4\u0ABF \u0A85\u0AB0\u0ACD\u0AAA\u0AC7 \u0AA4\u0AC7\u0AB5\u0AC0 \u0AAA\u0ACD\u0AB0\u0AAD\u0AC1 \u0A9A\u0AB0\u0AA3\u0ACB\u0AAE\u0ABE\u0A82 \u0AAA\u0ACD\u0AB0\u0ABE\u0AB0\u0ACD\u0AA5\u0AA8\u0ABE. \u0AD0 \u0AB6\u0ABE\u0A82\u0AA4\u0ABF \u{1F54A}\uFE0F`,
    caption: `\u{1F54A}\uFE0F \u0AAD\u0ABE\u0AB5\u0AAD\u0AC0\u0AA8\u0AC0 \u0AB6\u0ACD\u0AB0\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0A9C\u0AB2\u0ABF: \u0AB8\u0ACD\u0AB5. ${newItem.deceasedName} (\u0AB5\u0AA4\u0AA8: ${newItem.village || "-"})`,
    mediaUrls: [photo],
    imageUrls: [photo],
    mediaType: "reel",
    isReel: true,
    isMemorial: true,
    category: "memorial",
    maranNodhId: newItem.id,
    maranNodhData: {
      id: newItem.id,
      deceasedName: newItem.deceasedName,
      name: newItem.deceasedName,
      age: newItem.age,
      passedDate: newItem.passedDate,
      deathDate: newItem.passedDate,
      besnuDate: newItem.besnuDate,
      besnuTime: newItem.besnuTime,
      besnuVenue: newItem.besnuVenue,
      village: newItem.village,
      currentCity: newItem.currentCity,
      contactPhone: newItem.contactPhone,
      grievingFamily: newItem.grievingFamily,
      photo: newItem.photo,
      diyaCount: 0,
      flowerCount: 0
    },
    visibility: "samaj",
    samajId: newItem.samajId,
    audioTitle: "\u0AD0 \u0AB6\u0ABE\u0A82\u0AA4\u0ABF \u2022 \u0AAD\u0ABE\u0AB5\u0AAD\u0AC0\u0AA8\u0AC0 \u0AB6\u0ACD\u0AB0\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0A9C\u0AB2\u0ABF",
    location: newItem.village ? `${newItem.village}` : newItem.currentCity || "\u0AB8\u0AAE\u0ABE\u0A9C",
    likedBy: [],
    savedBy: [],
    likesCount: 0,
    commentsCount: 0,
    approved: true,
    status: "active",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  postsList.unshift(memorialReelPost);
  const reelNotif = {
    id: `notif_memorial_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    type: "reel",
    title: "\u{1F54A}\uFE0F \u0AAD\u0ABE\u0AB5\u0AAD\u0AC0\u0AA8\u0AC0 \u0AB6\u0ACD\u0AB0\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0A9C\u0AB2\u0ABF (\u0AB0\u0AC0\u0AB2)",
    body: `\u0AB8\u0ACD\u0AB5. ${newItem.deceasedName} (\u0AB5\u0AA4\u0AA8: ${newItem.village || "-"}) \u0AA8\u0AC0 \u0AAE\u0AB0\u0AA3 \u0AA8\u0ACB\u0A82\u0AA7 \u0A85\u0AA8\u0AC7 \u0AB6\u0ACD\u0AB0\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0A9C\u0AB2\u0ABF \u0AB0\u0AC0\u0AB2 \u0A9C\u0AC1\u0A93`,
    link: `/reels?id=${memorialReelPost.id}`,
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    userId: "all",
    samajId: newItem.samajId,
    authorId: user?.id || "admin",
    authorName: user?.name || "\u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0ABE\u0AB0\u0ACD\u0AAF\u0ABE\u0AB2\u0AAF",
    authorPhoto: photo,
    reelId: memorialReelPost.id
  };
  notificationsList.unshift(reelNotif);
  saveStore(true);
  const normalized = {
    ...newItem,
    name: newItem.deceasedName,
    deathDate: newItem.passedDate,
    tributes: { diya: 0, flower: 0 },
    familyMembers: typeof newItem.grievingFamily === "string" ? newItem.grievingFamily.split(",").map((s) => s.trim()).filter(Boolean) : []
  };
  res.json({ ok: true, item: newItem, record: normalized, reelPost: memorialReelPost });
});
app.post("/api/maran-nodh/:id/tribute", (req, res) => {
  const { type = "diya" } = req.body;
  const item = maranNodhList.find((m) => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "\u0AA8\u0ACB\u0A82\u0AA7 \u0AAE\u0AB3\u0AC0 \u0AA8\u0AA5\u0AC0" });
  }
  if (type === "diya") {
    item.diyaCount = (item.diyaCount || 0) + 1;
  } else {
    item.flowerCount = (item.flowerCount || 0) + 1;
  }
  const relatedPost = postsList.find((p) => p.maranNodhId === item.id || p.id === `post_memorial_${item.id}`);
  if (relatedPost && relatedPost.maranNodhData) {
    relatedPost.maranNodhData.diyaCount = item.diyaCount;
    relatedPost.maranNodhData.flowerCount = item.flowerCount;
    if (type === "diya") {
      relatedPost.likesCount = (relatedPost.likesCount || 0) + 1;
    }
  }
  saveStore(true);
  const record = {
    ...item,
    name: item.deceasedName,
    deathDate: item.passedDate,
    tributes: { diya: item.diyaCount, flower: item.flowerCount }
  };
  res.json({ ok: true, diyaCount: item.diyaCount, flowerCount: item.flowerCount, record });
});
app.post("/api/maran-nodh/:id/condolence", (req, res) => {
  const user = getAuthUser(req);
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "\u0AB8\u0A82\u0AA6\u0AC7\u0AB6 \u0AB2\u0A96\u0ACB" });
  }
  const item = maranNodhList.find((m) => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "\u0AA8\u0ACB\u0A82\u0AA7 \u0AAE\u0AB3\u0AC0 \u0AA8\u0AA5\u0AC0" });
  }
  const cond = {
    id: `c_${Date.now()}`,
    userName: user?.name || "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB8\u0AAD\u0ACD\u0AAF",
    text: text.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!item.condolences) item.condolences = [];
  item.condolences.unshift(cond);
  const relatedPost = postsList.find((p) => p.maranNodhId === item.id || p.id === `post_memorial_${item.id}`);
  if (relatedPost) {
    relatedPost.commentsCount = (relatedPost.commentsCount || 0) + 1;
  }
  saveStore(true);
  const record = {
    ...item,
    name: item.deceasedName,
    deathDate: item.passedDate,
    tributes: { diya: item.diyaCount, flower: item.flowerCount }
  };
  res.json({ ok: true, condolence: cond, record });
});
app.get("/api/members", requireCompletedOnboarding, (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  const village = (req.query.village || "").toLowerCase().trim();
  const district = (req.query.district || "").toLowerCase().trim();
  const bloodGroup = req.query.bloodGroup || "";
  const gender = req.query.gender || "";
  const skip = parseInt(req.query.skip || "0", 10);
  const limit = parseInt(req.query.limit || "50", 10);
  let filtered = membersList.filter((m) => m.isActive);
  if (q) {
    filtered = filtered.filter(
      (m) => m.name.toLowerCase().includes(q) || m.mobile.includes(q) || m.village.toLowerCase().includes(q) || m.district.toLowerCase().includes(q) || m.education.toLowerCase().includes(q)
    );
  }
  if (village) {
    filtered = filtered.filter((m) => m.village.toLowerCase() === village);
  }
  if (district) {
    filtered = filtered.filter((m) => m.district.toLowerCase() === district);
  }
  if (bloodGroup) {
    filtered = filtered.filter((m) => m.bloodGroup === bloodGroup);
  }
  if (gender) {
    filtered = filtered.filter((m) => m.gender === gender);
  }
  const paginated = filtered.slice(skip, skip + limit);
  res.json({
    items: paginated,
    total: filtered.length
  });
});
app.post("/api/members", (req, res) => {
  const body = req.body;
  if (!body.mobile || !body.name) {
    res.status(400).json({ detail: "\u0AA8\u0ABE\u0AAE \u0A85\u0AA8\u0AC7 \u0AAE\u0ACB\u0AAC\u0ABE\u0A87\u0AB2 \u0AA8\u0A82\u0AAC\u0AB0 \u0A86\u0AB5\u0AB6\u0ACD\u0AAF\u0A95 \u0A9B\u0AC7." });
    return;
  }
  const dup = membersList.find(
    (m) => m.mobile === body.mobile && m.samajId === currentUser.activeSamajId
  );
  if (dup) {
    res.status(400).json({ detail: "\u0A86 \u0AAE\u0ACB\u0AAC\u0ABE\u0A87\u0AB2 \u0AA8\u0A82\u0AAC\u0AB0 \u0AAA\u0AB9\u0AC7\u0AB2\u0AC7\u0AA5\u0AC0 \u0AA8\u0ACB\u0A82\u0AA7\u0ABE\u0AAF\u0AC7\u0AB2 \u0A9B\u0AC7" });
    return;
  }
  const newMember = {
    id: `mem_${Date.now()}`,
    ...body,
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdBy: currentUser.id
  };
  membersList.unshift(newMember);
  res.json(newMember);
});
app.get("/api/members/:mid", (req, res) => {
  const m = membersList.find((x) => x.id === req.params.mid);
  if (!m) {
    res.status(404).json({ detail: "\u0AB8\u0AAD\u0ACD\u0AAF \u0AAE\u0AB3\u0ACD\u0AAF\u0ABE \u0AA8\u0AB9\u0AC0\u0A82" });
    return;
  }
  res.json(m);
});
app.put("/api/members/:mid", (req, res) => {
  const idx = membersList.findIndex((x) => x.id === req.params.mid);
  if (idx === -1) {
    res.status(404).json({ detail: "\u0AB8\u0AAD\u0ACD\u0AAF \u0AAE\u0AB3\u0ACD\u0AAF\u0ABE \u0AA8\u0AB9\u0AC0\u0A82" });
    return;
  }
  membersList[idx] = { ...membersList[idx], ...req.body };
  res.json(membersList[idx]);
});
app.delete("/api/members/:mid", (req, res) => {
  const idx = membersList.findIndex((x) => x.id === req.params.mid);
  if (idx !== -1) {
    membersList[idx].isActive = false;
  }
  res.json({ ok: true });
});
app.get("/api/events", requireCompletedOnboarding, (req, res) => {
  const items = eventsList.map((e) => formatEvent(e, currentUser));
  res.json({ items });
});
app.post("/api/events", (req, res) => {
  const body = req.body;
  const newEvent = {
    id: `ev_${Date.now()}`,
    title: body.title,
    description: body.description || "",
    eventImage: body.eventImage || "",
    location: body.location || "",
    date: body.date,
    startTime: body.startTime || "",
    endTime: body.endTime || "",
    visibility: body.visibility || "samaj",
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    registrations: [currentUser.id],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdBy: currentUser.id
  };
  eventsList.unshift(newEvent);
  res.json(formatEvent(newEvent, currentUser));
});
app.post("/api/events/:eid/register", (req, res) => {
  const ev = eventsList.find((e) => e.id === req.params.eid);
  if (!ev) {
    res.status(404).json({ detail: "Event not found" });
    return;
  }
  if (!ev.registrations.includes(currentUser.id)) {
    ev.registrations.push(currentUser.id);
  }
  res.json(formatEvent(ev, currentUser));
});
app.post("/api/events/:eid/unregister", (req, res) => {
  const ev = eventsList.find((e) => e.id === req.params.eid);
  if (!ev) {
    res.status(404).json({ detail: "Event not found" });
    return;
  }
  ev.registrations = ev.registrations.filter((id) => id !== currentUser.id);
  res.json(formatEvent(ev, currentUser));
});
app.patch("/api/events/:eid", (req, res) => {
  const ev = eventsList.find((e) => e.id === req.params.eid);
  if (!ev) {
    res.status(404).json({ detail: "Event not found" });
    return;
  }
  Object.assign(ev, req.body);
  res.json(formatEvent(ev, getAuthUser(req) || currentUser));
});
app.delete("/api/events/:eid", (req, res) => {
  const idx = eventsList.findIndex((e) => e.id === req.params.eid);
  if (idx === -1) {
    res.status(404).json({ detail: "Event not found" });
    return;
  }
  eventsList.splice(idx, 1);
  res.json({ ok: true, id: req.params.eid });
});
app.get("/api/posts", requireCompletedOnboarding, (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Authentication required" });
  const { authorId, saved, eventId, filter } = req.query;
  let list = postsList.filter((p) => p.status !== "deleted");
  if (authorId) {
    list = list.filter((p) => p.authorId === authorId || authorId === "mine" && p.authorId === authUser.id);
  }
  if (saved === "true" || saved === true) {
    list = list.filter((p) => p.savedBy?.includes(authUser.id));
  }
  if (eventId) {
    list = list.filter((p) => p.eventId === eventId);
  }
  if (filter === "reel" || filter === "reels") {
    list = list.filter((p) => p.mediaType === "reel" || p.isReel || p.isMemorial || p.category === "memorial" || p.mediaUrls && p.mediaUrls.some((u) => /\.(mp4|mov|webm)(\?.*)?$/i.test(u)));
  }
  list = list.filter((post) => canUserViewPost(post, authUser));
  const formatted = list.map((p) => ({
    ...p,
    likedByMe: p.likedBy?.includes(authUser.id) || false,
    savedByMe: p.savedBy?.includes(authUser.id) || false,
    mediaUrls: p.mediaUrls || p.imageUrls || [],
    imageUrls: p.imageUrls || p.mediaUrls || [],
    content: p.content || p.caption || "",
    isOwner: p.authorId === authUser.id
  }));
  res.json({ items: formatted });
});
app.get("/api/posts/:pid", (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Authentication required" });
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "\u0AA4\u0AAE\u0AA8\u0AC7 \u0A86 \u0AAA\u0ACB\u0AB8\u0ACD\u0A9F \u0A9C\u0ACB\u0AB5\u0ABE\u0AA8\u0AC0 \u0AAA\u0AB0\u0AB5\u0ABE\u0AA8\u0A97\u0AC0 \u0AA8\u0AA5\u0AC0 (\u0A96\u0ABE\u0AA8\u0A97\u0AC0 \u0AB8\u0ABE\u0AAE\u0A97\u0ACD\u0AB0\u0AC0) / Private content" });
    return;
  }
  res.json({
    ...post,
    likedByMe: post.likedBy?.includes(authUser.id) || false,
    savedByMe: post.savedBy?.includes(authUser.id) || false,
    mediaUrls: post.mediaUrls || post.imageUrls || [],
    imageUrls: post.imageUrls || post.mediaUrls || [],
    content: post.content || post.caption || "",
    isOwner: post.authorId === authUser.id
  });
});
app.get("/api/public/posts/:pid", (req, res) => {
  if (!platformSettings.publicAccessEnabled) {
    return res.status(403).json({ detail: "Public access is disabled" });
  }
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) {
    return res.status(404).json({ detail: "Post not found" });
  }
  if (post.visibility !== "public" && post.visibility !== "all_samaj") {
    return res.status(403).json({ detail: "Private post requires login" });
  }
  res.json({
    ...post,
    likedByMe: false,
    savedByMe: false,
    mediaUrls: post.mediaUrls || post.imageUrls || [],
    imageUrls: post.imageUrls || post.mediaUrls || [],
    content: post.content || post.caption || "",
    isOwner: false
  });
});
app.post("/api/upload", (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ detail: "\u0AAE\u0AC0\u0AA1\u0ABF\u0AAF\u0ABE \u0A85\u0AAA\u0AB2\u0ACB\u0AA1 \u0A95\u0AB0\u0AB5\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7 \u0AB2\u0ACB\u0A97\u0ABF\u0AA8 \u0A9C\u0AB0\u0AC2\u0AB0\u0AC0 \u0A9B\u0AC7 (Authentication required)" });
  }
  try {
    const body = req.body || {};
    const fileData = body.fileData || body.data || body.file || body.mediaUrl;
    if (!fileData) {
      return res.status(400).json({ detail: "No file data provided" });
    }
    const fileName = body.fileName || `upload_${Date.now()}`;
    const contentType = body.contentType || (typeof fileData === "string" && fileData.startsWith("data:video") ? "video/mp4" : "image/jpeg");
    const url = typeof fileData === "string" && (fileData.startsWith("http://") || fileData.startsWith("https://") || fileData.startsWith("data:")) ? fileData : `data:${contentType};base64,${fileData}`;
    return res.json({
      url,
      fileName,
      contentType,
      success: true
    });
  } catch (err) {
    return res.status(500).json({ detail: "Upload processing failed: " + (err?.message || "Unknown error") });
  }
});
app.get("/api/posts/:pid/media", (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Authentication required" });
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) return res.status(404).json({ detail: "Post not found" });
  if (!canUserViewPost(post, authUser)) {
    return res.status(403).json({ detail: "\u0AA4\u0AAE\u0AA8\u0AC7 \u0A86 \u0AAE\u0AC0\u0AA1\u0ABF\u0AAF\u0ABE \u0A9C\u0ACB\u0AB5\u0ABE\u0AA8\u0AC0 \u0AAA\u0AB0\u0AB5\u0ABE\u0AA8\u0A97\u0AC0 \u0AA8\u0AA5\u0AC0 (\u0A96\u0ABE\u0AA8\u0A97\u0AC0 \u0AB8\u0ABE\u0AAE\u0A97\u0ACD\u0AB0\u0AC0) / Access denied by privacy rules" });
  }
  return res.json({
    id: post.id,
    mediaUrls: post.mediaUrls || post.imageUrls || [],
    visibility: post.visibility || "samaj",
    authorId: post.authorId
  });
});
app.post("/api/posts", (req, res) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ detail: "Authentication required" });
  if (platformSettings.requireVerificationForPosting && authUser.verificationStatus !== "verified") {
    return res.status(403).json({
      detail: "\u0AAA\u0ACD\u0AB0\u0A95\u0ABE\u0AB6\u0ABF\u0AA4 \u0A95\u0AB0\u0AB5\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7 \u0AA4\u0AAE\u0ABE\u0AB0\u0AC0 \u0AAA\u0ACD\u0AB0\u0ACB\u0AAB\u0ABE\u0A87\u0AB2 \u0A9A\u0A95\u0ABE\u0AB8\u0ABE\u0AAF\u0AC7\u0AB2 \u0AB9\u0ACB\u0AB5\u0AC0 \u0A9C\u0AB0\u0AC2\u0AB0\u0AC0 \u0A9B\u0AC7 (Verification required to publish)",
      verificationState: getVerificationState(authUser).verificationState
    });
  }
  const body = req.body;
  const urls = body.mediaUrls?.length ? body.mediaUrls : body.imageUrls || [];
  const visibility = body.visibility || "samaj";
  const newPost = {
    id: `post_${Date.now()}`,
    authorId: authUser.id,
    authorName: authUser.name,
    authorPhoto: authUser.profilePhoto,
    authorRole: authUser.role || "member",
    content: body.content || body.caption || "",
    caption: body.caption || body.content || "",
    mediaUrls: urls,
    imageUrls: urls,
    mediaType: body.mediaType || "image",
    visibility,
    // public | samaj | followers | only_me
    samajId: authUser.activeSamajId || DEFAULT_SAMAJ_ID,
    filter: body.filter || null,
    rotation: body.rotation || 0,
    aspectRatio: body.aspectRatio || "original",
    volume: body.volume ?? 1,
    trimStart: body.trimStart || 0,
    trimEnd: body.trimEnd || 0,
    music: body.music || null,
    location: body.location || "",
    eventId: body.eventId || null,
    textOverlays: body.textOverlays || [],
    emojiOverlays: body.emojiOverlays || [],
    likedBy: [],
    savedBy: [],
    likesCount: 0,
    commentsCount: 0,
    approved: true,
    status: "active",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  postsList.unshift(newPost);
  const isVideoOrReel = newPost.mediaType === "video" || body.isReel || body.mediaType === "reel";
  if (isVideoOrReel) {
    const reelNotif = {
      id: `notif_reel_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: "reel",
      title: "\u{1F3AC} \u0AA8\u0AB5\u0AC0 \u0AB0\u0AC0\u0AB2 \u0A86\u0AB5\u0AC0 \u0A9B\u0AC7!",
      body: `${authUser.name || "\u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0AB8\u0AAD\u0ACD\u0AAF"} \u0A8F \u0AA8\u0AB5\u0AC0 \u0AB0\u0AC0\u0AB2 \u0AB6\u0AC7\u0AB0 \u0A95\u0AB0\u0AC0: "${(newPost.caption || newPost.content || "\u0AA8\u0AB5\u0AC0 \u0AB0\u0AC0\u0AB2 \u0A9C\u0AC1\u0A93").slice(0, 60)}"`,
      link: `/reels?id=${newPost.id}`,
      read: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      userId: "all",
      samajId: newPost.samajId,
      authorId: authUser.id,
      authorName: authUser.name,
      authorPhoto: authUser.profilePhoto,
      reelId: newPost.id
    };
    notificationsList.unshift(reelNotif);
  }
  res.json({
    ...newPost,
    likedByMe: false,
    savedByMe: false,
    isOwner: true
  });
});
app.put("/api/posts/:pid", (req, res) => {
  const authUser = getAuthUser(req);
  const pid = req.params.pid;
  const post = postsList.find((p) => p.id === pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  const isAuthor = post.authorId === authUser.id || post.createdBy === authUser.id;
  const isMod = ["super_admin", "samaj_admin", "admin", "moderator"].includes(authUser.role);
  if (!isAuthor && !isMod) {
    res.status(403).json({ detail: "\u0AA4\u0AAE\u0AC7 \u0A86 \u0AAA\u0ACB\u0AB8\u0ACD\u0A9F \u0A8F\u0AA1\u0ABF\u0A9F \u0A95\u0AB0\u0AB5\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7 \u0A85\u0AA7\u0ABF\u0A95\u0AC3\u0AA4 \u0AA8\u0AA5\u0AC0 (Unauthorized to edit)" });
    return;
  }
  const { caption, content, visibility, location, textOverlays, emojiOverlays, filter, rotation } = req.body;
  if (caption !== void 0) {
    post.caption = caption;
    post.content = caption;
  }
  if (content !== void 0 && caption === void 0) {
    post.content = content;
    post.caption = content;
  }
  if (visibility !== void 0) {
    post.visibility = visibility;
  }
  if (location !== void 0) {
    post.location = location;
  }
  if (textOverlays !== void 0) {
    post.textOverlays = textOverlays;
  }
  if (emojiOverlays !== void 0) {
    post.emojiOverlays = emojiOverlays;
  }
  if (filter !== void 0) {
    post.filter = filter;
  }
  if (rotation !== void 0) {
    post.rotation = rotation;
  }
  post.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  res.json({
    ...post,
    likedByMe: post.likedBy?.includes(authUser.id) || false,
    savedByMe: post.savedBy?.includes(authUser.id) || false,
    mediaUrls: post.mediaUrls || post.imageUrls || [],
    imageUrls: post.imageUrls || post.mediaUrls || [],
    content: post.content || post.caption || "",
    isOwner: isAuthor
  });
});
app.delete("/api/posts/:pid", (req, res) => {
  const authUser = getAuthUser(req);
  const pid = req.params.pid;
  const postIndex = postsList.findIndex((p) => p.id === pid);
  if (postIndex === -1) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  const post = postsList[postIndex];
  const isAuthor = post.authorId === authUser.id || post.createdBy === authUser.id;
  const isMod = ["super_admin", "samaj_admin", "admin", "moderator"].includes(authUser.role);
  if (!isAuthor && !isMod) {
    res.status(403).json({ detail: "\u0AA4\u0AAE\u0AC7 \u0A86 \u0AAA\u0ACB\u0AB8\u0ACD\u0A9F \u0AA1\u0ABF\u0AB2\u0AC0\u0A9F \u0A95\u0AB0\u0AB5\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7 \u0A85\u0AA7\u0ABF\u0A95\u0AC3\u0AA4 \u0AA8\u0AA5\u0AC0 (Unauthorized to delete)" });
    return;
  }
  post.status = "deleted";
  postsList.splice(postIndex, 1);
  delete commentsList[pid];
  res.json({ ok: true, id: pid, message: "\u0AAA\u0ACB\u0AB8\u0ACD\u0A9F \u0AB8\u0AAB\u0AB3\u0AA4\u0ABE\u0AAA\u0AC2\u0AB0\u0ACD\u0AB5\u0A95 \u0AA1\u0ABF\u0AB2\u0AC0\u0A9F \u0AA5\u0A88 \u0A97\u0A88" });
});
app.post("/api/posts/:pid/like", (req, res) => {
  const authUser = getAuthUser(req);
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "Not authorized to access this post" });
    return;
  }
  const isLiked = post.likedBy.includes(authUser.id);
  if (isLiked) {
    post.likedBy = post.likedBy.filter((id) => id !== authUser.id);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likedBy.push(authUser.id);
    post.likesCount += 1;
  }
  res.json({ liked: !isLiked, likesCount: post.likesCount });
});
app.post("/api/posts/:pid/save", (req, res) => {
  const authUser = getAuthUser(req);
  const post = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "Not authorized to access this post" });
    return;
  }
  const isSaved = post.savedBy?.includes(authUser.id);
  if (isSaved) {
    post.savedBy = post.savedBy.filter((id) => id !== authUser.id);
  } else {
    post.savedBy = post.savedBy || [];
    post.savedBy.push(authUser.id);
  }
  res.json({ saved: !isSaved });
});
app.get("/api/posts/:pid/comments", (req, res) => {
  const authUser = getAuthUser(req);
  const pid = req.params.pid;
  const post = postsList.find((p) => p.id === pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "Not authorized to view comments for this private post" });
    return;
  }
  res.json({ items: commentsList[pid] || [] });
});
app.post("/api/posts/:pid/comments", (req, res) => {
  const authUser = getAuthUser(req);
  const pid = req.params.pid;
  const post = postsList.find((p) => p.id === pid && p.status !== "deleted");
  if (!post) {
    res.status(404).json({ detail: "Post not found" });
    return;
  }
  if (!canUserViewPost(post, authUser)) {
    res.status(403).json({ detail: "Not authorized to comment on this private post" });
    return;
  }
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ detail: "Content required" });
    return;
  }
  const newComment = {
    id: `comm_${Date.now()}`,
    authorId: authUser.id,
    authorName: authUser.name,
    authorPhoto: authUser.profilePhoto,
    content,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  commentsList[pid] = commentsList[pid] || [];
  commentsList[pid].push(newComment);
  post.commentsCount = (post.commentsCount || 0) + 1;
  res.json(newComment);
});
app.delete("/api/comments/:cid", (req, res) => {
  const cid = req.params.cid;
  for (const pid in commentsList) {
    const idx = commentsList[pid].findIndex((c) => c.id === cid);
    if (idx !== -1) {
      commentsList[pid].splice(idx, 1);
      const post = postsList.find((p) => p.id === pid);
      if (post && post.commentsCount) post.commentsCount = Math.max(0, post.commentsCount - 1);
      return res.json({ ok: true });
    }
  }
  res.json({ ok: true });
});
app.post("/api/posts/:pid/view", (req, res) => {
  const post = postsList.find((p) => p.id === req.params.pid);
  if (post) {
    post.viewsCount = (post.viewsCount || 0) + 1;
  }
  res.json({ ok: true, viewsCount: post?.viewsCount || 0 });
});
app.post("/api/posts/:pid/share", (req, res) => {
  const post = postsList.find((p) => p.id === req.params.pid);
  if (post) {
    post.sharesCount = (post.sharesCount || 0) + 1;
  }
  res.json({ ok: true, sharesCount: post?.sharesCount || 0 });
});
app.post("/api/posts/:pid/repost", (req, res) => {
  const authUser = getAuthUser(req) || currentUser;
  const original = postsList.find((p) => p.id === req.params.pid && p.status !== "deleted");
  if (!original) {
    return res.status(404).json({ detail: "Original post not found" });
  }
  const body = req.body;
  const repost = {
    id: `post_${Date.now()}`,
    authorId: authUser.id,
    authorName: authUser.name,
    authorPhoto: authUser.profilePhoto,
    authorRole: authUser.role,
    caption: body.caption || "",
    mediaUrls: original.mediaUrls || [],
    mediaType: original.mediaType || "none",
    samajId: body.samajId || authUser.activeSamajId || DEFAULT_SAMAJ_ID,
    visibility: body.visibility || "samaj",
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    status: "active",
    approved: true,
    likedBy: [],
    savedBy: [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    originalPostId: original.id,
    originalPost: original
  };
  postsList.unshift(repost);
  original.sharesCount = (original.sharesCount || 0) + 1;
  res.json(formatPost(repost, authUser));
});
app.get("/api/hashtags/trending", (_req, res) => {
  const counts = {};
  for (const p of postsList) {
    if (p.status !== "deleted") {
      const tags = (p.caption || "").match(/#[a-zA-Z0-9_\u0A80-\u0AFF]+/g) || [];
      for (let t of tags) {
        const clean = t.replace(/^#/, "");
        counts[clean] = (counts[clean] || 0) + 1;
      }
    }
  }
  let items = Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
  if (!items.length) {
    items = [
      { tag: "\u0AB8\u0AAE\u0ABE\u0A9C\u0A95\u0AA8\u0AC7\u0A95\u0ACD\u0A9F", count: 24 },
      { tag: "\u0AB8\u0ACD\u0AA8\u0AC7\u0AB9\u0AAE\u0ABF\u0AB2\u0AA8", count: 18 },
      { tag: "\u0AAF\u0AC1\u0AB5\u0ABE\u0AAE\u0AB9\u0ACB\u0AA4\u0ACD\u0AB8\u0AB5", count: 15 },
      { tag: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4", count: 12 },
      { tag: "\u0AB6\u0ABF\u0A95\u0ACD\u0AB7\u0AA3", count: 9 }
    ];
  }
  res.json({ items });
});
app.post("/api/reports", (req, res) => {
  const authUser = getAuthUser(req);
  const { targetType, targetId, reason } = req.body;
  const report = {
    id: `rep_${Date.now()}`,
    targetType: targetType || "general",
    targetId: targetId || "",
    reason: reason || "Inappropriate content",
    reporterId: authUser ? authUser.id : "guest",
    reporterName: authUser ? authUser.name : "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB8\u0AAD\u0ACD\u0AAF",
    status: "open",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  reportsList.unshift(report);
  res.json({ ok: true, report });
});
app.get("/api/stories", (req, res) => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1e3;
  const now = Date.now();
  const activeStories = storiesList.filter((s) => {
    const age = now - new Date(s.createdAt).getTime();
    return age >= 0 && age < ONE_DAY_MS;
  });
  const visible = activeStories.filter((s) => {
    if (s.userId === currentUser.id) return true;
    if (s.visibility === "public" || s.visibility === "all_samaj") return true;
    if (s.samajId && currentUser.samajIds?.includes(s.samajId)) return true;
    if (!s.samajId) return true;
    return false;
  });
  const groupMap = {};
  for (const s of visible) {
    if (!groupMap[s.userId]) {
      groupMap[s.userId] = {
        userId: s.userId,
        name: s.userName || "\u0AB8\u0AAD\u0ACD\u0AAF",
        photo: s.userPhoto,
        items: []
      };
    }
    groupMap[s.userId].items.push({
      ...s,
      likedByMe: s.likedBy?.includes(currentUser.id) || false,
      viewedByMe: s.viewedBy?.includes(currentUser.id) || false
    });
  }
  Object.values(groupMap).forEach((g) => {
    g.items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });
  const groups = Object.values(groupMap).sort((a, b) => {
    if (a.userId === currentUser.id) return -1;
    if (b.userId === currentUser.id) return 1;
    const aLatest = new Date(a.items[a.items.length - 1]?.createdAt || 0).getTime();
    const bLatest = new Date(b.items[b.items.length - 1]?.createdAt || 0).getTime();
    return bLatest - aLatest;
  });
  res.json({ items: groups });
});
app.post("/api/stories", (req, res) => {
  const body = req.body;
  if (!body.mediaUrl) {
    res.status(400).json({ detail: "mediaUrl is required" });
    return;
  }
  const newStory = {
    id: `story_${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.name,
    userPhoto: currentUser.profilePhoto,
    mediaUrl: body.mediaUrl,
    mediaType: body.mediaType || "image",
    caption: body.caption || "",
    filter: body.filter || "normal",
    rotation: body.rotation || 0,
    aspectRatio: body.aspectRatio || "9:16",
    volume: body.volume ?? 1,
    trimStart: body.trimStart || 0,
    trimEnd: body.trimEnd || 15,
    textOverlays: body.textOverlays || [],
    emojiOverlays: body.emojiOverlays || [],
    music: body.music || null,
    visibility: body.visibility || "samaj",
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    likedBy: [],
    likesCount: 0,
    viewedBy: [currentUser.id],
    viewsCount: 1,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  storiesList.unshift(newStory);
  res.json({
    ...newStory,
    likedByMe: false,
    viewedByMe: true
  });
});
app.delete("/api/stories/:id", (req, res) => {
  const idx = storiesList.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ detail: "Story not found" });
    return;
  }
  const story = storiesList[idx];
  const isOwner = story.userId === currentUser.id;
  const isAdmin = ["admin", "samaj_admin", "super_admin"].includes(currentUser.role);
  if (!isOwner && !isAdmin) {
    res.status(403).json({ detail: "Not authorized to delete this story" });
    return;
  }
  storiesList.splice(idx, 1);
  res.json({ ok: true });
});
app.post("/api/stories/:id/view", (req, res) => {
  const story = storiesList.find((s) => s.id === req.params.id);
  if (!story) {
    res.status(404).json({ detail: "Story not found" });
    return;
  }
  if (!story.viewedBy.includes(currentUser.id)) {
    story.viewedBy.push(currentUser.id);
    story.viewsCount += 1;
  }
  res.json({ ok: true, viewsCount: story.viewsCount });
});
app.post("/api/stories/:id/like", (req, res) => {
  const story = storiesList.find((s) => s.id === req.params.id);
  if (!story) {
    res.status(404).json({ detail: "Story not found" });
    return;
  }
  const isLiked = story.likedBy.includes(currentUser.id);
  if (isLiked) {
    story.likedBy = story.likedBy.filter((id) => id !== currentUser.id);
    story.likesCount = Math.max(0, story.likesCount - 1);
  } else {
    story.likedBy.push(currentUser.id);
    story.likesCount += 1;
  }
  res.json({ liked: !isLiked, likesCount: story.likesCount });
});
app.post("/api/stories/:id/share", (req, res) => {
  const story = storiesList.find((s) => s.id === req.params.id);
  if (!story) {
    res.status(404).json({ detail: "Story not found" });
    return;
  }
  const { conversationId, note } = req.body;
  if (conversationId && messagesMap && messagesMap[conversationId]) {
    const shareMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPhoto: currentUser.profilePhoto,
      text: note ? note : `\u{1F4F1} \u0AB8\u0ACD\u0A9F\u0ACB\u0AB0\u0AC0 \u0AB6\u0AC7\u0AB0 \u0A95\u0AB0\u0AC0 (Shared Story)${story.caption ? `: "${story.caption}"` : ""}`,
      type: story.mediaType || "image",
      mediaUrl: story.mediaUrl,
      storyId: story.id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      reactions: {},
      deliveryStatus: "sent"
    };
    messagesMap[conversationId].push(shareMessage);
  }
  res.json({ ok: true, sharesCount: (story.sharesCount || 0) + 1 });
});
app.get("/api/halls", (req, res) => {
  res.json({ items: hallsList });
});
app.get("/api/bookings", (req, res) => {
  res.json({ items: bookingsList });
});
app.post("/api/bookings", (req, res) => {
  const body = req.body;
  const hall = hallsList.find((h) => h.id === body.hallId);
  const newBooking = {
    id: `bk_${Date.now()}`,
    hallId: body.hallId,
    hallName: hall?.name || "Samaj Hall",
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    purpose: body.purpose || "",
    guests: body.guests || 50,
    contactPhone: body.contactPhone || currentUser.phone,
    userName: currentUser.name,
    userId: currentUser.id,
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    status: "approved",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  bookingsList.unshift(newBooking);
  res.json(newBooking);
});
app.post("/api/halls", (req, res) => {
  const authUser = getAuthUser(req) || currentUser;
  const body = req.body;
  const newHall = {
    id: `hall_${Date.now()}`,
    name: body.name || "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB5\u0ABE\u0AA1\u0AC0",
    samajId: authUser.activeSamajId || DEFAULT_SAMAJ_ID,
    city: body.city || "\u0A85\u0AAE\u0AA6\u0ABE\u0AB5\u0ABE\u0AA6",
    address: body.address || "",
    capacity: Number(body.capacity) || 500,
    pricePerDay: body.pricePerDay ? Number(body.pricePerDay) : null,
    facilities: body.facilities || ["AC", "Parking", "Kitchen"],
    imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
    managerPhone: body.managerPhone || authUser.phone || "9876543210",
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  hallsList.unshift(newHall);
  res.json(newHall);
});
app.get("/api/halls/:hid", (req, res) => {
  const hall = hallsList.find((h) => h.id === req.params.hid);
  if (!hall) return res.status(404).json({ detail: "Hall not found" });
  const { date } = req.query;
  const busySlots = [];
  if (date) {
    const booked = bookingsList.filter((b) => b.hallId === req.params.hid && b.date === date && b.status !== "cancelled" && b.status !== "rejected");
    for (const b of booked) {
      busySlots.push(`${b.startTime}-${b.endTime}`);
    }
  }
  res.json({ hall, busySlots });
});
app.post("/api/bookings/:bid/cancel", (req, res) => {
  const booking = bookingsList.find((b) => b.id === req.params.bid);
  if (!booking) return res.status(404).json({ detail: "Booking not found" });
  booking.status = "cancelled";
  res.json({ ok: true, booking });
});
app.get("/api/admin/bookings", requireAdmin, (req, res) => {
  const { status } = req.query;
  let items = [...bookingsList];
  if (status && status !== "all") {
    items = items.filter((b) => b.status === status);
  }
  res.json({ items });
});
app.post("/api/admin/bookings/:bid/decision", requireAdmin, (req, res) => {
  const booking = bookingsList.find((b) => b.id === req.params.bid);
  if (!booking) return res.status(404).json({ detail: "Booking not found" });
  const { action, note } = req.body;
  if (action === "approve") {
    booking.status = "approved";
  } else if (action === "reject") {
    booking.status = "rejected";
    booking.rejectionNote = note || "";
  }
  res.json({ ok: true, booking });
});
app.get("/api/albums", (req, res) => {
  res.json({ items: albumsList });
});
app.get("/api/albums/:aid", (req, res) => {
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) {
    res.status(404).json({ detail: "Album not found" });
    return;
  }
  res.json(album);
});
app.post("/api/albums", (req, res) => {
  const body = req.body;
  const newAlbum = {
    id: `alb_${Date.now()}`,
    title: body.title,
    description: body.description || "",
    coverUrl: body.coverUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    photosCount: 0,
    samajId: currentUser.activeSamajId || DEFAULT_SAMAJ_ID,
    approved: true,
    status: "active",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    photos: []
  };
  albumsList.unshift(newAlbum);
  res.json(newAlbum);
});
app.get("/api/photos/recent", (_req, res) => {
  const photos = [];
  for (const alb of albumsList) {
    if (alb.photos && Array.isArray(alb.photos)) {
      for (const p of alb.photos) {
        photos.push({ ...p, albumId: alb.id, albumTitle: alb.title, authorName: alb.authorName || "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB8\u0AAD\u0ACD\u0AAF" });
      }
    }
  }
  res.json({ items: photos.slice(0, 30) });
});
app.get("/api/albums/:aid/photos", (req, res) => {
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) return res.status(404).json({ detail: "Album not found" });
  res.json({ items: album.photos || [] });
});
app.post("/api/albums/:aid/photos", (req, res) => {
  const authUser = getAuthUser(req) || currentUser;
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) return res.status(404).json({ detail: "Album not found" });
  const { items } = req.body;
  album.photos = album.photos || [];
  const added = (items || []).map((it, i) => ({
    id: `p_${Date.now()}_${i}`,
    url: it.url,
    type: it.type || "image",
    caption: it.caption || "",
    authorId: authUser.id,
    authorName: authUser.name,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }));
  album.photos.unshift(...added);
  album.photosCount = album.photos.length;
  res.json({ items: added });
});
app.delete("/api/photos/:pid", (req, res) => {
  const pid = req.params.pid;
  for (const alb of albumsList) {
    if (alb.photos) {
      const idx = alb.photos.findIndex((p) => p.id === pid);
      if (idx !== -1) {
        alb.photos.splice(idx, 1);
        alb.photosCount = alb.photos.length;
        return res.json({ ok: true });
      }
    }
  }
  res.json({ ok: true });
});
app.patch("/api/albums/:aid", (req, res) => {
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) return res.status(404).json({ detail: "Album not found" });
  Object.assign(album, req.body);
  res.json(album);
});
app.delete("/api/albums/:aid", (req, res) => {
  const idx = albumsList.findIndex((a) => a.id === req.params.aid);
  if (idx !== -1) {
    albumsList.splice(idx, 1);
  }
  res.json({ ok: true });
});
app.get("/api/admin/albums", requireAdmin, (req, res) => {
  const { status } = req.query;
  let items = [...albumsList];
  if (status && status !== "all") {
    if (status === "pending") items = items.filter((a) => !a.approved);
    else if (status === "active") items = items.filter((a) => a.status === "active");
    else if (status === "removed") items = items.filter((a) => a.status === "deleted" || a.status === "removed");
  }
  res.json({ items });
});
app.post("/api/admin/albums/:aid/moderate", requireAdmin, (req, res) => {
  const album = albumsList.find((a) => a.id === req.params.aid);
  if (!album) return res.status(404).json({ detail: "Album not found" });
  const { action } = req.body;
  if (action === "approve") {
    album.approved = true;
    album.status = "active";
  } else if (action === "reject" || action === "delete") {
    album.status = "removed";
  } else if (action === "restore") {
    album.status = "active";
    album.approved = true;
  }
  res.json({ ok: true, album });
});
var liveChats = {};
app.get("/api/live", (req, res) => {
  res.json({ items: liveSessions });
});
app.post("/api/live", (req, res) => {
  const user = getAuthUser(req);
  const body = req.body;
  const streamUrl = body.streamUrl || "";
  const newLive = {
    id: `live_${Date.now()}`,
    title: body.title,
    description: body.description || "",
    thumbnail: body.thumbnail || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    streamUrl,
    scheduledAt: body.scheduledAt || null,
    visibility: body.visibility || "samaj",
    status: body.scheduledAt ? "scheduled" : "live",
    hostId: user.id,
    hostName: user.name,
    viewerCount: 1,
    reactions: { "\u2764\uFE0F": 0, "\u{1F44F}": 0, "\u{1F64F}": 0, "\u{1F389}": 0 },
    playback: {
      playbackType: streamUrl.includes("youtube") ? "youtube" : streamUrl.includes("facebook") ? "facebook" : streamUrl.includes(".m3u8") ? "hls" : "embed",
      playbackUrl: streamUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  liveSessions.unshift(newLive);
  res.json(newLive);
});
app.get("/api/live/config", (req, res) => {
  res.json({ provider: "embed", requiresStreamUrl: true });
});
app.get("/api/live/:lid", (req, res) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (!live) {
    res.status(404).json({ detail: "Live stream not found" });
    return;
  }
  res.json(live);
});
app.post("/api/live/:lid/start", (req, res) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (!live) {
    res.status(404).json({ detail: "Live stream not found" });
    return;
  }
  const { streamUrl } = req.body;
  if (streamUrl) {
    live.streamUrl = streamUrl;
    live.playback = {
      playbackType: streamUrl.includes("youtube") ? "youtube" : streamUrl.includes("facebook") ? "facebook" : streamUrl.includes(".m3u8") ? "hls" : "embed",
      playbackUrl: streamUrl
    };
  }
  live.status = "live";
  res.json(live);
});
app.post("/api/live/:lid/end", (req, res) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (!live) {
    res.status(404).json({ detail: "Live stream not found" });
    return;
  }
  live.status = "ended";
  live.replayUrl = live.playback?.playbackUrl || live.streamUrl;
  res.json(live);
});
app.post("/api/live/:lid/join", (req, res) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (live) {
    live.viewerCount = (live.viewerCount || 0) + 1;
  }
  res.json({ ok: true });
});
app.post("/api/live/:lid/leave", (req, res) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  if (live && live.viewerCount && live.viewerCount > 0) {
    live.viewerCount -= 1;
  }
  res.json({ ok: true });
});
app.post("/api/live/:lid/chat", (req, res) => {
  const user = getAuthUser(req);
  const lid = req.params.lid;
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ detail: "Text is required" });
    return;
  }
  const msg = {
    id: `msg_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userPhoto: user.profilePhoto,
    text,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  liveChats[lid] = liveChats[lid] || [];
  liveChats[lid].push(msg);
  res.json(msg);
});
app.post("/api/live/:lid/react", (req, res) => {
  const live = liveSessions.find((l) => l.id === req.params.lid);
  const { emoji } = req.body;
  if (live && emoji) {
    live.reactions = live.reactions || {};
    live.reactions[emoji] = (live.reactions[emoji] || 0) + 1;
  }
  res.json({ ok: true });
});
app.post("/api/live/:lid/moderate", (req, res) => {
  res.json({ ok: true });
});
app.get("/api/admin/verify", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const adminScope = req.adminScope;
  res.json({
    verified: true,
    user: {
      id: adminUser.id,
      name: adminUser.name,
      phone: adminUser.phone,
      role: adminUser.role,
      adminRole,
      scope: adminScope,
      profilePhoto: adminUser.profilePhoto,
      village: adminUser.village
    }
  });
});
app.post("/api/admin/logout", (req, res) => {
  const user = getAuthUser(req);
  if (user) {
    const rawRole = (user.adminRole || user.role || "").toUpperCase();
    const role = rawRole === "MAIN_SAMAJ_ADMIN" ? "MAIN_SAMAJ_ADMIN" : rawRole === "SAMAJ_ADMIN" ? "SAMAJ_ADMIN" : "SUPER_ADMIN";
    logAdminAction({
      adminUserId: user.id,
      adminName: user.name,
      role,
      scope: {
        mainSamajId: user.mainSamajId || null,
        samajId: user.activeSamajId || null
      },
      action: "ADMIN_LOGOUT",
      details: { ip: req.ip }
    });
  }
  res.json({ ok: true });
});
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  const scope = req.adminScope;
  let scopedMembers = membersList;
  let scopedPosts = postsList;
  let scopedSamaj = samajList;
  let scopedGam = gamList;
  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    scopedGam = gamList.filter((g) => g.mainSamajId === scope.mainSamajId);
    scopedMembers = membersList.filter(
      (m) => m.mainSamajId === scope.mainSamajId || !m.samajId || m.samajId === DEFAULT_SAMAJ_ID
    );
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    scopedMembers = membersList.filter((m) => m.samajId === scope.samajId);
    scopedPosts = postsList.filter((p) => p.samajId === scope.samajId);
    scopedSamaj = samajList.filter((s) => s.id === scope.samajId);
  }
  const allUsers = Object.values(usersMap);
  const uniqueUsersCount = new Set(allUsers.map((u) => u.id)).size;
  const reelsCount = scopedPosts.filter((p) => p.mediaType === "video" || p.isReel).length;
  const pendingVerificationCount = allUsers.filter((u) => u.verificationStatus === "pending").length;
  const blockedCount = allUsers.filter((u) => u.isSuspended).length;
  const adminRolesCount = allUsers.filter((u) => {
    const r = (u.adminRole || u.role || "").toUpperCase();
    return ["SUPER_ADMIN", "MAIN_SAMAJ_ADMIN", "SAMAJ_ADMIN", "ADMIN"].includes(r);
  }).length;
  res.json({
    users: uniqueUsersCount,
    members: scopedMembers.length,
    mainSamaj: mainSamajList.length,
    gam: scopedGam.length,
    samaj: scopedSamaj.length,
    posts: scopedPosts.length,
    reels: reelsCount,
    reports: reportsList.length,
    blocks: blockedCount,
    adminRoles: adminRolesCount,
    auditLogs: auditLogsList.length,
    pendingVerification: pendingVerificationCount,
    events: eventsList.length,
    live: liveSessions.length,
    albums: albumsList.length
  });
});
app.get("/api/admin/users", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  const scope = req.adminScope;
  const q = (req.query.q || "").toLowerCase().trim();
  const seen = /* @__PURE__ */ new Set();
  let list = Object.values(usersMap).filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    list = list.filter((u) => u.mainSamajId === scope.mainSamajId || !u.activeSamajId || u.activeSamajId === DEFAULT_SAMAJ_ID);
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    list = list.filter((u) => u.activeSamajId === scope.samajId || u.samajIds?.includes(scope.samajId));
  }
  if (q) {
    list = list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.village && u.village.toLowerCase().includes(q)
    );
  }
  res.json({ items: list });
});
app.patch("/api/admin/users/:uid/suspend", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const target = resolveUser(req.params.uid);
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }
  if (target.role === "super_admin" || target.adminRole === "SUPER_ADMIN") {
    return res.status(403).json({ error: "Cannot suspend Super Admin" });
  }
  target.isSuspended = !target.isSuspended;
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: target.isSuspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
    targetId: target.id,
    targetType: "user",
    details: { targetName: target.name, phone: target.phone }
  });
  res.json({ ok: true, isSuspended: target.isSuspended });
});
app.patch("/api/admin/users/:uid/role", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin privilege required to manage admin roles." });
  }
  const { newRole, newAdminRole, mainSamajId, samajId } = req.body;
  const target = resolveUser(req.params.uid);
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }
  target.role = newRole || target.role;
  target.adminRole = newAdminRole;
  if (mainSamajId !== void 0) target.mainSamajId = mainSamajId;
  if (samajId !== void 0) target.activeSamajId = samajId;
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: "SUPER_ADMIN",
    action: "ADMIN_ROLE_UPDATED",
    targetId: target.id,
    targetType: "user",
    details: {
      targetName: target.name,
      newRole: target.role,
      newAdminRole: target.adminRole,
      mainSamajId: target.mainSamajId,
      samajId: target.activeSamajId
    }
  });
  res.json({ ok: true, user: target });
});
app.get("/api/admin/districts", requireAdmin, (_req, res) => {
  res.json({ items: districtList });
});
app.post("/api/admin/districts", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can create districts" });
  }
  const { name, nameGujarati, code } = req.body;
  if (!name || !nameGujarati) {
    return res.status(400).json({ error: "Name and Name in Gujarati are required" });
  }
  const id = `dist_${code?.toLowerCase() || name.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`;
  const newDistrict = {
    id,
    name,
    nameGujarati,
    code: code || name.toUpperCase().slice(0, 4),
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  districtList.push(newDistrict);
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "DISTRICT_CREATED",
    targetId: id,
    targetType: "district",
    details: { name, nameGujarati }
  });
  res.status(201).json(newDistrict);
});
app.patch("/api/admin/districts/:id", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can update districts" });
  }
  const dist = districtList.find((d) => d.id === req.params.id);
  if (!dist) return res.status(404).json({ error: "District not found" });
  if (req.body.name !== void 0) dist.name = req.body.name;
  if (req.body.nameGujarati !== void 0) dist.nameGujarati = req.body.nameGujarati;
  if (req.body.isActive !== void 0) dist.isActive = req.body.isActive;
  dist.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "DISTRICT_UPDATED",
    targetId: dist.id,
    targetType: "district",
    details: req.body
  });
  res.json(dist);
});
app.get("/api/admin/talukas", requireAdmin, (req, res) => {
  const districtId = req.query.districtId;
  let items = talukaList;
  if (districtId) {
    items = items.filter((t) => t.districtId === districtId);
  }
  res.json({ items });
});
app.post("/api/admin/talukas", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can create talukas" });
  }
  const { districtId, name, nameGujarati, code } = req.body;
  if (!districtId || !name || !nameGujarati) {
    return res.status(400).json({ error: "DistrictId, Name, and Name in Gujarati are required" });
  }
  const dist = districtList.find((d) => d.id === districtId);
  if (!dist) return res.status(400).json({ error: "Invalid districtId" });
  const id = `tal_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`;
  const newTaluka = {
    id,
    districtId,
    name,
    nameGujarati,
    code: code || name.toUpperCase().slice(0, 4),
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  talukaList.push(newTaluka);
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "TALUKA_CREATED",
    targetId: id,
    targetType: "taluka",
    details: { districtId, name, nameGujarati }
  });
  res.status(201).json(newTaluka);
});
app.patch("/api/admin/talukas/:id", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can update talukas" });
  }
  const tal = talukaList.find((t) => t.id === req.params.id);
  if (!tal) return res.status(404).json({ error: "Taluka not found" });
  if (req.body.name !== void 0) tal.name = req.body.name;
  if (req.body.nameGujarati !== void 0) tal.nameGujarati = req.body.nameGujarati;
  if (req.body.isActive !== void 0) tal.isActive = req.body.isActive;
  tal.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "TALUKA_UPDATED",
    targetId: tal.id,
    targetType: "taluka",
    details: req.body
  });
  res.json(tal);
});
app.get("/api/admin/villages", requireAdmin, (req, res) => {
  const districtId = req.query.districtId;
  const talukaId = req.query.talukaId;
  let items = villageList;
  if (districtId) items = items.filter((v) => v.districtId === districtId);
  if (talukaId) items = items.filter((v) => v.talukaId === talukaId);
  res.json({ items });
});
app.post("/api/admin/villages", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const { districtId, talukaId, name, nameGujarati, pincode } = req.body;
  if (!districtId || !talukaId || !name || !nameGujarati) {
    return res.status(400).json({ error: "DistrictId, TalukaId, Name and NameGujarati are required" });
  }
  const dist = districtList.find((d) => d.id === districtId);
  const tal = talukaList.find((t) => t.id === talukaId && t.districtId === districtId);
  if (!dist || !tal) return res.status(400).json({ error: "Invalid district or taluka association" });
  const id = `vil_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`;
  const newVillage = {
    id,
    districtId,
    talukaId,
    name,
    nameGujarati,
    pincode,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  villageList.push(newVillage);
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "VILLAGE_CREATED",
    targetId: id,
    targetType: "village",
    details: { districtId, talukaId, name, nameGujarati }
  });
  res.status(201).json(newVillage);
});
app.patch("/api/admin/villages/:id", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const vil = villageList.find((v) => v.id === req.params.id);
  if (!vil) return res.status(404).json({ error: "Village not found" });
  if (req.body.name !== void 0) vil.name = req.body.name;
  if (req.body.nameGujarati !== void 0) vil.nameGujarati = req.body.nameGujarati;
  if (req.body.pincode !== void 0) vil.pincode = req.body.pincode;
  if (req.body.isActive !== void 0) vil.isActive = req.body.isActive;
  vil.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "VILLAGE_UPDATED",
    targetId: vil.id,
    targetType: "village",
    details: req.body
  });
  res.json(vil);
});
app.get("/api/admin/main-samaj", requireAdmin, (_req, res) => {
  res.json({ items: mainSamajList });
});
app.post("/api/admin/main-samaj", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can create Main Samaj" });
  }
  const { name, nameEn, code, description } = req.body;
  if (!name || !nameEn) {
    return res.status(400).json({ error: "Name (Gujarati) and NameEn (English) are required" });
  }
  const id = `main_${code?.toLowerCase() || nameEn.toLowerCase().replace(/\s+/g, "_")}`;
  const newMain = {
    id,
    name,
    nameGujarati: name,
    nameEn,
    code: code || nameEn.toUpperCase().slice(0, 6),
    description,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  mainSamajList.push(newMain);
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "MAIN_SAMAJ_CREATED",
    targetId: id,
    targetType: "main_samaj",
    details: { name, nameEn }
  });
  res.status(201).json(newMain);
});
app.patch("/api/admin/main-samaj/:id", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can update Main Samaj" });
  }
  const main = mainSamajList.find((m) => m.id === req.params.id);
  if (!main) return res.status(404).json({ error: "Main Samaj not found" });
  if (req.body.name !== void 0) {
    main.name = req.body.name;
    main.nameGujarati = req.body.name;
  }
  if (req.body.nameEn !== void 0) main.nameEn = req.body.nameEn;
  if (req.body.description !== void 0) main.description = req.body.description;
  if (req.body.isActive !== void 0) main.isActive = req.body.isActive;
  main.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "MAIN_SAMAJ_UPDATED",
    targetId: main.id,
    targetType: "main_samaj",
    details: req.body
  });
  res.json(main);
});
app.get("/api/admin/gam", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  const scope = req.adminScope;
  let list = villageList.map((v) => {
    const dist = districtList.find((d) => d.id === v.districtId);
    const tal = talukaList.find((t) => t.id === v.talukaId);
    return {
      id: v.id,
      name: v.nameGujarati || v.name,
      nameEn: v.name,
      district: dist?.nameGujarati || dist?.name || "",
      taluka: tal?.nameGujarati || tal?.name || "",
      mainSamajId: "main_patidar",
      isActive: v.isActive,
      createdAt: v.createdAt || (/* @__PURE__ */ new Date("2024-01-01")).toISOString()
    };
  });
  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    list = list.filter((g) => g.mainSamajId === scope.mainSamajId);
  }
  res.json({ items: list });
});
app.get("/api/admin/samaj", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  const scope = req.adminScope;
  let list = samajList;
  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    list = list.filter((s) => s.mainSamajId === scope.mainSamajId);
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    list = list.filter((s) => s.id === scope.samajId);
  }
  res.json({ items: list });
});
app.post("/api/admin/samaj", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const { name, nameEn, code, mainSamajId, districtId, talukaId, villageId } = req.body;
  if (!name || !mainSamajId) {
    return res.status(400).json({ error: "Name and mainSamajId are required" });
  }
  const id = `samaj_${code?.toLowerCase() || Date.now().toString()}`;
  const newSamaj = {
    id,
    name,
    nameGujarati: name,
    nameEn: nameEn || name,
    code: code || id.toUpperCase().slice(0, 6),
    mainSamajId,
    districtId,
    talukaId,
    villageId,
    gamIds: villageId ? [villageId] : [],
    isActive: true,
    requirePostApproval: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  samajList.push(newSamaj);
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "SAMAJ_CREATED",
    targetId: id,
    targetType: "samaj",
    details: { name, mainSamajId, districtId, talukaId }
  });
  res.status(201).json(newSamaj);
});
app.patch("/api/admin/samaj/:id", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const samaj = samajList.find((s) => s.id === req.params.id);
  if (!samaj) return res.status(404).json({ error: "Samaj not found" });
  if (req.body.name !== void 0) {
    samaj.name = req.body.name;
    samaj.nameGujarati = req.body.name;
  }
  if (req.body.nameEn !== void 0) samaj.nameEn = req.body.nameEn;
  if (req.body.requirePostApproval !== void 0) {
    samaj.requirePostApproval = req.body.requirePostApproval;
  }
  if (req.body.isActive !== void 0) {
    samaj.isActive = req.body.isActive;
  }
  if (req.body.districtId !== void 0) samaj.districtId = req.body.districtId;
  if (req.body.talukaId !== void 0) samaj.talukaId = req.body.talukaId;
  if (req.body.villageId !== void 0) {
    samaj.villageId = req.body.villageId;
    if (!samaj.gamIds) samaj.gamIds = [];
    if (!samaj.gamIds.includes(req.body.villageId)) samaj.gamIds.push(req.body.villageId);
  }
  samaj.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  persistMasterData();
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "SAMAJ_SETTINGS_UPDATED",
    targetId: samaj.id,
    targetType: "samaj",
    details: { requirePostApproval: samaj.requirePostApproval, isActive: samaj.isActive }
  });
  res.json(samaj);
});
app.get("/api/admin/samaj/change-requests", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  const adminScope = req.adminScope;
  let filtered = [...samajChangeRequests];
  if (adminRole === "MAIN_SAMAJ_ADMIN" && adminScope.mainSamajId) {
    filtered = filtered.filter((r) => r.requestedMainSamajId === adminScope.mainSamajId);
  } else if (adminRole === "SAMAJ_ADMIN" && adminScope.samajId) {
    filtered = filtered.filter((r) => r.requestedSamajId === adminScope.samajId);
  }
  res.json({ items: filtered.reverse() });
});
app.post("/api/admin/samaj/change-requests/:id/approve", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const adminScope = req.adminScope;
  const request = samajChangeRequests.find((r) => r.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ error: "Request has already been reviewed", status: request.status });
  }
  if (adminRole === "SAMAJ_ADMIN" && adminScope.samajId && adminScope.samajId !== request.requestedSamajId) {
    return res.status(403).json({ error: "Unauthorized: You can only approve requests for your assigned Samaj" });
  }
  if (adminRole === "MAIN_SAMAJ_ADMIN" && adminScope.mainSamajId && adminScope.mainSamajId !== request.requestedMainSamajId) {
    return res.status(403).json({ error: "Unauthorized: You can only approve requests for your Main Samaj" });
  }
  const targetUser = usersMap[request.userId] || Object.values(usersMap).find((u) => u.id === request.userId);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!targetUser.samajIds) targetUser.samajIds = [];
  if (!targetUser.samajIds.includes(request.requestedSamajId)) {
    targetUser.samajIds.push(request.requestedSamajId);
  }
  targetUser.activeSamajId = request.requestedSamajId;
  if (request.requestedMainSamajId) targetUser.mainSamajId = request.requestedMainSamajId;
  if (request.requestedGam) targetUser.village = request.requestedGam;
  request.status = "APPROVED";
  request.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  request.reviewedBy = adminUser.id;
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "SAMAJ_CHANGE_APPROVED",
    targetId: request.id,
    targetType: "user",
    details: {
      userId: targetUser.id,
      newSamajId: request.requestedSamajId,
      newSamajName: request.requestedSamajName
    }
  });
  res.json({
    ok: true,
    request,
    message: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AAC\u0AA6\u0AB2\u0AB5\u0ABE\u0AA8\u0AC0 \u0AB5\u0ABF\u0AA8\u0A82\u0AA4\u0AC0 \u0AB8\u0AAB\u0AB3\u0AA4\u0ABE\u0AAA\u0AC2\u0AB0\u0ACD\u0AB5\u0A95 \u0AAE\u0A82\u0A9C\u0AC2\u0AB0 \u0AA5\u0A88 \u0A97\u0A88. \u0AB8\u0AAD\u0ACD\u0AAF\u0AA8\u0ACB \u0AB8\u0A95\u0ACD\u0AB0\u0ABF\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C \u0AAC\u0AA6\u0AB2\u0ABE\u0A88 \u0A97\u0AAF\u0ACB \u0A9B\u0AC7."
  });
});
app.post("/api/admin/samaj/change-requests/:id/reject", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const adminScope = req.adminScope;
  const request = samajChangeRequests.find((r) => r.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ error: "Request has already been reviewed", status: request.status });
  }
  if (adminRole === "SAMAJ_ADMIN" && adminScope.samajId && adminScope.samajId !== request.requestedSamajId) {
    return res.status(403).json({ error: "Unauthorized: You can only reject requests for your assigned Samaj" });
  }
  if (adminRole === "MAIN_SAMAJ_ADMIN" && adminScope.mainSamajId && adminScope.mainSamajId !== request.requestedMainSamajId) {
    return res.status(403).json({ error: "Unauthorized: You can only reject requests for your Main Samaj" });
  }
  request.status = "REJECTED";
  request.rejectionReason = req.body.rejectionReason || "\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AB5\u0ABF\u0A97\u0AA4\u0ACB / \u0AB5\u0AC7\u0AB0\u0ABF\u0AAB\u0ABF\u0A95\u0AC7\u0AB6\u0AA8 \u0AAA\u0AC2\u0AB0\u0ACD\u0AA3 \u0AA8\u0AA5\u0AC0";
  request.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  request.reviewedBy = adminUser.id;
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "SAMAJ_CHANGE_REJECTED",
    targetId: request.id,
    targetType: "user",
    details: {
      userId: request.userId,
      reason: request.rejectionReason
    }
  });
  res.json({
    ok: true,
    request,
    message: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AAC\u0AA6\u0AB2\u0AB5\u0ABE\u0AA8\u0AC0 \u0AB5\u0ABF\u0AA8\u0A82\u0AA4\u0AC0 \u0A85\u0AB8\u0ACD\u0AB5\u0AC0\u0A95\u0ABE\u0AB0 \u0A95\u0AB0\u0AB5\u0ABE\u0AAE\u0ABE\u0A82 \u0A86\u0AB5\u0AC0."
  });
});
app.get("/api/admin/verification", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  const scope = req.adminScope;
  const allUsers = Object.values(usersMap);
  let pending = allUsers.filter((u) => u.verificationStatus === "pending");
  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    pending = pending.filter((u) => u.mainSamajId === scope.mainSamajId);
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    pending = pending.filter((u) => u.activeSamajId === scope.samajId);
  }
  res.json({ items: pending, count: pending.length });
});
function adminCanManageUser(targetUser, adminRole, scope) {
  if (adminRole === "SUPER_ADMIN") return true;
  if (adminRole === "MAIN_SAMAJ_ADMIN") return Boolean(scope.mainSamajId) && targetUser.mainSamajId === scope.mainSamajId;
  if (adminRole === "SAMAJ_ADMIN") return Boolean(scope.samajId) && targetUser.activeSamajId === scope.samajId;
  return false;
}
app.post("/api/admin/verification/:uid/approve", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const scope = req.adminScope;
  const target = resolveUser(req.params.uid);
  if (!target) return res.status(404).json({ detail: "User not found" });
  if (!adminCanManageUser(target, adminRole, scope)) {
    return res.status(403).json({ detail: "Forbidden: outside your Samaj scope" });
  }
  target.verificationStatus = "verified";
  target.verifiedAt = (/* @__PURE__ */ new Date()).toISOString();
  target.verifiedBy = adminUser.id;
  target.rejectionReason = null;
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "VERIFICATION_APPROVED",
    details: { targetUserId: target.id, targetName: target.name }
  });
  res.json({ success: true, user: { id: target.id, name: target.name, ...getVerificationState(target) } });
});
app.post("/api/admin/verification/:uid/reject", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const scope = req.adminScope;
  const reason = (req.body?.reason || "").toString().trim();
  if (!reason) return res.status(400).json({ detail: "Rejection reason is required" });
  const target = resolveUser(req.params.uid);
  if (!target) return res.status(404).json({ detail: "User not found" });
  if (!adminCanManageUser(target, adminRole, scope)) {
    return res.status(403).json({ detail: "Forbidden: outside your Samaj scope" });
  }
  target.verificationStatus = "rejected";
  target.rejectionReason = reason;
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "VERIFICATION_REJECTED",
    details: { targetUserId: target.id, targetName: target.name, reason }
  });
  res.json({ success: true, user: { id: target.id, name: target.name, ...getVerificationState(target) } });
});
app.get("/api/admin/posts", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  const scope = req.adminScope;
  let list = postsList;
  if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    list = list.filter((p) => p.samajId === scope.samajId);
  }
  res.json({ items: list });
});
app.patch("/api/admin/posts/:pid", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const post = postsList.find((p) => p.id === req.params.pid);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const { status, approved } = req.body;
  if (status !== void 0) post.status = status;
  if (approved !== void 0) post.approved = approved;
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: `POST_${(status || "MODERATED").toUpperCase()}`,
    targetId: post.id,
    targetType: "post",
    details: { status: post.status, approved: post.approved }
  });
  res.json(post);
});
app.get("/api/admin/reels", requireAdmin, (req, res) => {
  const reels = postsList.filter((p) => p.mediaType === "video" || p.isReel);
  res.json({ items: reels });
});
app.get("/api/admin/reports", requireAdmin, (req, res) => {
  res.json({ items: reportsList });
});
app.patch("/api/admin/reports/:rid/resolve", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const report = reportsList.find((r) => r.id === req.params.rid);
  if (!report) return res.status(404).json({ error: "Report not found" });
  report.status = "resolved";
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: adminRole,
    action: "REPORT_RESOLVED",
    targetId: report.id,
    targetType: "report",
    details: { reason: report.reason }
  });
  res.json({ ok: true, report });
});
app.patch("/api/admin/reports/:rid", requireAdmin, (req, res) => {
  const report = reportsList.find((r) => r.id === req.params.rid);
  if (!report) return res.status(404).json({ error: "Report not found" });
  if (req.body.status) report.status = req.body.status;
  res.json({ ok: true, report });
});
app.post("/api/admin/posts/:pid/moderate", requireAdmin, (req, res) => {
  const post = postsList.find((p) => p.id === req.params.pid);
  if (!post) return res.status(404).json({ detail: "Post not found" });
  const { action } = req.body;
  if (action === "approve") {
    post.approved = true;
    post.status = "active";
  } else if (action === "reject" || action === "delete") {
    post.status = "deleted";
  } else if (action === "hide") {
    post.status = "hidden";
  } else if (action === "unhide") {
    post.status = "active";
  }
  res.json({ ok: true, post });
});
app.post("/api/admin/comments/:cid/moderate", requireAdmin, (req, res) => {
  const cid = req.params.cid;
  for (const pid in commentsList) {
    const idx = commentsList[pid].findIndex((c) => c.id === cid);
    if (idx !== -1) {
      commentsList[pid].splice(idx, 1);
      const post = postsList.find((p) => p.id === pid);
      if (post && post.commentsCount) post.commentsCount = Math.max(0, post.commentsCount - 1);
      return res.json({ ok: true });
    }
  }
  res.json({ ok: true });
});
app.get("/api/admin/blocks", requireAdmin, (req, res) => {
  const allUsers = Object.values(usersMap);
  const seen = /* @__PURE__ */ new Set();
  const blocked = allUsers.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return u.isSuspended || u.blocked && u.blocked.length > 0;
  });
  res.json({ items: blocked });
});
app.get("/api/admin/roles", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin access required." });
  }
  const allUsers = Object.values(usersMap);
  const seen = /* @__PURE__ */ new Set();
  const adminUsers = allUsers.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    const r = (u.adminRole || u.role || "").toUpperCase();
    return ["SUPER_ADMIN", "MAIN_SAMAJ_ADMIN", "SAMAJ_ADMIN", "ADMIN"].includes(r);
  });
  res.json({
    roles: [
      {
        role: "SUPER_ADMIN",
        title: "\u0AB8\u0AC1\u0AAA\u0AB0 \u0A8F\u0AA1\u0AAE\u0ABF\u0AA8 (Super Administrator)",
        description: "\u0AB8\u0A82\u0AAA\u0AC2\u0AB0\u0ACD\u0AA3 \u0AB8\u0ABF\u0AB8\u0ACD\u0A9F\u0AAE\u0AA8\u0AC1\u0A82 \u0AB8\u0A82\u0A9A\u0ABE\u0AB2\u0AA8, \u0AA4\u0AAE\u0ABE\u0AAE \u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C, \u0A97\u0ABE\u0AAE, \u0AB8\u0AAE\u0ABE\u0A9C \u0AB6\u0ABE\u0A96\u0ABE\u0A93, \u0A85\u0AA8\u0AC7 \u0A8F\u0AA1\u0AAE\u0ABF\u0AA8 \u0A85\u0AA7\u0ABF\u0A95\u0ABE\u0AB0\u0ACB",
        scopeType: "GLOBAL"
      },
      {
        role: "MAIN_SAMAJ_ADMIN",
        title: "\u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C \u0AB8\u0A82\u0A9A\u0ABE\u0AB2\u0A95 (Main Samaj Admin)",
        description: "\u0A85\u0AA7\u0ABF\u0A95\u0AC3\u0AA4 \u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB8\u0AAE\u0ABE\u0A9C \u0A85\u0AA8\u0AC7 \u0AA4\u0AC7\u0AA8\u0ABE \u0AB8\u0A82\u0AB2\u0A97\u0ACD\u0AA8 \u0A97\u0ABE\u0AAE \u0A85\u0AA8\u0AC7 \u0AB6\u0ABE\u0A96\u0ABE\u0A93\u0AA8\u0AC1\u0A82 \u0AB5\u0AB9\u0AC0\u0AB5\u0A9F\u0AC0 \u0AB8\u0A82\u0A9A\u0ABE\u0AB2\u0AA8",
        scopeType: "MAIN_SAMAJ"
      },
      {
        role: "SAMAJ_ADMIN",
        title: "\u0AB8\u0AAE\u0ABE\u0A9C \u0AB6\u0ABE\u0A96\u0ABE \u0AB8\u0A82\u0A9A\u0ABE\u0AB2\u0A95 (Samaj Chapter Admin)",
        description: "\u0A85\u0AA7\u0ABF\u0A95\u0AC3\u0AA4 \u0AB8\u0ACD\u0AA5\u0ABE\u0AA8\u0ABF\u0A95 \u0AB8\u0AAE\u0ABE\u0A9C \u0AB6\u0ABE\u0A96\u0ABE\u0AA8\u0ABE \u0AB8\u0AAD\u0ACD\u0AAF\u0ACB, \u0AAA\u0ACB\u0AB8\u0ACD\u0A9F\u0ACD\u0AB8 \u0A85\u0AA8\u0AC7 \u0AB5\u0AC7\u0AB0\u0ABF\u0AAB\u0ABF\u0A95\u0AC7\u0AB6\u0AA8 \u0AB8\u0A82\u0A9A\u0ABE\u0AB2\u0AA8",
        scopeType: "SAMAJ_CHAPTER"
      }
    ],
    administrators: adminUsers
  });
});
app.post("/api/admin/roles", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin access required." });
  }
  const { phone, userId, role, mainSamajId, samajId } = req.body;
  if (!role || !["SUPER_ADMIN", "MAIN_SAMAJ_ADMIN", "SAMAJ_ADMIN"].includes(role)) {
    return res.status(400).json({ error: "\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AB0\u0ACB\u0AB2 \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0ACB (SUPER_ADMIN, MAIN_SAMAJ_ADMIN, SAMAJ_ADMIN)." });
  }
  let targetUser = void 0;
  let digits = "";
  if (userId && usersMap[userId]) {
    targetUser = usersMap[userId];
    digits = (targetUser.phone || "").replace(/\D/g, "").slice(-10);
  } else if (phone) {
    digits = phone.replace(/\D/g, "").slice(-10);
    targetUser = Object.values(usersMap).find((u) => u.phone && u.phone.replace(/\D/g, "").slice(-10) === digits);
  }
  if (!digits) {
    return res.status(400).json({ error: "10 \u0A85\u0A82\u0A95\u0AA8\u0ACB \u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AAE\u0ACB\u0AAC\u0ABE\u0A87\u0AB2 \u0AA8\u0A82\u0AAC\u0AB0 \u0A85\u0AA5\u0AB5\u0ABE userId \u0AA6\u0ABE\u0A96\u0AB2 \u0A95\u0AB0\u0ACB." });
  }
  adminRolesMap[digits] = role;
  if (targetUser) {
    targetUser.adminRole = role;
    targetUser.role = role.toLowerCase();
    if (mainSamajId) targetUser.mainSamajId = mainSamajId;
    if (samajId) {
      targetUser.activeSamajId = samajId;
      if (!targetUser.samajIds.includes(samajId)) targetUser.samajIds.push(samajId);
      targetUser.samajRoles = targetUser.samajRoles || {};
      targetUser.samajRoles[samajId] = role.toLowerCase();
    }
  }
  logAdminAction({
    adminUserId: req.adminUser?.id || "super_admin",
    adminName: req.adminUser?.name || "Super Admin",
    role: "SUPER_ADMIN",
    action: "GRANT_ADMIN_ROLE",
    details: { phoneDigits: digits, role, mainSamajId, samajId }
  });
  saveStore(true);
  res.json({ success: true, message: "\u0A8F\u0AA1\u0AAE\u0ABF\u0AA8 \u0A85\u0AA7\u0ABF\u0A95\u0ABE\u0AB0 \u0AB8\u0AAB\u0AB3\u0AA4\u0ABE\u0AAA\u0AC2\u0AB0\u0ACD\u0AB5\u0A95 \u0A85\u0AAA\u0AA1\u0AC7\u0A9F \u0AA5\u0AAF\u0ACB.", digits, role });
});
app.delete("/api/admin/roles/:identifier", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin access required." });
  }
  const { identifier } = req.params;
  const digits = identifier.replace(/\D/g, "").slice(-10);
  delete adminRolesMap[digits];
  const targetUser = Object.values(usersMap).find(
    (u) => u.id === identifier || u.phone && u.phone.replace(/\D/g, "").slice(-10) === digits
  );
  if (targetUser) {
    targetUser.adminRole = null;
    targetUser.role = "member";
  }
  logAdminAction({
    adminUserId: req.adminUser?.id || "super_admin",
    adminName: req.adminUser?.name || "Super Admin",
    role: "SUPER_ADMIN",
    action: "REVOKE_ADMIN_ROLE",
    details: { identifier, digits }
  });
  saveStore(true);
  res.json({ success: true, message: "\u0A8F\u0AA1\u0AAE\u0ABF\u0AA8 \u0A85\u0AA7\u0ABF\u0A95\u0ABE\u0AB0 \u0AB8\u0AAB\u0AB3\u0AA4\u0ABE\u0AAA\u0AC2\u0AB0\u0ACD\u0AB5\u0A95 \u0AB0\u0AA6 \u0A95\u0AB0\u0AB5\u0ABE\u0AAE\u0ABE\u0A82 \u0A86\u0AB5\u0ACD\u0AAF\u0ACB." });
});
app.get("/api/admin/audit-logs", requireAdmin, (req, res) => {
  const adminRole = req.adminRole;
  const scope = req.adminScope;
  let list = auditLogsList;
  if (adminRole === "MAIN_SAMAJ_ADMIN" && scope.mainSamajId) {
    list = list.filter((l) => !l.scope?.mainSamajId || l.scope.mainSamajId === scope.mainSamajId);
  } else if (adminRole === "SAMAJ_ADMIN" && scope.samajId) {
    list = list.filter((l) => !l.scope?.samajId || l.scope.samajId === scope.samajId);
  }
  res.json({ items: list, count: list.length });
});
var platformSettings = {
  publicAccessEnabled: true,
  requireVerificationForPosting: false,
  maintenanceMode: false
};
app.get("/api/admin/settings", requireAdmin, (req, res) => {
  res.json(platformSettings);
});
app.patch("/api/admin/settings", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  if (adminRole !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden: Super Admin only" });
  }
  platformSettings = { ...platformSettings, ...req.body };
  logAdminAction({
    adminUserId: adminUser.id,
    adminName: adminUser.name,
    role: "SUPER_ADMIN",
    action: "SYSTEM_SETTINGS_UPDATED",
    details: platformSettings
  });
  res.json(platformSettings);
});
app.get("/api/admin/members", requireAdmin, (req, res) => {
  res.json({ items: membersList });
});
app.patch("/api/admin/members/:mid/toggle-active", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const adminRole = req.adminRole;
  const m = membersList.find((x) => x.id === req.params.mid);
  if (m) {
    m.isActive = !m.isActive;
    logAdminAction({
      adminUserId: adminUser.id,
      adminName: adminUser.name,
      role: adminRole,
      action: m.isActive ? "MEMBER_ACTIVATED" : "MEMBER_DEACTIVATED",
      targetId: m.id,
      targetType: "member",
      details: { name: m.name, mobile: m.mobile }
    });
  }
  res.json({ ok: true });
});
app.get("/api/notifications", (req, res) => {
  const authUser = getAuthUser(req);
  const currentUid = authUser?.id || "u1";
  const userSamajId = authUser?.activeSamajId || DEFAULT_SAMAJ_ID;
  const items = notificationsList.filter((n) => {
    if (n.authorId && n.authorId === currentUid) return false;
    if (n.userId === "all") {
      if (n.samajId && n.samajId !== userSamajId) return false;
      return true;
    }
    return n.userId === currentUid;
  });
  const since = req.query.since;
  let filtered = items;
  if (since) {
    const sinceDate = new Date(since);
    filtered = items.filter((n) => new Date(n.createdAt) > sinceDate);
  }
  res.json({
    items: filtered.slice(0, 50),
    unreadCount: items.filter((n) => !n.read).length
  });
});
app.post("/api/notifications/read", (req, res) => {
  const authUser = getAuthUser(req);
  const currentUid = authUser?.id || "u1";
  const { id } = req.body || {};
  if (id) {
    const target = notificationsList.find((n) => n.id === id);
    if (target) target.read = true;
  } else {
    notificationsList.forEach((n) => {
      if (n.userId === currentUid || n.userId === "all") n.read = true;
    });
  }
  res.json({ ok: true });
});
app.post("/api/notifications/test", (req, res) => {
  const authUser = getAuthUser(req);
  const type = req.body.type || "reel";
  const currentUid = authUser?.id || "u1";
  const testNotif = type === "message" ? {
    id: `notif_msg_${Date.now()}`,
    type: "message",
    title: "\u{1F4AC} \u0AA8\u0AB5\u0ACB \u0AAE\u0AC7\u0AB8\u0AC7\u0A9C: \u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE \u0AAA\u0A9F\u0AC7\u0AB2",
    body: "\u0A95\u0AC7\u0AAE \u0A9B\u0ACB? \u0AB8\u0AAE\u0ABE\u0A9C\u0AA8\u0ABE \u0A86\u0A97\u0ABE\u0AAE\u0AC0 \u0AB8\u0ACD\u0AA8\u0AC7\u0AB9\u0AAE\u0ABF\u0AB2\u0AA8 \u0A95\u0ABE\u0AB0\u0ACD\u0AAF\u0A95\u0ACD\u0AB0\u0AAE\u0AAE\u0ABE\u0A82 \u0AA4\u0AAE\u0AC7 \u0A86\u0AB5\u0AB5\u0ABE\u0AA8\u0ABE \u0A9B\u0ACB? \u0A9C\u0AB0\u0AC2\u0AB0 \u0A9C\u0AA3\u0ABE\u0AB5\u0AB6\u0ACB!",
    link: "/messages",
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    userId: currentUid,
    authorName: "\u0AAA\u0ACD\u0AB0\u0ABF\u0AAF\u0A82\u0A95\u0ABE \u0AAA\u0A9F\u0AC7\u0AB2",
    authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    conversationId: "conv_1"
  } : {
    id: `notif_reel_${Date.now()}`,
    type: "reel",
    title: "\u{1F3AC} \u0AA8\u0AB5\u0AC0 \u0AB0\u0AC0\u0AB2: \u0AB0\u0ACB\u0AB9\u0AA8 \u0AAA\u0A9F\u0AC7\u0AB2",
    body: "\u0AA8\u0AB5\u0AB0\u0ABE\u0AA4\u0ACD\u0AB0\u0AC0 \u0AB0\u0ABE\u0AB8\u0ACB\u0AA4\u0ACD\u0AB8\u0AB5 2026 \u0AA8\u0AC0 \u0AAD\u0AB5\u0ACD\u0AAF \u0AA4\u0AC8\u0AAF\u0ABE\u0AB0\u0AC0\u0A93! \u{1F483}\u{1F57A} \u0A9C\u0AC1\u0A93 \u0AB8\u0AC1\u0A82\u0AA6\u0AB0 \u0A9D\u0AB2\u0A95!",
    link: "/reels",
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    userId: "all",
    authorId: "other_user",
    authorName: "\u0AB0\u0ACB\u0AB9\u0AA8 \u0AAA\u0A9F\u0AC7\u0AB2",
    authorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    reelId: "reel_test"
  };
  notificationsList.unshift(testNotif);
  res.json({ ok: true, item: testNotif });
});
app.post("/api/presence", (req, res) => {
  res.json({ ok: true });
});
app.post("/api/devices", (req, res) => {
  res.json({ ok: true });
});
app.get("/api/search", (req, res) => {
  const authUser = getAuthUser(req);
  const q = (req.query.q || "").toLowerCase().trim();
  const matchedMembers = membersList.filter(
    (m) => m.name.toLowerCase().includes(q) || m.village.toLowerCase().includes(q) || m.mobile.includes(q)
  ).map((m) => {
    const uid = `user_${m.mobile.slice(-10)}`;
    const resolved = resolveUser(uid);
    return {
      ...m,
      userId: uid,
      followersCount: resolved?.followersCount || 24,
      followingCount: resolved?.followingCount || 15,
      followedByMe: followRelationsMap.has(`${authUser.id}_${uid}`)
    };
  });
  const matchedEvents = eventsList.filter(
    (e) => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
  );
  const matchedPosts = postsList.filter(
    (p) => p.status !== "deleted" && (p.content && p.content.toLowerCase().includes(q) || p.caption && p.caption.toLowerCase().includes(q) || p.location && p.location.toLowerCase().includes(q))
  ).filter((p) => canUserViewPost(p, authUser)).map((p) => ({
    ...p,
    likedByMe: p.likedBy?.includes(authUser.id) || false,
    savedByMe: p.savedBy?.includes(authUser.id) || false,
    mediaUrls: p.mediaUrls || p.imageUrls || [],
    imageUrls: p.imageUrls || p.mediaUrls || [],
    content: p.content || p.caption || "",
    isOwner: p.authorId === authUser.id
  }));
  res.json({
    members: matchedMembers,
    events: matchedEvents,
    posts: matchedPosts
  });
});
var STORE_FILE = import_path.default.join(DATA_DIR, "store.json");
var saveStoreTimer = null;
function saveStore(immediate = false) {
  const doSave = () => {
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      const state = {
        usersMap,
        adminRolesMap,
        postsList,
        commentsList,
        storiesList,
        hallsList,
        bookingsList,
        albumsList,
        eventsList,
        membersList,
        maranNodhList,
        familyTreeList,
        reportsList,
        auditLogsList,
        conversationsMap,
        messagesMap,
        platformSettings,
        savedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const tmpFile = `${STORE_FILE}.tmp`;
      import_fs.default.writeFileSync(tmpFile, JSON.stringify(state, null, 2), "utf-8");
      import_fs.default.renameSync(tmpFile, STORE_FILE);
    } catch (err) {
      console.error("[Store] Failed to write store.json:", err);
    }
  };
  if (immediate) {
    if (saveStoreTimer) clearTimeout(saveStoreTimer);
    saveStoreTimer = null;
    doSave();
  } else {
    if (saveStoreTimer) clearTimeout(saveStoreTimer);
    saveStoreTimer = setTimeout(doSave, 300);
  }
}
function loadStore() {
  try {
    if (!import_fs.default.existsSync(STORE_FILE)) {
      console.log("[Store] No existing store.json found. Creating initial snapshot...");
      saveStore(true);
      return false;
    }
    const raw = import_fs.default.readFileSync(STORE_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (data.usersMap) Object.assign(usersMap, data.usersMap);
    if (data.adminRolesMap) Object.assign(adminRolesMap, data.adminRolesMap);
    if (!adminRolesMap["9876543210"]) adminRolesMap["9876543210"] = "SUPER_ADMIN";
    if (Array.isArray(data.postsList) && data.postsList.length > 0) postsList = data.postsList;
    if (data.commentsList) Object.assign(commentsList, data.commentsList);
    if (Array.isArray(data.storiesList) && data.storiesList.length > 0) storiesList = data.storiesList;
    if (Array.isArray(data.hallsList) && data.hallsList.length > 0) hallsList = data.hallsList;
    if (Array.isArray(data.bookingsList) && data.bookingsList.length > 0) bookingsList = data.bookingsList;
    if (Array.isArray(data.albumsList) && data.albumsList.length > 0) albumsList = data.albumsList;
    if (Array.isArray(data.eventsList) && data.eventsList.length > 0) eventsList = data.eventsList;
    if (Array.isArray(data.membersList) && data.membersList.length > 0) membersList = data.membersList;
    if (Array.isArray(data.maranNodhList) && data.maranNodhList.length > 0) maranNodhList = data.maranNodhList;
    if (Array.isArray(data.familyTreeList) && data.familyTreeList.length > 0) familyTreeList = data.familyTreeList;
    if (Array.isArray(data.reportsList)) reportsList = data.reportsList;
    if (Array.isArray(data.auditLogsList)) auditLogsList = data.auditLogsList;
    if (data.conversationsMap) Object.assign(conversationsMap, data.conversationsMap);
    if (data.messagesMap) Object.assign(messagesMap, data.messagesMap);
    if (data.platformSettings) platformSettings = { ...platformSettings, ...data.platformSettings };
    syncAllMaranNodhToReels();
    console.log(`[Store] Successfully loaded persistent state from ${STORE_FILE}`);
    return true;
  } catch (err) {
    console.error("[Store] Failed to load store.json:", err);
    return false;
  }
}
function syncAllMaranNodhToReels() {
  for (const m of maranNodhList) {
    const alreadyInPosts = postsList.some((p) => p.maranNodhId === m.id || p.id === `post_memorial_${m.id}`);
    if (!alreadyInPosts) {
      const photo = m.photo || (m.gender === "female" ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80");
      postsList.unshift({
        id: `post_memorial_${m.id}`,
        authorId: m.createdBy || "admin",
        authorName: "\u0AB8\u0AAE\u0ABE\u0A9C \u0A95\u0ABE\u0AB0\u0ACD\u0AAF\u0ABE\u0AB2\u0AAF",
        authorPhoto: null,
        authorRole: "admin",
        content: `\u{1F54A}\uFE0F \u0AAD\u0ABE\u0AB5\u0AAD\u0AC0\u0AA8\u0AC0 \u0AB6\u0ACD\u0AB0\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0A9C\u0AB2\u0ABF
\u0AB8\u0ACD\u0AB5. ${m.deceasedName}
\u0A89\u0A82\u0AAE\u0AB0: ${m.age || "-"} \u0AB5\u0AB0\u0ACD\u0AB7
\u0AB5\u0AA4\u0AA8: ${m.village || "-"}
\u0AB9\u0ABE\u0AB2: ${m.currentCity || "-"}
\u0AB8\u0ACD\u0AB5\u0AB0\u0ACD\u0A97\u0AB5\u0ABE\u0AB8 \u0AA4\u0ABE\u0AB0\u0AC0\u0A96: ${m.passedDate}

\u0AAC\u0AC7\u0AB8\u0AA3\u0AC1\u0A82: ${m.besnuDate || "\u0A9C\u0ABE\u0AB9\u0AC7\u0AB0 \u0AA5\u0AB6\u0AC7"} (${m.besnuTime || ""})
\u0AB8\u0ACD\u0AA5\u0AB3: ${m.besnuVenue || ""}
\u0AAA\u0AB0\u0ABF\u0AB5\u0ABE\u0AB0: ${m.grievingFamily || ""}

\u0AB8\u0AA6\u0ACD\u0A97\u0AA4\u0AA8\u0ABE \u0A86\u0AA4\u0ACD\u0AAE\u0ABE\u0AA8\u0AC7 \u0AAA\u0AB0\u0AAE \u0AB6\u0ABE\u0A82\u0AA4\u0ABF \u0A85\u0AB0\u0ACD\u0AAA\u0AC7 \u0AA4\u0AC7\u0AB5\u0AC0 \u0AAA\u0ACD\u0AB0\u0AAD\u0AC1 \u0A9A\u0AB0\u0AA3\u0ACB\u0AAE\u0ABE\u0A82 \u0AAA\u0ACD\u0AB0\u0ABE\u0AB0\u0ACD\u0AA5\u0AA8\u0ABE. \u0AD0 \u0AB6\u0ABE\u0A82\u0AA4\u0ABF \u{1F54A}\uFE0F`,
        caption: `\u{1F54A}\uFE0F \u0AAD\u0ABE\u0AB5\u0AAD\u0AC0\u0AA8\u0AC0 \u0AB6\u0ACD\u0AB0\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0A9C\u0AB2\u0ABF: \u0AB8\u0ACD\u0AB5. ${m.deceasedName} (\u0AB5\u0AA4\u0AA8: ${m.village || "-"})`,
        mediaUrls: [photo],
        imageUrls: [photo],
        mediaType: "reel",
        isReel: true,
        isMemorial: true,
        category: "memorial",
        maranNodhId: m.id,
        maranNodhData: {
          id: m.id,
          deceasedName: m.deceasedName,
          name: m.deceasedName,
          age: m.age,
          passedDate: m.passedDate,
          deathDate: m.passedDate,
          besnuDate: m.besnuDate,
          besnuTime: m.besnuTime,
          besnuVenue: m.besnuVenue,
          village: m.village,
          currentCity: m.currentCity,
          contactPhone: m.contactPhone,
          grievingFamily: m.grievingFamily,
          photo,
          diyaCount: m.diyaCount || 0,
          flowerCount: m.flowerCount || 0
        },
        visibility: "samaj",
        samajId: m.samajId || DEFAULT_SAMAJ_ID,
        audioTitle: "\u0AD0 \u0AB6\u0ABE\u0A82\u0AA4\u0ABF \u2022 \u0AAD\u0ABE\u0AB5\u0AAD\u0AC0\u0AA8\u0AC0 \u0AB6\u0ACD\u0AB0\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0A9C\u0AB2\u0ABF",
        location: m.village ? `${m.village}` : m.currentCity || "\u0AB8\u0AAE\u0ABE\u0A9C",
        likedBy: [],
        savedBy: [],
        likesCount: m.diyaCount || 0,
        commentsCount: m.condolences?.length || 0,
        approved: true,
        status: "active",
        createdAt: m.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
}
async function startServer() {
  loadStore();
  app.use(import_express.default.static(import_path.default.join(process.cwd(), "public"), { index: false }));
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Samaj Connect server running on port ${PORT} at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isUserOnboardingCompleted,
  loadStore,
  logAdminAction,
  notificationsList,
  persistMasterData,
  requireCompletedOnboarding,
  syncAllMaranNodhToReels
});
//# sourceMappingURL=server.cjs.map
