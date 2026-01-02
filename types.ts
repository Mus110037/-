
export enum OrderStatus {
  PENDING = '进行中',
  COMPLETED = '已完成',
  CANCELED = '已取消'
}

export type PersonCount = '单人' | '双人' | '多人';
export type ArtType = '头像' | '胸像' | '半身' | '全身' | '组合页';
export type OrderSource = '米画师' | 'QQ' | '画加';
export type CommissionType = '商用' | '私用';

export type ProgressStage = '未开始' | '构图/动态' | '色稿' | '草稿' | '线稿' | '细化' | '成稿';

export const STAGE_PROGRESS_MAP: Record<ProgressStage, number> = {
  '未开始': 0,
  '构图/动态': 15,
  '色稿': 30,
  '草稿': 50,
  '线稿': 70,
  '细化': 90,
  '成稿': 100
};

export interface Order {
  id: string;
  title: string;
  priority: '高' | '中' | '低';
  duration: number;
  deadline: string;
  createdAt: string; // 新增：企划录入日期
  status: OrderStatus;
  progressStage: ProgressStage;
  commissionType: CommissionType;
  personCount: PersonCount;
  artType: ArtType;
  source: OrderSource;
  totalPrice: number;
  description: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
}
