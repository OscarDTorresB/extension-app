import { Exercise, formatDuration } from '../data/exercises';

interface Props {
  exercise: Exercise;
}

export default function ExerciseCard({ exercise }: Props) {
  return (
    <div className="exercise-card">
      <div className="exercise-emoji-badge">{exercise.emoji}</div>
      <p className="exercise-name">{exercise.name}</p>
      <p className="exercise-instruction">{exercise.instruction}</p>
      <span className="exercise-duration">{formatDuration(exercise.durationSeconds)}</span>
    </div>
  );
}
