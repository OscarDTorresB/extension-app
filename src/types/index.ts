export type TimerStatus = 'idle' | 'running' | 'on_break';

export interface TimerState {
  status: TimerStatus;
  workMinutes: number;
  breakMinutes: number;
  startedAt: number | null;
  breakStartedAt: number | null;
}

export const DEFAULT_STATE: TimerState = {
  status: 'idle',
  workMinutes: 25,
  breakMinutes: 5,
  startedAt: null,
  breakStartedAt: null,
};

export type ExtensionMessage =
  | { type: 'START_TIMER'; payload: { workMinutes: number; breakMinutes: number } }
  | { type: 'STOP_TIMER' }
  | { type: 'SKIP_BREAK' }
  | { type: 'SHOW_OVERLAY'; payload: { breakMinutes: number } }
  | { type: 'DISMISS_OVERLAY' }
  | { type: 'GET_STATE' }
  | { type: 'STATE_UPDATE'; payload: TimerState };

export const ALARM_WORK = 'pausas-activas-work';
export const ALARM_BREAK = 'pausas-activas-break';
