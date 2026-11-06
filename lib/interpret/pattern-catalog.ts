/**
 * 格局目录 —— 由排盘引擎扫盘生成（静态数据，构建时零成本）
 * 生成方式：npx tsx gen-catalog.mjs（扫 YEARS.length*12*12*2 张盘，覆盖 70 种格局）
 * 每条含 name / level / description / palaces / source 与一条示例条件。
 */

export interface CatalogPattern {
  name: string;
  level: 'excellent' | 'good' | 'neutral' | 'caution';
  description: string;
  palaces: string[];
  source: string | null;
  sample?: { required: string[]; bonus?: string[]; breaking?: string[] } | null;
}

export const PATTERN_CATALOG: CatalogPattern[] = [
  {
    "name": "紫府同宫",
    "level": "good",
    "description": "紫微天府同宫但未坐命，主一生有贵人贵气依托，但本身不一定大富贵，需看会照吉煞而定。",
    "palaces": [
      "财帛"
    ],
    "source": "《紫微斗数全书·紫府同宫格》",
    "sample": {
      "required": [
        "紫微天府同宫（不在命宫，会照减力）"
      ],
      "bonus": [
        "再会昌曲"
      ],
      "breaking": []
    }
  },
  {
    "name": "府相朝垣",
    "level": "excellent",
    "description": "天府天相分守命宫三方四正，文武并济、权印双辉，主一生衣食丰足、地位崇高。古书云\"府相朝垣千钟食禄\"，常见于政界、企业管理者。",
    "palaces": [
      "财帛",
      "命宫"
    ],
    "source": "《紫微斗数全书·府相朝垣格》",
    "sample": {
      "required": [
        "天府坐命三方",
        "天相坐命三方",
        "两星不同宫"
      ],
      "bonus": [],
      "breaking": []
    }
  },
  {
    "name": "武贪格",
    "level": "excellent",
    "description": "武曲贪狼会命，财星与桃花欲望星交辉，古书云\"武贪不发少年人\"——三十岁后方能厚积薄发。主中年以后大富大贵，财源由人脉、应酬、欲望管理而来，适合金融、投机、销售、娱乐业。",
    "palaces": [
      "官禄",
      "夫妻"
    ],
    "source": "《紫微斗数骨髓赋》",
    "sample": {
      "required": [
        "武曲贪狼对宫拱照",
        "会照命宫三方"
      ],
      "bonus": [
        "武曲化禄"
      ],
      "breaking": []
    }
  },
  {
    "name": "廉贞天相格",
    "level": "good",
    "description": "廉贞天相同宫，印绶格局，主秉公处事、清廉之名，宜任公职、行政管理、法务、企划。怕见擎羊化忌，则反主官非。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "廉贞天相同宫"
      ],
      "bonus": [],
      "breaking": []
    }
  },
  {
    "name": "双禄朝垣",
    "level": "excellent",
    "description": "化禄、禄存同会命宫三方四正，财源涌动、衣食丰足。古书云\"双禄朝垣，富比陶朱\"，主一生不愁财，多有正财横财兼得。",
    "palaces": [
      "官禄",
      "迁移",
      "财帛",
      "命宫"
    ],
    "source": "《紫微斗数全书·双禄朝垣》",
    "sample": {
      "required": [
        "化禄会照三方四正",
        "禄存会照三方四正"
      ]
    }
  },
  {
    "name": "魁钺同会",
    "level": "good",
    "description": "天魁天钺同会命宫三方四正，主\"天乙贵人\"加持，关键时刻总有贵人提携。倪师说「魁钺夹命，必为贵人」——遇到困难时身边会出现得力相助者，宜主动维护人脉。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·魁钺论》",
    "sample": {
      "required": [
        "天魁、天钺同会命宫三方四正"
      ]
    }
  },
  {
    "name": "空劫夹命",
    "level": "caution",
    "description": "地空地劫夹命，主财来财去、思想脱俗、易遁入宗教哲学。古书云\"空劫夹命，财不聚\"。宜技艺、宗教、研究等不重物质之业。",
    "palaces": [
      "命宫",
      "兄弟",
      "父母"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "地空地劫分居命宫前后两宫"
      ]
    }
  },
  {
    "name": "天马入命",
    "level": "neutral",
    "description": "天马坐命，主一生奔波、动中得财，宜走商旅、外勤、跨界发展。倪师说「天马入命，无禄不发」——若再会禄存或化禄即「禄马交驰」之富格。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·天马星》",
    "sample": {
      "required": [
        "天马入命宫"
      ]
    }
  },
  {
    "name": "机月同梁三星会",
    "level": "neutral",
    "description": "机月同梁需天机、太阴、天同、天梁四星齐会三方四正方为完整真格；本盘只会齐其中 3 颗（天机、太阴、天梁），缺天同未会，并非完整真格，力量减一档。文质带谋，宜公职、教研、医疗、服务等靠积累与稳定的行业，关键看缺位星与四化的配合。",
    "palaces": [
      "官禄",
      "迁移",
      "命宫"
    ],
    "source": "《紫微斗数全书·机月同梁格》",
    "sample": {
      "required": [
        "三方四正会天机、太阴、天梁（机月同梁缺天同）"
      ]
    }
  },
  {
    "name": "机月同梁",
    "level": "excellent",
    "description": "天机太阴天同天梁四星齐入命迁财官，文质彬彬、聪慧善谋。最适合公职、学术、文艺、医疗、服务等需稳定累积的行业，不宜大冒险大投机。",
    "palaces": [
      "官禄",
      "财帛",
      "命宫"
    ],
    "source": "《紫微斗数全书·机月同梁格》",
    "sample": {
      "required": [
        "天机、太阴、天同、天梁四星齐入命宫三方四正"
      ],
      "bonus": [
        "再会昌曲",
        "再会化科"
      ],
      "breaking": []
    }
  },
  {
    "name": "巨日同宫",
    "level": "good",
    "description": "巨门太阳同寅宫，太阳化解巨门暗曜，主以口才、传媒、外语、专业立业。寅宫为佳，申宫力减。怕巨门化忌则官非。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书·巨日同宫》",
    "sample": {
      "required": [
        "巨门太阳同入寅宫"
      ],
      "bonus": [
        "寅宫太阳庙旺，巨门得日光化解是非"
      ],
      "breaking": []
    }
  },
  {
    "name": "化科入身",
    "level": "good",
    "description": "天梁化科入身宫，主名声、文书、学术运。倪师讲化科是「贵人星」——天梁化科带来的是被人看重的特质，宜从事文书、教育、研究、咨询、文创等“以名取利”的方向。",
    "palaces": [
      "身宫"
    ],
    "source": "《紫微斗数全书·四化论》",
    "sample": {
      "required": [
        "天梁化科入身宫"
      ]
    }
  },
  {
    "name": "辅弼同会",
    "level": "good",
    "description": "左辅右弼同会命宫三方四正，主一生贵人不绝、人缘极佳。最宜领导岗位与团队合作型工作。倪师说「辅弼夹命，平生贵人多」——你不是单打独斗的命，要善用人际网络。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·辅弼论》",
    "sample": {
      "required": [
        "左辅、右弼同会命宫三方四正"
      ]
    }
  },
  {
    "name": "日月同宫",
    "level": "good",
    "description": "太阳太阴于未宫同宫，阴阳平衡，文武兼备。主异性缘佳、事业顺遂、名声远播。未宫日月双美尤佳。",
    "palaces": [
      "父母"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "太阳太阴同入未宫"
      ],
      "bonus": [
        "未宫日月同辉（古书云未宫日月双美）"
      ],
      "breaking": [
        "日月宫煞星同坐"
      ]
    }
  },
  {
    "name": "武曲化禄入命",
    "level": "good",
    "description": "武曲化禄坐命，主生财顺利、人缘佳、机缘多。武曲化禄属正财，宜实业、金融。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "武曲化禄坐命宫"
      ]
    }
  },
  {
    "name": "禄存守命",
    "level": "good",
    "description": "禄存坐命，主一生衣食无忧、财禄稳定。性格保守，善积累，但羊陀夹禄须防小人。最宜配化禄、左辅右弼方为大格。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·禄存星》",
    "sample": {
      "required": [
        "禄存入命宫"
      ]
    }
  },
  {
    "name": "天马在迁",
    "level": "neutral",
    "description": "天马在迁移宫，主外出有利、远行得财，宜异乡发展。配化禄主异地生财，配煞星则旅途多波折。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书·天马星》",
    "sample": {
      "required": [
        "天马入迁移宫"
      ]
    }
  },
  {
    "name": "铃贪格",
    "level": "excellent",
    "description": "贪狼遇铃星三方会照，主突发横财、突如其来的机遇。古书云“贪狼遇火铃，必发横财”，但来得快去得也快，宜见好就收。",
    "palaces": [
      "迁移",
      "福德"
    ],
    "source": "《紫微斗数骨髓赋》",
    "sample": {
      "required": [
        "贪狼会照铃星",
        "贪狼会照命宫三方"
      ],
      "bonus": [
        "贪狼庙旺",
        "贪狼化禄/化权"
      ],
      "breaking": []
    }
  },
  {
    "name": "武曲七杀",
    "level": "good",
    "description": "武曲七杀同宫，将星配财星，主果决刚毅、理财能力强，适合金融、军警、创业。但忌见化忌煞星，否则凶险。一生奋斗、积财但操心。",
    "palaces": [
      "疾厄"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "武曲七杀同宫"
      ],
      "bonus": [
        "武曲化禄"
      ],
      "breaking": []
    }
  },
  {
    "name": "天同天梁格",
    "level": "neutral",
    "description": "天同天梁同宫，福星与荫星共会，主宽厚和善、乐于助人，宜医疗、教育、宗教、社会公益。但偏温和保守，难成大富大贵之局。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "天同天梁同宫"
      ],
      "bonus": [],
      "breaking": [
        "煞星同坐"
      ]
    }
  },
  {
    "name": "辅弼夹命",
    "level": "excellent",
    "description": "左辅右弼夹命，传统论述认为此格象征贵人相助与福厚特质。适合走仕途、大企业管理等能发挥组织才能的方向。古书云\"左辅右弼，终身福厚\"——强调此格在组织协调中的优势。",
    "palaces": [
      "命宫",
      "兄弟",
      "父母"
    ],
    "source": "《紫微斗数全书·辅弼夹命》",
    "sample": {
      "required": [
        "左辅右弼分居命宫前后两宫"
      ],
      "bonus": [],
      "breaking": []
    }
  },
  {
    "name": "杀破狼",
    "level": "good",
    "description": "七杀、破军、贪狼三星会命，开创闯荡之命格。一生变动多、不甘平凡，宜创业、军警、业务、销售。中年后才能稳定守成，年轻时易因冲动失利。",
    "palaces": [],
    "source": "《紫微斗数全书·杀破狼》",
    "sample": {
      "required": [
        "七杀、破军、贪狼三星齐入命宫三方四正"
      ],
      "bonus": [
        "三方有化禄或化权（动得有力）"
      ],
      "breaking": []
    }
  },
  {
    "name": "廉杀羊",
    "level": "caution",
    "description": "廉贞、七杀、擎羊三星会照命宫三方，传统论述中标记为需要特别关注的组合。此格在大限流年触发时提醒保持谨慎态度：驾驶安全、人际和平、医疗决策需理性——强调主动管理而非消极宿命。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·廉杀羊》",
    "sample": {
      "required": [
        "廉贞、七杀、擎羊三星会照三方四正"
      ]
    }
  },
  {
    "name": "化权入官",
    "level": "good",
    "description": "武曲化权入官禄宫，主事业有掌控力、能担当独当一面的职位。化权代表权力与执行力——武曲化权说明你在事业上能成为决策者或核心执行者，宜走管理或技术权威路线。",
    "palaces": [
      "官禄"
    ],
    "source": "《紫微斗数全书·四化论》",
    "sample": {
      "required": [
        "武曲化权入官禄宫"
      ]
    }
  },
  {
    "name": "昌曲同会",
    "level": "good",
    "description": "文昌文曲同会三方四正，主才华横溢、口才文笔俱佳。宜走需要表达与文采的行业，化科加持则名声大显。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·文星论》",
    "sample": {
      "required": [
        "文昌、文曲同会命宫三方四正"
      ]
    }
  },
  {
    "name": "天同化忌入命",
    "level": "caution",
    "description": "天同化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。化忌不一定坏，代表此星能量需要特别关注。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "天同化忌坐命宫"
      ]
    }
  },
  {
    "name": "太阳化禄入命",
    "level": "good",
    "description": "太阳化禄坐命，主生财顺利、人缘佳、机缘多。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "太阳化禄坐命宫"
      ]
    }
  },
  {
    "name": "火铃夹命",
    "level": "caution",
    "description": "火星铃星分居命宫前后两宫夹命，主性急、易冲动、突发意外或纠纷。需培养耐性、避免冲动决策。",
    "palaces": [
      "命宫",
      "兄弟",
      "父母"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "火星铃星分居命宫前后两宫"
      ]
    }
  },
  {
    "name": "天同化忌入迁",
    "level": "caution",
    "description": "天同化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "天同化忌坐迁宫"
      ]
    }
  },
  {
    "name": "化禄入财",
    "level": "good",
    "description": "太阳化禄入财帛宫，主财源畅通、收入稳定。倪师讲化禄是「正财」象征——这个化禄星所代表的能力（太阳的核心特质）是你赚钱的主轴。配禄存或天马则财源更广。",
    "palaces": [
      "财帛"
    ],
    "source": "《紫微斗数全书·四化论》",
    "sample": {
      "required": [
        "太阳化禄入财帛宫"
      ]
    }
  },
  {
    "name": "化科入命",
    "level": "good",
    "description": "太阴化科入命宫，主名声、文书、学术运。倪师讲化科是「贵人星」——太阴化科带来的是被人看重的特质，宜从事文书、教育、研究、咨询、文创等“以名取利”的方向。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·四化论》",
    "sample": {
      "required": [
        "太阴化科入命宫"
      ]
    }
  },
  {
    "name": "紫微入命",
    "level": "caution",
    "description": "紫微独坐命宫，帝王之星，自尊心强、有领导魅力。但紫微最忌\"在野孤君\"——若无左右辅弼相会，反成孤高自傲、易招毁谤。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "紫微独坐命宫（无天府同坐）"
      ],
      "bonus": [
        "文昌文曲同会"
      ],
      "breaking": [
        "无辅弼（孤君无臣）"
      ]
    }
  },
  {
    "name": "禄存守身",
    "level": "good",
    "description": "禄存入身宫，主中年后财源稳定、得禄自享。倪师说「禄存入身，财气近身」——配偶或事业方向能带来稳定财禄。",
    "palaces": [
      "身宫"
    ],
    "source": "《紫微斗数全书·禄存星》",
    "sample": {
      "required": [
        "禄存入身宫"
      ]
    }
  },
  {
    "name": "君臣庆会",
    "level": "excellent",
    "description": "紫微入命，左辅右弼同会，帝王得贤臣辅佐，主大富大贵、统御之命。一生贵人不绝，宜走政商高位、跨界领袖之途。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·君臣庆会格》",
    "sample": {
      "required": [
        "紫微入命",
        "左辅右弼同会三方四正"
      ],
      "bonus": [
        "再会文昌或文曲"
      ],
      "breaking": []
    }
  },
  {
    "name": "日月夹命",
    "level": "excellent",
    "description": "太阳太阴分居命宫两侧夹照，光明磊落，一生贵人相助，事业蓬勃。男主官贵，女主旺夫兴家。日月须不落陷方为真夹。",
    "palaces": [
      "兄弟",
      "父母"
    ],
    "source": "《紫微斗数全书·日月夹命》",
    "sample": {
      "required": [
        "太阳太阴分居命宫前后两宫"
      ],
      "bonus": [
        "太阳庙旺"
      ],
      "breaking": []
    }
  },
  {
    "name": "巨火羊",
    "level": "caution",
    "description": "巨门、火星、擎羊三星会照，传统古籍记载此格为需要警惕之组合（古文\"终身缢死\"为宿命论表述，今已不适用）。现代理解为：此组合象征直言易触发冲突、情绪激烈时需要自我觉察。修养方向是：练习温和表达、主动化解对立、培养情绪管理。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数骨髓赋·巨火羊》",
    "sample": {
      "required": [
        "巨门、火星、擎羊三星会照三方四正"
      ]
    }
  },
  {
    "name": "阳梁昌禄",
    "level": "good",
    "description": "太阳、天梁、文昌、禄存四星齐会命宫三方，号称\"科举之星\"，主清贵显达、考运极佳，宜走学术、文教、研究、专业认证之路，一生功名易就。",
    "palaces": [
      "财帛",
      "迁移"
    ],
    "source": "《紫微斗数全书·阳梁昌禄格》",
    "sample": {
      "required": [
        "太阳会命宫三方",
        "天梁会命宫三方",
        "文昌会命宫三方",
        "禄存会命宫三方"
      ],
      "bonus": [],
      "breaking": [
        "太阳落陷（阳梁失辉）"
      ]
    }
  },
  {
    "name": "明珠出海",
    "level": "excellent",
    "description": "命未空宫，对宫丑宫日月同辉拱照，号\"明珠出海\"。主出生平凡、后天努力出头，宜远赴他乡、学术研究或大公司高位，主大富大贵。",
    "palaces": [
      "命宫",
      "迁移"
    ],
    "source": "《紫微斗数全集·明珠出海》",
    "sample": {
      "required": [
        "命宫在未为空宫",
        "对宫丑宫为太阳太阴同度"
      ],
      "bonus": [
        "再会昌曲"
      ],
      "breaking": []
    }
  },
  {
    "name": "石中隐玉",
    "level": "excellent",
    "description": "巨门坐命子午，外表平凡而内蕴才学。早年默默无闻、中年方显贵气，宜走专业、研究、口才、传媒。需有禄权或文昌相助方能\"凿石见玉\"。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数骨髓赋·石中隐玉》",
    "sample": {
      "required": [
        "巨门入命于子宫"
      ],
      "bonus": [
        "文昌会照（石中隐玉得明）"
      ],
      "breaking": []
    }
  },
  {
    "name": "火贪格",
    "level": "good",
    "description": "贪狼遇火星三方会照，主突发横财、突如其来的机遇。古书云“贪狼遇火铃，必发横财”，但来得快去得也快，宜见好就收。本盘破格条件已触发，发力打折。",
    "palaces": [
      "命宫",
      "迁移"
    ],
    "source": "《紫微斗数骨髓赋》",
    "sample": {
      "required": [
        "贪狼会照火星",
        "贪狼会照命宫三方"
      ],
      "bonus": [
        "贪狼庙旺"
      ],
      "breaking": [
        "贪狼宫又见羊陀（破横发之力）"
      ]
    }
  },
  {
    "name": "昌曲夹命",
    "level": "excellent",
    "description": "文昌文曲夹命宫，主聪明俊秀、文采斐然，宜走文教、学术、艺术、写作。古书云\"昌曲夹命主科甲\"，最利考运。",
    "palaces": [
      "命宫",
      "兄弟",
      "父母"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "文昌文曲分居命宫前后两宫"
      ]
    }
  },
  {
    "name": "昌曲坐命",
    "level": "good",
    "description": "文昌文曲同入命宫，主聪明俊秀、文采斐然，宜文学、教育、写作、咨询。最忌化忌——昌曲化忌主文书契约暗亏。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·文星论》",
    "sample": {
      "required": [
        "文昌、文曲同会命宫三方四正"
      ]
    }
  },
  {
    "name": "三奇加会",
    "level": "excellent",
    "description": "化禄、化权、化科三吉化齐会命宫三方四正，号称\"三奇加会\"。主一生功名、财富、贵人三全，是紫微斗数最高吉格之一。",
    "palaces": [
      "官禄",
      "迁移",
      "财帛",
      "命宫"
    ],
    "source": "《紫微斗数全书·三奇加会》",
    "sample": {
      "required": [
        "化禄、化权、化科三吉化齐会命宫三方四正"
      ]
    }
  },
  {
    "name": "巨门化禄入命",
    "level": "good",
    "description": "巨门化禄坐命，主生财顺利、人缘佳、机缘多。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "巨门化禄坐命宫"
      ]
    }
  },
  {
    "name": "铃昌陀武",
    "level": "caution",
    "description": "铃星、文昌、陀罗、武曲四星齐会，传统古籍记载此为需要特别关注之组合（古文\"限至投河\"为宿命论表述，非现代理解）。现代建议为：此组合在大限流年触发时，提醒理性处理重大决策、关注情绪波动、维持生活的稳定性——强调主动管理而非消极等待。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数骨髓赋·铃昌陀武》",
    "sample": {
      "required": [
        "铃星、文昌、陀罗、武曲四星会照三方四正"
      ]
    }
  },
  {
    "name": "羊陀夹忌",
    "level": "caution",
    "description": "化忌坐命，左右擎羊陀罗夹命，古书云\"羊陀夹忌为败局\"，主一生劳碌奔波、坎坷不顺、身心俱疲。需以德行修养与积极做事化解，凡事谨慎为上。",
    "palaces": [
      "命宫",
      "兄弟",
      "父母"
    ],
    "source": "《紫微斗数骨髓赋·羊陀夹忌》",
    "sample": {
      "required": [
        "化忌坐命",
        "擎羊陀罗分居命宫前后两宫"
      ]
    }
  },
  {
    "name": "魁钺夹命",
    "level": "good",
    "description": "天魁天钺夹命，男称天乙、女称玉堂，一生贵人提携。考试、求职、关键时刻常有意外贵人相助。",
    "palaces": [
      "命宫",
      "兄弟",
      "父母"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "天魁天钺分居命宫前后两宫"
      ]
    }
  },
  {
    "name": "武曲化忌入命",
    "level": "caution",
    "description": "武曲化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。化忌不一定坏，代表此星能量需要特别关注。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "武曲化忌坐命宫"
      ]
    }
  },
  {
    "name": "武曲化忌入迁",
    "level": "caution",
    "description": "武曲化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "武曲化忌坐迁宫"
      ]
    }
  },
  {
    "name": "天梁化禄入命",
    "level": "good",
    "description": "天梁化禄坐命，主生财顺利、人缘佳、机缘多。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "天梁化禄坐命宫"
      ]
    }
  },
  {
    "name": "科权双会",
    "level": "good",
    "description": "化科 + 化权 同会三方四正，主名权双美——既有学识/名声（科），又有掌控力（权），宜走\"专业权威\"路线（如医生、律师、教授、技术骨干），名利双收且根基扎实。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书·四化会照》",
    "sample": {
      "required": [
        "化科、化权同会命宫三方四正"
      ]
    }
  },
  {
    "name": "贪狼化忌入迁",
    "level": "caution",
    "description": "贪狼化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "贪狼化忌坐迁宫"
      ]
    }
  },
  {
    "name": "贪狼化忌入命",
    "level": "caution",
    "description": "贪狼化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。化忌不一定坏，代表此星能量需要特别关注。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "贪狼化忌坐命宫"
      ]
    }
  },
  {
    "name": "破军化禄入命",
    "level": "good",
    "description": "破军化禄坐命，主生财顺利、人缘佳、机缘多。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "破军化禄坐命宫"
      ]
    }
  },
  {
    "name": "廉贞化禄入命",
    "level": "good",
    "description": "廉贞化禄坐命，主生财顺利、人缘佳、机缘多。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "廉贞化禄坐命宫"
      ]
    }
  },
  {
    "name": "太阳化忌入迁",
    "level": "caution",
    "description": "太阳化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "太阳化忌坐迁宫"
      ]
    }
  },
  {
    "name": "太阳化忌入命",
    "level": "caution",
    "description": "太阳化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。化忌不一定坏，代表此星能量需要特别关注。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "太阳化忌坐命宫"
      ]
    }
  },
  {
    "name": "天机化禄入命",
    "level": "good",
    "description": "天机化禄坐命，主生财顺利、人缘佳、机缘多。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "天机化禄坐命宫"
      ]
    }
  },
  {
    "name": "太阴化忌入迁",
    "level": "caution",
    "description": "太阴化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "太阴化忌坐迁宫"
      ]
    }
  },
  {
    "name": "太阴化忌入命",
    "level": "caution",
    "description": "太阴化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。化忌不一定坏，代表此星能量需要特别关注。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "太阴化忌坐命宫"
      ]
    }
  },
  {
    "name": "天同化禄入命",
    "level": "good",
    "description": "天同化禄坐命，主生财顺利、人缘佳、机缘多。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "天同化禄坐命宫"
      ]
    }
  },
  {
    "name": "马头带箭",
    "level": "caution",
    "description": "擎羊于午宫坐命，号\"马头带箭\"，古书云\"威镇边疆\"。此格象征果决行动力与竞争精神，适合需要执行力与果敢决策的职业方向。传统论述同时提醒此格需要配合吉利星曜才能最优发挥——强调组合影响而非单星独论。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数骨髓赋·马头带箭》",
    "sample": {
      "required": [
        "擎羊于午宫坐命"
      ],
      "bonus": []
    }
  },
  {
    "name": "廉贞化忌入迁",
    "level": "caution",
    "description": "廉贞化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "廉贞化忌坐迁宫"
      ]
    }
  },
  {
    "name": "廉贞化忌入命",
    "level": "caution",
    "description": "廉贞化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。化忌不一定坏，代表此星能量需要特别关注。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "廉贞化忌坐命宫"
      ]
    }
  },
  {
    "name": "太阴化禄入命",
    "level": "good",
    "description": "太阴化禄坐命，主生财顺利、人缘佳、机缘多。太阴化禄属阴财、不动产。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "太阴化禄坐命宫"
      ]
    }
  },
  {
    "name": "巨门化忌入命",
    "level": "caution",
    "description": "巨门化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。化忌不一定坏，代表此星能量需要特别关注。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "巨门化忌坐命宫"
      ]
    }
  },
  {
    "name": "巨门化忌入迁",
    "level": "caution",
    "description": "巨门化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "巨门化忌坐迁宫"
      ]
    }
  },
  {
    "name": "天机化忌入命",
    "level": "caution",
    "description": "天机化忌坐命宫，需留意自身固执、心理障碍或健康隐患，凡事退一步思考。化忌不一定坏，代表此星能量需要特别关注。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "天机化忌坐命宫"
      ]
    }
  },
  {
    "name": "贪狼化禄入命",
    "level": "good",
    "description": "贪狼化禄坐命，主生财顺利、人缘佳、机缘多。贪狼化禄属人脉财、桃花财。",
    "palaces": [
      "命宫"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "贪狼化禄坐命宫"
      ]
    }
  },
  {
    "name": "天机化忌入迁",
    "level": "caution",
    "description": "天机化忌坐迁移宫，外出、远行、人际关系易有波折，宜守不宜动。",
    "palaces": [
      "迁移"
    ],
    "source": "《紫微斗数全书》",
    "sample": {
      "required": [
        "天机化忌坐迁宫"
      ]
    }
  }
];
