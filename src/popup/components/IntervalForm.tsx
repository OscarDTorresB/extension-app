import { useState } from 'react';

interface Props {
  defaultWork: number;
  defaultBreak: number;
  onStart: (workMinutes: number, breakMinutes: number) => void;
}

export default function IntervalForm({ defaultWork, defaultBreak, onStart }: Props) {
  const [workMinutes, setWorkMinutes] = useState(defaultWork);
  const [breakMinutes, setBreakMinutes] = useState(defaultBreak);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onStart(workMinutes, breakMinutes);
  }

  return (
    <form className="interval-form" onSubmit={handleSubmit}>
      <label className="form-label">
        Tiempo de trabajo
        <div className="form-input-row">
          <input
            type="number"
            min={1}
            max={120}
            value={workMinutes}
            onChange={(e) => setWorkMinutes(Number(e.target.value))}
            className="form-input"
          />
          <span className="form-unit">min</span>
        </div>
      </label>
      <label className="form-label">
        Duración de pausa
        <div className="form-input-row">
          <input
            type="number"
            min={1}
            max={30}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            className="form-input"
          />
          <span className="form-unit">min</span>
        </div>
      </label>
      <button type="submit" className="btn btn--primary">
        Comenzar
      </button>
    </form>
  );
}
