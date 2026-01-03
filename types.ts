
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
  duration: number;
  deadline: string;
  createdAt: string;
  updatedAt: string; // 新增：用于判断哪个版本是最新的
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
  { name: '未开始', progress: 0, color: '#94A3B8' },
  { name: '构图/动态', progress: 15, color: '#3B82F6' },
  { name: '色稿', progress: 30, color: '#6366F1' },
  { name: '草稿', progress: 50, color: '#A855F7' },
  { name: '线稿', progress: 70, color: '#10B981' },
  { name: '细化', progress: 90, color: '#F43F5E' },
  { name: '成稿', progress: 100, color: '#1E293B' }
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
    duration: 7,
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
    status: OrderStatus.PENDING,
    progressStage: '草稿',
    commissionType: '商用',
    personCount: '单人',
    artType: '全身',
    source: '米画师',
    totalPrice: 2000,
    description: '示例数据：需要注意背景的氛围感，突出光影。'
  }
];
