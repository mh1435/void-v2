/* =========================================================
   VOID // GAMEHUB CONTENT DATABASE ENGINE (2026 MATRIX)
   ========================================================= */

const MLBB_HERO_DATA_RAW = [
  // --- ASSASSINS / JUNGLERS ---
  { 
    id: 'saber', 
    role: 'Assassin', 
    rarity: 'B-TIER',
    counters: ['khufra', 'tigreal', 'athena_shield'],
    builds: {
      'One-Shot Burst': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'],
      'CD Reduction Pen': ['hunter_strike', 'bloodlust_axe', 'war_axe', 'malefic_roar', 'rose_gold_meteor', 'immortality']
    }
  },
  { 
    id: 'karina', 
    role: 'Assassin', 
    rarity: 'A-TIER',
    counters: ['athena_shield', 'khufra', 'lolita'],
    builds: {
      'Full Magic Burst': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'],
      'Tank Karina Hybrid': ['thunder_belt', 'radiant_armor', 'antique_cuirass', 'genius_wand', 'immortality', 'guardian_helmet']
    }
  },
  { 
    id: 'fanny', 
    role: 'Assassin', 
    rarity: 'S-TIER (META)',
    counters: ['khufra', 'masha', 'chou', 'saber'],
    builds: {
      'S-Tier Hyper DMG': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor', 'immortality'],
      'Sustain Offlane': ['bloodlust_axe', 'hunter_strike', 'war_axe', 'brute_force_breastplate', 'athena_shield', 'immortality']
    }
  },
  { 
    id: 'hayabusa', 
    role: 'Assassin', 
    rarity: 'S-TIER (META)',
    counters: ['khufra', 'saber', 'winter_crown'],
    builds: {
      'Hyper Carry Jungle': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'],
      'Anti-Tank Pen': ['hunter_strike', 'corrosion_scythe', 'demon_hunter_sword', 'malefic_roar', 'rose_gold_meteor', 'immortality']
    }
  },
  { 
    id: 'natalia', 
    role: 'Assassin', 
    rarity: 'B-TIER',
    counters: ['hylos', 'baxia', 'rafaela'],
    builds: {
      'Roam Roamer Execute': ['blade_of_the_heptaseas', 'hunter_strike', 'windtalker', 'berserker_fury', 'malefic_roar', 'blade_of_despair']
    }
  },
  { 
    id: 'lancelot', 
    role: 'Assassin', 
    rarity: 'A-TIER',
    counters: ['khufra', 'phoveus', 'masha'],
    builds: {
      'Full Physical DMG': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'endless_battle', 'malefic_roar', 'immortality'],
      'Tank Meta Jungle': ['thunder_belt', 'brute_force_breastplate', 'radiant_armor', 'guardian_helmet', 'antique_cuirass', 'immortality']
    }
  },
  { 
    id: 'helcurt', 
    role: 'Assassin', 
    rarity: 'S-TIER (META)',
    counters: ['hylos', 'baxia', 'tigreal'],
    builds: {
      'Burst Damage': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'windtalker', 'immortality']
    }
  },
  { 
    id: 'gusion', 
    role: 'Assassin/Mage', 
    rarity: 'A-TIER',
    counters: ['athena_shield', 'khufra', 'lolita'],
    builds: {
      'Magic Core Dmg': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings']
    }
  },
  { 
    id: 'selena', 
    role: 'Assassin/Mage', 
    rarity: 'B-TIER',
    counters: ['diggie', 'radiant_armor', 'lolita'],
    builds: {
      'Roam Dire Hit Poke': ['enchanted_talisman', 'genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown']
    }
  },
  { id: 'hanzo', role: 'Assassin', rarity: 'B-TIER', counters: ['natalia', 'ling'], builds: { 'Attack Speed Carry': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'windtalker', 'malefic_roar', 'immortality'] } },
  { id: 'ling', role: 'Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'saber', 'masha'], builds: { 'Crit Rate Burst': ['windtalker', 'berserker_fury', 'haas_claws', 'endless_battle', 'malefic_roar', 'immortality'] } },
  { id: 'benedetta', role: 'Assassin', rarity: 'A-TIER', counters: ['phoveus', 'khufra', 'masha'], builds: { 'EXP Lane Sustain': ['bloodlust_axe', 'hunter_strike', 'war_axe', 'brute_force_breastplate', 'athena_shield', 'immortality'] } },
  { id: 'aamon', role: 'Assassin', rarity: 'A-TIER', counters: ['athena_shield', 'radiant_armor'], builds: { 'Magic Execute': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'] } },
  { id: 'joy', role: 'Assassin', rarity: 'A-TIER', counters: ['masha', 'saber', 'khufra'], builds: { 'Magic Shield-Sustain': ['genius_wand', 'holy_crystal', 'glowing_wand', 'oracle', 'winter_crown', 'immortality'] } },
  { id: 'nolan', role: 'Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'saber', 'tigreal'], builds: { 'Maximum CD Pen': ['hunter_strike', 'blade_of_the_heptaseas', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'sora', role: 'Fighter/Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'masha'], builds: { 'Jungle Meta Carry': ['hunter_strike', 'blade_of_despair', 'malefic_roar', 'immortality', 'rose_gold_meteor', 'war_axe'] } },
  { id: 'hirara', role: 'Assassin', rarity: 'A-TIER', counters: ['saber', 'hylos'], builds: { 'Burst Assassin': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'immortality', 'endless_battle'] } },

  // --- FIGHTERS / EXP LANE ---
  { 
    id: 'balmond', 
    role: 'Fighter', 
    rarity: 'B-TIER',
    counters: ['baxia', 'valir', 'dominance_ice'],
    builds: {
      'Jungle Utility Tank': ['war_axe', 'cursed_helmet', 'dominance_ice', 'guardian_helmet', 'radiant_armor', 'immortality'],
      'EXP Lane True DMG': ['war_axe', 'hunter_strike', 'bloodlust_axe', 'brute_force_breastplate', 'oracle', 'immortality']
    }
  },
  { 
    id: 'chou', 
    role: 'Fighter', 
    rarity: 'A-TIER',
    counters: ['khufra', 'phoveus', 'diggie'],
    builds: {
      'One-Shot Damage': ['blade_of_the_heptaseas', 'hunter_strike', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'],
      'Roam Setup Tank': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'brute_force_breastplate', 'guardian_helmet', 'immortality']
    }
  },
  { 
    id: 'ruby', 
    role: 'Fighter', 
    rarity: 'S-TIER (META)',
    counters: ['baxia', 'valir', 'dominance_ice'],
    builds: {
      'EXP Spellvamp Offlane': ['war_axe', 'bloodlust_axe', 'dominance_ice', 'oracle', 'brute_force_breastplate', 'immortality'],
      'Roam Crowd Control': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'oracle', 'thunder_belt', 'immortality']
    }
  },
  { 
    id: 'lapu-lapu', 
    role: 'Fighter', 
    rarity: 'A-TIER',
    counters: ['baxia', 'valir', 'dominance_ice'],
    builds: {
      'Sustain Offlane DMG': ['bloodlust_axe', 'hunter_strike', 'war_axe', 'brute_force_breastplate', 'oracle', 'immortality'],
      'Full Tank Frontline': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'radiant_armor', 'immortality']
    }
  },
  { id: 'alucard', role: 'Fighter', rarity: 'B-TIER', counters: ['baxia', 'khufra'], builds: { 'Lifesteal Burst': ['haas_claws', 'hunter_strike', 'endless_battle', 'berserker_fury', 'malefic_roar', 'immortality'] } },
  { id: 'bane', role: 'Fighter/Mage', rarity: 'A-TIER', counters: ['saber', 'gusion'], builds: { 'Magic Cannon': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'], 'Physical Burst': ['hunter_strike', 'blade_of_the_heptaseas', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'] } },
  { id: 'zilong', role: 'Fighter/Assassin', rarity: 'B-TIER', counters: ['khufra', 'hylos'], builds: { 'Push Master': ['windtalker', 'berserker_fury', 'great_dragon_spear', 'demon_hunter_sword', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'freya', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'khufra'], builds: { 'Crit Attack Speed': ['corrosion_scythe', 'haas_claws', 'berserker_fury', 'great_dragon_spear', 'malefic_roar', 'immortality'] } },
  { id: 'sun', role: 'Fighter', rarity: 'B-TIER', counters: ['ruby', 'balmond'], builds: { 'Clone Shredder': ['corrosion_scythe', 'demon_hunter_sword', 'war_axe', 'dominance_ice', 'brute_force_breastplate', 'immortality'] } },
  { id: 'alpha', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'valir'], builds: { 'True DMG Jungle': ['war_axe', 'bloodlust_axe', 'hunter_strike', 'dominance_ice', 'oracle', 'immortality'] } },
  { id: 'roger', role: 'Fighter/Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'khufra'], builds: { 'Gold Lane Carry': ['windtalker', 'demon_hunter_sword', 'corrosion_scythe', 'brute_force_breastplate', 'rose_gold_meteor', 'immortality'] } },
  { id: 'gatotkaca', role: 'Tank/Fighter', rarity: 'B-TIER', counters: ['karrie', 'divine_glaive'], builds: { 'Magic Tank Vengeance': ['cursed_helmet', 'dominance_ice', 'athena_shield', 'holy_crystal', 'glowing_wand', 'immortality'] } },
  { id: 'jawhead', role: 'Fighter', rarity: 'B-TIER', counters: ['khufra', 'tigreal'], builds: { 'Assassination Core': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'immortality'] } },
  { id: 'martis', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'valir'], builds: { 'Semi-Tank Jungle': ['hunter_strike', 'war_axe', 'dominance_ice', 'antique_cuirass', 'athena_shield', 'immortality'] } },
  { id: 'aldous', role: 'Fighter', rarity: 'B-TIER', counters: ['twilight_armor', 'franco'], builds: { '500 Stack One-Punch': ['thunder_belt', 'twilight_armor', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'leomord', role: 'Fighter', rarity: 'B-TIER', counters: ['khufra', 'tigreal'], builds: { 'Crit Charge Core': ['hunter_strike', 'bloodlust_axe', 'berserker_fury', 'malefic_roar', 'blade_of_despair', 'immortality'] } },
  { id: 'thamuz', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Attack Speed Sustain': ['corrosion_scythe', 'demon_hunter_sword', 'dominance_ice', 'radiant_armor', 'antique_cuirass', 'immortality'] } },
  { id: 'minsitthar', role: 'Fighter', rarity: 'A-TIER', counters: ['diggie', 'valir'], builds: { 'On-Hit King': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'dominance_ice', 'athena_shield', 'immortality'] } },
  { id: 'badang', role: 'Fighter', rarity: 'B-TIER', counters: ['khufra', 'antique_cuirass'], builds: { 'Wall Combo Burst': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'hunter_strike', 'malefic_roar', 'immortality'] } },
  { id: 'guinevere', role: 'Fighter/Mage', rarity: 'A-TIER', counters: ['diggie', 'athena_shield'], builds: { 'Magic Knockup Burst': ['genius_wand', 'glowing_wand', 'holy_crystal', 'star_shard', 'winter_crown', 'immortality'] } },
  { id: 'terizla', role: 'Fighter', rarity: 'S-TIER (META)', counters: ['valir', 'karrie'], builds: { 'Pure EXP Lane Frontline': ['bloodlust_axe', 'dominance_ice', 'antique_cuirass', 'athena_shield', 'guardian_helmet', 'immortality'] } },
  { id: 'x-borg', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'radiant_armor'], builds: { 'True DMG Spellvamp': ['immortality', 'war_axe', 'bloodlust_axe', 'glowing_wand', 'ice_queen_wand', 'oracle'] } },
  { id: 'dyrroth', role: 'Fighter', rarity: 'A-TIER', counters: ['khufra', 'saber'], builds: { 'Armor Shredder Core': ['hunter_strike', 'blade_of_the_heptaseas', 'bloodlust_axe', 'malefic_roar', 'antique_cuirass', 'immortality'] } },
  { id: 'silvanna', role: 'Fighter', rarity: 'B-TIER', counters: ['diggie', 'athena_shield'], builds: { 'Magic Lock Core': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'radiant_armor', 'athena_shield', 'immortality'] } },
  { id: 'yu-zhong', role: 'Fighter', rarity: 'S-TIER (META)', counters: ['baxia', 'dominance_ice'], builds: { 'Dragon Meta Sustain': ['hunter_strike', 'bloodlust_axe', 'war_axe', 'dominance_ice', 'oracle', 'immortality'] } },
  { id: 'khaleed', role: 'Fighter', rarity: 'A-TIER', counters: ['saber', 'franco'], builds: { 'Early Game Aggro': ['blade_of_the_heptaseas', 'hunter_strike', 'bloodlust_axe', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'paquito', role: 'Fighter', rarity: 'S-TIER (META)', counters: ['khufra', 'saber'], builds: { 'Combo Burst Jungle': ['hunter_strike', 'blade_of_the_heptaseas', 'bloodlust_axe', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'phoveus', role: 'Fighter', rarity: 'B-TIER', counters: ['athena_shield', 'esmeralda'], builds: { 'Anti-Dash Counter Magic': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'oracle', 'brute_force_breastplate', 'immortality'] } },
  { id: 'yin', role: 'Fighter', rarity: 'B-TIER', counters: ['winter_crown', 'wind_of_nature'], builds: { 'Domain Arena Executioner': ['blade_of_the_heptaseas', 'hunter_strike', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'julian', role: 'Fighter/Mage', rarity: 'S-TIER (META)', counters: ['athena_shield', 'radiant_armor'], builds: { 'Enhanced Skill Core Magic': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'] } },
  { id: 'fredrinn', role: 'Tank/Fighter', rarity: 'A-TIER', counters: ['karrie', 'divine_glaive'], builds: { 'Taunt Overlord Jungle': ['cursed_helmet', 'guardian_helmet', 'dominance_ice', 'radiant_armor', 'antique_cuirass', 'immortality'] } },
  { id: 'cici', role: 'Fighter', rarity: 'A-TIER', counters: ['saber', 'khufra'], builds: { 'Kiting Spellvamp': ['war_axe', 'hunter_strike', 'brute_force_breastplate', 'oracle', 'dominance_ice', 'immortality'] } },
  { id: 'arlott', role: 'Fighter', rarity: 'S-TIER (META)', counters: ['phoveus', 'khufra'], builds: { 'Gaze Gank Master': ['hunter_strike', 'endless_battle', 'brute_force_breastplate', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'aulus', role: 'Fighter', rarity: 'B-TIER', counters: ['saber', 'hylos'], builds: { 'Late Game Hyper': ['windtalker', 'berserker_fury', 'haas_claws', 'great_dragon_spear', 'malefic_roar', 'immortality'] } },
  { id: 'masha', role: 'Fighter/Tank', rarity: 'A-TIER', counters: ['twilight_armor', 'blade_armor'], builds: { '3 HP Bar Shredder': ['windtalker', 'berserker_fury', 'blade_of_despair', 'malefic_roar', 'sea_halberd', 'great_dragon_spear'] } },
  { id: 'suyou', role: 'Fighter/Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'saber'], builds: { 'Meta Flex Core': ['hunter_strike', 'blade_of_the_heptaseas', 'war_axe', 'malefic_roar', 'rose_gold_meteor', 'immortality'] } },
  { id: 'lukas', role: 'Fighter', rarity: 'A-TIER', counters: ['baxia', 'valir'], builds: { 'Fighter Core': ['war_axe', 'hunter_strike', 'brute_force_breastplate', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'kalea', role: 'Fighter', rarity: 'A-TIER', counters: ['khufra', 'franco'], builds: { 'EXP Sustainer': ['war_axe', 'bloodlust_axe', 'dominance_ice', 'oracle', 'antique_cuirass', 'immortality'] } },

  // --- MARKSMEN / GOLD LANE ---
  { 
    id: 'miya', 
    role: 'Marksman', 
    rarity: 'B-TIER',
    counters: ['saber', 'blade_armor', 'wind_of_nature'],
    builds: {
      'Crit Attack Speed': ['windtalker', 'berserker_fury', 'haas_claws', 'corrosion_scythe', 'malefic_roar', 'wind_of_nature'],
      'Trinity Melt (Tank shred)': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'sea_halberd', 'wind_of_nature', 'immortality']
    }
  },
  { 
    id: 'popol', 
    role: 'Marksman', 
    rarity: 'A-TIER',
    counters: ['saber', 'gusion', 'wind_of_nature'],
    builds: {
      'Gold Lane Tower Push': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'endless_battle', 'wind_of_nature'],
      'Roam Trapper Support': ['thunder_belt', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality', 'guardian_helmet']
    }
  },
  { id: 'bruno', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Bounce Crit Burst': ['haas_claws', 'berserker_fury', 'windtalker', 'endless_battle', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'clint', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Passive Ability Burst': ['endless_battle', 'hunter_strike', 'berserker_fury', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor'] } },
  { id: 'layla', role: 'Marksman', rarity: 'B-TIER', counters: ['saber', 'ling', 'gusion'], builds: { 'Max Range Crit': ['windtalker', 'berserker_fury', 'haas_claws', 'great_dragon_spear', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'moskov', role: 'Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'wind_of_nature'], builds: { 'Attack Speed Teleport': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'haas_claws', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'karrie', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Golden Trinity Meta': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'thunder_belt', 'wind_of_nature', 'immortality'] } },
  { id: 'iridhel', role: 'Marksman', rarity: 'B-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Run-and-Gun Crit': ['windtalker', 'berserker_fury', 'haas_claws', 'great_dragon_spear', 'malefic_roar', 'blade_of_despair'] } },
  { id: 'hanabi', role: 'Marksman', rarity: 'B-TIER', counters: ['saber', 'blade_armor'], builds: { 'Bounce CC Immune Setup': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'windtalker', 'sea_halberd', 'wind_of_nature'] } },
  { id: 'claude', role: 'Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'wind_of_nature'], builds: { 'DEX Ultimate Shred': ['demon_hunter_sword', 'golden_staff', 'corrosion_scythe', 'brute_force_breastplate', 'rose_gold_meteor', 'wind_of_nature'] } },
  { id: 'kimmy', role: 'Marksman/Mage', rarity: 'B-TIER', counters: ['radiant_armor', 'lolita'], builds: { 'Magic Searing Aim': ['genius_wand', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'ice_queen_wand', 'winter_crown'] } },
  { id: 'granger', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'khufra'], builds: { 'Jungle Bullet Burst': ['hunter_strike', 'blade_of_the_heptaseas', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'immortality'] } },
  { id: 'wanwan', role: 'Marksman', rarity: 'A-TIER', counters: ['phoveus', 'khufra'], builds: { 'Crossbow Weakness Melt': ['corrosion_scythe', 'demon_hunter_sword', 'windtalker', 'sea_halberd', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'brody', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Abyss Stack One-Shot': ['blade_of_the_heptaseas', 'hunter_strike', 'malefic_roar', 'blade_of_despair', 'brute_force_breastplate', 'immortality'] } },
  { id: 'beatrix', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Arsenal Heavy Carry': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor', 'immortality'] } },
  { id: 'melissa', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'franco'], builds: { 'Anti-Melee Field Setup': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'haas_claws', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'ixia', role: 'Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'gusion'], builds: { 'Full-Screen Ult Barrage': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'hunter_strike', 'malefic_roar', 'wind_of_nature'] } },
  { id: 'natan', role: 'Marksman', rarity: 'S-TIER (META)', counters: ['athena_shield', 'radiant_armor'], builds: { 'Magic Atk Spd Marksman': ['feather_of_heaven', 'genius_wand', 'holy_crystal', 'divine_glaive', 'glowing_wand', 'wind_of_nature'] } },
  { id: 'lesley', role: 'Marksman/Assassin', rarity: 'B-TIER', counters: ['saber', 'twilight_armor'], builds: { 'Sniper True Damage': ['windtalker', 'berserker_fury', 'endless_battle', 'blade_of_despair', 'malefic_roar', 'rose_gold_meteor'] } },
  { id: 'obsidia', role: 'Marksman', rarity: 'A-TIER', counters: ['saber', 'wind_of_nature'], builds: { 'Gold Core Build': ['corrosion_scythe', 'demon_hunter_sword', 'golden_staff', 'malefic_roar', 'wind_of_nature', 'immortality'] } },

  // --- MAGES / MID LANE ---
  { 
    id: 'alice', 
    role: 'Mage', 
    rarity: 'B-TIER',
    counters: ['baxia', 'dominance_ice', 'divine_glaive'],
    builds: {
      'Sustain Magic Tank': ['clock_of_destiny', 'lightning_truncheon', 'dominance_ice', 'glowing_wand', 'oracle', 'winter_crown'],
      'Mid Lane Mage Burst': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown']
    }
  },
  { id: 'eudora', role: 'Mage', rarity: 'B-TIER', counters: ['athena_shield'], builds: { 'Insta-Kill Bush Combo': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'gord', role: 'Mage', rarity: 'B-TIER', counters: ['saber', 'ling'], builds: { 'True DMG Beam Melt': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'kagura', role: 'Mage', rarity: 'A-TIER', counters: ['athena_shield'], builds: { 'Umbrella Burst Combo': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'cyclops', role: 'Mage', rarity: 'B-TIER', counters: ['athena_shield', 'baxia'], builds: { 'CD Spellvamp Core': ['enchanted_talisman', 'concentrated_energy', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'aurora', role: 'Mage', rarity: 'A-TIER', counters: ['athena_shield'], builds: { 'AOE Freeze Control': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'blood_wings'] } },
  { id: 'vexana', role: 'Mage', rarity: 'S-TIER (META)', counters: ['saber', 'ling'], builds: { 'Lord Summon Setup': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'glowing_wand', 'divine_glaive', 'winter_crown'] } },
  { id: 'harley', role: 'Mage/Assassin', rarity: 'B-TIER', counters: ['athena_shield', 'radiant_armor'], builds: { 'Jungle Ring Burst': ['genius_wand', 'feather_of_heaven', 'holy_crystal', 'divine_glaive', 'glowing_wand', 'winter_crown'] } },
  { id: 'odette', role: 'Mage', rarity: 'A-TIER', counters: ['tigreal', 'franco', 'athena_shield'], builds: { 'Swan Song CC Combo': ['enchanted_talisman', 'glowing_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'zhask', role: 'Mage', rarity: 'S-TIER (META)', counters: ['radiant_armor'], builds: { 'Spawn Attack Speed': ['clock_of_destiny', 'feather_of_heaven', 'genius_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'pharsa', role: 'Mage', rarity: 'B-TIER', counters: ['saber', 'ling'], builds: { 'Air Strike Burst': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'valir', role: 'Mage', rarity: 'B-TIER', counters: ['radiant_armor', 'assassins'], builds: { 'Anti-Melee Slow Burn': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'radiant_armor', 'athena_shield', 'immortality'] } },
  { id: 'chang-e', role: 'Mage', rarity: 'B-TIER', counters: ['radiant_armor', 'lolita'], builds: { 'Meteor Stream Shred': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'ice_queen_wand', 'divine_glaive', 'winter_crown'] } },
  { id: 'vale', role: 'Mage', rarity: 'B-TIER', counters: ['athena_shield'], builds: { 'Windstorm Crowd Control': ['clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'lunox', role: 'Mage', rarity: 'S-TIER (META)', counters: ['radiant_armor'], builds: { 'Order/Chaos Tank Melter': ['enchanted_talisman', 'genius_wand', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'harith', role: 'Mage', rarity: 'S-TIER (META)', counters: ['khufra', 'masha'], builds: { 'Gold Lane Magic Carry': ['clock_of_destiny', 'calamity_reaper', 'holy_crystal', 'feather_of_heaven', 'oracle', 'winter_crown'] } },
  { id: 'kadita', role: 'Mage/Assassin', rarity: 'A-TIER', counters: ['athena_shield', 'diggie'], builds: { 'Roam Tide Burst': ['genius_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown', 'immortality'] } },
  { id: 'esmeralda', role: 'Mage/Tank', rarity: 'A-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Shield Absorption Frontline': ['enchanted_talisman', 'dominance_ice', 'oracle', 'brute_force_breastplate', 'glowing_wand', 'immortality'] } },
  { id: 'lylia', role: 'Mage', rarity: 'A-TIER', counters: ['saber', 'athena_shield'], builds: { 'Gloom Explosion Chain': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'cecilision', role: 'Mage', rarity: 'B-TIER', counters: ['assassins', 'athena_shield'], builds: { 'Late Game Mana Stack': ['enchanted_talisman', 'clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'yve', role: 'Mage', rarity: 'B-TIER', counters: ['saber', 'ling'], builds: { 'Grid Matrix Slow': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'genius_wand', 'brute_force_breastplate', 'winter_crown'] } },
  { id: 'valentina', role: 'Mage', rarity: 'S-TIER (META)', counters: ['athena_shield'], builds: { 'Ult Steal Tactician': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'holy_crystal', 'brute_force_breastplate', 'winter_crown'] } },
  { id: 'xavier', role: 'Mage', rarity: 'A-TIER', counters: ['saber', 'ling'], builds: { 'Global Laser Cannon': ['enchanted_talisman', 'clock_of_destiny', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'novaria', role: 'Mage', rarity: 'A-TIER', counters: ['radiant_armor'], builds: { 'Sniper Vision Support': ['enchanted_talisman', 'glowing_wand', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'zhuxin', role: 'Mage', rarity: 'S-TIER (META)', counters: ['radiant_armor'], builds: { 'Meta Crowd Control': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'athena_shield', 'dominance_ice', 'winter_crown'] } },
  { id: 'luo-yi', role: 'Mage', rarity: 'A-TIER', counters: ['radiant_armor'], builds: { 'Yin-Yang Teleport Burst': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },
  { id: 'zetian', role: 'Mage', rarity: 'A-TIER', counters: ['athena_shield'], builds: { 'Mid Burn Burst': ['clock_of_destiny', 'lightning_truncheon', 'glowing_wand', 'holy_crystal', 'divine_glaive', 'winter_crown'] } },

  // --- TANKS / ROAM ---
  { 
    id: 'tigreal', 
    role: 'Tank', 
    rarity: 'A-TIER',
    counters: ['diggie', 'valir'],
    builds: {
      'Full Defense Roam': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'radiant_armor', 'immortality', 'guardian_helmet']
    }
  },
  { id: 'akai', role: 'Tank', rarity: 'B-TIER', counters: ['valir', 'diggie'], builds: { 'Jungle Pin Tank': ['cursed_helmet', 'guardian_helmet', 'dominance_ice', 'radiant_armor', 'immortality', 'antique_cuirass'] } },
  { id: 'franco', role: 'Tank', rarity: 'A-TIER', counters: ['diggie'], builds: { 'Suppression Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality', 'shadow_mask', 'guardian_helmet'] } },
  { id: 'minotaur', role: 'Tank/Support', rarity: 'S-TIER (META)', counters: ['diggie'], builds: { 'Heal-CC Setup Roam': ['dominance_ice', 'athena_shield', 'oracle', 'antique_cuirass', 'immortality', 'guardian_helmet'] } },
  { id: 'johnson', role: 'Tank', rarity: 'B-TIER', counters: ['diggie'], builds: { 'Mage Crash Build': ['clock_of_destiny', 'genius_wand', 'holy_crystal', 'blade_armor', 'athena_shield', 'immortality'] } },
  { id: 'hilda', role: 'Fighter/Tank', rarity: 'B-TIER', counters: ['karrie'], builds: { 'Bush Invader': ['blade_of_the_heptaseas', 'hunter_strike', 'dominance_ice', 'antique_cuirass', 'athena_shield', 'immortality'] } },
  { id: 'grock', role: 'Tank', rarity: 'A-TIER', counters: ['valir'], builds: { 'Physical Atk Tank': ['blade_of_the_heptaseas', 'hunter_strike', 'blade_of_despair', 'antique_cuirass', 'athena_shield', 'immortality'] } },
  { id: 'argus', role: 'Fighter/Tank', rarity: 'B-TIER', counters: ['franco', 'kaja'], builds: { 'Fallen Angel Crit': ['windtalker', 'berserker_fury', 'haas_claws', 'demon_hunter_sword', 'malefic_roar', 'sea_halberd'] } },
  { id: 'hylos', role: 'Tank', rarity: 'S-TIER (META)', counters: ['karrie', 'divine_glaive'], builds: { 'Max HP Clock Frontline': ['clock_of_destiny', 'dominance_ice', 'glowing_wand', 'radiant_armor', 'antique_cuirass', 'immortality'] } },
  { id: 'uranus', role: 'Tank', rarity: 'B-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Regen Core Frontline': ['enchanted_talisman', 'oracle', 'brute_force_breastplate', 'radiant_armor', 'guardian_helmet', 'immortality'] } },
  { id: 'belerick', role: 'Tank', rarity: 'B-TIER', counters: ['griving_wand'], builds: { 'Marksman Taunt Anti-Crit': ['blade_armor', 'dominance_ice', 'cursed_helmet', 'oracle', 'twilight_armor', 'immortality'] } },
  { id: 'khufra', role: 'Tank', rarity: 'A-TIER', counters: ['diggie', 'valir'], builds: { 'Anti-Dash Bounce Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'radiant_armor', 'twilight_armor', 'immortality'] } },
  { id: 'baxia', role: 'Tank', rarity: 'A-TIER', counters: ['karrie', 'divine_glaive'], builds: { 'Anti-Regen Jungle Tank': ['cursed_helmet', 'glowing_wand', 'dominance_ice', 'radiant_armor', 'guardian_helmet', 'immortality'] } },
  { id: 'atlas', role: 'Tank', rarity: 'A-TIER', counters: ['diggie', 'valir'], builds: { 'Kraken Flip CC Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality', 'fleeting_time', 'guardian_helmet'] } },
  { id: 'barats', role: 'Tank/Fighter', rarity: 'A-TIER', counters: ['karrie', 'valir'], builds: { 'Behemoth Jungle Utility': ['war_axe', 'cursed_helmet', 'guardian_helmet', 'dominance_ice', 'athena_shield', 'immortality'] } },
  { id: 'edith', role: 'Tank/Marksman', rarity: 'S-TIER (META)', counters: ['saber', 'masha'], builds: { 'Defense to Attack Convert': ['dominance_ice', 'athena_shield', 'blade_armor', 'holy_crystal', 'feather_of_heaven', 'immortality'] } },
  { id: 'gloo', role: 'Tank', rarity: 'B-TIER', counters: ['baxia'], builds: { 'Split Attachment Frontline': ['cursed_helmet', 'glowing_wand', 'dominance_ice', 'oracle', 'athena_shield', 'immortality'] } },

  // --- SUPPORTS / ROAM ---
  { 
    id: 'angela', 
    role: 'Support', 
    rarity: 'S-TIER (META)',
    counters: ['saber', 'natalia', 'gusion'],
    builds: {
      'Pocket Shield Heal': ['enchanted_talisman', 'glowing_wand', 'ice_queen_wand', 'oracle', 'athena_shield', 'immortality']
    }
  },
  { id: 'nana', role: 'Mage/Support', rarity: 'B-TIER', counters: ['athena_shield'], builds: { 'Molina Burst Trap': ['enchanted_talisman', 'lightning_truncheon', 'holy_crystal', 'divine_glaive', 'blood_wings', 'winter_crown'] } },
  { id: 'rafaela', role: 'Support', rarity: 'B-TIER', counters: ['baxia'], builds: { 'Speed Buff Roam': ['enchanted_talisman', 'dominance_ice', 'oracle', 'ice_queen_wand', 'athena_shield', 'immortality'] } },
  { id: 'lolita', role: 'Support/Tank', rarity: 'A-TIER', counters: ['diggie'], builds: { 'Shield Guard Setup': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'twilight_armor', 'immortality'] } },
  { id: 'estes', role: 'Support', rarity: 'B-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Font of Life Heal': ['enchanted_talisman', 'oracle', 'dominance_ice', 'immortality', 'athena_shield', 'guardian_helmet'] } },
  { id: 'diggie', role: 'Support', rarity: 'S-TIER (META)', counters: ['natalia', 'saber'], builds: { 'Anti-CC Meta Utility': ['enchanted_talisman', 'fleeting_time', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'immortality'] } },
  { id: 'carmilla', role: 'Support/Tank', rarity: 'A-TIER', counters: ['baxia'], builds: { 'Link CC Frontline': ['cursed_helmet', 'dominance_ice', 'athena_shield', 'guardian_helmet', 'oracle', 'immortality'] } },
  { id: 'mathilda', role: 'Support/Assassin', rarity: 'S-TIER (META)', counters: ['khufra', 'saber'], builds: { 'Wisp Burst Roam': ['enchanted_talisman', 'genius_wand', 'glowing_wand', 'holy_crystal', 'oracle', 'immortality'] } },
  { id: 'floryn', role: 'Support', rarity: 'A-TIER', counters: ['baxia', 'dominance_ice'], builds: { 'Global Map Heal': ['enchanted_talisman', 'fleeting_time', 'oracle', 'athena_shield', 'dominance_ice', 'immortality'] } },
  { id: 'faramis', role: 'Mage/Support', rarity: 'S-TIER (META)', counters: ['valentina'], builds: { 'Cult Altar Resurrection': ['enchanted_talisman', 'glowing_wand', 'genius_wand', 'lightning_truncheon', 'divine_glaive', 'winter_crown'] } },
  { id: 'kaja', role: 'Support/Fighter', rarity: 'A-TIER', counters: ['diggie'], builds: { 'Suppression Flicker Roam': ['fleeting_time', 'dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'immortality'] } },
  { id: 'chip', role: 'Support/Tank', rarity: 'S-TIER (META)', counters: ['diggie'], builds: { 'Portal Gatherer Tank': ['dominance_ice', 'athena_shield', 'antique_cuirass', 'guardian_helmet', 'radiant_armor', 'immortality'] } },
  { id: 'marcel', role: 'Support', rarity: 'A-TIER', counters: ['saber'], builds: { 'Utility Support': ['enchanted_talisman', 'dominance_ice', 'oracle', 'athena_shield', 'antique_cuirass', 'immortality'] } }
];

const MLBB_ITEM_DATA_RAW = [
  // Physical Attack Core Items
  { id: 'sea_halberd', name: 'Sea Halberd', type: 'Physical', tier: 'TIER III' },
  { id: 'rose_gold_meteor', name: 'Rose Gold Meteor', type: 'Physical', tier: 'TIER III' },
  { id: 'bloodlust_axe', name: 'Bloodlust Axe', type: 'Physical', tier: 'TIER III' },
  { id: 'hunter_strike', name: 'Hunter Strike', type: 'Physical', tier: 'TIER III' },
  { id: 'blade_of_despair', name: 'Blade of Despair', type: 'Physical', tier: 'TIER III' },
  { id: 'blade_of_the_heptaseas', name: 'Blade of the Heptaseas', type: 'Physical', tier: 'TIER III' },
  { id: 'windtalker', name: 'Windtalker', type: 'Physical', tier: 'TIER III' },
  { id: 'endless_battle', name: 'Endless Battle', type: 'Physical', tier: 'TIER III' },
  { id: 'berserker_fury', name: 'Berserker\'s Fury', type: 'Physical', tier: 'TIER III' },
  { id: 'haas_claws', name: 'Haas\'s Claws', type: 'Physical', tier: 'TIER III' },
  { id: 'malefic_roar', name: 'Malefic Roar', type: 'Physical', tier: 'TIER III' },
  { id: 'war_axe', name: 'War Axe', type: 'Physical', tier: 'TIER III' },
  { id: 'wind_of_nature', name: 'Wind of Nature', type: 'Physical', tier: 'TIER III' },
  { id: 'corrosion_scythe', name: 'Corrosion Scythe', type: 'Physical', tier: 'TIER III' },
  { id: 'demon_hunter_sword', name: 'Demon Hunter Sword', type: 'Physical', tier: 'TIER III' },
  { id: 'great_dragon_spear', name: 'Great Dragon Spear', type: 'Physical', tier: 'TIER III' },

  // Magic Power Items
  { id: 'genius_wand', name: 'Genius Wand', type: 'Magic', tier: 'TIER III' },
  { id: 'lightning_truncheon', name: 'Lightning Truncheon', type: 'Magic', tier: 'TIER III' },
  { id: 'fleeting_time', name: 'Fleeting Time', type: 'Magic', tier: 'TIER III' },
  { id: 'blood_wings', name: 'Blood Wings', type: 'Magic', tier: 'TIER III' },
  { id: 'clock_of_destiny', name: 'Clock of Destiny', type: 'Magic', tier: 'TIER III' },
  { id: 'holy_crystal', name: 'Holy Crystal', type: 'Magic', tier: 'TIER III' },
  { id: 'divine_glaive', name: 'Divine Glaive', type: 'Magic', tier: 'TIER III' },
  { id: 'glowing_wand', name: 'Glowing Wand', type: 'Magic', tier: 'TIER III' },
  { id: 'ice_queen_wand', name: 'Ice Queen Wand', type: 'Magic', tier: 'TIER III' },
  { id: 'feather_of_heaven', name: 'Feather of Heaven', type: 'Magic', tier: 'TIER III' },
  { id: 'star_shard', name: 'Star Shard', type: 'Magic', tier: 'TIER III' },
  { id: 'enchanted_talisman', name: 'Enchanted Talisman', type: 'Magic', tier: 'TIER III' },
  { id: 'winter_crown', name: 'Winter Crown', type: 'Magic', tier: 'TIER III' },

  // Defense / Protective Armour Items
  { id: 'radiant_armor', name: 'Radiant Armor', type: 'Defense', tier: 'TIER III' },
  { id: 'twilight_armor', name: 'Twilight Armor', type: 'Defense', tier: 'TIER III' },
  { id: 'brute_force_breastplate', name: 'Brute Force Breastplate', type: 'Defense', tier: 'TIER III' },
  { id: 'immortality', name: 'Immortality', type: 'Defense', tier: 'TIER III' },
  { id: 'dominance_ice', name: 'Dominance Ice', type: 'Defense', tier: 'TIER III' },
  { id: 'athena_shield', name: 'Athena\'s Shield', type: 'Defense', tier: 'TIER III' },
  { id: 'oracle', name: 'Oracle', type: 'Defense', tier: 'TIER III' },
  { id: 'antique_cuirass', name: 'Antique Cuirass', type: 'Defense', tier: 'TIER III' },
  { id: 'guardian_helmet', name: 'Guardian Helmet', type: 'Defense', tier: 'TIER III' },
  { id: 'blade_armor', name: 'Blade Armor', type: 'Defense', tier: 'TIER III' },
  { id: 'thunder_belt', name: 'Thunder Belt', type: 'Defense', tier: 'TIER III' },
  { id: 'cursed_helmet', name: 'Cursed Helmet', type: 'Defense', tier: 'TIER III' }
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
  return id.charAt(0).toUpperCase() + id.slice(1) + '.png';
}

const GameHubData = {
  heroes: MLBB_HERO_DATA_RAW.map(h => ({
    id: h.id,
    name: buildHeroTitleString(h.id),
    role: h.role,
    rarity: h.rarity,
    img: `images/heroes/${resolveHeroFilename(h.id)}`, 
    counters: h.counters || [],
    builds: h.builds || {},
    desc: `Battlefield tactical asset database log parsing parameters for registry unit [${h.id.toUpperCase()}].`
  })),
  items: MLBB_ITEM_DATA_RAW.map(i => ({
    id: i.id,
    name: i.name,
    type: i.type,
    tier: i.tier,
    img: `images/items/${i.id}.png`,
    desc: `GameHub equipment profile tracking baseline metrics for tier matrix core: [${i.name.toUpperCase()}].`
  }))
};
