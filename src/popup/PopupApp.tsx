import { useEffect, useState } from 'react';
import { TimerState, DEFAULT_STATE } from '../types/index';
import TimerDisplay from './components/TimerDisplay';
import IntervalForm from './components/IntervalForm';
import ControlButtons from './components/ControlButtons';

function deriveSecondsLeft(state: TimerState): number {
  if (state.status === 'running' && state.startedAt != null) {
    const elapsed = (Date.now() - state.startedAt) / 1000;
    return Math.max(0, state.workMinutes * 60 - elapsed);
  }
  if (state.status === 'on_break' && state.breakStartedAt != null) {
    const elapsed = (Date.now() - state.breakStartedAt) / 1000;
    return Math.max(0, state.breakMinutes * 60 - elapsed);
  }
  return 0;
}

export default function PopupApp() {
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT_STATE);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state: TimerState) => {
      if (state) {
        setTimerState(state);
        setSecondsLeft(Math.round(deriveSecondsLeft(state)));
      }
    });

    const onChanged = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.timerState?.newValue) {
        const updated = changes.timerState.newValue as TimerState;
        setTimerState(updated);
        setSecondsLeft(Math.round(deriveSecondsLeft(updated)));
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  // Tick the local countdown while popup is open
  useEffect(() => {
    if (timerState.status === 'idle') return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timerState.status]);

  function handleStart(workMinutes: number, breakMinutes: number): void {
    chrome.runtime.sendMessage(
      { type: 'START_TIMER', payload: { workMinutes, breakMinutes } },
      () => {
        const next: TimerState = {
          status: 'running',
          workMinutes,
          breakMinutes,
          startedAt: Date.now(),
          breakStartedAt: null,
        };
        setTimerState(next);
        setSecondsLeft(workMinutes * 60);
      }
    );
  }

  function handleStop(): void {
    chrome.runtime.sendMessage({ type: 'STOP_TIMER' }, () => {
      setTimerState(DEFAULT_STATE);
      setSecondsLeft(0);
    });
  }

  return (
    <div className="popup">
      <header className="popup-header">
        <span className="popup-logo">⏱</span>
        <h1 className="popup-title">Pausas Activas</h1>
      </header>

      {timerState.status === 'idle' ? (
        <IntervalForm
          defaultWork={timerState.workMinutes}
          defaultBreak={timerState.breakMinutes}
          onStart={handleStart}
        />
      ) : (
        <>
          <TimerDisplay
            secondsLeft={secondsLeft}
            phase={timerState.status === 'on_break' ? 'break' : 'work'}
          />
          <ControlButtons onStop={handleStop} />
        </>
      )}
    </div>
  );
}
