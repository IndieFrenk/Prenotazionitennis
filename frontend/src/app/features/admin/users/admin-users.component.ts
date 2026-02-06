import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserService } from '@app/core/services/user.service';
import { User } from '@app/core/models/user.model';

/**
 * Admin users list component.
 * Displays a paginated DataTable of users with search, role change, and
 * status toggle capabilities.
 */
@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    DropdownModule,
    PaginatorModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
    DatePipe
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;
  private searchSubscription: Subscription | null = null;

  /** Subject for debouncing search input. */
  private readonly searchSubject = new Subject<string>();

  /** Users loaded from the current page. */
  users: User[] = [];

  /** Whether data is being loaded. */
  loading = false;

  /** Current search term. */
  searchTerm = '';

  /** Current page index (0-based). */
  currentPage = 0;

  /** Number of rows per page. */
  pageSize = 10;

  /** Total number of users matching the search. */
  totalRecords = 0;

  /** Dropdown options for role changes. */
  readonly roleOptions = [
    { label: 'Utente', value: 'ROLE_USER' },
    { label: 'Socio', value: 'ROLE_MEMBER' },
    { label: 'Amministratore', value: 'ROLE_ADMIN' }
  ];

  ngOnInit(): void {
    // Set up debounced search
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 0;
      this.loadUsers();
    });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
    this.searchSubject.complete();
  }

  /**
   * Emit the search term into the debounce subject.
   * @param term - The search string typed by the user.
   */
  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * Handle paginator page change events.
   * @param event - The paginator state change event.
   */
  onPageChange(event: PaginatorState): void {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? 10;
    this.loadUsers();
  }

  /**
   * Prompt for role change confirmation, then update the role.
   * @param user - The target user.
   * @param newRole - The new role value.
   */
  confirmRoleChange(user: User, newRole: string): void {
    if (newRole === user.role) return;

    const roleLabel = this.getRoleLabel(newRole);
    this.confirmationService.confirm({
      message: `Sei sicuro di voler cambiare il ruolo di "${user.username}" in "${roleLabel}"?`,
      header: 'Conferma cambio ruolo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Conferma',
      rejectLabel: 'Annulla',
      accept: () => this.changeRole(user, newRole),
      reject: () => {
        // Reset the dropdown in the UI by triggering change detection
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Prompt for status toggle confirmation.
   * @param user - The target user.
   */
  confirmToggleStatus(user: User): void {
    const action = user.accountStatus === 'ATTIVO' ? 'sospendere' : 'riattivare';
    this.confirmationService.confirm({
      message: `Sei sicuro di voler ${action} l'utente "${user.username}"?`,
      header: 'Conferma cambio stato',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Conferma',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: user.accountStatus === 'ATTIVO' ? 'p-button-warning' : 'p-button-success',
      accept: () => this.toggleStatus(user)
    });
  }

  /**
   * Return the Italian label for a user role.
   * @param role - The role string.
   */
  getRoleLabel(role: string): string {
    switch (role) {
      case 'ROLE_USER':
        return 'Utente';
      case 'ROLE_MEMBER':
        return 'Socio';
      case 'ROLE_ADMIN':
        return 'Amministratore';
      default:
        return role;
    }
  }

  /**
   * Return a PrimeNG severity for a role tag.
   * @param role - The role string.
   */
  getRoleSeverity(role: string): 'info' | 'success' | 'danger' {
    switch (role) {
      case 'ROLE_USER':
        return 'info';
      case 'ROLE_MEMBER':
        return 'success';
      case 'ROLE_ADMIN':
        return 'danger';
      default:
        return 'info';
    }
  }

  /**
   * Return the Italian label for a user account status.
   * @param status - The account status string.
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'ATTIVO':
        return 'Attivo';
      case 'SOSPESO':
        return 'Sospeso';
      default:
        return status;
    }
  }

  /**
   * Return a PrimeNG severity for a status tag.
   * @param status - The account status string.
   */
  getStatusSeverity(status: string): 'success' | 'warn' {
    switch (status) {
      case 'ATTIVO':
        return 'success';
      case 'SOSPESO':
        return 'warn';
      default:
        return 'success';
    }
  }

  /**
   * Return the button label for the status toggle.
   * @param status - The current account status.
   */
  getToggleLabel(status: string): string {
    return status === 'ATTIVO' ? 'Sospendi' : 'Attiva';
  }

  /**
   * Return the button icon for the status toggle.
   * @param status - The current account status.
   */
  getToggleIcon(status: string): string {
    return status === 'ATTIVO' ? 'pi pi-ban' : 'pi pi-check-circle';
  }

  /**
   * Return the button severity for the status toggle.
   * @param status - The current account status.
   */
  getToggleSeverity(status: string): 'warn' | 'success' {
    return status === 'ATTIVO' ? 'warn' : 'success';
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Load users from the API for the current page and search term. */
  private loadUsers(): void {
    this.loading = true;
    this.subscription?.unsubscribe();

    const search = this.searchTerm.trim() || undefined;

    this.subscription = this.userService.getUsers(this.currentPage, this.pageSize, search).subscribe({
      next: (response) => {
        this.users = response.content;
        this.totalRecords = response.totalElements;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare gli utenti.'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Change the role of a user via the API. */
  private changeRole(user: User, newRole: string): void {
    this.userService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Ruolo aggiornato',
          detail: `Il ruolo di "${user.username}" e stato aggiornato a "${this.getRoleLabel(newRole)}".`
        });
        this.loadUsers();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: `Impossibile aggiornare il ruolo di "${user.username}".`
        });
        this.cdr.markForCheck();
      }
    });
  }

  /** Toggle the active/suspended status of a user via the API. */
  private toggleStatus(user: User): void {
    this.userService.toggleUserStatus(user.id).subscribe({
      next: () => {
        const newStatus = user.accountStatus === 'ATTIVO' ? 'sospeso' : 'riattivato';
        this.messageService.add({
          severity: 'success',
          summary: 'Stato aggiornato',
          detail: `L'utente "${user.username}" e stato ${newStatus}.`
        });
        this.loadUsers();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: `Impossibile aggiornare lo stato di "${user.username}".`
        });
        this.cdr.markForCheck();
      }
    });
  }
}
