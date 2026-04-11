import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  features = [
    {
      icon: 'school',
      title: 'Multi-School Management',
      desc: 'Manage multiple schools from a single platform with complete data isolation and role-based access.'
    },
    {
      icon: 'people',
      title: 'Student & Teacher Portals',
      desc: 'Dedicated dashboards for students, teachers, parents, and administrators — each tailored to their needs.'
    },
    {
      icon: 'how_to_reg',
      title: 'Attendance Tracking',
      desc: 'Mark and monitor attendance in real time with detailed reports and automated alerts for parents.'
    },
    {
      icon: 'payments',
      title: 'Fee Management',
      desc: 'Streamline fee collection with automated reminders, payment history, and overdue tracking.'
    },
    {
      icon: 'grade',
      title: 'Grade & Assessment',
      desc: 'Record grades, generate report cards, and track academic progress across subjects and terms.'
    },
    {
      icon: 'bar_chart',
      title: 'Analytics & Reports',
      desc: 'Comprehensive dashboards with real-time insights on attendance, fees, and academic performance.'
    }
  ];

  stats = [
    { value: '500+', label: 'Schools Onboarded' },
    { value: '1.2M+', label: 'Students Managed' },
    { value: '99.9%', label: 'Platform Uptime' },
    { value: '4.9★', label: 'Average Rating' }
  ];

  plans = [
    {
      name: 'Basic',
      price: '₹2,999',
      period: '/month',
      highlight: false,
      features: [
        'Up to 500 students',
        'Attendance tracking',
        'Basic fee management',
        'Student & teacher portals',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      price: '₹6,999',
      period: '/month',
      highlight: true,
      features: [
        'Up to 2,000 students',
        'Everything in Basic',
        'Advanced analytics',
        'Parent portal',
        'Grade management',
        'Priority support'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      highlight: false,
      features: [
        'Unlimited students',
        'Everything in Pro',
        'Multi-school management',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 support'
      ]
    }
  ];

  testimonials = [
    {
      name: 'Dr. Priya Sharma',
      role: 'Principal, Delhi Public School',
      text: 'EduSaaS transformed how we manage our school. Attendance, fees, and grades — all in one place. Our parents love the transparency.',
      avatar: 'P'
    },
    {
      name: 'Rajesh Kumar',
      role: 'Administrator, Sunrise Academy',
      text: 'The multi-role dashboards are incredible. Teachers can mark attendance in seconds, and parents see updates instantly.',
      avatar: 'R'
    },
    {
      name: 'Anita Patel',
      role: 'Director, Future Kids School',
      text: 'We saved 40+ hours per month on administrative work after switching to EduSaaS. The ROI was immediate.',
      avatar: 'A'
    }
  ];
}
