import {
  Component, OnInit, ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss',
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  inputText = '';
  isLoading = false;
  private shouldScroll = false;

  private readonly API = 'http://localhost:3000/api/v1/ai/ask';

  readonly suggestedQuestions = [
    'Which students have low attendance?',
    'Show me fee collection summary this month',
    'Which students are at risk of failing?',
    'How is the overall school performance?',
  ];

  ngOnInit(): void {
    this.messages.push({
      role: 'assistant',
      content: `Hello! I'm your AI school assistant. I can help you with insights about attendance, grades, fees, and overall school performance. What would you like to know?`,
      timestamp: new Date(),
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  sendMessage(text?: string): void {
    const question = (text || this.inputText).trim();
    if (!question || this.isLoading) return;

    this.inputText = '';
    this.messages.push({ role: 'user', content: question, timestamp: new Date() });
    this.isLoading = true;
    this.shouldScroll = true;

    this.http.post<{ success: boolean; data: { answer: string } }>(
      this.API, { question }
    ).subscribe({
      next: res => {
        this.messages.push({
          role: 'assistant',
          content: res.data?.answer || 'No response received.',
          timestamp: new Date(),
        });
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: err => {
        const msg = err.status === 403
          ? 'AI features require a premium plan. Please upgrade your subscription.'
          : err.error?.message || 'Failed to get a response. Please try again.';
        this.messages.push({ role: 'assistant', content: msg, timestamp: new Date() });
        this.isLoading = false;
        this.shouldScroll = true;
      },
    });
  }

  clearChat(): void {
    this.messages = [{
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date(),
    }];
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  constructor(private http: HttpClient) {}
}
