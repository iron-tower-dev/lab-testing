import { Component, input, output, computed, inject } from '@angular/core';
import { ActionContext } from '../../../shared/types/status-workflow.types';
import { StatusWorkflowService } from '../../../shared/services/status-workflow.service';
import { SharedModule } from '../../../shared-module';

/**
 * Action Buttons Component
 * Displays context-aware action buttons based on test status, user qualification, and mode
 */
@Component({
  selector: 'app-action-buttons',
  imports: [SharedModule],
  template: `
    <div class="action-buttons">
      @for (action of availableActions(); track action.action) {
        <button 
          mat-raised-button
          [color]="getButtonColor(action.action)"
          class="action-button"
          [class.primary]="action.action === 'save' || action.action === 'accept'"
          [class.danger]="action.action === 'delete' || action.action === 'reject'"
          (click)="actionClicked.emit(action.action)">
          @if (action.icon) {
            <mat-icon>{{ action.icon }}</mat-icon>
          }
          {{ action.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    .action-buttons {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }
    
    .action-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .action-button mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }
  `]
})
export class ActionButtons {
  private statusService = inject(StatusWorkflowService);
  
  context = input.required<ActionContext>();
  actionClicked = output<string>();
  
  availableActions = computed(() => 
    this.statusService.getAvailableActions(this.context())
  );
  
  getButtonColor(action: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (action) {
      case 'save':
      case 'accept':
        return 'primary';
      case 'delete':
      case 'reject':
        return 'warn';
      case 'partial-save':
      case 'media-ready':
        return 'accent';
      default:
        return undefined;
    }
  }
}
