interface Props {
  onStop: () => void;
}

export default function ControlButtons({ onStop }: Props) {
  return (
    <div className="control-buttons">
      <button className="btn btn--danger" onClick={onStop}>
        Detener
      </button>
    </div>
  );
}
