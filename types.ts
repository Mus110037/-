
export enum OrderStatus {
  PENDING = '进行中',
  COMPLETED = '已完成',
  CANCELED = '已取消'
}

export type CommissionType = '商用' | '私用';

export interface StageConfig {
  name: string;
  progress: number;
  color: string;
}

export interface SourceConfig {
  name: string;
  fee: number;
}

export interface Resource {
  id: string;
  name: string;
}

export interface AppSettings {
  stages: StageConfig[];
  sources: SourceConfig[];
  artTypes: string[];
  personCounts: string[];
  showAiUI: boolean; // 新增：控制财务视图中时薪计算的显示
}

export interface Order {
  id: string;
  title: string;
  priority: '高' | '中' | '低';
  duration: number; // 预计小时
  actualDuration?: number; // 实际所用小时
  deadline: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: OrderStatus;
  progressStage: string;
  commissionType: CommissionType;
  personCount: string;
  artType: string;
  source: string;
  totalPrice: number;
  description: string;
}

// 进度阶段：使用易懂的专业术语
export const DEFAULT_STAGES: StageConfig[] = [
  { name: '待开始', progress: 0, color: '#FFF9C4' },
  { name: '草稿阶段', progress: 15, color: '#FFECB3' },
  { name: '线稿阶段', progress: 30, color: '#FCE4EC' },
  { name: '铺色阶段', progress: 50, color: '#F3E5F5' },
  { name: '细化阶段', progress: 75, color: '#E3F2FD' },
  { name: '后期调整', progress: 90, color: '#E8F5E9' },
  { name: '已成稿', progress: 100, color: '#D4A373' }
];

export const DEFAULT_SOURCES: SourceConfig[] = [
  { name: '米画师', fee: 5 },
  { name: '画加', fee: 5 },
  { name: '小红书', fee: 0 },
  { name: '推特', fee: 0 },
  { name: '私单', fee: 0 }
];

export const DEFAULT_ART_TYPES = ['头像', '半身/立绘', '全插', '拆分层', '组合页', '曲绘/PV'];
export const DEFAULT_PERSON_COUNTS = ['单人', '双人', '多人'];

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 's1',
    title: '【加急】赛博风少女全插',
    priority: '高',
    duration: 40,
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    version: 1,
    status: OrderStatus.PENDING,
    progressStage: '铺色阶段',
    commissionType: '商用',
    personCount: '单人',
    artType: '全插',
    source: '米画师',
    totalPrice: 4500,
    description: '需强调霓虹散射感。'
  },
  {
    id: 's2',
    title: '某Vocaloid曲绘委托',
    priority: '中',
    duration: 30,
    deadline: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    version: 1,
    status: OrderStatus.PENDING,
    progressStage: '草稿阶段',
    commissionType: '商用',
    personCount: '单人',
    artType: '曲绘/PV',
    source: '私单',
    totalPrice: 2800,
    description: '横向构图，预留歌词位。'
  },
  {
    id: 's3',
    title: 'B站百大头像框设计',
    priority: '高',
    duration: 15,
    deadline: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    version: 1,
    status: OrderStatus.PENDING,
    progressStage: '后期调整',
    commissionType: '商用',
    personCount: '单人',
    artType: '头像',
    source: '米画师',
    totalPrice: 1200,
    description: '透明背景，注意圆框裁剪。'
  },
  {
    id: 's4',
    title: '海外推特私单：角色立绘',
    priority: '中',
    duration: 20,
    deadline: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    version: 1,
    status: OrderStatus.PENDING,
    progressStage: '待开始',
    commissionType: '私用',
    personCount: '单人',
    artType: '半身/立绘',
    source: '推特',
    totalPrice: 850,
    description: '需黑白草稿确认。'
  },
  {
    id: 's5',
    title: '画加企划：Q版双人插图',
    priority: '低',
    duration: 12,
    deadline: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    version: 1,
    status: OrderStatus.PENDING,
    progressStage: '待开始',
    commissionType: '私用',
    personCount: '双人',
    artType: '全插',
    source: '画加',
    totalPrice: 450,
    description: '简单场景即可。'
  },
  {
    id: 's6',
    title: '已完成：猫耳少年头像',
    priority: '中',
    duration: 6,
    actualDuration: 5.5,
    deadline: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    version: 1,
    status: OrderStatus.COMPLETED,
    progressStage: '已成稿',
    commissionType: '私用',
    personCount: '单人',
    artType: '头像',
    source: '小红书',
    totalPrice: 300,
    description: '好评返图已收。'
  }
];
