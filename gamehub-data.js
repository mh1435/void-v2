/* =========================================================
   VOID // GAMEHUB CONTENT DATABASE ENGINE (2026 MATRIX)
   ========================================================= */

const MLBB_HERO_DATA_RAW = [
  // --- ASSASSINS / JUNGLERS ---
  { 
    id: 'saber', 
    role: 'Assassin',
    counters: ['khufra', 'tigreal', 'athena_shield'],
    builds: {
      'One-Shot Burst': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'],
      'CD Reduction Pen': ['hunter_strike', 'haas_claws', 'war_axe', 'malefic_roar', 'rose_gold_meteor', 'immortality']
    }
  },
  { 
    id: 'karina', 
    role: 'Assassin',
    counters: ['athena_shield', 'khufra', 'lolita'],
    builds: {
      'Full Magic Burst': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy', 'blood_wings'],
      'Tank Karina Hybrid': ['thunder_belt', 'radiant_armor', 'antique_cuirass', 'genius_wand', 'immortality', 'guardian_helmet']
    }
  },
  { 
    id: 'fanny', 
    role: 'Assassin',
    counters: ['khufra', 'masha', 'chou', 'saber'],
    builds: {
      'S-Tier Hyper DMG': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor', 'immortality'],
      'Sustain Offlane': ['haas_claws', 'hunter_strike', 'war_axe', 'brute_force_breastplate', 'athena_shield', 'immortality']
    }
  },
  { 
    id: 'hayabusa', 
    role: 'Assassin',
    counters: ['khufra', 'saber', 'concentrated_energy'],
    builds: {
      'Hyper Carry Jungle': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'],
      'Anti-Tank Pen': ['hunter_strike', 'corrosion_scythe', 'demon_hunter_sword', 'malefic_roar', 'rose_gold_meteor', 'immortality']
    }
  },
  { 
    id: 'natalia', 
    role: 'Assassin',
    counters: ['hylos', 'baxia', 'rafaela'],
    builds: {
      'Roam Roamer Execute': ['blade_of_the_heptaseas', 'hunter_strike', 'windtalker', 'berserker_fury', 'malefic_roar', 'blade_of_despair']
    }
  },
  { 
    id: 'lancelot', 
    role: 'Assassin',
    counters: ['khufra', 'phoveus', 'masha'],
    builds: {
      'Full Physical DMG': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'endless_battle', 'malefic_roar', 'immortality'],
      'Tank Meta Jungle': ['thunder_belt', 'brute_force_breastplate', 'radiant_armor', 'guardian_helmet', 'antique_cuirass', 'immortality']
    }
  },
  { 
    id: 'helcurt', 
    role: 'Assassin',
    counters: ['hylos', 'baxia', 'tigreal'],
    builds: {
      'Burst Damage': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'windtalker', 'immortality']
    }
  },
  { 
    id: 'gusion', 
    role: 'Assassin/Mage',
    counters: ['athena_shield', 'khufra', 'lolita'],
    builds: {
      'Magic Core Dmg': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy', 'blood_wings']
    }
  },
  { 
    id: 'selena', 
    role: 'Assassin/Mage',
    counters: ['diggie', 'radiant_armor', 'lolita'],
    builds: {
      'Roam Dire Hit Poke': ['enchanted_talisman', 'genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy']
    }
  },
  { id: 'hanzo', role: 'Assassin', counters: ['natalia', 'ling'], builds: { 'Attack Speed Carry': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'windtalker', 'malefic_roar', 'immortality'] } },
  { id: 'ling', role: 'Assassin', counters: ['khufra', 'saber', 'masha'], builds: { 'Crit Rate Burst': ['windtalker', 'berserker_fury', 'haas_claws', 'endless_battle', 'malefic_roar', 'immortality'] } },
  { id: 'benedetta', role: 'Assassin', counters: ['phoveus', 'khufra', 'masha'], builds: { 'EXP Lane Sustain': ['haas_claws', 'hunter_strike', 'war_axe', 'brute_force_breastplate', 'athena_shield', 'immortality'] } },
  { id: 'aamon', role: 'Assassin', counters: ['athena_shield', 'radiant_armor'], builds: { 'Magic Execute': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'divine_glaive', 'concentrated_energy', 'blood_wings'] } },
  { id: 'joy', role: 'Assassin', counters: ['masha', 'saber', 'khufra'], builds: { 'Magic Shield-Sustain': ['genius_wand', 'holy_crystal', 'glowing_wand', 'oracle', 'concentrated_energy', 'immortality'] } },
  { id: 'nolan', role: 'Assassin', counters: ['khufra', 'saber', 'tigreal'], builds: { 'Maximum CD Pen': ['hunter_strike', 'blade_of_the_heptaseas', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'sora', role: 'Fighter/Assassin', counters: ['khufra', 'masha'], builds: { 'Jungle Meta Carry': ['hunter_strike', 'blade_of_despair', 'malefic_roar', 'immortality', 'rose_gold_meteor', 'war_axe'] } },
  { id: 'hirara', role: 'Assassin', counters: ['saber', 'hylos'], builds: { 'Burst Assassin': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'immortality', 'endless_battle'] } },

  // --- FIGHTERS / EXP LANE ---
  { 
    id: 'balmond', 
    role: 'Fighter',
    counters: ['baxia', 'valir', 'dominance_ice'],
    builds: {
      'Jungle Utility Tank': ['war_axe', 'cursed_helmet', 'dominance_ice', 'guardian_helmet', 'radiant_armor', 'immortality'],
      'EXP Lane True DMG': ['war_axe', 'hunter_strike', 'haas_claws', 'brute_force_breastplate', 'oracle', 'immortality']
    }
  },
  { 
    id: 'chou', 
    role: 'Fighter',
    counters: ['khufra', 'phoveus', 'diggie'],
    builds: {
      'One-Shot Damage': ['blade_of_the_heptaseas', 'hunter_strike', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'],
      'Roam Setup Tank': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'brute_force_breastplate', 'guardian_helmet', 'immortality']
    }
  },
  { 
    id: 'ruby', 
    role: 'Fighter',
    counters: ['baxia', 'valir', 'dominance_ice'],
    builds: {
      'EXP Spellvamp Offlane': ['war_axe', 'haas_claws', 'dominance_ice', 'oracle', 'brute_force_breastplate', 'immortality'],
      'Roam Crowd Control': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'oracle', 'thunder_belt', 'immortality']
    }
  },
  { 
    id: 'lapu-lapu', 
    role: 'Fighter',
    counters: ['baxia', 'valir', 'dominance_ice'],
    builds: {
      'Sustain Offlane DMG': ['haas_claws', 'hunter_strike', 'war_axe', 'brute_force_breastplate', 'oracle', 'immortality'],
      'Full Tank Frontline': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'radiant_armor', 'immortality']
    }
  },
  { id: 'alucard', role: 'Fighter', counters: ['baxia', 'khufra'], builds: { 'Lifesteal Burst': ['haas_claws', 'hunter_strike', 'endless_battle', 'berserker_fury', 'malefic_roar', 'immortality'] } },
  { id: 'bane', role: 'Fighter/Mage', counters: ['saber', 'gusion'], builds: { 'Magic Cannon': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy', 'blood_wings'], 'Physical Burst': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'] } },
  { id: 'zilong', role: 'Fighter/Assassin', counters: ['khufra', 'hylos'], builds: { 'Push Master': ['windtalker', 'berserker_fury', 'great_dragon_spear', 'demon_hunter_sword', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'freya', role: 'Fighter', counters: ['baxia', 'khufra'], builds: { 'Crit Attack Speed': ['corrosion_scythe', 'haas_claws', 'berserker_fury', 'great_dragon_spear', 'malefic_roar', 'immortality'] } },
  { id: 'sun', role: 'Fighter', counters: ['ruby', 'balmond'], builds: { 'Clone Shredder': ['corrosion_scythe', 'demon_hunter_sword', 'war_axe', 'dominance_ice', 'brute_force_breastplate', 'immortality'] } },
  { id: 'alpha', role: 'Fighter', counters: ['baxia', 'valir'], builds: { 'True DMG Jungle': ['war_axe', 'haas_claws', 'hunter_strike', 'dominance_ice', 'oracle', 'immortality'] } },
  { id: 'roger', role: 'Fighter/Marksman', counters: ['saber', 'khufra'], builds: { 'Gold Lane Carry': ['windtalker', 'demon_hunter_sword', 'corrosion_scythe', 'brute_force_breastplate', 'rose_gold_meteor', 'immortality'] } },
  { id: 'gatotkaca', role: 'Tank/Fighter', counters: ['karrie', 'divine_glaive'], builds: { 'Magic Tank Vengeance': ['cursed_helmet', 'dominance_ice', 'athena_shield', 'holy_crystal', 'glowing_wand', 'immortality'] } },
  { id: 'jawhead', role: 'Fighter', counters: ['khufra', 'tigreal'], builds: { 'Assassination Core': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'] } },
  { id: 'martis', role: 'Fighter', counters: ['baxia', 'valir'], builds: { 'Semi-Tank Jungle': ['hunter_strike', 'war_axe', 'dominance_ice', 'antique_cuirass', 'athena_shield', 'immortality'] } },
  { id: 'aldous', role: 'Fighter', counters: ['franco'], builds: { '500 Stack One-Punch': ['thunder_belt', 'radiant_armor', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'leomord', role: 'Fighter', counters: ['khufra', 'tigreal'], builds: { 'Crit Charge Core': ['hunter_strike', 'haas_claws', 'berserker_fury', 'malefic_roar', 'blade_of_despair', 'immortality'] } },
  { id: 'thamuz', role: 'Fighter', counters: ['baxia', 'dominance_ice'], builds: { 'Attack Speed Sustain': ['corrosion_scythe', 'demon_hunter_sword', 'dominance_ice', 'radiant_armor', 'antique_cuirass', 'immortality'] } },
  { id: 'minsitthar', role: 'Fighter', counters: ['diggie', 'valir'], builds: { 'On-Hit King': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'dominance_ice', 'athena_shield', 'immortality'] } },
  { id: 'badang', role: 'Fighter', counters: ['khufra', 'antique_cuirass'], builds: { 'Wall Combo Burst': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'hunter_strike', 'malefic_roar', 'immortality'] } },
  { id: 'guinevere', role: 'Fighter/Mage', counters: ['diggie', 'athena_shield'], builds: { 'Magic Knockup Burst': ['genius_wand', 'glowing_wand', 'holy_crystal', 'star_shard', 'concentrated_energy', 'immortality'] } },
  { id: 'terizla', role: 'Fighter', counters: ['valir', 'karrie'], builds: { 'Pure EXP Lane Frontline': ['haas_claws', 'dominance_ice', 'antique_cuirass', 'athena_shield', 'guardian_helmet', 'immortality'] } },
  { id: 'x-borg', role: 'Fighter', counters: ['baxia', 'radiant_armor'], builds: { 'True DMG Spellvamp': ['immortality', 'war_axe', 'haas_claws', 'glowing_wand', 'ice_queen_wand', 'oracle'] } },
  { id: 'dyrroth', role: 'Fighter', counters: ['khufra', 'saber'], builds: { 'Armor Shredder Core': ['hunter_strike', 'blade_of_the_heptaseas', 'haas_claws', 'malefic_roar', 'antique_cuirass', 'immortality'] } },
  { id: 'silvanna', role: 'Fighter', counters: ['diggie', 'athena_shield'], builds: { 'Magic Lock Core': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'radiant_armor', 'athena_shield', 'immortality'] } },
  { id: 'yu-zhong', role: 'Fighter', counters: ['baxia', 'dominance_ice'], builds: { 'Dragon Meta Sustain': ['hunter_strike', 'haas_claws', 'war_axe', 'dominance_ice', 'oracle', 'immortality'] } },
  { id: 'khaleed', role: 'Fighter', counters: ['saber', 'franco'], builds: { 'Early Game Aggro': ['blade_of_the_heptaseas', 'hunter_strike', 'haas_claws', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'paquito', role: 'Fighter', counters: ['khufra', 'saber'], builds: { 'Combo Burst Jungle': ['hunter_strike', 'blade_of_the_heptaseas', 'haas_claws', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'phoveus', role: 'Fighter', counters: ['athena_shield', 'esmeralda'], builds: { 'Anti-Dash Counter Magic': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'oracle', 'brute_force_breastplate', 'immortality'] } },
  { id: 'yin', role: 'Fighter', counters: ['concentrated_energy', 'wind_of_nature'], builds: { 'Domain Arena Executioner': ['blade_of_the_heptaseas', 'hunter_strike', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'julian', role: 'Fighter/Mage', counters: ['athena_shield', 'radiant_armor'], builds: { 'Enhanced Skill Core Magic': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'divine_glaive', 'concentrated_energy', 'blood_wings'] } },
  { id: 'fredrinn', role: 'Tank/Fighter', counters: ['karrie', 'divine_glaive'], builds: { 'Taunt Overlord Jungle': ['cursed_helmet', 'guardian_helmet', 'dominance_ice', 'radiant_armor', 'antique_cuirass', 'immortality'] } },
  { id: 'cici', role: 'Fighter', counters: ['saber', 'khufra'], builds: { 'Kiting Spellvamp': ['war_axe', 'hunter_strike', 'brute_force_breastplate', 'oracle', 'dominance_ice', 'immortality'] } },
  { id: 'arlott', role: 'Fighter', counters: ['phoveus', 'khufra'], builds: { 'Gaze Gank Master': ['hunter_strike', 'endless_battle', 'brute_force_breastplate', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'aulus', role: 'Fighter', counters: ['saber', 'hylos'], builds: { 'Late Game Hyper': ['windtalker', 'berserker_fury', 'haas_claws', 'great_dragon_spear', 'malefic_roar', 'immortality'] } },
  { id: 'masha', role: 'Fighter/Tank', counters: ['blade_armor'], builds: { '3 HP Bar Shredder': ['windtalker', 'berserker_fury', 'blade_of_despair', 'malefic_roar', 'sea_halberd', 'great_dragon_spear'] } },
  { id: 'suyou', role: 'Fighter/Assassin', counters: ['khufra', 'saber'], builds: { 'Meta Flex Core': ['hunter_strike', 'blade_of_the_heptaseas', 'war_axe', 'malefic_roar', 'rose_gold_meteor', 'immortality'] } },
  { id: 'lukas', role: 'Fighter', counters: ['baxia', 'valir'], builds: { 'Fighter Core': ['war_axe', 'hunter_strike', 'brute_force_breastplate', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'kalea', role: 'Fighter', counters: ['khufra', 'franco'], builds: { 'EXP Sustainer': ['war_axe', 'haas_claws', 'dominance_ice', 'oracle', 'antique_cuirass', 'immortality'] } },

  // --- MARKSMEN / GOLD LANE ---
  { 
    id: 'miya', 
    role: 'Marksman',
    counters: ['saber', 'blade_armor', 'wind_of_nature'],
    builds: {
      'Crit Attack Speed': ['windtalker', 'berserker_fury', 'haas_claws', 'corrosion_scythe', 'malefic_roar', 'wind_of_nature'],
      'Trinity Melt (Tank shred)': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'sea_halberd', 'wind_of_nature', 'immortality']
    }
  },
  { 
    id: 'popol', 
    role: 'Marksman',
    counters: ['saber', 'gusion', 'wind_of_nature'],
    builds: {
      'Gold Lane Tower Push': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'wind_of_nature'],
      'Roam Trapper Support': ['thunder_belt', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality', 'guardian_helmet']
    }
  },
  { id: 'bruno', role: 'Marksman', counters: ['saber', 'wind_of_nature'], builds: { 'Bounce Crit Burst': ['haas_claws', 'berserker_fury', 'windtalker', 'endless_battle', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'clint', role: 'Marksman', counters: ['saber', 'wind_of_nature'], builds: { 'Passive Ability Burst': ['endless_battle', 'hunter_strike', 'berserker_fury', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor'] } },
  { id: 'layla', role: 'Marksman', counters: ['saber', 'ling', 'gusion'], builds: { 'Max Range Crit': ['windtalker', 'berserker_fury', 'haas_claws', 'great_dragon_spear', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'moskov', role: 'Marksman', counters: ['saber', 'wind_of_nature'], builds: { 'Attack Speed Teleport': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'haas_claws', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'karrie', role: 'Marksman', counters: ['saber', 'wind_of_nature'], builds: { 'Golden Trinity Meta': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'thunder_belt', 'wind_of_nature', 'immortality'] } },
  { id: 'iridhel', role: 'Marksman', counters: ['saber', 'wind_of_nature'], builds: { 'Run-and-Gun Crit': ['windtalker', 'berserker_fury', 'haas_claws', 'great_dragon_spear', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'hanabi', role: 'Marksman', counters: ['saber', 'blade_armor'], builds: { 'Bounce CC Immune Setup': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'windtalker', 'sea_halberd', 'wind_of_nature'] } },
  { id: 'claude', role: 'Marksman', counters: ['saber', 'wind_of_nature'], builds: { 'DEX Ultimate Shred': ['demon_hunter_sword', 'golden_staff', 'corrosion_scythe', 'brute_force_breastplate', 'rose_gold_meteor', 'wind_of_nature'] } },
  { id: 'kimmy', role: 'Marksman/Mage', counters: ['radiant_armor', 'lolita'], builds: { 'Magic Searing Aim': ['genius_wand', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'ice_queen_wand', 'concentrated_energy'] } },
  { id: 'granger', role: 'Marksman', counters: ['saber', 'khufra'], builds: { 'Jungle Bullet Burst': ['hunter_strike', 'blade_of_the_heptaseas', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'wanwan', role: 'Marksman', counters: ['phoveus', 'khufra'], builds: { 'Crossbow Weakness Melt': ['corrosion_scythe', 'demon_hunter_sword', 'windtalker', 'sea_halberd', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'brody', role: 'Marksman', counters: ['saber', 'wind_of_nature'], builds: { 'Abyss Stack One-Shot': ['blade_of_the_heptaseas', 'hunter_strike', 'malefic_roar', 'blade_of_despair', 'brute_force_breastplate', 'immortality'] } },
  { id: 'beatrix', role: 'Marksman', counters: ['saber', 'wind_of_nature'], builds: { 'Arsenal Heavy Carry': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor', 'immortality'] } },
  { id: 'melissa', role: 'Marksman', counters: ['saber', 'franco'], builds: { 'Anti-Melee Field Setup': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'haas_claws', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'ixia', role: 'Marksman', counters: ['saber', 'gusion'], builds: { 'Full-Screen Ult Barrage': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'hunter_strike', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'natan', role: 'Marksman', counters: ['athena_shield', 'radiant_armor'], builds: { 'Magic Atk Spd Marksman': ['feather_of_heaven', 'genius_wand', 'holy_crystal', 'divine_glaive', 'glowing_wand', 'wind_of_nature'] } },
  { id: 'lesley', role: 'Marksman/Assassin', counters: ['saber'], builds: { 'Sniper True Damage': ['windtalker', 'berserker_fury', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor'] } },
  { id: 'obsidia', role: 'Marksman', counters: ['saber', 'wind_of_nature'], builds: { 'Gold Core Build': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'malefic_roar', 'wind_of_nature', 'immortality'] } },

  // --- MAGES / MID LANE ---
  { 
    id: 'alice', 
    role: 'Mage',
    counters: ['baxia', 'dominance_ice', 'divine_glaive'],
    builds: {
      'Sustain Magic Tank': ['clock_of_destiny', 'lightning_truncheon', 'dominance_ice', 'glowing_wand', 'oracle', 'concentrated_energy'],
      'Mid Lane Mage Burst': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'concentrated_energy']
    }
  },
  { id: 'eudora', role: 'Mage', counters: ['athena_shield'], builds: { 'Insta-Kill Bush Combo': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'concentrated_energy'] } },
  { id: 'gord', role: 'Mage', counters: ['saber', 'ling'], builds: { 'True DMG Beam Melt': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'kagura', role: 'Mage', counters: ['athena_shield'], builds: { 'Umbrella Burst Combo': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'concentrated_energy'] } },
  { id: 'cyclops', role: 'Mage', counters: ['athena_shield', 'baxia'], builds: { 'CD Spellvamp Core': ['enchanted_talisman', 'concentrated_energy', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'blood_wings'] } },
  { id: 'aurora', role: 'Mage', counters: ['athena_shield'], builds: { 'AOE Freeze Control': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy', 'blood_wings'] } },
  { id: 'vexana', role: 'Mage', counters: ['saber', 'ling'], builds: { 'Lord Summon Setup': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'glowing_wand', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'harley', role: 'Mage/Assassin', counters: ['athena_shield', 'radiant_armor'], builds: { 'Jungle Ring Burst': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'divine_glaive', 'glowing_wand', 'concentrated_energy'] } },
  { id: 'odette', role: 'Mage', counters: ['tigreal', 'franco', 'athena_shield'], builds: { 'Swan Song CC Combo': ['enchanted_talisman', 'glowing_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'zhask', role: 'Mage', counters: ['radiant_armor'], builds: { 'Spawn Attack Speed': ['clock_of_destiny', 'feather_of_heaven', 'genius_wand', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'pharsa', role: 'Mage', counters: ['saber', 'ling'], builds: { 'Air Strike Burst': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'concentrated_energy'] } },
  { id: 'valir', role: 'Mage', counters: ['radiant_armor', 'assassins'], builds: { 'Anti-Melee Slow Burn': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'radiant_armor', 'athena_shield', 'immortality'] } },
  { id: 'chang-e', role: 'Mage', counters: ['radiant_armor', 'lolita'], builds: { 'Meteor Stream Shred': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'ice_queen_wand', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'vale', role: 'Mage', counters: ['athena_shield'], builds: { 'Windstorm Crowd Control': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'concentrated_energy'] } },
  { id: 'lunox', role: 'Mage', counters: ['radiant_armor'], builds: { 'Order/Chaos Tank Melter': ['enchanted_talisman', 'genius_wand', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'harith', role: 'Mage', counters: ['khufra', 'masha'], builds: { 'Gold Lane Magic Carry': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'feather_of_heaven', 'oracle', 'concentrated_energy'] } },
  { id: 'kadita', role: 'Mage/Assassin', counters: ['athena_shield', 'diggie'], builds: { 'Roam Tide Burst': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy', 'immortality'] } },
  { id: 'esmeralda', role: 'Mage/Tank', counters: ['baxia', 'dominance_ice'], builds: { 'Shield Absorption Frontline': ['enchanted_talisman', 'dominance_ice', 'oracle', 'brute_force_breastplate', 'glowing_wand', 'immortality'] } },
  { id: 'lylia', role: 'Mage', counters: ['saber', 'athena_shield'], builds: { 'Gloom Explosion Chain': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'cecilision', role: 'Mage', counters: ['assassins', 'athena_shield'], builds: { 'Late Game Mana Stack': ['enchanted_talisman', 'clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'yve', role: 'Mage', counters: ['saber', 'ling'], builds: { 'Grid Matrix Slow': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'genius_wand', 'brute_force_breastplate', 'concentrated_energy'] } },
  { id: 'valentina', role: 'Mage', counters: ['athena_shield'], builds: { 'Ult Steal Tactician': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'holy_crystal', 'brute_force_breastplate', 'concentrated_energy'] } },
  { id: 'xavier', role: 'Mage', counters: ['saber', 'ling'], builds: { 'Global Laser Cannon': ['enchanted_talisman', 'clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'novaria', role: 'Mage', counters: ['radiant_armor'], builds: { 'Sniper Vision Support': ['enchanted_talisman', 'glowing_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'zhuxin', role: 'Mage', counters: ['radiant_armor'], builds: { 'Meta Crowd Control': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'athena_shield', 'dominance_ice', 'concentrated_energy'] } },
  { id: 'luo-yi', role: 'Mage', counters: ['radiant_armor'], builds: { 'Yin-Yang Teleport Burst': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'zetian', role: 'Mage', counters: ['athena_shield'], builds: { 'Mid Burn Burst': ['clock_of_destiny', 'lightning_truncheon', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'concentrated_energy'] } },

  // --- TANKS / ROAM ---
  { 
    id: 'tigreal', 
    role: 'Tank',
    counters: ['diggie', 'valir'],
    builds: {
      'Full Defense Roam': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'radiant_armor', 'immortality', 'guardian_helmet']
    }
  },
  { id: 'akai', role: 'Tank', counters: ['valir', 'diggie'], builds: { 'Jungle Pin Tank': ['cursed_helmet', 'guardian_helmet', 'dominance_ice', 'radiant_armor', 'immortality', 'antique_cuirass'] } },
  { id: 'franco', role: 'Tank', counters: ['diggie'], builds: { 'Suppression Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality', 'shadow_mask', 'guardian_helmet'] } },
  { id: 'minotaur', role: 'Tank/Support', counters: ['diggie'], builds: { 'Heal-CC Setup Roam': ['dominance_ice', 'athena_shield', 'oracle', 'antique_cuirass', 'immortality', 'guardian_helmet'] } },
  { id: 'johnson', role: 'Tank', counters: ['diggie'], builds: { 'Mage Crash Build': ['clock_of_destiny', 'genius_wand', 'holy_crystal', 'blade_armor', 'athena_shield', 'immortality'] } },
  { id: 'hilda', role: 'Fighter/Tank', counters: ['karrie'], builds: { 'Bush Invader': ['blade_of_the_heptaseas', 'hunter_strike', 'dominance_ice', 'antique_cuirass', 'athena_shield', 'immortality'] } },
  { id: 'grock', role: 'Tank', counters: ['valir'], builds: { 'Physical Atk Tank': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'antique_cuirass', 'athena_shield', 'immortality'] } },
  { id: 'argus', role: 'Fighter/Tank', counters: ['franco', 'kaja'], builds: { 'Fallen Angel Crit': ['windtalker', 'berserker_fury', 'haas_claws', 'demon_hunter_sword', 'malefic_roar', 'sea_halberd'] } },
  { id: 'hylos', role: 'Tank', counters: ['karrie', 'divine_glaive'], builds: { 'Max HP Clock Frontline': ['clock_of_destiny', 'dominance_ice', 'glowing_wand', 'radiant_armor', 'antique_cuirass', 'immortality'] } },
  { id: 'uranus', role: 'Tank', counters: ['baxia', 'dominance_ice'], builds: { 'Regen Core Frontline': ['enchanted_talisman', 'oracle', 'brute_force_breastplate', 'radiant_armor', 'guardian_helmet', 'immortality'] } },
  { id: 'belerick', role: 'Tank', counters: ['griving_wand'], builds: { 'Marksman Taunt Anti-Crit': ['blade_armor', 'dominance_ice', 'cursed_helmet', 'oracle', 'guardian_helmet', 'immortality'] } },
  { id: 'khufra', role: 'Tank', counters: ['diggie', 'valir'], builds: { 'Anti-Dash Bounce Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'radiant_armor', 'guardian_helmet', 'immortality'] } },
  { id: 'baxia', role: 'Tank', counters: ['karrie', 'divine_glaive'], builds: { 'Anti-Regen Jungle Tank': ['cursed_helmet', 'glowing_wand', 'dominance_ice', 'radiant_armor', 'guardian_helmet', 'immortality'] } },
  { id: 'atlas', role: 'Tank', counters: ['diggie', 'valir'], builds: { 'Kraken Flip CC Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality', 'oracle', 'guardian_helmet'] } },
  { id: 'barats', role: 'Tank/Fighter', counters: ['karrie', 'valir'], builds: { 'Behemoth Jungle Utility': ['war_axe', 'cursed_helmet', 'guardian_helmet', 'dominance_ice', 'athena_shield', 'immortality'] } },
  { id: 'edith', role: 'Tank/Marksman', counters: ['saber', 'masha'], builds: { 'Defense to Attack Convert': ['dominance_ice', 'athena_shield', 'blade_armor', 'holy_crystal', 'feather_of_heaven', 'immortality'] } },
  { id: 'gloo', role: 'Tank', counters: ['baxia'], builds: { 'Split Attachment Frontline': ['cursed_helmet', 'glowing_wand', 'dominance_ice', 'oracle', 'athena_shield', 'immortality'] } },

  // --- SUPPORTS / ROAM ---
  { 
    id: 'angela', 
    role: 'Support',
    counters: ['saber', 'natalia', 'gusion'],
    builds: {
      'Pocket Shield Heal': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'oracle', 'athena_shield', 'immortality']
    }
  },
  { id: 'nana', role: 'Mage/Support', counters: ['athena_shield'], builds: { 'Molina Burst Trap': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'concentrated_energy'] } },
  { id: 'rafaela', role: 'Support', counters: ['baxia'], builds: { 'Speed Buff Roam': ['enchanted_talisman', 'dominance_ice', 'oracle', 'ice_queen_wand', 'athena_shield', 'immortality'] } },
  { id: 'lolita', role: 'Support/Tank', counters: ['diggie'], builds: { 'Shield Guard Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'thunder_belt', 'immortality'] } },
  { id: 'estes', role: 'Support', counters: ['baxia', 'dominance_ice'], builds: { 'Font of Life Heal': ['enchanted_talisman', 'oracle', 'dominance_ice', 'immortality', 'athena_shield', 'guardian_helmet'] } },
  { id: 'diggie', role: 'Support', counters: ['natalia', 'saber'], builds: { 'Anti-CC Meta Utility': ['enchanted_talisman', 'oracle', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'carmilla', role: 'Support/Tank', counters: ['baxia'], builds: { 'Link CC Frontline': ['cursed_helmet', 'dominance_ice', 'athena_shield', 'guardian_helmet', 'oracle', 'immortality'] } },
  { id: 'mathilda', role: 'Support/Assassin', counters: ['khufra', 'saber'], builds: { 'Wisp Burst Roam': ['enchanted_talisman', 'genius_wand', 'glowing_wand', 'holy_crystal', 'oracle', 'immortality'] } },
  { id: 'floryn', role: 'Support', counters: ['baxia', 'dominance_ice'], builds: { 'Global Map Heal': ['enchanted_talisman', 'wishing_lantern', 'oracle', 'athena_shield', 'dominance_ice', 'immortality'] } },
  { id: 'faramis', role: 'Mage/Support', counters: ['valentina'], builds: { 'Cult Altar Resurrection': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'lightning_truncheon', 'divine_glaive', 'concentrated_energy'] } },
  { id: 'kaja', role: 'Support/Fighter', counters: ['diggie'], builds: { 'Suppression Flicker Roam': ['oracle', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'immortality'] } },
  { id: 'chip', role: 'Support/Tank', counters: ['diggie'], builds: { 'Portal Gatherer Tank': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'radiant_armor', 'immortality'] } },
  { id: 'marcel', role: 'Support', counters: ['saber'], builds: { 'Utility Support': ['enchanted_talisman', 'dominance_ice', 'oracle', 'athena_shield', 'antique_cuirass', 'immortality'] } }
];

const MLBB_ITEM_DATA_RAW = [
  // Physical Attack Core Items
  { id: 'sea_halberd', name: 'Sea Halberd', type: 'Physical' },
  { id: 'rose_gold_meteor', name: 'Rose Gold Meteor', type: 'Physical' },
  { id: 'hunter_strike', name: 'Hunter Strike', type: 'Physical' },
  { id: 'blade_of_despair', name: 'Blade of Despair', type: 'Physical' },
  { id: 'blade_of_the_heptaseas', name: 'Blade of the Heptaseas', type: 'Physical' },
  { id: 'windtalker', name: 'Windtalker', type: 'Physical' },
  { id: 'endless_battle', name: 'Endless Battle', type: 'Physical' },
  { id: 'berserker_fury', name: 'Berserker\'s Fury', type: 'Physical' },
  { id: 'haas_claws', name: 'Haas\'s Claws', type: 'Physical' },
  { id: 'malefic_roar', name: 'Malefic Roar', type: 'Physical' },
  { id: 'war_axe', name: 'War Axe', type: 'Physical' },
  { id: 'wind_of_nature', name: 'Wind of Nature', type: 'Physical' },
  { id: 'corrosion_scythe', name: 'Corrosion Scythe', type: 'Physical' },
  { id: 'demon_hunter_sword', name: 'Demon Hunter Sword', type: 'Physical' },
  { id: 'great_dragon_spear', name: 'Great Dragon Spear', type: 'Physical' },
  { id: 'malefic_gun', name: 'Malefic Gun', type: 'Physical' },

  // Magic Power Items
  { id: 'genius_wand', name: 'Genius Wand', type: 'Magic' },
  { id: 'lightning_truncheon', name: 'Lightning Truncheon', type: 'Magic' },
  { id: 'blood_wings', name: 'Blood Wings', type: 'Magic' },
  { id: 'clock_of_destiny', name: 'Clock of Destiny', type: 'Magic' },
  { id: 'holy_crystal', name: 'Holy Crystal', type: 'Magic' },
  { id: 'divine_glaive', name: 'Divine Glaive', type: 'Magic' },
  { id: 'glowing_wand', name: 'Glowing Wand', type: 'Magic' },
  { id: 'ice_queen_wand', name: 'Ice Queen Wand', type: 'Magic' },
  { id: 'feather_of_heaven', name: 'Feather of Heaven', type: 'Magic' },
  { id: 'star_shard', name: 'Starlium Scythe', type: 'Magic' },
  { id: 'enchanted_talisman', name: 'Enchanted Talisman', type: 'Magic' },
  { id: 'flask_of_the_oasis', name: 'Flask of the Oasis', type: 'Magic' },
  { id: 'wishing_lantern', name: 'Wishing Lantern', type: 'Magic' },

  { id: 'golden_staff', name: 'Golden Staff', type: 'Physical' },

  { id: 'concentrated_energy', name: 'Concentrated Energy', type: 'Magic' },

  // Defense / Protective Armour Items
  { id: 'radiant_armor', name: 'Radiant Armor', type: 'Defense' },
  { id: 'brute_force_breastplate', name: 'Brute Force Breastplate', type: 'Defense' },
  { id: 'immortality', name: 'Immortality', type: 'Defense' },
  { id: 'dominance_ice', name: 'Dominance Ice', type: 'Defense' },
  { id: 'athena_shield', name: 'Athena\'s Shield', type: 'Defense' },
  { id: 'oracle', name: 'Oracle', type: 'Defense' },
  { id: 'antique_cuirass', name: 'Antique Cuirass', type: 'Defense' },
  { id: 'guardian_helmet', name: 'Guardian Helmet', type: 'Defense' },
  { id: 'blade_armor', name: 'Blade Armor', type: 'Defense' },
  { id: 'thunder_belt', name: 'Thunder Belt', type: 'Defense' },
  { id: 'chastise_pauldron', name: 'Chastise Pauldron', type: 'Defense' },
  { id: "queen_wings", name: "Queen's Wings", type: 'Defense' },
  { id: 'cursed_helmet', name: 'Cursed Helmet', type: 'Defense' },

  // Movement / Boots
  { id: 'warrior_boots', name: 'Warrior Boots', type: 'Movement' },
  { id: 'tough_boots', name: 'Tough Boots', type: 'Movement' },
  { id: 'arcane_boots', name: 'Arcane Boots', type: 'Movement' },
  { id: 'magic_shoes', name: 'Magic Boots', type: 'Movement' },
  { id: 'swift_boots', name: 'Swift Boots', type: 'Movement' },
  { id: 'rapid_boots', name: 'Rapid Boots', type: 'Movement' },
  { id: 'demon_shoes', name: 'Demon Boots', type: 'Movement' }
];

function buildHeroTitleString(id) {
  return id.split(/[-']/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(id.includes('-') ? '-' : "'");
}

function resolveHeroFilename(id) {
  if (id === 'lapu-lapu') return 'Lapu-lapu.png';
  if (id === 'popol') return 'Popol and Kupa.png';
  if (id === 'yu-zhong') return 'Yu Zhong.png';
  if (id === 'x-borg') return 'X-Borg.png';
  if (id === 'chang-e') return "Chang'e.png";
  if (id === 'cecilision') return 'Cecillion.png';
  if (id === 'luo-yi') return 'Luo Yi.png';
  if (id === 'iridhel') return 'Irithel.png';
  return id.charAt(0).toUpperCase() + id.slice(1) + '.png';
}

const ITEM_FILENAME_MAP = {
  sea_halberd:            'sea-healberd-png.png',
  rose_gold_meteor:       'rose-gold-meteor-png.png',
  hunter_strike:          'hunter-strike-png.png',
  blade_of_despair:       'blade-of-despair-png.png',
  blade_of_the_heptaseas: 'blade-of-heptaseas-png.png',
  windtalker:             'windtalker-png.png',
  endless_battle:         'endless-battle-png.png',
  berserker_fury:         'bersekers-fury-png.png',
  haas_claws:             'haas-claw-png.png',
  malefic_roar:           'malefic-roar-png.png',
  war_axe:                'war-axe-png.png',
  wind_of_nature:         'wind-of-nature-png.png',
  corrosion_scythe:       'corrosion-scythe.png',
  demon_hunter_sword:     'demon-hunter-sword-png.png',
  great_dragon_spear:     'great-dragon-spear-png.png',
  genius_wand:            'genius-wand-png.png',
  lightning_truncheon:    'lightning-truncheon-png.png',
  blood_wings:            'blood-wings-png.png',
  clock_of_destiny:       'clock-of-destiny-png.png',
  holy_crystal:           'holy-crystal-png.png',
  divine_glaive:          'divine-glaive-png.png',
  glowing_wand:           'glowing-wand-png.png',
  ice_queen_wand:         'ice-queen-wand-png.png',
  feather_of_heaven:      'feather-of-heaven-png.png',
  star_shard:             'starlium-scythe-png.png',
  enchanted_talisman:     'enhanched-talisman-png.png',
  flask_of_the_oasis:     'flask-of-the-oasis-png.png',
  wishing_lantern:        'wishing-lantern-png.png',
  radiant_armor:          'radiant-armor-png.png',
  brute_force_breastplate:'brute-force-breastplate-png.png',
  immortality:            'immortality-png.png',
  dominance_ice:          'dominance-ace-png.png',
  athena_shield:          'athena-shield-png.png',
  oracle:                 'oracle-png.png',
  antique_cuirass:        'antique-cuirass-png.png',
  guardian_helmet:        'guardian-helmet-png.png',
  blade_armor:            'blade-armor-png.png',
  thunder_belt:           'thunder-belt-png.png',
  chastise_pauldron:      'chastise-pauldron-png.png',
  queen_wings:            'queens-wings-png.png',
  cursed_helmet:          'cursed-helmet-png.png',
  golden_staff:           'golden-staff-png.png',
  malefic_gun:            'malefic-gun-png.png',
  concentrated_energy:    'concentrated-energy-png.png',
  warrior_boots:          'warrior-boots-png-min.png',
  tough_boots:            'tough-boots-png-min.png',
  arcane_boots:           'arcane-boots-png-min.png',
  magic_shoes:            'magic-shoes-png-min.png',
  swift_boots:            'swift-boots-png-min.png',
  rapid_boots:            'rapid-boots-png-min.png',
  demon_shoes:            'demon-shoes-png-min.png',
};

function resolveItemFilename(id) {
  return ITEM_FILENAME_MAP[id] || (id + '.png');
}

const HERO_COMBO_VIDEOS = {
  gusion:       'x6BdXzdHvVs',
  fanny:        'YTqkMqRCx7E',
  ling:         'C1T5AHljXk4',
  lancelot:     'q3P4_Gm0tIA',
  chou:         '3NSq-XVCKqE',
  hayabusa:     'ExWG2GTGIfw',
};

const GameHubData = {
  heroes: MLBB_HERO_DATA_RAW.map(h => ({
    id: h.id,
    name: buildHeroTitleString(h.id),
    role: h.role,
    img: `images/heroes/${resolveHeroFilename(h.id)}`,
    counters: h.counters || [],
    builds: h.builds || {},
    desc: `Battlefield tactical asset database log parsing parameters for registry unit [${h.id.toUpperCase()}].`
  })),
  items: MLBB_ITEM_DATA_RAW.map(i => ({
    id: i.id,
    name: i.name,
    type: i.type,
    img: `images/items/${resolveItemFilename(i.id)}`,
    desc: `GameHub equipment profile tracking baseline metrics for tier matrix core: [${i.name.toUpperCase()}].`
  }))
};
