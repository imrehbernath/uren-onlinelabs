

export interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  address: string;
  zipCode: string;
  city: string;
  btwId?: string;
  kvk?: string;
}

export interface Project {
  id: string;
  name:string;
  clientId: string;
  rate: number; // hourly rate in EUR
  userBudgets?: {
    userId: string;
    hours: number;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  monthlyHourGoal?: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  userId: string;
  description: string;
  startTime: Date; // The very first time the timer was started
  endTime: Date | null; // The final time the timer was stopped
  invoiced: boolean;
  isPaused: boolean;
  accumulatedDuration: number; // In milliseconds, stores total time when paused or stopped
  lastStartTime: Date; // The time the timer was last (re)started
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  projectId: string;
  subject: string;
  issueDate: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  taxRate: number; // e.g., 0.21 for 21%, 0 for 0%
  total: number;
  timeEntryIds?: string[];
}

export type Page = 'Dashboard' | 'Projecten' | 'Facturen' | 'Rapporten' | 'Beheer' | 'Klanten' | 'Prognose' | 'Team';