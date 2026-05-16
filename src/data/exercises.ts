export interface Exercise {
  id: string;
  name: string;
  instruction: string;
  emoji: string;
  durationSeconds: number;
  category: 'neck' | 'eyes' | 'shoulders' | 'wrists' | 'legs' | 'breathing' | 'back';
}

export const EXERCISES: Exercise[] = [
  {
    id: 'neck-rolls',
    name: 'Rotación de cuello',
    instruction: 'Inclina la cabeza despacio hacia la derecha, luego a la izquierda, adelante y atrás. Repite 3 veces en cada dirección.',
    emoji: '🔄',
    durationSeconds: 60,
    category: 'neck',
  },
  {
    id: 'shoulder-shrugs',
    name: 'Elevación de hombros',
    instruction: 'Sube los hombros hacia las orejas, sostén 3 segundos y suelta. Repite 8 veces para liberar la tensión acumulada.',
    emoji: '🤷',
    durationSeconds: 45,
    category: 'shoulders',
  },
  {
    id: 'eye-20-20-20',
    name: 'Regla 20-20-20',
    instruction: 'Mira un objeto a 6 metros de distancia durante 20 segundos completos. Parpadea suavemente para humedecer los ojos.',
    emoji: '👁️',
    durationSeconds: 20,
    category: 'eyes',
  },
  {
    id: 'deep-breathing',
    name: 'Respiración profunda',
    instruction: 'Inhala lentamente por la nariz durante 4 segundos, sostén 4 y exhala por la boca durante 6. Repite 5 veces.',
    emoji: '🌬️',
    durationSeconds: 75,
    category: 'breathing',
  },
  {
    id: 'wrist-stretch',
    name: 'Estiramiento de muñecas',
    instruction: 'Extiende el brazo con la palma hacia afuera y jala los dedos hacia ti con la otra mano. Sostén 15 segundos por lado.',
    emoji: '🤲',
    durationSeconds: 45,
    category: 'wrists',
  },
  {
    id: 'calf-raises',
    name: 'Elevación de talones',
    instruction: 'De pie, sube lentamente sobre las puntas de los pies y baja. Realiza 15 repeticiones para activar la circulación.',
    emoji: '🦵',
    durationSeconds: 60,
    category: 'legs',
  },
  {
    id: 'chest-stretch',
    name: 'Apertura de pecho',
    instruction: 'Entrelaza los dedos detrás de la espalda, saca el pecho y levanta los brazos suavemente. Mantén 20 segundos.',
    emoji: '🫁',
    durationSeconds: 45,
    category: 'back',
  },
  {
    id: 'palm-eye-rest',
    name: 'Palming ocular',
    instruction: 'Frota las palmas hasta sentir calor, cúbrete los ojos cerrados con ellas. Relájate en la oscuridad cálida por 30 segundos.',
    emoji: '🙈',
    durationSeconds: 30,
    category: 'eyes',
  },
  {
    id: 'seated-spinal-twist',
    name: 'Torsión espinal sentado',
    instruction: 'Siéntate erguido, gira el torso hacia la derecha tomando el respaldo de la silla. Sostén 15 segundos por lado.',
    emoji: '🌀',
    durationSeconds: 45,
    category: 'back',
  },
  {
    id: 'finger-spread',
    name: 'Apertura de dedos',
    instruction: 'Abre y cierra los dedos en abanico 10 veces. Luego haz círculos con cada puño para movilizar las articulaciones.',
    emoji: '✋',
    durationSeconds: 30,
    category: 'wrists',
  },
];

export function getExerciseForBreak(breakMinutes: number): Exercise {
  const breakDurationMs = breakMinutes * 60 * 1000;
  const index = Math.floor(Date.now() / breakDurationMs) % EXERCISES.length;
  return EXERCISES[index];
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `~${seconds} seg`;
  return `~${Math.round(seconds / 60)} min`;
}
