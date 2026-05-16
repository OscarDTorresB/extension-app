interface Props {
  secondsLeft: number;
  totalSeconds: number;
  phase: 'work' | 'break';
}

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function TimerDisplay({ secondsLeft, totalSeconds, phase }: Props) {
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="timer-display">
      <span className={`timer-phase timer-phase--${phase}`}>
        {phase === 'work' ? 'Trabajando' : '🌸 En pausa'}
      </span>

      <div className={`timer-ring-wrapper timer-ring-wrapper--${phase}`}>
        <svg className="timer-ring" viewBox="0 0 140 140">
          <circle className="timer-ring-track" cx="70" cy="70" r={RADIUS} />
          <circle
            className="timer-ring-progress"
            cx="70"
            cy="70"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="timer-ring-center">
          <span className="timer-clock">{formatTime(secondsLeft)}</span>
        </div>
      </div>
    </div>
  );
}
