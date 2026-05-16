interface Props {
  secondsLeft: number;
  phase: 'work' | 'break';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function TimerDisplay({ secondsLeft, phase }: Props) {
  return (
    <div className="timer-display">
      <span className={`timer-phase timer-phase--${phase}`}>
        {phase === 'work' ? '💼 Trabajando' : '🧘 En pausa'}
      </span>
      <span className="timer-clock">{formatTime(secondsLeft)}</span>
    </div>
  );
}
