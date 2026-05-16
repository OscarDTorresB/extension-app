import {
  TimerState,
  ExtensionMessage,
  DEFAULT_STATE,
  ALARM_WORK,
  ALARM_BREAK,
} from '../types/index';

async function getState(): Promise<TimerState> {
  const result = await chrome.storage.local.get('timerState');
  return (result.timerState as TimerState) ?? DEFAULT_STATE;
}

async function setState(patch: Partial<TimerState>): Promise<TimerState> {
  const current = await getState();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ timerState: next });
  return next;
}

async function notifyActiveTab(message: ExtensionMessage): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) {
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch {
      // Tab may not have a content script (e.g. chrome:// pages) — safe to ignore
    }
  }
}

async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  const state = await getState();

  if (alarm.name === ALARM_WORK) {
    await setState({ status: 'on_break', breakStartedAt: Date.now() });
    await chrome.alarms.create(ALARM_BREAK, { delayInMinutes: state.breakMinutes });
    await notifyActiveTab({ type: 'SHOW_OVERLAY', payload: { breakMinutes: state.breakMinutes } });
    return;
  }

  if (alarm.name === ALARM_BREAK) {
    await setState({ status: 'running', breakStartedAt: null, startedAt: Date.now() });
    await chrome.alarms.create(ALARM_WORK, { delayInMinutes: state.workMinutes });
    await notifyActiveTab({ type: 'DISMISS_OVERLAY' });
  }
}

// Must be at top level — service workers are terminated between alarms and re-registered on wakeup
chrome.alarms.onAlarm.addListener(handleAlarm);

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    (async () => {
      switch (message.type) {
        case 'START_TIMER': {
          const { workMinutes, breakMinutes } = message.payload;
          await setState({ status: 'running', workMinutes, breakMinutes, startedAt: Date.now(), breakStartedAt: null });
          await chrome.alarms.clearAll();
          await chrome.alarms.create(ALARM_WORK, { delayInMinutes: workMinutes });
          sendResponse({ ok: true });
          break;
        }
        case 'STOP_TIMER': {
          await chrome.alarms.clearAll();
          await setState({ ...DEFAULT_STATE });
          await notifyActiveTab({ type: 'DISMISS_OVERLAY' });
          sendResponse({ ok: true });
          break;
        }
        case 'SKIP_BREAK': {
          const state = await getState();
          await chrome.alarms.clear(ALARM_BREAK);
          await setState({ status: 'running', breakStartedAt: null, startedAt: Date.now() });
          await chrome.alarms.create(ALARM_WORK, { delayInMinutes: state.workMinutes });
          sendResponse({ ok: true });
          break;
        }
        case 'GET_STATE': {
          const state = await getState();
          sendResponse(state);
          break;
        }
      }
    })();
    // Return true to keep message channel open for async sendResponse
    return true;
  }
);
