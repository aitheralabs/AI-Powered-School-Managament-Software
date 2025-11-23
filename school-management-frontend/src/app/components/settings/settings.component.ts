import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { SettingsService, UserSettings } from '../../services/settings.service';
import { NotificationService } from '../../services/notification.service';
import { ErrorService } from '../../services/error.service';
import { UserService } from '../../services/user.service';
import { ChangePasswordDialogComponent } from '../profile/change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Loading states
  isLoading = true;
  isSaving = false;

  // Notification settings
  emailNotifications = true;
  pushNotifications = false;
  smsNotifications = false;

  // Display settings
  darkMode = false;
  compactView = false;

  // Privacy settings
  profileVisibility = true;
  activityStatus = true;

  // Track if settings have changed
  hasChanges = false;
  originalSettings: UserSettings | null = null;

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadSettings();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user settings from API
   */
  loadSettings() {
    this.isLoading = true;
    this.settingsService.getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.applySettings(response.data);
            this.originalSettings = { ...response.data };
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = this.errorService.processError(error);
          this.notificationService.error(errorMessage.message, 'Error');
          this.errorService.logError(error, 'Settings.loadSettings');
        }
      });
  }

  /**
   * Apply settings to component properties
   */
  private applySettings(settings: UserSettings) {
    this.emailNotifications = settings.emailNotifications;
    this.pushNotifications = settings.pushNotifications;
    this.smsNotifications = settings.smsNotifications;
    this.darkMode = settings.darkMode;
    this.compactView = settings.compactView;
    this.profileVisibility = settings.profileVisibility;
    this.activityStatus = settings.activityStatus;
  }

  /**
   * Check if settings have changed
   */
  checkForChanges() {
    if (!this.originalSettings) {
      this.hasChanges = false;
      return;
    }

    this.hasChanges = 
      this.emailNotifications !== this.originalSettings.emailNotifications ||
      this.pushNotifications !== this.originalSettings.pushNotifications ||
      this.smsNotifications !== this.originalSettings.smsNotifications ||
      this.darkMode !== this.originalSettings.darkMode ||
      this.compactView !== this.originalSettings.compactView ||
      this.profileVisibility !== this.originalSettings.profileVisibility ||
      this.activityStatus !== this.originalSettings.activityStatus;
  }

  /**
   * Handle toggle change
   */
  onToggleChange() {
    this.checkForChanges();
  }

  /**
   * Save settings to API
   */
  saveSettings() {
    if (!this.hasChanges) {
      this.notificationService.info('No changes to save');
      return;
    }

    this.isSaving = true;
    const updates = {
      emailNotifications: this.emailNotifications,
      pushNotifications: this.pushNotifications,
      smsNotifications: this.smsNotifications,
      darkMode: this.darkMode,
      compactView: this.compactView,
      profileVisibility: this.profileVisibility,
      activityStatus: this.activityStatus
    };

    this.settingsService.updateSettings(updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          if (response.success) {
            this.notificationService.success('Settings saved successfully!');
            if (response.data) {
              this.originalSettings = { ...response.data };
            }
            this.hasChanges = false;
          }
        },
        error: (error) => {
          this.isSaving = false;
          const errorMessage = this.errorService.processError(error);
          this.notificationService.error(errorMessage.message, 'Error');
          this.errorService.logError(error, 'Settings.saveSettings');
        }
      });
  }

  /**
   * Reset settings to default
   */
  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.isSaving = true;
      this.settingsService.resetSettings()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSaving = false;
            if (response.success && response.data) {
              this.applySettings(response.data);
              this.originalSettings = { ...response.data };
              this.hasChanges = false;
              this.notificationService.success('Settings reset to default');
            }
          },
          error: (error) => {
            this.isSaving = false;
            const errorMessage = this.errorService.processError(error);
            this.notificationService.error(errorMessage.message, 'Error');
            this.errorService.logError(error, 'Settings.resetSettings');
          }
        });
    }
  }

  /**
   * Open change password dialog
   */
  onChangePassword() {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      disableClose: true
    });
  }

  /**
   * Download user data
   */
  onDownloadData() {
    this.notificationService.info('Preparing your data for download...');
    // TODO: Implement data download functionality
  }

  /**
   * Delete account
   */
  onDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.notificationService.warning('Account deletion is not yet implemented');
      // TODO: Implement account deletion
    }
  }
}
