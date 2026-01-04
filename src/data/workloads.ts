// 预设工况模板

export interface WorkloadProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;

  // 工况特征参数
  peakDischargeRate: number; // 峰值放电倍率 C
  avgDischargeRate: number; // 平均放电倍率 C
  peakChargeRate: number; // 峰值充电倍率 C
  avgChargeRate: number; // 平均充电倍率 C

  // 温度需求
  operatingTempMin: number;
  operatingTempMax: number;

  // 寿命需求
  targetCycles: number;
  targetYears: number;

  // SOC使用范围
  socMin: number;
  socMax: number;

  // 工况曲线数据点 (用于可视化)
  curveData: { time: number; power: number }[];

  // 权重偏好 (用于匹配算法)
  priorities: {
    energyDensity: number; // 1-10
    powerDensity: number;
    safety: number;
    cost: number;
    cycleLife: number;
  };
}

export const workloadTemplates: WorkloadProfile[] = [
  // ========== 电动汽车工况 ==========
  {
    id: 'nedc',
    name: 'NEDC 城市工况',
    category: '电动汽车',
    description: '新欧洲驾驶循环，模拟城市道路与郊区混合行驶，含频繁启停',
    icon: '🚗',
    peakDischargeRate: 2.5,
    avgDischargeRate: 0.8,
    peakChargeRate: 1.5,
    avgChargeRate: 0.5,
    operatingTempMin: -10,
    operatingTempMax: 45,
    targetCycles: 2000,
    targetYears: 8,
    socMin: 20,
    socMax: 90,
    curveData: [
      { time: 0, power: 0 }, { time: 10, power: 30 }, { time: 20, power: 15 },
      { time: 30, power: 50 }, { time: 40, power: 0 }, { time: 50, power: 35 },
      { time: 60, power: 70 }, { time: 70, power: 50 }, { time: 80, power: 30 },
      { time: 90, power: 80 }, { time: 100, power: 60 }, { time: 110, power: 0 },
    ],
    priorities: { energyDensity: 8, powerDensity: 6, safety: 8, cost: 7, cycleLife: 9 }
  },
  {
    id: 'wltp',
    name: 'WLTP 综合工况',
    category: '电动汽车',
    description: '全球轻型车测试程序，更贴近真实驾驶，含高速巡航段',
    icon: '🚙',
    peakDischargeRate: 3.0,
    avgDischargeRate: 1.0,
    peakChargeRate: 2.0,
    avgChargeRate: 0.8,
    operatingTempMin: -15,
    operatingTempMax: 45,
    targetCycles: 1500,
    targetYears: 10,
    socMin: 15,
    socMax: 95,
    curveData: [
      { time: 0, power: 0 }, { time: 10, power: 25 }, { time: 20, power: 40 },
      { time: 30, power: 60 }, { time: 40, power: 45 }, { time: 50, power: 80 },
      { time: 60, power: 100 }, { time: 70, power: 85 }, { time: 80, power: 95 },
      { time: 90, power: 70 }, { time: 100, power: 40 }, { time: 110, power: 0 },
    ],
    priorities: { energyDensity: 9, powerDensity: 7, safety: 8, cost: 6, cycleLife: 8 }
  },
  {
    id: 'fast-charge',
    name: '快充运营工况',
    category: '电动汽车',
    description: '网约车/出租车场景，频繁快充，高周转率',
    icon: '⚡',
    peakDischargeRate: 2.0,
    avgDischargeRate: 1.2,
    peakChargeRate: 3.0,
    avgChargeRate: 2.0,
    operatingTempMin: -5,
    operatingTempMax: 40,
    targetCycles: 3000,
    targetYears: 5,
    socMin: 20,
    socMax: 80,
    curveData: [
      { time: 0, power: 50 }, { time: 10, power: 60 }, { time: 20, power: 55 },
      { time: 30, power: 70 }, { time: 40, power: 65 }, { time: 50, power: 60 },
      { time: 60, power: -100 }, { time: 70, power: -90 }, { time: 80, power: -70 },
      { time: 90, power: 50 }, { time: 100, power: 60 }, { time: 110, power: 55 },
    ],
    priorities: { energyDensity: 6, powerDensity: 8, safety: 9, cost: 8, cycleLife: 10 }
  },

  // ========== 储能工况 ==========
  {
    id: 'grid-storage',
    name: '电网储能工况',
    category: '储能',
    description: '日间削峰填谷，1-2次/天充放电循环',
    icon: '🏭',
    peakDischargeRate: 0.5,
    avgDischargeRate: 0.3,
    peakChargeRate: 0.5,
    avgChargeRate: 0.3,
    operatingTempMin: 0,
    operatingTempMax: 40,
    targetCycles: 6000,
    targetYears: 15,
    socMin: 10,
    socMax: 90,
    curveData: [
      { time: 0, power: -30 }, { time: 20, power: -30 }, { time: 40, power: -25 },
      { time: 60, power: 0 }, { time: 80, power: 35 }, { time: 100, power: 35 },
      { time: 120, power: 30 }, { time: 140, power: 0 }, { time: 160, power: -30 },
    ],
    priorities: { energyDensity: 5, powerDensity: 4, safety: 10, cost: 10, cycleLife: 10 }
  },
  {
    id: 'home-storage',
    name: '家庭储能工况',
    category: '储能',
    description: '光伏配套储能，日间充电/夜间放电',
    icon: '🏠',
    peakDischargeRate: 1.0,
    avgDischargeRate: 0.5,
    peakChargeRate: 0.8,
    avgChargeRate: 0.4,
    operatingTempMin: -10,
    operatingTempMax: 45,
    targetCycles: 4000,
    targetYears: 10,
    socMin: 15,
    socMax: 95,
    curveData: [
      { time: 0, power: 10 }, { time: 10, power: -20 }, { time: 20, power: -50 },
      { time: 30, power: -40 }, { time: 40, power: -30 }, { time: 50, power: 0 },
      { time: 60, power: 30 }, { time: 70, power: 50 }, { time: 80, power: 40 },
      { time: 90, power: 20 }, { time: 100, power: 10 }, { time: 110, power: 5 },
    ],
    priorities: { energyDensity: 6, powerDensity: 5, safety: 9, cost: 9, cycleLife: 9 }
  },

  // ========== 无人机工况 ==========
  {
    id: 'drone-commercial',
    name: '商用无人机工况',
    category: '无人机',
    description: '航拍/物流无人机，高功率起降，中功率巡航',
    icon: '🚁',
    peakDischargeRate: 8.0,
    avgDischargeRate: 3.0,
    peakChargeRate: 2.0,
    avgChargeRate: 1.5,
    operatingTempMin: -10,
    operatingTempMax: 50,
    targetCycles: 500,
    targetYears: 3,
    socMin: 20,
    socMax: 100,
    curveData: [
      { time: 0, power: 100 }, { time: 5, power: 60 }, { time: 15, power: 45 },
      { time: 25, power: 40 }, { time: 35, power: 50 }, { time: 45, power: 45 },
      { time: 55, power: 70 }, { time: 60, power: 100 }, { time: 65, power: 0 },
    ],
    priorities: { energyDensity: 10, powerDensity: 10, safety: 7, cost: 5, cycleLife: 5 }
  },
  {
    id: 'drone-fpv',
    name: 'FPV竞速无人机',
    category: '无人机',
    description: '极限竞速，持续大倍率放电',
    icon: '🏎️',
    peakDischargeRate: 15.0,
    avgDischargeRate: 8.0,
    peakChargeRate: 3.0,
    avgChargeRate: 2.0,
    operatingTempMin: 10,
    operatingTempMax: 45,
    targetCycles: 200,
    targetYears: 1,
    socMin: 30,
    socMax: 100,
    curveData: [
      { time: 0, power: 80 }, { time: 2, power: 100 }, { time: 4, power: 90 },
      { time: 6, power: 100 }, { time: 8, power: 85 }, { time: 10, power: 100 },
      { time: 12, power: 95 }, { time: 14, power: 100 }, { time: 16, power: 0 },
    ],
    priorities: { energyDensity: 8, powerDensity: 10, safety: 5, cost: 4, cycleLife: 3 }
  },

  // ========== 消费电子工况 ==========
  {
    id: 'smartphone',
    name: '智能手机工况',
    category: '消费电子',
    description: '日常使用，快充+常规放电',
    icon: '📱',
    peakDischargeRate: 1.5,
    avgDischargeRate: 0.5,
    peakChargeRate: 2.0,
    avgChargeRate: 1.0,
    operatingTempMin: 0,
    operatingTempMax: 45,
    targetCycles: 800,
    targetYears: 3,
    socMin: 20,
    socMax: 85,
    curveData: [
      { time: 0, power: 20 }, { time: 10, power: 30 }, { time: 20, power: 15 },
      { time: 30, power: 25 }, { time: 40, power: 50 }, { time: 50, power: 35 },
      { time: 60, power: -80 }, { time: 70, power: -60 }, { time: 80, power: -30 },
      { time: 90, power: 20 }, { time: 100, power: 15 }, { time: 110, power: 10 },
    ],
    priorities: { energyDensity: 9, powerDensity: 6, safety: 9, cost: 7, cycleLife: 7 }
  },
  {
    id: 'power-tool',
    name: '电动工具工况',
    category: '消费电子',
    description: '电钻/电锯等，脉冲大功率输出',
    icon: '🔧',
    peakDischargeRate: 6.0,
    avgDischargeRate: 2.5,
    peakChargeRate: 2.0,
    avgChargeRate: 1.0,
    operatingTempMin: -10,
    operatingTempMax: 50,
    targetCycles: 600,
    targetYears: 5,
    socMin: 15,
    socMax: 100,
    curveData: [
      { time: 0, power: 0 }, { time: 5, power: 100 }, { time: 10, power: 0 },
      { time: 15, power: 80 }, { time: 20, power: 0 }, { time: 25, power: 100 },
      { time: 30, power: 60 }, { time: 35, power: 100 }, { time: 40, power: 0 },
    ],
    priorities: { energyDensity: 7, powerDensity: 9, safety: 7, cost: 8, cycleLife: 6 }
  },

  // ========== 户外电源工况 ==========
  {
    id: 'portable-power',
    name: '便携户外电源',
    category: '户外储能',
    description: '露营/应急电源，宽温域、中低功率',
    icon: '🏕️',
    peakDischargeRate: 1.5,
    avgDischargeRate: 0.5,
    peakChargeRate: 1.0,
    avgChargeRate: 0.5,
    operatingTempMin: -20,
    operatingTempMax: 50,
    targetCycles: 1000,
    targetYears: 5,
    socMin: 10,
    socMax: 95,
    curveData: [
      { time: 0, power: 10 }, { time: 15, power: 30 }, { time: 30, power: 60 },
      { time: 45, power: 40 }, { time: 60, power: 20 }, { time: 75, power: 50 },
      { time: 90, power: 30 }, { time: 105, power: 15 }, { time: 120, power: 10 },
    ],
    priorities: { energyDensity: 7, powerDensity: 5, safety: 9, cost: 8, cycleLife: 8 }
  },
  {
    id: 'extreme-cold',
    name: '极寒环境工况',
    category: '户外储能',
    description: '极地科考/高原作业，-30°C以下工作',
    icon: '❄️',
    peakDischargeRate: 0.8,
    avgDischargeRate: 0.3,
    peakChargeRate: 0.5,
    avgChargeRate: 0.2,
    operatingTempMin: -40,
    operatingTempMax: 40,
    targetCycles: 800,
    targetYears: 5,
    socMin: 20,
    socMax: 85,
    curveData: [
      { time: 0, power: 15 }, { time: 20, power: 25 }, { time: 40, power: 20 },
      { time: 60, power: 30 }, { time: 80, power: 25 }, { time: 100, power: 20 },
    ],
    priorities: { energyDensity: 5, powerDensity: 4, safety: 10, cost: 6, cycleLife: 8 }
  },
];

// 按类别分组
export const workloadCategories = {
  '电动汽车': workloadTemplates.filter(w => w.category === '电动汽车'),
  '储能': workloadTemplates.filter(w => w.category === '储能'),
  '无人机': workloadTemplates.filter(w => w.category === '无人机'),
  '消费电子': workloadTemplates.filter(w => w.category === '消费电子'),
  '户外储能': workloadTemplates.filter(w => w.category === '户外储能'),
};
