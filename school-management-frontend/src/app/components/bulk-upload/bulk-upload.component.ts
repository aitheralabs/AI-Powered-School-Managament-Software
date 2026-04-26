import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

export type BulkUploadType = 'students' | 'teachers';

interface ImportResult {
  created: number;
  failed: number;
  errors: string[];
}

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatDividerModule,
  ],
  template: `
<div class="bulk-upload">
  <div class="upload-header">
    <h3>Bulk Import via CSV</h3>
    <button mat-stroked-button (click)="downloadTemplate()" class="template-btn">
      <mat-icon>download</mat-icon> Download Template
    </button>
  </div>

  <!-- Drop zone -->
  <div
    class="drop-zone"
    [class.drag-over]="isDragging"
    [class.has-file]="selectedFile"
    (dragover)="onDragOver($event)"
    (dragleave)="isDragging = false"
    (drop)="onDrop($event)"
    (click)="fileInput.click()"
  >
    <input #fileInput type="file" accept=".csv" hidden (change)="onFileSelected($event)" />
    <mat-icon class="upload-icon">{{ selectedFile ? 'description' : 'upload_file' }}</mat-icon>
    <div *ngIf="!selectedFile">
      <p class="drop-label">Drag & drop your CSV file here</p>
      <p class="drop-sub">or click to browse · Max 10 MB</p>
    </div>
    <div *ngIf="selectedFile">
      <p class="drop-label">{{ selectedFile.name }}</p>
      <p class="drop-sub">{{ (selectedFile.size / 1024).toFixed(1) }} KB · Ready to import</p>
    </div>
  </div>

  <!-- Progress -->
  <mat-progress-bar *ngIf="isUploading" mode="indeterminate" class="progress-bar"></mat-progress-bar>

  <!-- Actions -->
  <div class="upload-actions" *ngIf="selectedFile && !isUploading">
    <button mat-flat-button color="primary" (click)="upload()">
      <mat-icon>cloud_upload</mat-icon> Import
    </button>
    <button mat-button (click)="clearFile()">
      <mat-icon>clear</mat-icon> Clear
    </button>
  </div>

  <!-- Results -->
  <div class="result-card" *ngIf="result">
    <div class="result-stats">
      <div class="stat success">
        <mat-icon>check_circle</mat-icon>
        <span>{{ result.created }} created</span>
      </div>
      <div class="stat" [class.error]="result.failed > 0">
        <mat-icon>{{ result.failed > 0 ? 'error' : 'check' }}</mat-icon>
        <span>{{ result.failed }} failed</span>
      </div>
    </div>
    <div class="error-list" *ngIf="result.errors.length > 0">
      <p class="error-title">Errors:</p>
      <ul>
        <li *ngFor="let e of result.errors.slice(0,10)">{{ e }}</li>
        <li *ngIf="result.errors.length > 10">… and {{ result.errors.length - 10 }} more</li>
      </ul>
    </div>
  </div>
</div>
  `,
  styles: [`
.bulk-upload { display: flex; flex-direction: column; gap: 16px; }
.upload-header {
  display: flex; align-items: center; justify-content: space-between;
  h3 { margin: 0; font-size: 15px; font-weight: 600; }
}
.template-btn { font-size: 13px; }
.drop-zone {
  border: 2px dashed var(--gray-300, #cbd5e1); border-radius: 12px;
  padding: 32px; text-align: center; cursor: pointer;
  transition: all 0.2s; background: var(--gray-50, #f8fafc);
  &.drag-over { border-color: #6366f1; background: rgba(99,102,241,.05); }
  &.has-file  { border-color: #10b981; background: rgba(16,185,129,.05); }
  &:hover { border-color: #6366f1; }
}
.upload-icon { font-size: 40px; width: 40px; height: 40px; color: #94a3b8; margin-bottom: 8px; }
.drop-label { margin: 0; font-size: 14px; font-weight: 500; color: #475569; }
.drop-sub   { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
.progress-bar { border-radius: 4px; }
.upload-actions { display: flex; gap: 12px; }
.result-card {
  border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;
}
.result-stats { display: flex; gap: 24px; margin-bottom: 8px; }
.stat {
  display: flex; align-items: center; gap: 6px; font-size: 14px;
  color: #10b981;
  &.error { color: #ef4444; }
  mat-icon { font-size: 18px; width: 18px; height: 18px; }
}
.error-list { margin-top: 8px; }
.error-title { margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #ef4444; }
ul { margin: 0; padding-left: 16px; }
li { font-size: 12px; color: #64748b; line-height: 1.6; }
  `],
})
export class BulkUploadComponent {
  @Input() type: BulkUploadType = 'students';

  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;
  result: ImportResult | null = null;

  private readonly API = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private toast: NotificationService,
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
    if (!file.name.endsWith('.csv')) {
      this.toast.error('Only CSV files are allowed');
      return;
    }
    this.selectedFile = file;
    this.result = null;
  }

  clearFile(): void {
    this.selectedFile = null;
    this.result = null;
  }

  upload(): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.isUploading = true;
    this.result = null;

    const endpoint = `${this.API}/${this.type}/import-csv`;

    this.http.post<{ success: boolean; data: ImportResult }>(endpoint, formData).subscribe({
      next: res => {
        this.isUploading = false;
        this.result = res.data;
        this.selectedFile = null;
        if (res.data.created > 0) {
          this.toast.success(`${res.data.created} ${this.type} imported successfully`);
        }
        if (res.data.failed > 0) {
          this.toast.warning(`${res.data.failed} rows failed to import`);
        }
      },
      error: err => {
        this.isUploading = false;
        this.toast.error(err.error?.message || 'Import failed. Please check your CSV file.');
      },
    });
  }

  downloadTemplate(): void {
    const url = `${this.API}/${this.type}/csv-template`;
    window.open(url, '_blank');
  }
}
