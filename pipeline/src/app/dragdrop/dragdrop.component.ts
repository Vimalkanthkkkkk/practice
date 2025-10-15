import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AggregateConfig, FilterConfig, WorkflowStep } from '../services/injector';

@Component({
  selector: 'app-dragdrop',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: 'dragdrop.component.html',
  styleUrl: 'dragdrop.component.css'
})
export class DragdropComponent {
  availableOperations: WorkflowStep[] = [
    { id: 'data', type: 'data', label: 'Add Data' },
    { id: 'filter', type: 'filter', label: 'Filter' },
    { id: 'max', type: 'max', label: 'Maximum' },
    { id: 'min', type: 'min', label: 'Minimum' },
    { id: 'count', type: 'count', label: 'Count' },
    { id: 'sum', type: 'sum', label: 'Sum' }
  ];

  workflowSteps: WorkflowStep[] = [
    { id: 'empty-1', type: 'empty', label: 'Empty' }
  ];

  activeStepIndex: number | null = null;
  dataInput = '';
  filterConfig: FilterConfig = { field: '', operator: 'greater', value: '' };
  aggregateConfig: AggregateConfig = { field: '' };
  workflowResult: any = null;

  drop(event: CdkDragDrop<WorkflowStep[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      if (event.container.data === this.workflowSteps) {
        const droppedItem = event.previousContainer.data[event.previousIndex];
        const emptyIndex = this.workflowSteps.findIndex(s => s.type === 'empty');
        
        if (emptyIndex !== -1) {
          this.workflowSteps[emptyIndex] = {
            ...droppedItem,
            id: `${droppedItem.type}-${Date.now()}`
          };
          
          this.workflowSteps.push({
            id: `empty-${Date.now()}`,
            type: 'empty',
            label: 'Empty'
          });
        }
      }
    }
  }

  toggleConfig(index: number) {
    this.activeStepIndex = this.activeStepIndex === index ? null : index;
  }

  removeStep(index: number, event: Event) {
    event.stopPropagation();
    this.workflowSteps.splice(index, 1);
    
    if (!this.workflowSteps.some(s => s.type === 'empty')) {
      this.workflowSteps.push({
        id: `empty-${Date.now()}`,
        type: 'empty',
        label: 'Empty'
      });
    }
  }

  saveData(index: number) {
    try {
      let parsedData;
      if (this.dataInput.trim().startsWith('[')) {
        parsedData = JSON.parse(this.dataInput);
      } else {
        parsedData = this.dataInput.split(',').map(v => {
          const trimmed = v.trim();
          const num = Number(trimmed);
          return isNaN(num) ? trimmed : num;
        });
      }
      
      this.workflowSteps[index].data = parsedData;
      this.workflowSteps[index].config = { saved: true };
      this.dataInput = '';
      alert('Data saved successfully!');
    } catch (error) {
      alert('Invalid data format. Use comma-separated values or JSON array.');
    }
  }

  saveFilter(index: number) {
    if (!this.filterConfig.field || !this.filterConfig.value) {
      alert('Please fill in all filter fields');
      return;
    }
    
    this.workflowSteps[index].config = { ...this.filterConfig };
    this.filterConfig = { field: '', operator: 'greater', value: '' };
    alert('Filter saved successfully!');
  }

  saveAggregate(index: number) {
    if (!this.aggregateConfig.field) {
      alert('Please specify a field name');
      return;
    }
    
    this.workflowSteps[index].config = { ...this.aggregateConfig };
    this.aggregateConfig = { field: '' };
    alert('Configuration saved successfully!');
  }

  executeWorkflow() {
    const steps = this.workflowSteps.filter(s => s.type !== 'empty');
    
    if (steps.length === 0) {
      alert('No steps to execute');
      return;
    }

    let data: any = null;

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        switch (step.type) {
          case 'data':
            if (!step.data) {
              alert(`Step ${i + 1}: No data configured`);
              return;
            }
            data = step.data;
            break;

          case 'filter':
            if (!data || !step.config) {
              alert(`Step ${i + 1}: Missing data or configuration`);
              return;
            }
            data = this.applyFilter(data, step.config);
            break;

          case 'max':
            if (!data || !step.config) {
              alert(`Step ${i + 1}: Missing data or configuration`);
              return;
            }
            data = this.findMax(data, step.config.field);
            break;

          case 'min':
            if (!data || !step.config) {
              alert(`Step ${i + 1}: Missing data or configuration`);
              return;
            }
            data = this.findMin(data, step.config.field);
            break;

          case 'count':
            if (!data) {
              alert(`Step ${i + 1}: Missing data`);
              return;
            }
            data = Array.isArray(data) ? data.length : 1;
            break;

          case 'sum':
            if (!data || !step.config) {
              alert(`Step ${i + 1}: Missing data or configuration`);
              return;
            }
            data = this.calculateSum(data, step.config.field);
            break;
        }
      }

      this.workflowResult = data;
    } catch (error: any) {
      alert(`Execution error: ${error.message}`);
    }
  }

  private applyFilter(data: any[], config: FilterConfig): any[] {
    return data.filter(item => {
      const value = typeof item === 'object' ? item[config.field] : item;
      const compareValue = isNaN(Number(config.value)) ? config.value : Number(config.value);

      switch (config.operator) {
        case 'greater':
          return value > compareValue;
        case 'less':
          return value < compareValue;
        case 'equal':
          return value == compareValue;
        case 'notEqual':
          return value != compareValue;
        default:
          return true;
      }
    });
  }

  private findMax(data: any[], field: string): any {
    if (!Array.isArray(data) || data.length === 0) return null;
    
    return data.reduce((max, item) => {
      const value = typeof item === 'object' ? item[field] : item;
      const maxValue = typeof max === 'object' ? max[field] : max;
      return value > maxValue ? item : max;
    });
  }

  private findMin(data: any[], field: string): any {
    if (!Array.isArray(data) || data.length === 0) return null;
    
    return data.reduce((min, item) => {
      const value = typeof item === 'object' ? item[field] : item;
      const minValue = typeof min === 'object' ? min[field] : min;
      return value < minValue ? item : min;
    });
  }

  private calculateSum(data: any[], field: string): number {
    if (!Array.isArray(data)) return 0;
    
    return data.reduce((sum, item) => {
      const value = typeof item === 'object' ? item[field] : item;
      return sum + (Number(value) || 0);
    }, 0);
  }
}