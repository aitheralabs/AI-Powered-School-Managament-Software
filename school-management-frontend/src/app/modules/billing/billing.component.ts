import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

declare var Razorpay: any;

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, DecimalPipe],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
})
export class BillingComponent implements OnInit {
  usage: any = null;
  plans: any[] = [];
  invoices: any[] = [];
  invoiceTotal = 0;

  isLoading = true;
  checkoutLoading = false;
  error = '';
  successMsg = '';

  billingPeriod: 'monthly' | 'yearly' = 'monthly';

  private readonly API = `${environment.apiUrl}/schools`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.loadRazorpayScript();
    Promise.all([this.loadUsage(), this.loadPlans(), this.loadInvoices()]).finally(() => {
      this.isLoading = false;
    });
  }

  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof Razorpay !== 'undefined') { resolve(); return; }
      const script   = document.createElement('script');
      script.src     = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload  = () => resolve();
      script.onerror = () => { console.warn('Razorpay script failed to load'); resolve(); };
      document.head.appendChild(script);
    });
  }

  private loadUsage(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`${this.API}/me/usage`).subscribe({
        next:  (r) => { this.usage = r.data; resolve(); },
        error: () => resolve(),
      });
    });
  }

  private loadPlans(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`${this.API}/plans`).subscribe({
        next:  (r) => { this.plans = (r.data || []).filter((p: any) => p.name !== 'trial'); resolve(); },
        error: () => resolve(),
      });
    });
  }

  private loadInvoices(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`${this.API}/me/invoices`).subscribe({
        next: (r) => {
          this.invoices     = r.data?.invoices || [];
          this.invoiceTotal = r.data?.total    || 0;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  get currentPlan(): string  { return this.usage?.plan || 'trial'; }
  get trialEndsAt(): Date | null {
    return this.usage?.trialEndsAt ? new Date(this.usage.trialEndsAt) : null;
  }
  get trialDaysLeft(): number {
    if (!this.trialEndsAt) return 0;
    return Math.max(0, Math.ceil((this.trialEndsAt.getTime() - Date.now()) / 86400000));
  }
  get isTrialing(): boolean { return this.usage?.subscriptionStatus === 'trialing'; }
  get isPastDue(): boolean  { return this.usage?.subscriptionStatus === 'past_due'; }

  planPrice(plan: any): number {
    return this.billingPeriod === 'yearly' ? (plan.price_yearly || 0) : (plan.price_monthly || 0);
  }

  planSaving(plan: any): number {
    if (!plan.price_monthly || !plan.price_yearly) return 0;
    return Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100);
  }

  isCurrentPlan(planName: string): boolean {
    return this.currentPlan === planName;
  }

  isUpgrade(planName: string): boolean {
    const order = ['trial', 'basic', 'standard', 'premium', 'enterprise'];
    return order.indexOf(planName) > order.indexOf(this.currentPlan);
  }

  planColor(name: string): string {
    if (name === 'enterprise') return '#7c3aed';
    if (name === 'premium')    return '#2563eb';
    if (name === 'standard')   return '#0891b2';
    if (name === 'basic')      return '#059669';
    return '#64748b';
  }

  usagePct(used: number, max: number): number {
    if (!max) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  }

  startCheckout(plan: any) {
    if (plan.name === 'enterprise') {
      window.location.href = 'mailto:sales@edusaas.in?subject=Enterprise inquiry';
      return;
    }
    const price = this.planPrice(plan);
    if (!price) return;

    this.checkoutLoading = true;
    this.error = '';

    this.http.post<any>(`${this.API}/me/create-order`, {
      plan:          plan.name,
      billingPeriod: this.billingPeriod,
    }).subscribe({
      next: (res) => {
        this.checkoutLoading = false;
        this.openRazorpay(res.data, plan);
      },
      error: (err) => {
        this.checkoutLoading = false;
        this.error = err.error?.message || 'Could not create payment order. Please try again.';
      },
    });
  }

  private openRazorpay(orderData: any, plan: any) {
    if (typeof Razorpay === 'undefined') {
      this.error = 'Payment gateway failed to load. Please refresh and try again.';
      return;
    }

    const options = {
      key:         orderData.keyId,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        'EduSaaS',
      description: `${orderData.planName} — ${this.billingPeriod}`,
      order_id:    orderData.orderId,
      prefill: {
        name:    orderData.schoolName,
        email:   orderData.schoolEmail,
        contact: orderData.schoolPhone || '',
      },
      theme: { color: '#4f46e5' },
      handler: (response: any) => {
        this.verifyPayment(response, plan.name);
      },
      modal: {
        ondismiss: () => { this.checkoutLoading = false; },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      this.error = response.error?.description || 'Payment failed. Please try again.';
    });
    rzp.open();
  }

  private verifyPayment(response: any, plan: string) {
    this.checkoutLoading = true;
    this.http.post<any>(`${this.API}/me/verify-payment`, {
      orderId:       response.razorpay_order_id,
      paymentId:     response.razorpay_payment_id,
      signature:     response.razorpay_signature,
      plan,
      billingPeriod: this.billingPeriod,
    }).subscribe({
      next: (res) => {
        this.checkoutLoading = false;
        this.successMsg = res.message || 'Subscription activated!';
        this.loadUsage();
        this.loadInvoices();
        setTimeout(() => this.successMsg = '', 6000);
      },
      error: (err) => {
        this.checkoutLoading = false;
        this.error = err.error?.message || 'Payment verification failed. Contact support.';
      },
    });
  }

  featureList(plan: any): string[] {
    const feats: string[] = [];
    if (plan.max_students)       feats.push(`Up to ${plan.max_students.toLocaleString()} students`);
    if (plan.max_teachers)       feats.push(`Up to ${plan.max_teachers} teachers`);
    if (plan.feature_ai_insights) feats.push('AI insights & analytics');
    if (plan.feature_messaging)   feats.push('Parent messaging');
    if (plan.feature_library)     feats.push('Library management');
    if (plan.feature_transport)   feats.push('Transport management');
    if (plan.feature_hostel)      feats.push('Hostel management');
    if (plan.feature_api_access)  feats.push('API access');
    return feats;
  }
}
