import { Component, input, computed, inject } from '@angular/core';
import { TestStatus } from '../../../shared/types/status-workflow.types';
import { StatusWorkflowService } from '../../../shared/services/status-workflow.service';

/**
 * Status Badge Component
 * Displays the current status of a test with color-coded badge, icon, and optional description
 */
@Component({
  selector: 'app-status-badge',
  imports: [],
  template: `
    @if (status()) {
      <div class="status-badge" [style.background-color]="statusInfo().color">
        <span class="icon">{{ statusInfo().icon }}</span>
        <span class="label">{{ statusInfo().label }}</span>
      </div>
      @if (showDescription()) {
        <div class="status-description">
          {{ statusInfo().description }}
        </div>
      }
    }
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      color: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      font-size: 0.875rem;
    }
    
    .status-badge .icon {
      font-size: 1rem;
    }
    
    .status-badge .label {
      white-space: nowrap;
    }
    
    .status-description {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      font-style: italic;
    }
  `]
})
export class StatusBadge {
  private statusService = inject(StatusWorkflowService);
  
  status = input.required<TestStatus>();
  showDescription = input<boolean>(false);
  
  statusInfo = computed(() => 
    this.statusService.getStatusInfo(this.status())
  );
}
