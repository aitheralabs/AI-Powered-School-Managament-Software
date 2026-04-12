import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  roles: string[];
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatDividerModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  @Output() closeSidenav = new EventEmitter<void>();
  
  currentUser: User | null = null;
  menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['admin', 'teacher', 'student', 'parent', 'staff']
    },
    {
      title: 'Student Management',
      icon: 'school',
      roles: ['admin', 'teacher', 'staff'],
      children: [
        {
          title: 'All Students',
          icon: 'group',
          route: '/students',
          roles: ['admin', 'teacher', 'staff']
        },
        {
          title: 'Add Student',
          icon: 'person_add',
          route: '/students/add',
          roles: ['admin', 'staff']
        },
        {
          title: 'Student Reports',
          icon: 'assessment',
          route: '/students/reports',
          roles: ['admin', 'teacher', 'staff']
        }
      ]
    },
    {
      title: 'Teacher Management',
      icon: 'person',
      roles: ['admin', 'staff'],
      children: [
        {
          title: 'All Teachers',
          icon: 'group',
          route: '/teachers',
          roles: ['admin', 'staff']
        },
        {
          title: 'Add Teacher',
          icon: 'person_add',
          route: '/teachers/add',
          roles: ['admin', 'staff']
        },
        {
          title: 'Teacher Assignments',
          icon: 'assignment_ind',
          route: '/teachers/assignments',
          roles: ['admin', 'staff']
        }
      ]
    },
    {
      title: 'Academic Structure',
      icon: 'account_tree',
      roles: ['admin', 'teacher', 'staff'],
      children: [
        {
          title: 'Classes',
          icon: 'class',
          route: '/classes',
          roles: ['admin', 'teacher', 'staff']
        },
        {
          title: 'Subjects',
          icon: 'book',
          route: '/subjects',
          roles: ['admin', 'teacher', 'staff']
        },
        {
          title: 'Academic Years',
          icon: 'calendar_today',
          route: '/academic/academic-years',
          roles: ['admin', 'staff']
        }
      ]
    },
    {
      title: 'Attendance',
      icon: 'how_to_reg',
      roles: ['admin', 'teacher', 'staff'],
      children: [
        {
          title: 'Mark Attendance',
          icon: 'check_circle',
          route: '/attendance/mark',
          roles: ['teacher', 'staff']
        },
        {
          title: 'Attendance Reports',
          icon: 'assessment',
          route: '/attendance/reports',
          roles: ['admin', 'teacher', 'staff']
        },
        {
          title: 'Attendance Analytics',
          icon: 'analytics',
          route: '/attendance/analytics',
          roles: ['admin', 'teacher', 'staff']
        }
      ]
    },
    {
      title: 'Fee Management',
      icon: 'payment',
      roles: ['admin', 'staff'],
      children: [
        {
          title: 'Fee Categories',
          icon: 'category',
          route: '/fees/categories',
          roles: ['admin', 'staff']
        },
        {
          title: 'Student Fees',
          icon: 'receipt',
          route: '/fees/student-fees',
          roles: ['admin', 'staff']
        },
        {
          title: 'Payments',
          icon: 'payment',
          route: '/fees/payments',
          roles: ['admin', 'staff']
        },
        {
          title: 'Fee Reports',
          icon: 'assessment',
          route: '/fees/reports',
          roles: ['admin', 'staff']
        }
      ]
    },
    {
      title: 'Grades & Assessment',
      icon: 'grade',
      roles: ['admin', 'teacher', 'staff'],
      children: [
        {
          title: 'Grade Entry',
          icon: 'edit',
          route: '/grades/entry',
          roles: ['teacher', 'staff']
        },
        {
          title: 'Report Cards',
          icon: 'description',
          route: '/grades/report-cards',
          roles: ['admin', 'teacher', 'staff']
        },
        {
          title: 'Assessment Types',
          icon: 'quiz',
          route: '/grades/assessment-types',
          roles: ['admin', 'teacher', 'staff']
        }
      ]
    },
    {
      title: 'Timetable',
      icon: 'calendar_view_week',
      roles: ['admin', 'teacher', 'staff'],
      children: [
        {
          title: 'Class Timetable',
          icon: 'grid_view',
          route: '/timetable/view',
          roles: ['admin', 'teacher', 'staff']
        },
        {
          title: 'Manage Slots',
          icon: 'edit_calendar',
          route: '/timetable/manage',
          roles: ['admin', 'staff']
        },
        {
          title: 'Exams',
          icon: 'assignment',
          route: '/timetable/exams',
          roles: ['admin', 'teacher', 'staff']
        }
      ]
    },
    {
      title: 'Staff Management',
      icon: 'badge',
      roles: ['admin', 'staff'],
      children: [
        {
          title: 'All Staff',
          icon: 'group',
          route: '/staff',
          roles: ['admin', 'staff']
        },
        {
          title: 'Add Staff',
          icon: 'person_add',
          route: '/staff/add',
          roles: ['admin']
        }
      ]
    },
    {
      title: 'Parents',
      icon: 'family_restroom',
      roles: ['admin', 'staff'],
      children: [
        {
          title: 'All Parents',
          icon: 'group',
          route: '/parents',
          roles: ['admin', 'staff']
        },
        {
          title: 'Add Parent',
          icon: 'person_add',
          route: '/parents/add',
          roles: ['admin', 'staff']
        }
      ]
    },
    {
      title: 'Reports & Analytics',
      icon: 'analytics',
      roles: ['admin', 'teacher', 'staff'],
      children: [
        {
          title: 'Attendance Reports',
          icon: 'how_to_reg',
          route: '/reports/attendance',
          roles: ['admin', 'teacher', 'staff']
        },
        {
          title: 'Fee Reports',
          icon: 'account_balance',
          route: '/reports/fees',
          roles: ['admin', 'staff']
        },
        {
          title: 'Report Cards',
          icon: 'description',
          route: '/reports/report-cards',
          roles: ['admin', 'teacher', 'staff']
        }
      ]
    },
    {
      title: 'AI Assistant',
      icon: 'smart_toy',
      route: '/ai-chat',
      roles: ['admin', 'teacher', 'staff']
    },
    {
      title: 'Settings',
      icon: 'settings',
      route: '/settings',
      roles: ['admin']
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  hasAccess(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }

  toggleExpansion(item: MenuItem) {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeSidenav.emit();
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return 'User';
  }

  getUserRole(): string {
    if (!this.currentUser?.role) return '';
    return this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
  }
}