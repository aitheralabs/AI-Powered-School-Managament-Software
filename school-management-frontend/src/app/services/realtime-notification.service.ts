/**
 * Real-Time Notification Service
 *
 * Connects to the Socket.io server using the JWT from AuthService.
 * Features:
 *   - Auto-reconnect on connection loss (handled by Socket.io client)
 *   - Streams live notifications to subscribers
 *   - REST API calls for CRUD (mark-as-read, delete, list)
 */

import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  status: 'pending' | 'sent' | 'read';
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    items: AppNotification[];
    unreadCount: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class RealtimeNotificationService implements OnDestroy {
  private readonly API = `${environment.apiUrl}/notifications`;
  private readonly WS_URL = environment.apiUrl.replace('/api/v1', '');

  private socket: Socket | null = null;

  /** Live unread count */
  private unreadCount$ = new BehaviorSubject<number>(0);
  unreadCount = this.unreadCount$.asObservable();

  /** Stream of new incoming notifications */
  private newNotification$ = new Subject<AppNotification>();
  newNotification = this.newNotification$.asObservable();

  /** Connection status */
  private connected$ = new BehaviorSubject<boolean>(false);
  connected = this.connected$.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    // Connect when user logs in, disconnect on logout
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private connect(): void {
    const token = this.authService.getToken();
    if (!token) return;
    if (this.socket?.connected) return;

    this.socket = io(this.WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    this.socket.on('connect', () => {
      console.log('[Notifications] WebSocket connected');
      this.connected$.next(true);
      // Refresh unread count on reconnect
      this.fetchUnreadCount();
    });

    this.socket.on('disconnect', () => {
      console.log('[Notifications] WebSocket disconnected');
      this.connected$.next(false);
    });

    this.socket.on('reconnect', (attempt: number) => {
      console.log(`[Notifications] Reconnected after ${attempt} attempts`);
      this.fetchUnreadCount();
    });

    this.socket.on('notification:new', (notification: AppNotification) => {
      this.newNotification$.next(notification);
      this.unreadCount$.next(this.unreadCount$.value + 1);
      this.showBrowserNotification(notification);
    });
  }

  private disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected$.next(false);
    this.unreadCount$.next(0);
  }

  // ─── REST API ──────────────────────────────────────────────────────────────

  getNotifications(page = 1, limit = 20, unreadOnly = false): Observable<NotificationListResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('unreadOnly', unreadOnly);
    return this.http.get<NotificationListResponse>(this.API, { params });
  }

  fetchUnreadCount(): void {
    this.http.get<{ success: boolean; data: { count: number } }>(`${this.API}/unread-count`)
      .subscribe({ next: res => this.unreadCount$.next(res.data.count), error: () => {} });
  }

  markAsRead(id: string): Observable<any> {
    const obs = this.http.patch(`${this.API}/${id}/read`, {});
    obs.subscribe({ next: () => this.fetchUnreadCount(), error: () => {} });
    return obs;
  }

  markAllAsRead(): Observable<any> {
    const obs = this.http.patch(`${this.API}/read-all`, {});
    obs.subscribe({ next: () => this.unreadCount$.next(0), error: () => {} });
    return obs;
  }

  deleteNotification(id: string): Observable<any> {
    const obs = this.http.delete(`${this.API}/${id}`);
    obs.subscribe({ next: () => this.fetchUnreadCount(), error: () => {} });
    return obs;
  }

  deleteAll(): Observable<any> {
    const obs = this.http.delete(this.API);
    obs.subscribe({ next: () => this.unreadCount$.next(0), error: () => {} });
    return obs;
  }

  // ─── Browser Push Notifications ──────────────────────────────────────────

  /** Request permission for browser notifications (call once after user interaction) */
  requestBrowserPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return Promise.resolve('denied');
    return Notification.requestPermission();
  }

  private showBrowserNotification(n: AppNotification): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const notification = new Notification(n.title, {
      body: n.body,
      icon: '/favicon.ico',
      tag: n.id,
      silent: false,
    });
    notification.onclick = () => { window.focus(); notification.close(); };
    setTimeout(() => notification.close(), 8000);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
