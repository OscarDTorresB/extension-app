interface Props {
  onStop: () => void;
}

export default function ControlButtons({ onStop }: Props) {
  return (
    <div className="control-buttons">
      <button className="btn btn--stop" onClick={onStop}>
        Detener
      </button>
    </div>
  );
}
