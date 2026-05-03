import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-school-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './school-register.component.html',
  styleUrl: './school-register.component.scss',
})
export class SchoolRegisterComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  error = '';
  success = '';
  showPassword = false;
  currentStep = 1;
  totalSteps = 2;

  private readonly API = `${environment.apiUrl}/schools`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      // Step 1 — school info
      name:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      slug:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-z0-9-]+$/)]],
      email:   ['', [Validators.required, Validators.email]],
      phone:   [''],
      city:    [''],
      state:   [''],
      // Step 2 — admin account
      adminFirstName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      adminLastName:  ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      adminEmail:     ['', [Validators.required, Validators.email]],
      adminPassword:  ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onNameInput() {
    const slug = this.form.get('slug');
    // Auto-fill slug only if user hasn't manually edited it
    if (!slug?.dirty || !slug.value) {
      const generated = (this.form.get('name')?.value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      slug?.setValue(generated, { emitEvent: false });
    }
  }

  step1Controls(): AbstractControl[] {
    return ['name', 'slug', 'email'].map(k => this.form.get(k)!);
  }

  step1Valid(): boolean {
    return this.step1Controls().every(c => c.valid);
  }

  nextStep() {
    this.step1Controls().forEach(c => c.markAsTouched());
    if (!this.step1Valid()) return;
    this.currentStep = 2;
  }

  prevStep() {
    this.currentStep = 1;
    this.error = '';
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isLoading = true;
    this.error = '';
    this.success = '';

    const payload = {
      name:           this.form.value.name,
      slug:           this.form.value.slug,
      email:          this.form.value.email,
      phone:          this.form.value.phone || undefined,
      city:           this.form.value.city || undefined,
      state:          this.form.value.state || undefined,
      adminFirstName: this.form.value.adminFirstName,
      adminLastName:  this.form.value.adminLastName,
      adminEmail:     this.form.value.adminEmail,
      adminPassword:  this.form.value.adminPassword,
    };

    this.http.post<any>(`${this.API}/register`, payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.success = res.message || 'School registered! Redirecting to login…';
        setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || err.error?.error;
        if (Array.isArray(msg)) {
          this.error = msg.map((e: any) => e.message || e).join(', ');
        } else {
          this.error = msg || 'Registration failed. Please try again.';
        }
      },
    });
  }

  fieldError(name: string): string | null {
    const c = this.form.get(name);
    if (!c || !c.invalid || !c.touched) return null;
    if (c.errors?.['required']) return 'This field is required.';
    if (c.errors?.['email']) return 'Enter a valid email address.';
    if (c.errors?.['minlength']) return `Minimum ${c.errors['minlength'].requiredLength} characters.`;
    if (c.errors?.['pattern']) return 'Use only lowercase letters, numbers, and hyphens.';
    return 'Invalid value.';
  }
}
