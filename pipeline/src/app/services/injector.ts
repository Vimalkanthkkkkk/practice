export interface WorkflowStep {
  id: string;
  type: 'data' | 'filter' | 'max' | 'min' | 'count' | 'sum' | 'empty';
  label: string;
  config?: any;
  data?: any[];
}

export interface FilterConfig {
  field: string;
  operator: 'greater' | 'less' | 'equal' | 'notEqual';
  value: any;
}

export interface AggregateConfig {
  field: string;
  value?: number;
}