
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

export const DEFAULT_STAGES: StageConfig[] = [
  { name: '未开始', progress: 0, color: '#A8A291' },
  { name: '构图/动态', progress: 15, color: '#7A8B7C' },
  { name: '色稿', progress: 30, color: '#90A19D' },
  { name: '草稿', progress: 50, color: '#B2B7A5' },
  { name: '线稿', progress: 70, color: '#4B5E4F' },
  { name: '细化', progress: 90, color: '#D4A373' },
  { name: '成稿', progress: 100, color: '#3D4C41' }
];

export const DEFAULT_SOURCES: SourceConfig[] = [
  { name: '米画师', fee: 5 },
  { name: '画加', fee: 5 },
  { name: 'QQ', fee: 0 },
  { name: '小红书', fee: 0 },
  { name: '推特', fee: 0 }
];

export const DEFAULT_ART_TYPES = ['头像', '胸像', '半身', '全身', '组合页', '插图'];
export const DEFAULT_PERSON_COUNTS = ['单人', '双人', '多人'];

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'sample-1',
    title: '示例：异世界美少女全身',
    priority: '高',
    duration: 50,
    actualDuration: 42.5,
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    version: 1,
    status: OrderStatus.COMPLETED,
    progressStage: '成稿',
    commissionType: '商用',
    personCount: '单人',
    artType: '全身',
    source: '米画师',
    totalPrice: 2000,
    description: '示例数据：注意背景氛围。'
  }
];
