import { Asistencia } from '../types/model.types';

const MOCK_ATTENDANCES: Asistencia[] = [
  {
    asistencia_id: 1,
    persona_id: 1,
    incorrecto: false,
    identificador: '12345678',
    nombre: 'Juan Pérez',
    fecha: '2026-03-09',
    marcacion: '08:00:00',
    marcacion_tipo_id: 1,
    marcacion_tipo: 'Entrada',
    almacen_id: 1,
    almacen: 'Almacén Central',
  },
  {
    asistencia_id: 2,
    persona_id: 1,
    incorrecto: false,
    identificador: '12345678',
    nombre: 'Juan Pérez',
    fecha: '2026-03-09',
    marcacion: '12:00:00',
    marcacion_tipo_id: 3,
    marcacion_tipo: 'Receso',
    almacen_id: 1,
    almacen: 'Almacén Central',
  },
  {
    asistencia_id: 3,
    persona_id: 1,
    incorrecto: false,
    identificador: '12345678',
    nombre: 'Juan Pérez',
    fecha: '2026-03-09',
    marcacion: '13:00:00',
    marcacion_tipo_id: 4,
    marcacion_tipo: 'Fin Receso',
    almacen_id: 1,
    almacen: 'Almacén Central',
  },
  {
    asistencia_id: 4,
    persona_id: 2,
    incorrecto: false,
    identificador: '87654321',
    nombre: 'María García',
    fecha: '2026-03-09',
    marcacion: '08:15:00',
    marcacion_tipo_id: 1,
    marcacion_tipo: 'Entrada',
    almacen_id: 2,
    almacen: 'Almacén Norte',
  },
  {
    asistencia_id: 5,
    persona_id: 2,
    incorrecto: false,
    identificador: '87654321',
    nombre: 'María García',
    fecha: '2026-03-09',
    marcacion: '17:00:00',
    marcacion_tipo_id: 2,
    marcacion_tipo: 'Salida',
    almacen_id: 2,
    almacen: 'Almacén Norte',
  },
  {
    asistencia_id: 6,
    persona_id: 3,
    incorrecto: false,
    identificador: '11223344',
    nombre: 'Carlos López',
    fecha: '2026-03-09',
    marcacion: '07:50:00',
    marcacion_tipo_id: 1,
    marcacion_tipo: 'Entrada',
    almacen_id: 1,
    almacen: 'Almacén Central',
  },
];

const MOCK_PEOPLE: Record<string, string> = {
  '12345678': 'Juan Pérez',
  '87654321': 'María García',
  '11223344': 'Carlos López',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAttendanceHistory(): Promise<Asistencia[]> {
  await delay(800);
  return [...MOCK_ATTENDANCES];
}

export async function getAttendanceByDocument(document: string): Promise<Asistencia[]> {
  await delay(600);
  return MOCK_ATTENDANCES.filter((a) => a.identificador === document);
}

export interface MarkAttendanceResult {
  success: boolean;
  message: string;
  nombre?: string;
  marcacion_tipo?: string;
  marcacion?: string;
}

export async function markAttendance(
  document: string,
  status: string,
): Promise<MarkAttendanceResult> {
  await delay(1200);
  const nombre = MOCK_PEOPLE[document];
  if (!nombre) {
    return {
      success: false,
      message: `No se encontró una persona con el documento ${document}`,
    };
  }
  const now = new Date();
  const marcacion = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return {
    success: true,
    message: `Asistencia registrada correctamente para ${nombre}`,
    nombre,
    marcacion_tipo: status,
    marcacion,
  };
}
