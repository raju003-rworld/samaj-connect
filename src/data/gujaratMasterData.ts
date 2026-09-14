export interface District {
  id: string;
  name: string;
  nameGujarati: string;
  state: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Taluka {
  id: string;
  districtId: string;
  name: string;
  nameGujarati: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Village {
  id: string;
  districtId: string;
  talukaId: string;
  name: string;
  nameGujarati: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MainSamajItem {
  id: string;
  name: string;
  nameGujarati: string;
  nameEn: string;
  code: string;
  aliases: string[];
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SamajItem {
  id: string;
  mainSamajId: string;
  districtId: string;
  talukaId: string;
  villageId: string;
  name: string;
  nameGujarati: string;
  nameEn?: string;
  code: string;
  gamIds?: string[];
  district?: string;
  isActive: boolean;
  requirePostApproval: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const initialDistricts: District[] = [
  { id: "dist_kachchh", name: "Kachchh", nameGujarati: "કચ્છ", state: "Gujarat", isActive: true },
  { id: "dist_ahmedabad", name: "Ahmedabad", nameGujarati: "અમદાવાદ", state: "Gujarat", isActive: true },
  { id: "dist_mehsana", name: "Mehsana", nameGujarati: "મહેસાણા", state: "Gujarat", isActive: true },
  { id: "dist_surat", name: "Surat", nameGujarati: "સુરત", state: "Gujarat", isActive: true },
  { id: "dist_rajkot", name: "Rajkot", nameGujarati: "રાજકોટ", state: "Gujarat", isActive: true },
  { id: "dist_patan", name: "Patan", nameGujarati: "પાટણ", state: "Gujarat", isActive: true },
  { id: "dist_vadodara", name: "Vadodara", nameGujarati: "વડોદરા", state: "Gujarat", isActive: true },
  { id: "dist_gandhinagar", name: "Gandhinagar", nameGujarati: "ગાંધીનગર", state: "Gujarat", isActive: true },
  { id: "dist_jamnagar", name: "Jamnagar", nameGujarati: "જામનગર", state: "Gujarat", isActive: true },
  { id: "dist_bhavnagar", name: "Bhavnagar", nameGujarati: "ભાવનગર", state: "Gujarat", isActive: true },
  { id: "dist_junagadh", name: "Junagadh", nameGujarati: "જૂનાગઢ", state: "Gujarat", isActive: true },
  { id: "dist_anand", name: "Anand", nameGujarati: "આણંદ", state: "Gujarat", isActive: true },
  { id: "dist_kheda", name: "Kheda", nameGujarati: "ખેડા", state: "Gujarat", isActive: true },
  { id: "dist_bharuch", name: "Bharuch", nameGujarati: "ભરૂચ", state: "Gujarat", isActive: true },
  { id: "dist_navsari", name: "Navsari", nameGujarati: "નવસારી", state: "Gujarat", isActive: true },
  { id: "dist_valsad", name: "Valsad", nameGujarati: "વલસાડ", state: "Gujarat", isActive: true },
  { id: "dist_morbi", name: "Morbi", nameGujarati: "મોરબી", state: "Gujarat", isActive: true },
  { id: "dist_surendranagar", name: "Surendranagar", nameGujarati: "સુરેન્દ્રનગર", state: "Gujarat", isActive: true },
  { id: "dist_amreli", name: "Amreli", nameGujarati: "અમરેલી", state: "Gujarat", isActive: true },
  { id: "dist_banaskantha", name: "Banaskantha", nameGujarati: "બનાસકાંઠા", state: "Gujarat", isActive: true },
  { id: "dist_sabarkantha", name: "Sabarkantha", nameGujarati: "સાબરકાંઠા", state: "Gujarat", isActive: true },
  { id: "dist_aravalli", name: "Aravalli", nameGujarati: "અરવલ્લી", state: "Gujarat", isActive: true },
  { id: "dist_botad", name: "Botad", nameGujarati: "બોટાદ", state: "Gujarat", isActive: true },
  { id: "dist_chhota_udepur", name: "Chhota Udaipur", nameGujarati: "છોટા ઉદેપુર", state: "Gujarat", isActive: true },
  { id: "dist_dahod", name: "Dahod", nameGujarati: "દાહોદ", state: "Gujarat", isActive: true },
  { id: "dist_dang", name: "Dang", nameGujarati: "ડાંગ", state: "Gujarat", isActive: true },
  { id: "dist_devbhumi_dwarka", name: "Devbhumi Dwarka", nameGujarati: "દેવભૂમિ દ્વારકા", state: "Gujarat", isActive: true },
  { id: "dist_gir_somnath", name: "Gir Somnath", nameGujarati: "ગીર સોમનાથ", state: "Gujarat", isActive: true },
  { id: "dist_mahisagar", name: "Mahisagar", nameGujarati: "મહીસાગર", state: "Gujarat", isActive: true },
  { id: "dist_narmada", name: "Narmada", nameGujarati: "નર્મદા", state: "Gujarat", isActive: true },
  { id: "dist_panchmahal", name: "Panchmahal", nameGujarati: "પંચમહાલ", state: "Gujarat", isActive: true },
  { id: "dist_porbandar", name: "Porbandar", nameGujarati: "પોરબંદર", state: "Gujarat", isActive: true },
  { id: "dist_tapi", name: "Tapi", nameGujarati: "તાપી", state: "Gujarat", isActive: true },
];

export const initialTalukas: Taluka[] = [
  // Kachchh
  { id: "tal_kch_abdasa", districtId: "dist_kachchh", name: "Abdasa", nameGujarati: "અબડાસા", isActive: true },
  { id: "tal_kch_anjar", districtId: "dist_kachchh", name: "Anjar", nameGujarati: "અંજાર", isActive: true },
  { id: "tal_kch_bhachau", districtId: "dist_kachchh", name: "Bhachau", nameGujarati: "ભચાઉ", isActive: true },
  { id: "tal_kch_bhuj", districtId: "dist_kachchh", name: "Bhuj", nameGujarati: "ભુજ", isActive: true },
  { id: "tal_kch_gandhidham", districtId: "dist_kachchh", name: "Gandhidham", nameGujarati: "ગાંધીધામ", isActive: true },
  { id: "tal_kch_lakhpat", districtId: "dist_kachchh", name: "Lakhpat", nameGujarati: "લખપત", isActive: true },
  { id: "tal_kch_mandvi", districtId: "dist_kachchh", name: "Mandvi", nameGujarati: "માંડવી", isActive: true },
  { id: "tal_kch_mundra", districtId: "dist_kachchh", name: "Mundra", nameGujarati: "મુંદ્રા", isActive: true },
  { id: "tal_kch_nakhatrana", districtId: "dist_kachchh", name: "Nakhatrana", nameGujarati: "નખત્રાણા", isActive: true },
  { id: "tal_kch_rapar", districtId: "dist_kachchh", name: "Rapar", nameGujarati: "રાપર", isActive: true },

  // Ahmedabad
  { id: "tal_ahm_daskroi", districtId: "dist_ahmedabad", name: "Daskroi", nameGujarati: "દસ્ક્રોઈ", isActive: true },
  { id: "tal_ahm_city", districtId: "dist_ahmedabad", name: "Ahmedabad City", nameGujarati: "અમદાવાદ શહેર", isActive: true },
  { id: "tal_ahm_sanand", districtId: "dist_ahmedabad", name: "Sanand", nameGujarati: "સાણંદ", isActive: true },
  { id: "tal_ahm_dholka", districtId: "dist_ahmedabad", name: "Dholka", nameGujarati: "ધોળકા", isActive: true },
  { id: "tal_ahm_dhandhuka", districtId: "dist_ahmedabad", name: "Dhandhuka", nameGujarati: "ધંધૂકા", isActive: true },
  { id: "tal_ahm_viramgam", districtId: "dist_ahmedabad", name: "Viramgam", nameGujarati: "વિરમગામ", isActive: true },
  { id: "tal_ahm_bavla", districtId: "dist_ahmedabad", name: "Bavla", nameGujarati: "બાવળા", isActive: true },
  { id: "tal_ahm_dholera", districtId: "dist_ahmedabad", name: "Dholera", nameGujarati: "ધોલેરા", isActive: true },
  { id: "tal_ahm_mandal", districtId: "dist_ahmedabad", name: "Mandal", nameGujarati: "માંડલ", isActive: true },
  { id: "tal_ahm_detroj", districtId: "dist_ahmedabad", name: "Detroj-Rampura", nameGujarati: "દેત્રોજ-રામપુરા", isActive: true },

  // Surat
  { id: "tal_sur_choryasi", districtId: "dist_surat", name: "Choryasi", nameGujarati: "ચોર્યાસી", isActive: true },
  { id: "tal_sur_city", districtId: "dist_surat", name: "Surat City", nameGujarati: "સુરત શહેર", isActive: true },
  { id: "tal_sur_bardoli", districtId: "dist_surat", name: "Bardoli", nameGujarati: "બારડોલી", isActive: true },
  { id: "tal_sur_kamrej", districtId: "dist_surat", name: "Kamrej", nameGujarati: "કામરેજ", isActive: true },
  { id: "tal_sur_mangrol", districtId: "dist_surat", name: "Mangrol", nameGujarati: "માંગરોળ", isActive: true },
  { id: "tal_sur_mandvi", districtId: "dist_surat", name: "Mandvi", nameGujarati: "માંડવી", isActive: true },
  { id: "tal_sur_olpad", districtId: "dist_surat", name: "Olpad", nameGujarati: "ઓલપાડ", isActive: true },
  { id: "tal_sur_palsana", districtId: "dist_surat", name: "Palsana", nameGujarati: "પલસાણા", isActive: true },
  { id: "tal_sur_mahuva", districtId: "dist_surat", name: "Mahuva", nameGujarati: "મહુવા", isActive: true },
  { id: "tal_sur_umarpada", districtId: "dist_surat", name: "Umarpada", nameGujarati: "ઉમરપાડા", isActive: true },

  // Mehsana
  { id: "tal_mehsana_unjha", districtId: "dist_mehsana", name: "Unjha", nameGujarati: "ઊંઝા", isActive: true },
  { id: "tal_mehsana_visnagar", districtId: "dist_mehsana", name: "Visnagar", nameGujarati: "વિસનગર", isActive: true },
  { id: "tal_mehsana_kadi", districtId: "dist_mehsana", name: "Kadi", nameGujarati: "કડી", isActive: true },
  { id: "tal_mehsana_mehsana", districtId: "dist_mehsana", name: "Mehsana", nameGujarati: "મહેસાણા", isActive: true },
  { id: "tal_mehsana_becharaji", districtId: "dist_mehsana", name: "Becharaji", nameGujarati: "બેચરાજી", isActive: true },
  { id: "tal_mehsana_vadnagar", districtId: "dist_mehsana", name: "Vadnagar", nameGujarati: "વડનગર", isActive: true },
  { id: "tal_mehsana_kheralu", districtId: "dist_mehsana", name: "Kheralu", nameGujarati: "ખેરાલુ", isActive: true },
  { id: "tal_mehsana_satlasana", districtId: "dist_mehsana", name: "Satlasana", nameGujarati: "સતલાસણા", isActive: true },
  { id: "tal_mehsana_vijapur", districtId: "dist_mehsana", name: "Vijapur", nameGujarati: "વિજાપુર", isActive: true },
  { id: "tal_mehsana_jotana", districtId: "dist_mehsana", name: "Jotana", nameGujarati: "જોટાણા", isActive: true },

  // Patan
  { id: "tal_patan_patan", districtId: "dist_patan", name: "Patan", nameGujarati: "પાટણ", isActive: true },
  { id: "tal_patan_sidhpur", districtId: "dist_patan", name: "Sidhpur", nameGujarati: "સિદ્ધપુર", isActive: true },
  { id: "tal_patan_chanasma", districtId: "dist_patan", name: "Chanasma", nameGujarati: "ચાણસ્મા", isActive: true },
  { id: "tal_patan_radhanpur", districtId: "dist_patan", name: "Radhanpur", nameGujarati: "રાધનપુર", isActive: true },
  { id: "tal_patan_sami", districtId: "dist_patan", name: "Sami", nameGujarati: "સમી", isActive: true },
  { id: "tal_patan_harij", districtId: "dist_patan", name: "Harij", nameGujarati: "હારિજ", isActive: true },
  { id: "tal_patan_vagdod", districtId: "dist_patan", name: "Vagdod", nameGujarati: "વાગડોદ", isActive: true },
  { id: "tal_patan_santalpur", districtId: "dist_patan", name: "Santalpur", nameGujarati: "સાંતલપુર", isActive: true },
  { id: "tal_patan_shankheshwar", districtId: "dist_patan", name: "Shankheshwar", nameGujarati: "શંખેશ્વર", isActive: true },

  // Rajkot
  { id: "tal_raj_rajkot", districtId: "dist_rajkot", name: "Rajkot", nameGujarati: "રાજકોટ", isActive: true },
  { id: "tal_raj_gondal", districtId: "dist_rajkot", name: "Gondal", nameGujarati: "ગોંડલ", isActive: true },
  { id: "tal_raj_jetpur", districtId: "dist_rajkot", name: "Jetpur", nameGujarati: "જેતપુર", isActive: true },
  { id: "tal_raj_dhoraji", districtId: "dist_rajkot", name: "Dhoraji", nameGujarati: "ધોરાજી", isActive: true },
  { id: "tal_raj_jasdan", districtId: "dist_rajkot", name: "Jasdan", nameGujarati: "જસદણ", isActive: true },
  { id: "tal_raj_kotda_sangani", districtId: "dist_rajkot", name: "Kotda Sangani", nameGujarati: "કોટડા સાંગાણી", isActive: true },
  { id: "tal_raj_lodhika", districtId: "dist_rajkot", name: "Lodhika", nameGujarati: "લોધીકા", isActive: true },
  { id: "tal_raj_paddhari", districtId: "dist_rajkot", name: "Paddhari", nameGujarati: "પડધરી", isActive: true },
  { id: "tal_raj_jamkandorna", districtId: "dist_rajkot", name: "Jamkandorna", nameGujarati: "જામકંડોરણા", isActive: true },
  { id: "tal_raj_upleta", districtId: "dist_rajkot", name: "Upleta", nameGujarati: "ઉપલેટા", isActive: true },
  { id: "tal_raj_vinchhiya", districtId: "dist_rajkot", name: "Vinchhiya", nameGujarati: "વીંછીયા", isActive: true },

  // Vadodara
  { id: "tal_vad_vadodara", districtId: "dist_vadodara", name: "Vadodara", nameGujarati: "વડોદરા", isActive: true },
  { id: "tal_vad_dabhoi", districtId: "dist_vadodara", name: "Dabhoi", nameGujarati: "ડભોઈ", isActive: true },
  { id: "tal_vad_padra", districtId: "dist_vadodara", name: "Padra", nameGujarati: "પાદરા", isActive: true },
  { id: "tal_vad_karjan", districtId: "dist_vadodara", name: "Karjan", nameGujarati: "કરજણ", isActive: true },
  { id: "tal_vad_shinor", districtId: "dist_vadodara", name: "Shinor", nameGujarati: "શિનોર", isActive: true },
  { id: "tal_vad_vaghodia", districtId: "dist_vadodara", name: "Vaghodia", nameGujarati: "વાઘોડિયા", isActive: true },
  { id: "tal_vad_savli", districtId: "dist_vadodara", name: "Savli", nameGujarati: "સાવલી", isActive: true },
  { id: "tal_vad_desar", districtId: "dist_vadodara", name: "Desar", nameGujarati: "દેસર", isActive: true },

  // Gandhinagar
  { id: "tal_gan_gandhinagar", districtId: "dist_gandhinagar", name: "Gandhinagar", nameGujarati: "ગાંધીનગર", isActive: true },
  { id: "tal_gan_kalol", districtId: "dist_gandhinagar", name: "Kalol", nameGujarati: "કલોલ", isActive: true },
  { id: "tal_gan_dehgam", districtId: "dist_gandhinagar", name: "Dehgam", nameGujarati: "દહેગામ", isActive: true },
  { id: "tal_gan_mansa", districtId: "dist_gandhinagar", name: "Mansa", nameGujarati: "માણસા", isActive: true },

  // Jamnagar
  { id: "tal_jam_jamnagar", districtId: "dist_jamnagar", name: "Jamnagar", nameGujarati: "જામનગર", isActive: true },
  { id: "tal_jam_dhrol", districtId: "dist_jamnagar", name: "Dhrol", nameGujarati: "ધ્રોલ", isActive: true },
  { id: "tal_jam_jamjodhpur", districtId: "dist_jamnagar", name: "Jamjodhpur", nameGujarati: "જામજોધપુર", isActive: true },
  { id: "tal_jam_jodiya", districtId: "dist_jamnagar", name: "Jodiya", nameGujarati: "જોડિયા", isActive: true },
  { id: "tal_jam_kalavad", districtId: "dist_jamnagar", name: "Kalavad", nameGujarati: "કાલાવડ", isActive: true },
  { id: "tal_jam_lalpur", districtId: "dist_jamnagar", name: "Lalpur", nameGujarati: "લાલપુર", isActive: true },

  // Bhavnagar
  { id: "tal_bhav_bhavnagar", districtId: "dist_bhavnagar", name: "Bhavnagar", nameGujarati: "ભાવનગર", isActive: true },
  { id: "tal_bhav_sihor", districtId: "dist_bhavnagar", name: "Sihor", nameGujarati: "સિહોર", isActive: true },
  { id: "tal_bhav_palitana", districtId: "dist_bhavnagar", name: "Palitana", nameGujarati: "પાલીતાણા", isActive: true },
  { id: "tal_bhav_mahuva", districtId: "dist_bhavnagar", name: "Mahuva", nameGujarati: "મહુવા", isActive: true },
  { id: "tal_bhav_talaja", districtId: "dist_bhavnagar", name: "Talaja", nameGujarati: "તળાજા", isActive: true },

  // Junagadh
  { id: "tal_jun_junagadh", districtId: "dist_junagadh", name: "Junagadh", nameGujarati: "જૂનાગઢ", isActive: true },
  { id: "tal_jun_keshod", districtId: "dist_junagadh", name: "Keshod", nameGujarati: "કેશોદ", isActive: true },
  { id: "tal_jun_mangrol", districtId: "dist_junagadh", name: "Mangrol", nameGujarati: "માંગરોળ", isActive: true },
  { id: "tal_jun_manavadar", districtId: "dist_junagadh", name: "Manavadar", nameGujarati: "માણાવદર", isActive: true },
  { id: "tal_jun_visavadar", districtId: "dist_junagadh", name: "Visavadar", nameGujarati: "વિસાવદર", isActive: true },

  // Anand
  { id: "tal_and_anand", districtId: "dist_anand", name: "Anand", nameGujarati: "આણંદ", isActive: true },
  { id: "tal_and_petlad", districtId: "dist_anand", name: "Petlad", nameGujarati: "પેટલાદ", isActive: true },
  { id: "tal_and_khambhat", districtId: "dist_anand", name: "Khambhat", nameGujarati: "ખંભાત", isActive: true },
  { id: "tal_and_borsad", districtId: "dist_anand", name: "Borsad", nameGujarati: "બોરસદ", isActive: true },
  { id: "tal_and_umreth", districtId: "dist_anand", name: "Umreth", nameGujarati: "ઉમરેઠ", isActive: true },

  // Kheda
  { id: "tal_khd_nadiad", districtId: "dist_kheda", name: "Nadiad", nameGujarati: "નડિયાદ", isActive: true },
  { id: "tal_khd_kheda", districtId: "dist_kheda", name: "Kheda", nameGujarati: "ખેડા", isActive: true },
  { id: "tal_khd_kapadvanj", districtId: "dist_kheda", name: "Kapadvanj", nameGujarati: "કપડવંજ", isActive: true },
  { id: "tal_khd_matar", districtId: "dist_kheda", name: "Matar", nameGujarati: "માતર", isActive: true },

  // Bharuch
  { id: "tal_bh_bharuch", districtId: "dist_bharuch", name: "Bharuch", nameGujarati: "ભરૂચ", isActive: true },
  { id: "tal_bh_ankleshwar", districtId: "dist_bharuch", name: "Ankleshwar", nameGujarati: "અંકલેશ્વર", isActive: true },
  { id: "tal_bh_jambusar", districtId: "dist_bharuch", name: "Jambusar", nameGujarati: "જંબુસર", isActive: true },

  // Navsari
  { id: "tal_nav_navsari", districtId: "dist_navsari", name: "Navsari", nameGujarati: "નવસારી", isActive: true },
  { id: "tal_nav_jalalpore", districtId: "dist_navsari", name: "Jalalpore", nameGujarati: "જલાલપોર", isActive: true },
  { id: "tal_nav_gandevi", districtId: "dist_navsari", name: "Gandevi", nameGujarati: "ગણદેવી", isActive: true },

  // Valsad
  { id: "tal_val_valsad", districtId: "dist_valsad", name: "Valsad", nameGujarati: "વલસાડ", isActive: true },
  { id: "tal_val_pardi", districtId: "dist_valsad", name: "Pardi", nameGujarati: "પારડી", isActive: true },
  { id: "tal_val_vapi", districtId: "dist_valsad", name: "Vapi", nameGujarati: "વાપી", isActive: true },

  // Morbi
  { id: "tal_mor_morbi", districtId: "dist_morbi", name: "Morbi", nameGujarati: "મોરબી", isActive: true },
  { id: "tal_mor_wankaner", districtId: "dist_morbi", name: "Wankaner", nameGujarati: "વાંકાનેર", isActive: true },
  { id: "tal_mor_halvad", districtId: "dist_morbi", name: "Halvad", nameGujarati: "હળવદ", isActive: true },

  // Surendranagar
  { id: "tal_sn_wadhwan", districtId: "dist_surendranagar", name: "Wadhwan", nameGujarati: "વઢવાણ", isActive: true },
  { id: "tal_sn_limbdi", districtId: "dist_surendranagar", name: "Limbdi", nameGujarati: "લીંબડી", isActive: true },
  { id: "tal_sn_chotila", districtId: "dist_surendranagar", name: "Chotila", nameGujarati: "ચોટીલા", isActive: true },
  { id: "tal_sn_dhrangadhra", districtId: "dist_surendranagar", name: "Dhrangadhra", nameGujarati: "ધ્રાંગધ્રા", isActive: true },

  // Amreli
  { id: "tal_amr_amreli", districtId: "dist_amreli", name: "Amreli", nameGujarati: "અમરેલી", isActive: true },
  { id: "tal_amr_babra", districtId: "dist_amreli", name: "Babra", nameGujarati: "બાબરા", isActive: true },
  { id: "tal_amr_savarkundla", districtId: "dist_amreli", name: "Savarkundla", nameGujarati: "સાવરકુંડલા", isActive: true },

  // Banaskantha
  { id: "tal_bk_palanpur", districtId: "dist_banaskantha", name: "Palanpur", nameGujarati: "પાલનપુર", isActive: true },
  { id: "tal_bk_deesa", districtId: "dist_banaskantha", name: "Deesa", nameGujarati: "ડીસા", isActive: true },
  { id: "tal_bk_vadgam", districtId: "dist_banaskantha", name: "Vadgam", nameGujarati: "વડગામ", isActive: true },

  // Sabarkantha
  { id: "tal_sk_himatnagar", districtId: "dist_sabarkantha", name: "Himatnagar", nameGujarati: "હિંમતનગર", isActive: true },
  { id: "tal_sk_idar", districtId: "dist_sabarkantha", name: "Idar", nameGujarati: "ઇડર", isActive: true },
  { id: "tal_sk_prantij", districtId: "dist_sabarkantha", name: "Prantij", nameGujarati: "પ્રાંતિજ", isActive: true },

  // Porbandar
  { id: "tal_por_porbandar", districtId: "dist_porbandar", name: "Porbandar", nameGujarati: "પોરબંદર", isActive: true },
  { id: "tal_por_ranavav", districtId: "dist_porbandar", name: "Ranavav", nameGujarati: "રાણાવાવ", isActive: true },

  // Devbhumi Dwarka
  { id: "tal_dwd_dwarka", districtId: "dist_devbhumi_dwarka", name: "Dwarka", nameGujarati: "દ્વારકા", isActive: true },
  { id: "tal_dwd_khambhalia", districtId: "dist_devbhumi_dwarka", name: "Khambhalia", nameGujarati: "ખંભાળિયા", isActive: true },

  // Gir Somnath
  { id: "tal_gs_veraval", districtId: "dist_gir_somnath", name: "Veraval", nameGujarati: "વેરાવળ", isActive: true },
  { id: "tal_gs_kodinar", districtId: "dist_gir_somnath", name: "Kodinar", nameGujarati: "કોડીનાર", isActive: true },

  // Botad
  { id: "tal_bot_botad", districtId: "dist_botad", name: "Botad", nameGujarati: "બોટાદ", isActive: true },
  { id: "tal_bot_gadhada", districtId: "dist_botad", name: "Gadhada", nameGujarati: "ગઢડા", isActive: true },

  // Aravalli
  { id: "tal_arv_modasa", districtId: "dist_aravalli", name: "Modasa", nameGujarati: "મોડાસા", isActive: true },
  { id: "tal_arv_bayad", districtId: "dist_aravalli", name: "Bayad", nameGujarati: "બાયડ", isActive: true },

  // Mahisagar
  { id: "tal_mah_lunawada", districtId: "dist_mahisagar", name: "Lunawada", nameGujarati: "લુણાવાડા", isActive: true },
  { id: "tal_mah_balasinor", districtId: "dist_mahisagar", name: "Balasinor", nameGujarati: "બાલાસિનોર", isActive: true },

  // Panchmahal
  { id: "tal_pan_godhra", districtId: "dist_panchmahal", name: "Godhra", nameGujarati: "ગોધરા", isActive: true },
  { id: "tal_pan_halol", districtId: "dist_panchmahal", name: "Halol", nameGujarati: "હાલોલ", isActive: true },

  // Dahod
  { id: "tal_dah_dahod", districtId: "dist_dahod", name: "Dahod", nameGujarati: "દાહોદ", isActive: true },
  { id: "tal_dah_jhalod", districtId: "dist_dahod", name: "Jhalod", nameGujarati: "ઝાલોદ", isActive: true },

  // Chhota Udaipur
  { id: "tal_cu_chhota_udepur", districtId: "dist_chhota_udepur", name: "Chhota Udaipur", nameGujarati: "છોટા ઉદેપુર", isActive: true },
  { id: "tal_cu_bodeli", districtId: "dist_chhota_udepur", name: "Bodeli", nameGujarati: "બોડેલી", isActive: true },

  // Narmada
  { id: "tal_nar_rajpipla", districtId: "dist_narmada", name: "Nandod (Rajpipla)", nameGujarati: "નાંદોદ (રાજપીપળા)", isActive: true },

  // Tapi
  { id: "tal_tap_vyara", districtId: "dist_tapi", name: "Vyara", nameGujarati: "વ્યારા", isActive: true },
  { id: "tal_tap_songadh", districtId: "dist_tapi", name: "Songadh", nameGujarati: "સોનગઢ", isActive: true },

  // Dang
  { id: "tal_dan_ahwa", districtId: "dist_dang", name: "Ahwa", nameGujarati: "આહવા", isActive: true },
];

export const initialVillages: Village[] = [
  // Kachchh -> Abdasa (requested: Gadhsisa)
  { id: "vil_kch_gadhsisa", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Gadhsisa", nameGujarati: "ગઢશીશા", isActive: true },
  { id: "vil_kch_kothara", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Kothara", nameGujarati: "કોઠારા", isActive: true },
  { id: "vil_kch_naliya", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Naliya", nameGujarati: "નલિયા", isActive: true },
  { id: "vil_kch_vanki", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Vanki", nameGujarati: "વાંકી", isActive: true },
  { id: "vil_kch_bada", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Bada", nameGujarati: "બડા", isActive: true },
  { id: "vil_kch_dumra", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Dumra", nameGujarati: "ડુમરા", isActive: true },
  { id: "vil_kch_tera", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Tera", nameGujarati: "તેરા", isActive: true },
  { id: "vil_kch_vithon", districtId: "dist_kachchh", talukaId: "tal_kch_abdasa", name: "Vithon", nameGujarati: "વિઠોણ", isActive: true },

  // Kachchh -> Bhuj
  { id: "vil_kch_bhuj", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Bhuj", nameGujarati: "ભુજ", isActive: true },
  { id: "vil_kch_madhapar", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Madhapar", nameGujarati: "માધાપર", isActive: true },
  { id: "vil_kch_mirzapar", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Mirzapar", nameGujarati: "મિર્ઝાપર", isActive: true },
  { id: "vil_kch_sukhpar", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Sukhpar", nameGujarati: "સુખપર", isActive: true },
  { id: "vil_kch_kera", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Kera", nameGujarati: "કેરા", isActive: true },
  { id: "vil_kch_baladiya", districtId: "dist_kachchh", talukaId: "tal_kch_bhuj", name: "Baladiya", nameGujarati: "બળદિયા", isActive: true },

  // Kachchh -> Mandvi
  { id: "vil_kch_mandvi", districtId: "dist_kachchh", talukaId: "tal_kch_mandvi", name: "Mandvi", nameGujarati: "માંડવી", isActive: true },
  { id: "vil_kch_maska", districtId: "dist_kachchh", talukaId: "tal_kch_mandvi", name: "Maska", nameGujarati: "મસ્કા", isActive: true },
  { id: "vil_kch_asambiya", districtId: "dist_kachchh", talukaId: "tal_kch_mandvi", name: "Asambiya", nameGujarati: "આસંબિયા", isActive: true },

  // Kachchh -> Anjar
  { id: "vil_kch_anjar", districtId: "dist_kachchh", talukaId: "tal_kch_anjar", name: "Anjar", nameGujarati: "અંજાર", isActive: true },
  { id: "vil_kch_varsamedi", districtId: "dist_kachchh", talukaId: "tal_kch_anjar", name: "Varsamedi", nameGujarati: "વરસમેડી", isActive: true },

  // Ahmedabad -> Daskroi (requested: Gam under Daskroi)
  { id: "vil_daskroi_aslali", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Aslali", nameGujarati: "અસલાલી", isActive: true },
  { id: "vil_daskroi_bareja", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Bareja", nameGujarati: "બરેજા", isActive: true },
  { id: "vil_daskroi_bhuvaldi", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Bhuvaldi", nameGujarati: "ભુવાલડી", isActive: true },
  { id: "vil_daskroi_gatrad", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Gatrad", nameGujarati: "ગાત્રાડ", isActive: true },
  { id: "vil_daskroi_kuha", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Kuha", nameGujarati: "કુહા", isActive: true },
  { id: "vil_daskroi_lambha", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Lambha", nameGujarati: "લાંભા", isActive: true },
  { id: "vil_daskroi_odhav", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Odhav", nameGujarati: "ઓઢવ", isActive: true },
  { id: "vil_daskroi_geratpur", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Geratpur", nameGujarati: "ગેરતપુર", isActive: true },
  { id: "vil_daskroi_miroli", districtId: "dist_ahmedabad", talukaId: "tal_ahm_daskroi", name: "Miroli", nameGujarati: "મિરોલી", isActive: true },

  // Ahmedabad -> Ahmedabad City
  { id: "vil_ahm_city", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Ahmedabad City", nameGujarati: "અમદાવાદ શહેર", isActive: true },
  { id: "vil_ahm_navrangpura", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Navrangpura", nameGujarati: "નવરંગપુરા", isActive: true },
  { id: "vil_ahm_naranpura", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Naranpura", nameGujarati: "નારણપુરા", isActive: true },
  { id: "vil_ahm_maninagar", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Maninagar", nameGujarati: "મણિનગર", isActive: true },
  { id: "vil_ahm_ghatlodia", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Ghatlodia", nameGujarati: "ઘાટલોડિયા", isActive: true },
  { id: "vil_ahm_chandkheda", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Chandkheda", nameGujarati: "ચાંદખેડા", isActive: true },
  { id: "vil_ahm_bopal", districtId: "dist_ahmedabad", talukaId: "tal_ahm_city", name: "Bopal", nameGujarati: "બોપલ", isActive: true },

  // Ahmedabad -> Sanand
  { id: "vil_sanand_sanand", districtId: "dist_ahmedabad", talukaId: "tal_ahm_sanand", name: "Sanand", nameGujarati: "સાણંદ", isActive: true },
  { id: "vil_sanand_nidhrad", districtId: "dist_ahmedabad", talukaId: "tal_ahm_sanand", name: "Nidhrad", nameGujarati: "નિધરાડ", isActive: true },
  { id: "vil_sanand_chekhla", districtId: "dist_ahmedabad", talukaId: "tal_ahm_sanand", name: "Chekhla", nameGujarati: "ચેખલા", isActive: true },
  { id: "vil_sanand_changodar", districtId: "dist_ahmedabad", talukaId: "tal_ahm_sanand", name: "Changodar", nameGujarati: "ચાંગોદર", isActive: true },

  // Surat -> Choryasi (requested: Gam under Choryasi)
  { id: "vil_choryasi_dumas", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Dumas", nameGujarati: "ડુમસ", isActive: true },
  { id: "vil_choryasi_hazira", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Hazira", nameGujarati: "હજીરા", isActive: true },
  { id: "vil_choryasi_bhatha", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Bhatha", nameGujarati: "ભાઠા", isActive: true },
  { id: "vil_choryasi_mora", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Mora", nameGujarati: "મોરા", isActive: true },
  { id: "vil_choryasi_damka", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Damka", nameGujarati: "દામકા", isActive: true },
  { id: "vil_choryasi_ichhapore", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Ichhapore", nameGujarati: "ઇચ્છાપોર", isActive: true },
  { id: "vil_choryasi_suvali", districtId: "dist_surat", talukaId: "tal_sur_choryasi", name: "Suvali", nameGujarati: "સુવાલી", isActive: true },

  // Surat -> Surat City
  { id: "vil_sur_city", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Surat City", nameGujarati: "સુરત શહેર", isActive: true },
  { id: "vil_sur_katargam", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Katargam", nameGujarati: "કતારગામ", isActive: true },
  { id: "vil_sur_varachha", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Varachha", nameGujarati: "વરાછા", isActive: true },
  { id: "vil_sur_adajan", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Adajan", nameGujarati: "અડાજણ", isActive: true },
  { id: "vil_sur_athwa", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Athwa", nameGujarati: "અઠવા", isActive: true },
  { id: "vil_sur_majura", districtId: "dist_surat", talukaId: "tal_sur_city", name: "Majura", nameGujarati: "મજુરા", isActive: true },

  // Surat -> Kamrej
  { id: "vil_sur_kamrej", districtId: "dist_surat", talukaId: "tal_sur_kamrej", name: "Kamrej", nameGujarati: "કામરેજ", isActive: true },
  { id: "vil_sur_pasodara", districtId: "dist_surat", talukaId: "tal_sur_kamrej", name: "Pasodara", nameGujarati: "પાસોદરા", isActive: true },

  // Surat -> Bardoli
  { id: "vil_sur_bardoli", districtId: "dist_surat", talukaId: "tal_sur_bardoli", name: "Bardoli", nameGujarati: "બારડોલી", isActive: true },
  { id: "vil_sur_baben", districtId: "dist_surat", talukaId: "tal_sur_bardoli", name: "Baben", nameGujarati: "બાબેન", isActive: true },

  // Mehsana -> Unjha
  { id: "vil_unjha", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Unjha", nameGujarati: "ઊંઝા", isActive: true },
  { id: "vil_unjha_aithor", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Aithor", nameGujarati: "ઐઠોર", isActive: true },
  { id: "vil_unjha_dasaj", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Dasaj", nameGujarati: "દાસજ", isActive: true },
  { id: "vil_unjha_kamli", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Kamli", nameGujarati: "કામલી", isActive: true },
  { id: "vil_unjha_brahmanwada", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Brahmanwada", nameGujarati: "બ્રાહ્મણવાડા", isActive: true },
  { id: "vil_unjha_upera", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Upera", nameGujarati: "ઉપેરા", isActive: true },
  { id: "vil_unjha_sunok", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Sunok", nameGujarati: "સુણોક", isActive: true },
  { id: "vil_unjha_bhunav", districtId: "dist_mehsana", talukaId: "tal_mehsana_unjha", name: "Bhunav", nameGujarati: "ભુણાવ", isActive: true },

  // Mehsana -> Visnagar
  { id: "vil_visnagar", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Visnagar", nameGujarati: "વિસનગર", isActive: true },
  { id: "vil_vis_basana", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Basana", nameGujarati: "બાસણા", isActive: true },
  { id: "vil_vis_bhandu", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Bhandu", nameGujarati: "ભાંડુ", isActive: true },
  { id: "vil_vis_kada", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Kada", nameGujarati: "કાડા", isActive: true },
  { id: "vil_vis_valam", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Valam", nameGujarati: "વાલમ", isActive: true },
  { id: "vil_vis_tarabh", districtId: "dist_mehsana", talukaId: "tal_mehsana_visnagar", name: "Tarabh", nameGujarati: "તારભ", isActive: true },

  // Mehsana -> Kadi
  { id: "vil_kadi", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Kadi", nameGujarati: "કડી", isActive: true },
  { id: "vil_kadi_nandasan", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Nandasan", nameGujarati: "નાંદાસણ", isActive: true },
  { id: "vil_kadi_borisana", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Borisana", nameGujarati: "બોરીસણા", isActive: true },
  { id: "vil_kadi_karannagar", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Karannagar", nameGujarati: "કરણનગર", isActive: true },
  { id: "vil_kadi_thol", districtId: "dist_mehsana", talukaId: "tal_mehsana_kadi", name: "Thol", nameGujarati: "થોળ", isActive: true },

  // Mehsana -> Mehsana
  { id: "vil_mehsana", districtId: "dist_mehsana", talukaId: "tal_mehsana_mehsana", name: "Mehsana", nameGujarati: "મહેસાણા", isActive: true },
  { id: "vil_meh_ambaliyasan", districtId: "dist_mehsana", talukaId: "tal_mehsana_mehsana", name: "Ambaliyasan", nameGujarati: "આંબલિયાસણ", isActive: true },
  { id: "vil_meh_palavasana", districtId: "dist_mehsana", talukaId: "tal_mehsana_mehsana", name: "Palavasana", nameGujarati: "પાલાવાસણા", isActive: true },
  { id: "vil_meh_nagalpur", districtId: "dist_mehsana", talukaId: "tal_mehsana_mehsana", name: "Nagalpur", nameGujarati: "નાગલપુર", isActive: true },

  // Patan -> Patan
  { id: "vil_patan", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Patan", nameGujarati: "પાટણ", isActive: true },
  { id: "vil_pat_balisana", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Balisana", nameGujarati: "બલીસણા", isActive: true },
  { id: "vil_pat_ranuj", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Ranuj", nameGujarati: "રણુજ", isActive: true },
  { id: "vil_pat_vagdod", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Wagdod", nameGujarati: "વાગડોદ", isActive: true },
  { id: "vil_pat_hansapur", districtId: "dist_patan", talukaId: "tal_patan_patan", name: "Hansapur", nameGujarati: "હંસાપુર", isActive: true },

  // Patan -> Sidhpur
  { id: "vil_sidhpur", districtId: "dist_patan", talukaId: "tal_patan_sidhpur", name: "Sidhpur", nameGujarati: "સિદ્ધપુર", isActive: true },
  { id: "vil_sid_kakoshi", districtId: "dist_patan", talukaId: "tal_patan_sidhpur", name: "Kakoshi", nameGujarati: "કાકોશી", isActive: true },

  // Rajkot -> Rajkot
  { id: "vil_rajkot", districtId: "dist_rajkot", talukaId: "tal_raj_rajkot", name: "Rajkot", nameGujarati: "રાજકોટ", isActive: true },
  { id: "vil_raj_kothariya", districtId: "dist_rajkot", talukaId: "tal_raj_rajkot", name: "Kothariya", nameGujarati: "કોઠારીયા", isActive: true },
  { id: "vil_raj_bedi", districtId: "dist_rajkot", talukaId: "tal_raj_rajkot", name: "Bedi", nameGujarati: "બેડી", isActive: true },
  { id: "vil_raj_madhapar", districtId: "dist_rajkot", talukaId: "tal_raj_rajkot", name: "Madhapar", nameGujarati: "માધાપર", isActive: true },

  // Rajkot -> Gondal
  { id: "vil_gondal", districtId: "dist_rajkot", talukaId: "tal_raj_gondal", name: "Gondal", nameGujarati: "ગોંડલ", isActive: true },
  { id: "vil_gon_gomta", districtId: "dist_rajkot", talukaId: "tal_raj_gondal", name: "Gomta", nameGujarati: "ગોમટા", isActive: true },
  { id: "vil_gon_moviya", districtId: "dist_rajkot", talukaId: "tal_raj_gondal", name: "Moviya", nameGujarati: "મોવિયા", isActive: true },

  // Vadodara -> Vadodara
  { id: "vil_vadodara", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Vadodara", nameGujarati: "વડોદરા", isActive: true },
  { id: "vil_vad_chhani", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Chhani", nameGujarati: "છાણી", isActive: true },
  { id: "vil_vad_tarsali", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Tarsali", nameGujarati: "તરસાલી", isActive: true },
  { id: "vil_vad_sama", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Sama", nameGujarati: "સમા", isActive: true },
  { id: "vil_vad_makarpura", districtId: "dist_vadodara", talukaId: "tal_vad_vadodara", name: "Makarpura", nameGujarati: "મકરપુરા", isActive: true },

  // Vadodara -> Padra
  { id: "vil_padra", districtId: "dist_vadodara", talukaId: "tal_vad_padra", name: "Padra", nameGujarati: "પાદરા", isActive: true },
  { id: "vil_pad_dabhasa", districtId: "dist_vadodara", talukaId: "tal_vad_padra", name: "Dabhasa", nameGujarati: "ડભાસા", isActive: true },

  // Gandhinagar -> Gandhinagar
  { id: "vil_gan_gandhinagar", districtId: "dist_gandhinagar", talukaId: "tal_gan_gandhinagar", name: "Gandhinagar", nameGujarati: "ગાંધીનગર", isActive: true },
  { id: "vil_gan_koba", districtId: "dist_gandhinagar", talukaId: "tal_gan_gandhinagar", name: "Koba", nameGujarati: "કોબા", isActive: true },
  { id: "vil_gan_chiloda", districtId: "dist_gandhinagar", talukaId: "tal_gan_gandhinagar", name: "Chiloda", nameGujarati: "ચિલોડા", isActive: true },

  // Gandhinagar -> Kalol
  { id: "vil_gan_kalol", districtId: "dist_gandhinagar", talukaId: "tal_gan_kalol", name: "Kalol", nameGujarati: "કલોલ", isActive: true },
  { id: "vil_gan_saij", districtId: "dist_gandhinagar", talukaId: "tal_gan_kalol", name: "Saij", nameGujarati: "સાઈજ", isActive: true },

  // Jamnagar -> Jamnagar
  { id: "vil_jam_jamnagar", districtId: "dist_jamnagar", talukaId: "tal_jam_jamnagar", name: "Jamnagar", nameGujarati: "જામનગર", isActive: true },
  { id: "vil_jam_bedeshwar", districtId: "dist_jamnagar", talukaId: "tal_jam_jamnagar", name: "Bedeshwar", nameGujarati: "બેડેશ્વર", isActive: true },
  { id: "vil_jam_dhuvav", districtId: "dist_jamnagar", talukaId: "tal_jam_jamnagar", name: "Dhuvav", nameGujarati: "ધુવાવ", isActive: true },

  // Bhavnagar -> Bhavnagar
  { id: "vil_bhav_bhavnagar", districtId: "dist_bhavnagar", talukaId: "tal_bhav_bhavnagar", name: "Bhavnagar", nameGujarati: "ભાવનગર", isActive: true },
  { id: "vil_bhav_vartej", districtId: "dist_bhavnagar", talukaId: "tal_bhav_bhavnagar", name: "Vartej", nameGujarati: "વરતેજ", isActive: true },

  // Junagadh -> Junagadh
  { id: "vil_jun_junagadh", districtId: "dist_junagadh", talukaId: "tal_jun_junagadh", name: "Junagadh", nameGujarati: "જૂનાગઢ", isActive: true },
  { id: "vil_jun_bilkha", districtId: "dist_junagadh", talukaId: "tal_jun_junagadh", name: "Bilkha", nameGujarati: "બિલખા", isActive: true },

  // Anand -> Anand
  { id: "vil_and_anand", districtId: "dist_anand", talukaId: "tal_and_anand", name: "Anand", nameGujarati: "આણંદ", isActive: true },
  { id: "vil_and_vallabh_vidyanagar", districtId: "dist_anand", talukaId: "tal_and_anand", name: "Vallabh Vidyanagar", nameGujarati: "વલ્લભ વિદ્યાનગર", isActive: true },

  // Kheda -> Nadiad
  { id: "vil_khd_nadiad", districtId: "dist_kheda", talukaId: "tal_khd_nadiad", name: "Nadiad", nameGujarati: "નડિયાદ", isActive: true },
  { id: "vil_khd_uttarsanda", districtId: "dist_kheda", talukaId: "tal_khd_nadiad", name: "Uttarsanda", nameGujarati: "ઉત્તરસંડા", isActive: true },

  // Bharuch -> Bharuch
  { id: "vil_bh_bharuch", districtId: "dist_bharuch", talukaId: "tal_bh_bharuch", name: "Bharuch", nameGujarati: "ભરૂચ", isActive: true },
  { id: "vil_bh_ankleshwar", districtId: "dist_bharuch", talukaId: "tal_bh_ankleshwar", name: "Ankleshwar", nameGujarati: "અંકલેશ્વર", isActive: true },

  // Navsari -> Navsari
  { id: "vil_nav_navsari", districtId: "dist_navsari", talukaId: "tal_nav_navsari", name: "Navsari", nameGujarati: "નવસારી", isActive: true },

  // Valsad -> Valsad
  { id: "vil_val_valsad", districtId: "dist_valsad", talukaId: "tal_val_valsad", name: "Valsad", nameGujarati: "વલસાડ", isActive: true },
  { id: "vil_val_vapi", districtId: "dist_valsad", talukaId: "tal_val_vapi", name: "Vapi", nameGujarati: "વાપી", isActive: true },

  // Morbi -> Morbi
  { id: "vil_mor_morbi", districtId: "dist_morbi", talukaId: "tal_mor_morbi", name: "Morbi", nameGujarati: "મોરબી", isActive: true },
  { id: "vil_mor_trajpar", districtId: "dist_morbi", talukaId: "tal_mor_morbi", name: "Trajpar", nameGujarati: "ત્રાજપર", isActive: true },

  // Surendranagar -> Wadhwan
  { id: "vil_sn_wadhwan", districtId: "dist_surendranagar", talukaId: "tal_sn_wadhwan", name: "Wadhwan", nameGujarati: "વઢવાણ", isActive: true },

  // Amreli -> Amreli
  { id: "vil_amr_amreli", districtId: "dist_amreli", talukaId: "tal_amr_amreli", name: "Amreli", nameGujarati: "અમરેલી", isActive: true },

  // Banaskantha -> Palanpur
  { id: "vil_bk_palanpur", districtId: "dist_banaskantha", talukaId: "tal_bk_palanpur", name: "Palanpur", nameGujarati: "પાલનપુર", isActive: true },
  { id: "vil_bk_deesa", districtId: "dist_banaskantha", talukaId: "tal_bk_deesa", name: "Deesa", nameGujarati: "ડીસા", isActive: true },

  // Sabarkantha -> Himatnagar
  { id: "vil_sk_himatnagar", districtId: "dist_sabarkantha", talukaId: "tal_sk_himatnagar", name: "Himatnagar", nameGujarati: "હિંમતનગર", isActive: true },
  { id: "vil_sk_idar", districtId: "dist_sabarkantha", talukaId: "tal_sk_idar", name: "Idar", nameGujarati: "ઇડર", isActive: true },

  // Porbandar -> Porbandar
  { id: "vil_por_porbandar", districtId: "dist_porbandar", talukaId: "tal_por_porbandar", name: "Porbandar", nameGujarati: "પોરબંદર", isActive: true },

  // Devbhumi Dwarka -> Dwarka
  { id: "vil_dwd_dwarka", districtId: "dist_devbhumi_dwarka", talukaId: "tal_dwd_dwarka", name: "Dwarka", nameGujarati: "દ્વારકા", isActive: true },

  // Gir Somnath -> Veraval
  { id: "vil_gs_veraval", districtId: "dist_gir_somnath", talukaId: "tal_gs_veraval", name: "Veraval", nameGujarati: "વેરાવળ", isActive: true },

  // Botad -> Botad
  { id: "vil_bot_botad", districtId: "dist_botad", talukaId: "tal_bot_botad", name: "Botad", nameGujarati: "બોટાદ", isActive: true },

  // Aravalli -> Modasa
  { id: "vil_arv_modasa", districtId: "dist_aravalli", talukaId: "tal_arv_modasa", name: "Modasa", nameGujarati: "મોડાસા", isActive: true },

  // Mahisagar -> Lunawada
  { id: "vil_mah_lunawada", districtId: "dist_mahisagar", talukaId: "tal_mah_lunawada", name: "Lunawada", nameGujarati: "લુણાવાડા", isActive: true },

  // Panchmahal -> Godhra
  { id: "vil_pan_godhra", districtId: "dist_panchmahal", talukaId: "tal_pan_godhra", name: "Godhra", nameGujarati: "ગોધરા", isActive: true },

  // Dahod -> Dahod
  { id: "vil_dah_dahod", districtId: "dist_dahod", talukaId: "tal_dah_dahod", name: "Dahod", nameGujarati: "દાહોદ", isActive: true },

  // Chhota Udaipur -> Chhota Udaipur
  { id: "vil_cu_chhota_udepur", districtId: "dist_chhota_udepur", talukaId: "tal_cu_chhota_udepur", name: "Chhota Udaipur", nameGujarati: "છોટા ઉદેપુર", isActive: true },

  // Narmada -> Rajpipla
  { id: "vil_nar_rajpipla", districtId: "dist_narmada", talukaId: "tal_nar_rajpipla", name: "Rajpipla", nameGujarati: "રાજપીપળા", isActive: true },

  // Tapi -> Vyara
  { id: "vil_tap_vyara", districtId: "dist_tapi", talukaId: "tal_tap_vyara", name: "Vyara", nameGujarati: "વ્યારા", isActive: true },

  // Dang -> Ahwa
  { id: "vil_dan_ahwa", districtId: "dist_dang", talukaId: "tal_dan_ahwa", name: "Ahwa", nameGujarati: "આહવા", isActive: true },
];

export const initialMainSamaj: MainSamajItem[] = [
  {
    id: "main_patidar",
    name: "શ્રી પાટીદાર સમાજ (Patel)",
    nameGujarati: "શ્રી પાટીદાર સમાજ (પટેલ)",
    nameEn: "Shree Patidar Samaj (Patel)",
    code: "PATEL",
    aliases: ["PATEL", "PATIDAR", "પટેલ", "પાટીદાર", "KADVA", "LEUVA", "PAT", "PATEL SAMAJ"],
    description: "સમસ્ત પાટીદાર સમાજ કેન્દ્રીય સંસ્થા અને સંચાલન મંડળ",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "main_luhar",
    name: "શ્રી પંચાલ લુહાર સમાજ (Luhar)",
    nameGujarati: "શ્રી પંચાલ લુહાર સમાજ",
    nameEn: "Shree Panchal Luhar Samaj (Luhar)",
    code: "LUHAR",
    aliases: ["LUHAR", "PANCHAL", "લુહાર", "પંચાલ", "LUH", "LUHAR SAMAJ"],
    description: "સમસ્ત લુહાર / પંચાલ જ્ઞાતિ કેન્દ્રીય સંસ્થા",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "main_soni",
    name: "શ્રી સોની સમાજ (Soni)",
    nameGujarati: "શ્રી સોની સમાજ (સુવર્ણકાર)",
    nameEn: "Shree Soni Samaj (Soni)",
    code: "SONI",
    aliases: ["SONI", "SUVARNAKAR", "સોની", "સુવર્ણકાર", "SON", "SONI SAMAJ"],
    description: "સમસ્ત સોની (સુવર્ણકાર) જ્ઞાતિ કેન્દ્રીય સંસ્થા",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "main_brahmin",
    name: "શ્રી સમસ્ત બ્રહ્મ સમાજ (Brahmin)",
    nameGujarati: "શ્રી સમસ્ત બ્રહ્મ સમાજ (બ્રાહ્મણ)",
    nameEn: "Shree Samast Brahm Samaj (Brahmin)",
    code: "BRAHMIN",
    aliases: ["BRAHMIN", "BRAHM", "બ્રાહ્મણ", "બ્રહ્મ સમાજ", "BHATT", "DAVE", "JOSHI", "SHUKLA"],
    description: "સમસ્ત ગુજરાત બ્રહ્મ સમાજ કેન્દ્રીય સંસ્થા",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "main_rajput",
    name: "શ્રી ક્ષત્રિય રાજપૂત સમાજ (Rajput)",
    nameGujarati: "શ્રી ક્ષત્રિય રાજપૂત સમાજ",
    nameEn: "Shree Kshatriya Rajput Samaj (Rajput)",
    code: "RAJPUT",
    aliases: ["RAJPUT", "KSHATRIYA", "રાજપૂત", "ક્ષત્રિય", "DARBAR", "દરબાર"],
    description: "અખિલ ગુજરાત ક્ષત્રિય રાજપૂત સમાજ",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "main_jain",
    name: "શ્રી સમસ્ત જૈન સમાજ (Jain)",
    nameGujarati: "શ્રી સમસ્ત જૈન સમાજ",
    nameEn: "Shree Samast Jain Samaj (Jain)",
    code: "JAIN",
    aliases: ["JAIN", "SHAH", "જૈન", "શાહ", "DERAVASI", "STHANAKVASI"],
    description: "સમસ્ત જૈન મહાસંઘ ગુજરાત",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "main_vaishnav",
    name: "શ્રી વૈષ્ણવ વણિક સમાજ (Vaishnav)",
    nameGujarati: "શ્રી વૈષ્ણવ વણિક સમાજ",
    nameEn: "Shree Vaishnav Vanik Samaj (Vaishnav)",
    code: "VAISHNAV",
    aliases: ["VAISHNAV", "VANIK", "વૈષ્ણવ", "વણિક", "MODH", "KAPOL"],
    description: "સમસ્ત વૈષ્ણવ વણિક મહાજન",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "main_prajapati",
    name: "શ્રી પ્રજાપતિ સમાજ (Prajapati)",
    nameGujarati: "શ્રી પ્રજાપતિ સમાજ (કુંભાર)",
    nameEn: "Shree Prajapati Samaj (Prajapati)",
    code: "PRAJAPATI",
    aliases: ["PRAJAPATI", "KUMBHAR", "પ્રજાપતિ", "કુંભાર"],
    description: "અખિલ ગુજરાત પ્રજાપતિ સંઘ",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "main_suthar",
    name: "શ્રી ગુર્જર સુથાર સમાજ (Suthar)",
    nameGujarati: "શ્રી ગુર્જર સુથાર સમાજ",
    nameEn: "Shree Gurjar Suthar Samaj (Suthar)",
    code: "SUTHAR",
    aliases: ["SUTHAR", "MISTRY", "સુથાર", "મિર્સ્તી"],
    description: "સમસ્ત ગુર્જર સુથાર જ્ઞાતિ મંડળ",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "main_darji",
    name: "શ્રી દર્જી સમાજ (Darji)",
    nameGujarati: "શ્રી દર્જી સમાજ",
    nameEn: "Shree Darji Samaj (Darji)",
    code: "DARJI",
    aliases: ["DARJI", "CHAVDA", "દર્જી", "દરજી"],
    description: "સમસ્ત દર્જી જ્ઞાતિ સેવા ટ્રસ્ટ",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

// Verified Samaj records mapped strictly to: mainSamajId + districtId + talukaId + villageId
export const initialSamaj: SamajItem[] = [
  // 1. Patidar Chapters
  {
    id: "default",
    mainSamajId: "main_patidar",
    districtId: "dist_mehsana",
    talukaId: "tal_mehsana_unjha",
    villageId: "vil_unjha",
    name: "મુખ્ય સમાજ (શ્રી પાટીદાર સમાજ કેન્દ્ર)",
    nameGujarati: "મુખ્ય સમાજ (શ્રી પાટીદાર સમાજ કેન્દ્ર)",
    nameEn: "Main Patidar Samaj Central (Unjha)",
    code: "PAT01",
    gamIds: ["vil_unjha", "gam_unjha", "gam_visnagar", "gam_kadi", "gam_mehsana", "vil_visnagar", "vil_kadi", "vil_mehsana"],
    district: "મહેસાણા",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "samaj_patidar_kutch_gadhsisa",
    mainSamajId: "main_patidar",
    districtId: "dist_kachchh",
    talukaId: "tal_kch_abdasa",
    villageId: "vil_kch_gadhsisa",
    name: "શ્રી કડવા પાટીદાર સમાજ ગઢશીશા (કચ્છ)",
    nameGujarati: "શ્રી કડવા પાટીદાર સમાજ ગઢશીશા (કચ્છ)",
    nameEn: "Shree Kadva Patidar Samaj Gadhsisa (Kachchh)",
    code: "PAT_KCH_GDS",
    gamIds: ["vil_kch_gadhsisa"],
    district: "કચ્છ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "samaj_ahmedabad",
    mainSamajId: "main_patidar",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "અમદાવાદ પાટીદાર સમાજ શાખા",
    nameGujarati: "અમદાવાદ પાટીદાર સમાજ શાખા",
    nameEn: "Ahmedabad Patidar Samaj Chapter",
    code: "AHM01",
    gamIds: ["vil_ahm_city", "gam_ahmedabad_patel"],
    district: "અમદાવાદ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-02-01T00:00:00.000Z",
  },
  {
    id: "samaj_surat",
    mainSamajId: "main_patidar",
    districtId: "dist_surat",
    talukaId: "tal_sur_city",
    villageId: "vil_sur_city",
    name: "સુરત પાટીદાર સમાજ પરિવાર",
    nameGujarati: "સુરત પાટીદાર સમાજ પરિવાર",
    nameEn: "Surat Patidar Samaj Parivar",
    code: "SUR01",
    gamIds: ["vil_sur_city", "gam_surat_patel"],
    district: "સુરત",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-03-01T00:00:00.000Z",
  },
  {
    id: "samaj_patidar_mehsana",
    mainSamajId: "main_patidar",
    districtId: "dist_mehsana",
    talukaId: "tal_mehsana_mehsana",
    villageId: "vil_mehsana",
    name: "મહેસાણા પાટીદાર પ્રગતિ મંડળ",
    nameGujarati: "મહેસાણા પાટીદાર પ્રગતિ મંડળ",
    nameEn: "Mehsana Patidar Pragati Mandal",
    code: "MEH01",
    gamIds: ["vil_mehsana", "gam_mehsana", "gam_visnagar", "gam_kadi"],
    district: "મહેસાણા",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-04-01T00:00:00.000Z",
  },

  // 2. Luhar Chapters
  {
    id: "samaj_luhar_ahmedabad",
    mainSamajId: "main_luhar",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_daskroi",
    villageId: "vil_daskroi_aslali",
    name: "અમદાવાદ શ્રી પંચાલ સેવા સમાજ (દસ્ક્રોઈ)",
    nameGujarati: "અમદાવાદ શ્રી પંચાલ સેવા સમાજ (દસ્ક્રોઈ)",
    nameEn: "Ahmedabad Shree Panchal Seva Samaj (Daskroi)",
    code: "LUH_AHM",
    gamIds: ["vil_daskroi_aslali", "gam_luhar_ahmedabad", "vil_daskroi_bareja"],
    district: "અમદાવાદ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-04-01T00:00:00.000Z",
  },
  {
    id: "samaj_luhar_patan",
    mainSamajId: "main_luhar",
    districtId: "dist_patan",
    talukaId: "tal_patan_patan",
    villageId: "vil_patan",
    name: "શ્રી પંચાલ લુહાર સમાજ પાટણ",
    nameGujarati: "શ્રી પંચાલ લુહાર સમાજ પાટણ",
    nameEn: "Shree Panchal Luhar Samaj Patan",
    code: "LUH_PAT",
    gamIds: ["vil_patan", "gam_luhar_patan"],
    district: "પાટણ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "samaj_luhar_vadodara",
    mainSamajId: "main_luhar",
    districtId: "dist_vadodara",
    talukaId: "tal_vad_vadodara",
    villageId: "vil_vadodara",
    name: "વડોદરા શ્રી પંચાલ લુહાર સંસ્થા",
    nameGujarati: "વડોદરા શ્રી પંચાલ લુહાર સંસ્થા",
    nameEn: "Vadodara Shree Panchal Luhar Sanstha",
    code: "LUH_VAD",
    gamIds: ["vil_vadodara", "gam_luhar_vadodara"],
    district: "વડોદરા",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-02-01T00:00:00.000Z",
  },
  {
    id: "samaj_luhar_rajkot",
    mainSamajId: "main_luhar",
    districtId: "dist_rajkot",
    talukaId: "tal_raj_rajkot",
    villageId: "vil_rajkot",
    name: "સૌરાષ્ટ્ર પંચાલ લુહાર જ્ઞાતિ સમાજ (રાજકોટ)",
    nameGujarati: "સૌરાષ્ટ્ર પંચાલ લુહાર જ્ઞાતિ સમાજ (રાજકોટ)",
    nameEn: "Saurashtra Panchal Luhar Samaj (Rajkot)",
    code: "LUH_RAJ",
    gamIds: ["vil_rajkot", "gam_luhar_rajkot"],
    district: "રાજકોટ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-03-01T00:00:00.000Z",
  },

  // 3. Soni Chapters
  {
    id: "samaj_soni_surat",
    mainSamajId: "main_soni",
    districtId: "dist_surat",
    talukaId: "tal_sur_choryasi",
    villageId: "vil_choryasi_dumas",
    name: "સુરત સોની સમાજ વિકાસ પરિષદ (ચોર્યાસી)",
    nameGujarati: "સુરત સોની સમાજ વિકાસ પરિષદ (ચોર્યાસી)",
    nameEn: "Surat Soni Samaj Vikas Parishad (Choryasi)",
    code: "SON_SUR",
    gamIds: ["vil_choryasi_dumas", "gam_soni_surat"],
    district: "સુરત",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-02-01T00:00:00.000Z",
  },
  {
    id: "samaj_soni_rajkot",
    mainSamajId: "main_soni",
    districtId: "dist_rajkot",
    talukaId: "tal_raj_rajkot",
    villageId: "vil_rajkot",
    name: "રાજકોટ સુવર્ણકાર સોની મહામંડળ",
    nameGujarati: "રાજકોટ સુવર્ણકાર સોની મહામંડળ",
    nameEn: "Rajkot Suvarnakar Soni Mahamandal",
    code: "SON_RAJ",
    gamIds: ["vil_rajkot", "gam_soni_rajkot"],
    district: "રાજકોટ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "samaj_soni_ahmedabad",
    mainSamajId: "main_soni",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "અમદાવાદ શ્રી સોની સેવા સમાજ",
    nameGujarati: "અમદાવાદ શ્રી સોની સેવા સમાજ",
    nameEn: "Ahmedabad Shree Soni Seva Samaj",
    code: "SON_AHM",
    gamIds: ["vil_ahm_city", "gam_soni_ahmedabad"],
    district: "અમદાવાદ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-03-01T00:00:00.000Z",
  },
  {
    id: "samaj_soni_bhuj",
    mainSamajId: "main_soni",
    districtId: "dist_kachchh",
    talukaId: "tal_kch_bhuj",
    villageId: "vil_kch_bhuj",
    name: "કચ્છ ગુર્જર સોની સમાજ (ભુજ)",
    nameGujarati: "કચ્છ ગુર્જર સોની સમાજ (ભુજ)",
    nameEn: "Kutch Gurjar Soni Samaj (Bhuj)",
    code: "SON_BHUJ",
    gamIds: ["vil_kch_bhuj", "gam_soni_bhuj"],
    district: "કચ્છ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },

  // 4. Brahmin Chapters
  {
    id: "samaj_brahmin_central",
    mainSamajId: "main_brahmin",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "સમસ્ત ગુજરાત બ્રહ્મ સમાજ કેન્દ્ર",
    nameGujarati: "સમસ્ત ગુજરાત બ્રહ્મ સમાજ કેન્દ્ર",
    nameEn: "Samast Gujarat Brahm Samaj Central",
    code: "BRH_CENTRAL",
    gamIds: ["vil_ahm_city"],
    district: "અમદાવાદ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "samaj_brahmin_rajkot",
    mainSamajId: "main_brahmin",
    districtId: "dist_rajkot",
    talukaId: "tal_raj_rajkot",
    villageId: "vil_rajkot",
    name: "સૌરાષ્ટ્ર બ્રહ્મ સમાજ મંડળ (રાજકોટ)",
    nameGujarati: "સૌરાષ્ટ્ર બ્રહ્મ સમાજ મંડળ (રાજકોટ)",
    nameEn: "Saurashtra Brahm Samaj Mandal (Rajkot)",
    code: "BRH_RAJ",
    gamIds: ["vil_rajkot"],
    district: "રાજકોટ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },

  // 5. Rajput Chapters
  {
    id: "samaj_rajput_central",
    mainSamajId: "main_rajput",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "અખિલ ગુજરાત ક્ષત્રિય રાજપૂત સભા",
    nameGujarati: "અખિલ ગુજરાત ક્ષત્રિય રાજપૂત સભા",
    nameEn: "Akhil Gujarat Kshatriya Rajput Sabha",
    code: "RAJ_CENTRAL",
    gamIds: ["vil_ahm_city"],
    district: "અમદાવાદ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "samaj_rajput_kachchh",
    mainSamajId: "main_rajput",
    districtId: "dist_kachchh",
    talukaId: "tal_kch_bhuj",
    villageId: "vil_kch_bhuj",
    name: "કચ્છ જિલ્લા ક્ષત્રિય રાજપૂત સમાજ",
    nameGujarati: "કચ્છ જિલ્લા ક્ષત્રિય રાજપૂત સમાજ",
    nameEn: "Kachchh District Rajput Samaj",
    code: "RAJ_KCH",
    gamIds: ["vil_kch_bhuj"],
    district: "કચ્છ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },

  // 6. Jain Chapters
  {
    id: "samaj_jain_central",
    mainSamajId: "main_jain",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "અમદાવાદ જૈન મહાસંઘ",
    nameGujarati: "અમદાવાદ જૈન મહાસંઘ",
    nameEn: "Ahmedabad Jain Mahasangh",
    code: "JAIN_AHM",
    gamIds: ["vil_ahm_city"],
    district: "અમદાવાદ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },

  // 7. Vaishnav Chapters
  {
    id: "samaj_vaishnav_central",
    mainSamajId: "main_vaishnav",
    districtId: "dist_surat",
    talukaId: "tal_sur_city",
    villageId: "vil_sur_city",
    name: "સુરત વૈષ્ણવ વણિક મહાજન",
    nameGujarati: "સુરત વૈષ્ણવ વણિક મહાજન",
    nameEn: "Surat Vaishnav Vanik Mahajan",
    code: "VSH_SUR",
    gamIds: ["vil_sur_city"],
    district: "સુરત",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },

  // 8. Prajapati Chapters
  {
    id: "samaj_prajapati_central",
    mainSamajId: "main_prajapati",
    districtId: "dist_mehsana",
    talukaId: "tal_mehsana_mehsana",
    villageId: "vil_mehsana",
    name: "સમસ્ત પ્રજાપતિ સમાજ ઉત્કર્ષ મંડળ",
    nameGujarati: "સમસ્ત પ્રજાપતિ સમાજ ઉત્કર્ષ મંડળ",
    nameEn: "Samast Prajapati Samaj Mandal",
    code: "PRJ_MEH",
    gamIds: ["vil_mehsana"],
    district: "મહેસાણા",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },

  // 9. Suthar Chapters
  {
    id: "samaj_suthar_central",
    mainSamajId: "main_suthar",
    districtId: "dist_ahmedabad",
    talukaId: "tal_ahm_city",
    villageId: "vil_ahm_city",
    name: "શ્રી ગુર્જર સુથાર જ્ઞાતિ બોર્ડિંગ એસોસિએશન",
    nameGujarati: "શ્રી ગુર્જર સુથાર જ્ઞાતિ બોર્ડિંગ એસોસિએશન",
    nameEn: "Shree Gurjar Suthar Boarding Association",
    code: "SUT_AHM",
    gamIds: ["vil_ahm_city"],
    district: "અમદાવાદ",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },

  // 10. Darji Chapters
  {
    id: "samaj_darji_central",
    mainSamajId: "main_darji",
    districtId: "dist_vadodara",
    talukaId: "tal_vad_vadodara",
    villageId: "vil_vadodara",
    name: "વડોદરા દર્જી જ્ઞાતિ પંચાયત",
    nameGujarati: "વડોદરા દર્જી જ્ઞાતિ પંચાયત",
    nameEn: "Vadodara Darji Gnati Panchayat",
    code: "DRJ_VAD",
    gamIds: ["vil_vadodara"],
    district: "વડોદરા",
    isActive: true,
    requirePostApproval: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];
