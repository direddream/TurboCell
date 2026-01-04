// 模拟电芯数据库 - 包含主流电芯厂商的典型产品

export interface CellData {
  id: string;
  manufacturer: string;
  model: string;
  chemistry: 'NCM811' | 'NCM622' | 'LFP' | 'NCA' | 'LCO';
  formFactor: '圆柱' | '方壳' | '软包';
  specification: string; // 如 21700, 4680, VDA355等

  // 基本参数
  nominalCapacity: number; // Ah
  nominalVoltage: number; // V
  energyDensity: number; // Wh/kg
  powerDensity: number; // W/kg

  // 倍率性能
  maxChargeRate: number; // C
  maxDischargeRate: number; // C
  continuousDischargeRate: number; // C

  // 温度范围
  chargeTempMin: number; // °C
  chargeTempMax: number; // °C
  dischargeTempMin: number; // °C
  dischargeTempMax: number; // °C
  optimalTempMin: number; // °C
  optimalTempMax: number; // °C

  // 寿命
  cycleLife80: number; // 80% SOH时的循环次数
  calendarLife: number; // 年

  // 安全特性
  thermalRunawayTemp: number; // °C
  safetyLevel: 'A' | 'B' | 'C'; // 安全等级

  // 成本 (相对值 1-10)
  costIndex: number;

  // 适用场景标签
  tags: string[];

  // SOA边界数据 (用于功能B)
  soaData: {
    socRange: [number, number]; // 推荐SOC使用区间
    tempRateMatrix: {
      temp: number;
      maxChargeRate: number;
      maxDischargeRate: number;
    }[];
  };
}

export const cellDatabase: CellData[] = [
  // ========== 宁德时代 CATL ==========
  {
    id: 'catl-ncm811-140',
    manufacturer: '宁德时代',
    model: 'NCM811-140Ah',
    chemistry: 'NCM811',
    formFactor: '方壳',
    specification: 'VDA355',
    nominalCapacity: 140,
    nominalVoltage: 3.65,
    energyDensity: 245,
    powerDensity: 580,
    maxChargeRate: 2.0,
    maxDischargeRate: 3.0,
    continuousDischargeRate: 1.5,
    chargeTempMin: 0,
    chargeTempMax: 45,
    dischargeTempMin: -20,
    dischargeTempMax: 55,
    optimalTempMin: 20,
    optimalTempMax: 35,
    cycleLife80: 2000,
    calendarLife: 10,
    thermalRunawayTemp: 210,
    safetyLevel: 'B',
    costIndex: 7,
    tags: ['电动汽车', '高能量密度', '长续航'],
    soaData: {
      socRange: [15, 90],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.3, maxDischargeRate: 0.8 },
        { temp: 0, maxChargeRate: 0.5, maxDischargeRate: 1.2 },
        { temp: 10, maxChargeRate: 1.0, maxDischargeRate: 2.0 },
        { temp: 25, maxChargeRate: 2.0, maxDischargeRate: 3.0 },
        { temp: 35, maxChargeRate: 1.5, maxDischargeRate: 2.5 },
        { temp: 45, maxChargeRate: 0.8, maxDischargeRate: 2.0 },
      ]
    }
  },
  {
    id: 'catl-lfp-280',
    manufacturer: '宁德时代',
    model: 'LFP-280Ah',
    chemistry: 'LFP',
    formFactor: '方壳',
    specification: '储能专用',
    nominalCapacity: 280,
    nominalVoltage: 3.2,
    energyDensity: 160,
    powerDensity: 400,
    maxChargeRate: 1.0,
    maxDischargeRate: 1.5,
    continuousDischargeRate: 0.5,
    chargeTempMin: 0,
    chargeTempMax: 55,
    dischargeTempMin: -20,
    dischargeTempMax: 60,
    optimalTempMin: 15,
    optimalTempMax: 40,
    cycleLife80: 6000,
    calendarLife: 15,
    thermalRunawayTemp: 270,
    safetyLevel: 'A',
    costIndex: 5,
    tags: ['储能', '长寿命', '高安全', '低成本'],
    soaData: {
      socRange: [10, 95],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.2, maxDischargeRate: 0.5 },
        { temp: 0, maxChargeRate: 0.5, maxDischargeRate: 1.0 },
        { temp: 15, maxChargeRate: 0.8, maxDischargeRate: 1.3 },
        { temp: 25, maxChargeRate: 1.0, maxDischargeRate: 1.5 },
        { temp: 40, maxChargeRate: 1.0, maxDischargeRate: 1.5 },
        { temp: 55, maxChargeRate: 0.5, maxDischargeRate: 1.0 },
      ]
    }
  },
  {
    id: 'catl-ncm622-50',
    manufacturer: '宁德时代',
    model: 'NCM622-50Ah',
    chemistry: 'NCM622',
    formFactor: '软包',
    specification: 'VDA模组',
    nominalCapacity: 50,
    nominalVoltage: 3.65,
    energyDensity: 230,
    powerDensity: 650,
    maxChargeRate: 2.5,
    maxDischargeRate: 5.0,
    continuousDischargeRate: 2.0,
    chargeTempMin: 0,
    chargeTempMax: 45,
    dischargeTempMin: -20,
    dischargeTempMax: 55,
    optimalTempMin: 20,
    optimalTempMax: 35,
    cycleLife80: 1500,
    calendarLife: 8,
    thermalRunawayTemp: 200,
    safetyLevel: 'B',
    costIndex: 6,
    tags: ['电动汽车', '快充', '均衡型'],
    soaData: {
      socRange: [20, 85],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.5, maxDischargeRate: 1.5 },
        { temp: 0, maxChargeRate: 1.0, maxDischargeRate: 2.5 },
        { temp: 15, maxChargeRate: 1.8, maxDischargeRate: 4.0 },
        { temp: 25, maxChargeRate: 2.5, maxDischargeRate: 5.0 },
        { temp: 35, maxChargeRate: 2.0, maxDischargeRate: 4.5 },
        { temp: 45, maxChargeRate: 1.2, maxDischargeRate: 3.0 },
      ]
    }
  },

  // ========== 比亚迪 BYD ==========
  {
    id: 'byd-blade-100',
    manufacturer: '比亚迪',
    model: '刀片电池-100Ah',
    chemistry: 'LFP',
    formFactor: '方壳',
    specification: '刀片长薄型',
    nominalCapacity: 100,
    nominalVoltage: 3.2,
    energyDensity: 180,
    powerDensity: 450,
    maxChargeRate: 1.5,
    maxDischargeRate: 2.0,
    continuousDischargeRate: 1.0,
    chargeTempMin: 0,
    chargeTempMax: 50,
    dischargeTempMin: -25,
    dischargeTempMax: 55,
    optimalTempMin: 20,
    optimalTempMax: 40,
    cycleLife80: 5000,
    calendarLife: 12,
    thermalRunawayTemp: 300,
    safetyLevel: 'A',
    costIndex: 4,
    tags: ['电动汽车', '高安全', '针刺不起火', '长寿命'],
    soaData: {
      socRange: [5, 95],
      tempRateMatrix: [
        { temp: -20, maxChargeRate: 0.2, maxDischargeRate: 0.5 },
        { temp: -10, maxChargeRate: 0.4, maxDischargeRate: 0.8 },
        { temp: 0, maxChargeRate: 0.7, maxDischargeRate: 1.2 },
        { temp: 20, maxChargeRate: 1.5, maxDischargeRate: 2.0 },
        { temp: 35, maxChargeRate: 1.5, maxDischargeRate: 2.0 },
        { temp: 50, maxChargeRate: 0.8, maxDischargeRate: 1.5 },
      ]
    }
  },

  // ========== 三星SDI ==========
  {
    id: 'samsung-21700-50e',
    manufacturer: '三星SDI',
    model: 'INR21700-50E',
    chemistry: 'NCM811',
    formFactor: '圆柱',
    specification: '21700',
    nominalCapacity: 5,
    nominalVoltage: 3.6,
    energyDensity: 260,
    powerDensity: 520,
    maxChargeRate: 1.5,
    maxDischargeRate: 2.0,
    continuousDischargeRate: 1.0,
    chargeTempMin: 0,
    chargeTempMax: 45,
    dischargeTempMin: -20,
    dischargeTempMax: 60,
    optimalTempMin: 20,
    optimalTempMax: 35,
    cycleLife80: 1000,
    calendarLife: 8,
    thermalRunawayTemp: 200,
    safetyLevel: 'B',
    costIndex: 8,
    tags: ['消费电子', '电动工具', '高能量密度'],
    soaData: {
      socRange: [20, 80],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.3, maxDischargeRate: 0.8 },
        { temp: 0, maxChargeRate: 0.5, maxDischargeRate: 1.2 },
        { temp: 15, maxChargeRate: 1.0, maxDischargeRate: 1.8 },
        { temp: 25, maxChargeRate: 1.5, maxDischargeRate: 2.0 },
        { temp: 35, maxChargeRate: 1.2, maxDischargeRate: 1.8 },
        { temp: 45, maxChargeRate: 0.8, maxDischargeRate: 1.5 },
      ]
    }
  },
  {
    id: 'samsung-21700-50g',
    manufacturer: '三星SDI',
    model: 'INR21700-50G',
    chemistry: 'NCM811',
    formFactor: '圆柱',
    specification: '21700',
    nominalCapacity: 5,
    nominalVoltage: 3.6,
    energyDensity: 265,
    powerDensity: 600,
    maxChargeRate: 2.0,
    maxDischargeRate: 3.0,
    continuousDischargeRate: 1.5,
    chargeTempMin: 0,
    chargeTempMax: 45,
    dischargeTempMin: -20,
    dischargeTempMax: 60,
    optimalTempMin: 20,
    optimalTempMax: 35,
    cycleLife80: 800,
    calendarLife: 7,
    thermalRunawayTemp: 195,
    safetyLevel: 'B',
    costIndex: 9,
    tags: ['电动汽车', '高功率', '快充'],
    soaData: {
      socRange: [15, 85],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.4, maxDischargeRate: 1.0 },
        { temp: 0, maxChargeRate: 0.8, maxDischargeRate: 1.8 },
        { temp: 15, maxChargeRate: 1.5, maxDischargeRate: 2.5 },
        { temp: 25, maxChargeRate: 2.0, maxDischargeRate: 3.0 },
        { temp: 35, maxChargeRate: 1.8, maxDischargeRate: 2.8 },
        { temp: 45, maxChargeRate: 1.0, maxDischargeRate: 2.0 },
      ]
    }
  },

  // ========== LG新能源 ==========
  {
    id: 'lg-21700-m50',
    manufacturer: 'LG新能源',
    model: 'INR21700-M50T',
    chemistry: 'NCM811',
    formFactor: '圆柱',
    specification: '21700',
    nominalCapacity: 5,
    nominalVoltage: 3.63,
    energyDensity: 255,
    powerDensity: 550,
    maxChargeRate: 1.5,
    maxDischargeRate: 2.9,
    continuousDischargeRate: 1.0,
    chargeTempMin: 0,
    chargeTempMax: 45,
    dischargeTempMin: -20,
    dischargeTempMax: 60,
    optimalTempMin: 20,
    optimalTempMax: 35,
    cycleLife80: 1200,
    calendarLife: 8,
    thermalRunawayTemp: 205,
    safetyLevel: 'B',
    costIndex: 8,
    tags: ['电动汽车', '储能', '均衡型'],
    soaData: {
      socRange: [15, 85],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.3, maxDischargeRate: 0.9 },
        { temp: 0, maxChargeRate: 0.6, maxDischargeRate: 1.5 },
        { temp: 15, maxChargeRate: 1.2, maxDischargeRate: 2.2 },
        { temp: 25, maxChargeRate: 1.5, maxDischargeRate: 2.9 },
        { temp: 35, maxChargeRate: 1.3, maxDischargeRate: 2.5 },
        { temp: 45, maxChargeRate: 0.8, maxDischargeRate: 2.0 },
      ]
    }
  },

  // ========== 松下 Panasonic ==========
  {
    id: 'panasonic-2170-tesla',
    manufacturer: '松下',
    model: 'NCR2170A (Tesla合作款)',
    chemistry: 'NCA',
    formFactor: '圆柱',
    specification: '2170',
    nominalCapacity: 4.8,
    nominalVoltage: 3.6,
    energyDensity: 270,
    powerDensity: 600,
    maxChargeRate: 2.5,
    maxDischargeRate: 4.0,
    continuousDischargeRate: 2.0,
    chargeTempMin: 0,
    chargeTempMax: 45,
    dischargeTempMin: -20,
    dischargeTempMax: 60,
    optimalTempMin: 25,
    optimalTempMax: 35,
    cycleLife80: 1500,
    calendarLife: 10,
    thermalRunawayTemp: 190,
    safetyLevel: 'B',
    costIndex: 9,
    tags: ['电动汽车', '高能量密度', '高功率', 'Tesla'],
    soaData: {
      socRange: [10, 90],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.5, maxDischargeRate: 1.2 },
        { temp: 0, maxChargeRate: 1.0, maxDischargeRate: 2.0 },
        { temp: 15, maxChargeRate: 1.8, maxDischargeRate: 3.2 },
        { temp: 25, maxChargeRate: 2.5, maxDischargeRate: 4.0 },
        { temp: 35, maxChargeRate: 2.2, maxDischargeRate: 3.8 },
        { temp: 45, maxChargeRate: 1.2, maxDischargeRate: 2.5 },
      ]
    }
  },

  // ========== 亿纬锂能 EVE ==========
  {
    id: 'eve-lfp-105',
    manufacturer: '亿纬锂能',
    model: 'LF105',
    chemistry: 'LFP',
    formFactor: '方壳',
    specification: '储能电芯',
    nominalCapacity: 105,
    nominalVoltage: 3.2,
    energyDensity: 155,
    powerDensity: 380,
    maxChargeRate: 1.0,
    maxDischargeRate: 1.0,
    continuousDischargeRate: 0.5,
    chargeTempMin: 0,
    chargeTempMax: 55,
    dischargeTempMin: -20,
    dischargeTempMax: 60,
    optimalTempMin: 15,
    optimalTempMax: 45,
    cycleLife80: 8000,
    calendarLife: 15,
    thermalRunawayTemp: 280,
    safetyLevel: 'A',
    costIndex: 3,
    tags: ['储能', '超长寿命', '高安全', '低成本'],
    soaData: {
      socRange: [5, 95],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.2, maxDischargeRate: 0.4 },
        { temp: 0, maxChargeRate: 0.4, maxDischargeRate: 0.7 },
        { temp: 15, maxChargeRate: 0.8, maxDischargeRate: 1.0 },
        { temp: 25, maxChargeRate: 1.0, maxDischargeRate: 1.0 },
        { temp: 40, maxChargeRate: 1.0, maxDischargeRate: 1.0 },
        { temp: 55, maxChargeRate: 0.5, maxDischargeRate: 0.8 },
      ]
    }
  },

  // ========== 国轩高科 Gotion ==========
  {
    id: 'gotion-lfp-230',
    manufacturer: '国轩高科',
    model: 'JTM230Ah',
    chemistry: 'LFP',
    formFactor: '方壳',
    specification: 'VDA355',
    nominalCapacity: 230,
    nominalVoltage: 3.2,
    energyDensity: 165,
    powerDensity: 420,
    maxChargeRate: 1.2,
    maxDischargeRate: 1.5,
    continuousDischargeRate: 0.8,
    chargeTempMin: 0,
    chargeTempMax: 50,
    dischargeTempMin: -20,
    dischargeTempMax: 55,
    optimalTempMin: 20,
    optimalTempMax: 40,
    cycleLife80: 4000,
    calendarLife: 12,
    thermalRunawayTemp: 260,
    safetyLevel: 'A',
    costIndex: 4,
    tags: ['储能', '电动大巴', '长寿命', '高安全'],
    soaData: {
      socRange: [10, 90],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.3, maxDischargeRate: 0.5 },
        { temp: 0, maxChargeRate: 0.5, maxDischargeRate: 0.9 },
        { temp: 15, maxChargeRate: 0.9, maxDischargeRate: 1.3 },
        { temp: 25, maxChargeRate: 1.2, maxDischargeRate: 1.5 },
        { temp: 35, maxChargeRate: 1.2, maxDischargeRate: 1.5 },
        { temp: 50, maxChargeRate: 0.7, maxDischargeRate: 1.0 },
      ]
    }
  },

  // ========== 高功率电芯 (无人机/电动工具) ==========
  {
    id: 'molicel-21700-p45b',
    manufacturer: 'Molicel',
    model: 'INR21700-P45B',
    chemistry: 'NCA',
    formFactor: '圆柱',
    specification: '21700',
    nominalCapacity: 4.5,
    nominalVoltage: 3.6,
    energyDensity: 230,
    powerDensity: 900,
    maxChargeRate: 2.0,
    maxDischargeRate: 10.0,
    continuousDischargeRate: 5.0,
    chargeTempMin: 0,
    chargeTempMax: 40,
    dischargeTempMin: -30,
    dischargeTempMax: 60,
    optimalTempMin: 20,
    optimalTempMax: 35,
    cycleLife80: 500,
    calendarLife: 5,
    thermalRunawayTemp: 180,
    safetyLevel: 'C',
    costIndex: 10,
    tags: ['无人机', '电动工具', '高功率', '极限性能'],
    soaData: {
      socRange: [20, 80],
      tempRateMatrix: [
        { temp: -20, maxChargeRate: 0.3, maxDischargeRate: 3.0 },
        { temp: -10, maxChargeRate: 0.5, maxDischargeRate: 5.0 },
        { temp: 0, maxChargeRate: 0.8, maxDischargeRate: 7.0 },
        { temp: 20, maxChargeRate: 2.0, maxDischargeRate: 10.0 },
        { temp: 35, maxChargeRate: 1.5, maxDischargeRate: 9.0 },
        { temp: 50, maxChargeRate: 0.8, maxDischargeRate: 6.0 },
      ]
    }
  },
  {
    id: 'sony-18650-vtc6',
    manufacturer: 'Sony/Murata',
    model: 'US18650VTC6',
    chemistry: 'NCM622',
    formFactor: '圆柱',
    specification: '18650',
    nominalCapacity: 3,
    nominalVoltage: 3.6,
    energyDensity: 220,
    powerDensity: 800,
    maxChargeRate: 2.0,
    maxDischargeRate: 6.7,
    continuousDischargeRate: 5.0,
    chargeTempMin: 0,
    chargeTempMax: 45,
    dischargeTempMin: -20,
    dischargeTempMax: 60,
    optimalTempMin: 20,
    optimalTempMax: 35,
    cycleLife80: 600,
    calendarLife: 5,
    thermalRunawayTemp: 185,
    safetyLevel: 'B',
    costIndex: 7,
    tags: ['电动工具', '电子烟', '高功率', '成熟产品'],
    soaData: {
      socRange: [15, 85],
      tempRateMatrix: [
        { temp: -10, maxChargeRate: 0.4, maxDischargeRate: 2.0 },
        { temp: 0, maxChargeRate: 0.8, maxDischargeRate: 4.0 },
        { temp: 15, maxChargeRate: 1.5, maxDischargeRate: 5.5 },
        { temp: 25, maxChargeRate: 2.0, maxDischargeRate: 6.7 },
        { temp: 35, maxChargeRate: 1.8, maxDischargeRate: 6.0 },
        { temp: 45, maxChargeRate: 1.0, maxDischargeRate: 4.0 },
      ]
    }
  },

  // ========== 消费电子电芯 ==========
  {
    id: 'atl-lco-pouch',
    manufacturer: 'ATL',
    model: 'PLM505090',
    chemistry: 'LCO',
    formFactor: '软包',
    specification: '消费电子',
    nominalCapacity: 3.5,
    nominalVoltage: 3.85,
    energyDensity: 280,
    powerDensity: 400,
    maxChargeRate: 1.5,
    maxDischargeRate: 2.0,
    continuousDischargeRate: 1.0,
    chargeTempMin: 5,
    chargeTempMax: 45,
    dischargeTempMin: -10,
    dischargeTempMax: 55,
    optimalTempMin: 20,
    optimalTempMax: 35,
    cycleLife80: 800,
    calendarLife: 5,
    thermalRunawayTemp: 175,
    safetyLevel: 'B',
    costIndex: 8,
    tags: ['手机', '平板', '消费电子', '高能量密度'],
    soaData: {
      socRange: [20, 85],
      tempRateMatrix: [
        { temp: 0, maxChargeRate: 0.3, maxDischargeRate: 0.8 },
        { temp: 10, maxChargeRate: 0.7, maxDischargeRate: 1.2 },
        { temp: 20, maxChargeRate: 1.2, maxDischargeRate: 1.8 },
        { temp: 25, maxChargeRate: 1.5, maxDischargeRate: 2.0 },
        { temp: 35, maxChargeRate: 1.2, maxDischargeRate: 1.8 },
        { temp: 45, maxChargeRate: 0.8, maxDischargeRate: 1.5 },
      ]
    }
  },

  // ========== 户外储能专用 ==========
  {
    id: 'lishen-lfp-wt',
    manufacturer: '力神',
    model: 'LFP-WT100',
    chemistry: 'LFP',
    formFactor: '方壳',
    specification: '宽温储能',
    nominalCapacity: 100,
    nominalVoltage: 3.2,
    energyDensity: 150,
    powerDensity: 350,
    maxChargeRate: 0.8,
    maxDischargeRate: 1.0,
    continuousDischargeRate: 0.5,
    chargeTempMin: -20,
    chargeTempMax: 55,
    dischargeTempMin: -30,
    dischargeTempMax: 60,
    optimalTempMin: 10,
    optimalTempMax: 45,
    cycleLife80: 5000,
    calendarLife: 12,
    thermalRunawayTemp: 275,
    safetyLevel: 'A',
    costIndex: 5,
    tags: ['户外储能', '宽温域', '极端环境', '高可靠'],
    soaData: {
      socRange: [10, 90],
      tempRateMatrix: [
        { temp: -30, maxChargeRate: 0.1, maxDischargeRate: 0.3 },
        { temp: -20, maxChargeRate: 0.2, maxDischargeRate: 0.5 },
        { temp: -10, maxChargeRate: 0.4, maxDischargeRate: 0.7 },
        { temp: 0, maxChargeRate: 0.6, maxDischargeRate: 0.9 },
        { temp: 25, maxChargeRate: 0.8, maxDischargeRate: 1.0 },
        { temp: 45, maxChargeRate: 0.8, maxDischargeRate: 1.0 },
        { temp: 55, maxChargeRate: 0.5, maxDischargeRate: 0.8 },
      ]
    }
  },
];

// 按应用场景分类
export const scenarioCategories = {
  '电动汽车': cellDatabase.filter(c => c.tags.includes('电动汽车')),
  '储能系统': cellDatabase.filter(c => c.tags.includes('储能')),
  '无人机': cellDatabase.filter(c => c.tags.includes('无人机') || c.maxDischargeRate >= 5),
  '消费电子': cellDatabase.filter(c => c.tags.includes('消费电子') || c.tags.includes('手机')),
  '电动工具': cellDatabase.filter(c => c.tags.includes('电动工具')),
  '户外储能': cellDatabase.filter(c => c.tags.includes('户外储能') || c.tags.includes('宽温域')),
};
