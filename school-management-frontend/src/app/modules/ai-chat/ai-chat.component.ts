import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';

import { AiService } from '../../services/ai.service';
import { NotificationService } from '../../services/notification.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'insights' | 'error';
}

interface InsightCard {
  type: 'attendance' | 'grade' | 'fee' | 'general';
  title: string;
  items: any[];
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatChipsModule,
    RouterModule,
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
  isPremium = false;

  readonly suggestedQuestions = [
    {
      icon: 'people',
      text: 'Which students have low attendance?',
      category: 'attendance',
    },
    {
      icon: 'trending_up',
      text: 'Show me fee collection summary',
      category: 'fees',
    },
    {
      icon: 'school',
      text: 'Which students are at risk of failing?',
      category: 'grades',
    },
    {
      icon: 'analytics',
      text: 'How is the overall school performance?',
      category: 'health',
    },
  ];

  constructor(
    private aiService: AiService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.messages.push({
      role: 'assistant',
      content: `Hello! I'm your AI school assistant powered by Claude. I can help you with:

• **Attendance Insights** — Identify students at risk
• **Fee Management** — Collection summaries and defaulters
• **Academic Performance** — Grade trends and predictions
• **School Health** — Overall performance metrics

What would you like to know?`,
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
    this.messages.push({
      role: 'user',
      content: question,
      timestamp: new Date(),
    });
    this.isLoading = true;
    this.shouldScroll = true;

    this.aiService.askQuestion(question).subscribe({
      next: (res) => {
        const response =
          res.data?.answer ||
          'I apologize, but I was unable to generate a response. Please try again.';
        this.messages.push({
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          type: 'text',
        });
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: (err) => {
        let msg = 'Failed to get a response. Please try again.';
        if (err.status === 403) {
          msg =
            'AI features require a Standard or Premium plan. Please upgrade your subscription to access AI insights.';
        } else if (err.status === 429) {
          msg = 'Too many requests. Please wait a moment and try again.';
        } else if (err.error?.message) {
          msg = err.error.message;
        }
        this.messages.push({
          role: 'assistant',
          content: msg,
          timestamp: new Date(),
          type: 'error',
        });
        this.isLoading = false;
        this.shouldScroll = true;
      },
    });
  }

  askQuestion(category: string): void {
    const questions: Record<string, string> = {
      attendance:
        'Which students have attendance below 75% in the current month?',
      fees: 'Give me a summary of fee collection this month and list the top 5 defaulters.',
      grades: 'Which students have declining grades over the last semester?',
      health:
        'Provide a comprehensive school health report including attendance, academics, and fees.',
    };
    this.sendMessage(questions[category] || questions['health']);
  }

  quickStats(type: 'attendance' | 'fees' | 'grades'): void {
    const questions: Record<string, string> = {
      attendance: 'Show me the attendance statistics for all classes today.',
      fees: 'What is the current fee collection status? List pending amounts by class.',
      grades: 'Show me the grade distribution across all subjects.',
    };
    this.sendMessage(questions[type]);
  }

  clearChat(): void {
    this.messages = [
      {
        role: 'assistant',
        content: 'Chat cleared! How can I help you?',
        timestamp: new Date(),
      },
    ];
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatContent(content: string): SafeHtml {
    // Escape HTML entities first to prevent XSS
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    // Then apply safe formatting on the escaped content
    const formatted = escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/- (.*?)(?=\n|$)/g, '&bull; $1<br>');
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }
}
