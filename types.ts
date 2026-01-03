
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

export interface AppSettings {
  stages: StageConfig[];
  sources: string[];
  artTypes: string[]; // 新增：自定义企划分类
  personCounts: string[]; // 新增：自定义人数分类
}

export interface Order {
  id: string;
  title: string;
  priority: '高' | '中' | '低';
  duration: number;
  deadline: string;
  createdAt: string;
  status: OrderStatus;
  progressStage: string;
  commissionType: CommissionType;
  personCount: string; // 变为动态字符串
  artType: string; // 变为动态字符串
  source: string;
  totalPrice: number;
  description: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

export const DEFAULT_STAGES: StageConfig[] = [
  { name: '未开始', progress: 0, color: '#CBD5E1' },
  { name: '构图/动态', progress: 15, color: '#BEE3F8' },
  { name: '色稿', progress: 30, color: '#C3DAFE' },
  { name: '草稿', progress: 50, color: '#E9D5FF' },
  { name: '线稿', progress: 70, color: '#BCF0DA' },
  { name: '细化', progress: 90, color: '#FEE2E2' },
  { name: '成稿', progress: 100, color: '#10B981' }
];

export const DEFAULT_SOURCES = ['米画师', 'QQ', '画加', '小红书', '推特'];
export const DEFAULT_ART_TYPES = ['头像', '胸像', '半身', '全身', '组合页', '壁纸'];
export const DEFAULT_PERSON_COUNTS = ['单人', '双人', '多人', 'Q版多人'];

export const STAGE_PROGRESS_MAP: Record<string, number> = {
  '未开始': 0,
  '构图/动态': 15,
  '色稿': 30,
  '草稿': 50,
  '线稿': 70,
  '细化': 90,
  '成稿': 100
};
