export type AttendanceAction = 'Ingreso' | 'Inicio receso' | 'Fin receso' | 'Salida';
export type AttendanceState = AttendanceAction | null;

export interface AttendanceLookupResult {
  success: boolean;
  dni: string;
  employeeName?: string;
  currentState: AttendanceState;
  nextActions: AttendanceAction[];
  message: string;
}

export interface AttendanceRegistrationResult {
  success: boolean;
  employeeName?: string;
  action?: AttendanceAction;
  timestamp?: string;
  message: string;
}

const LOCAL_AGENT_URL = 'http://127.0.0.1:9000/validate-device';

const EMPLOYEE_DIRECTORY: Record<string, string> = {
  '12345678': 'Juan Pérez',
  '87654321': 'María García',
  '11223344': 'Carlos López',
  '44332211': 'Lucía Fernández',
};

const attendanceHistoryByDni: Record<string, AttendanceAction[]> = {
  '12345678': [],
  '87654321': ['Ingreso'],
  '11223344': ['Ingreso', 'Inicio receso'],
  '44332211': ['Ingreso', 'Inicio receso', 'Fin receso'],
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCurrentState(history: AttendanceAction[]): AttendanceState {
  return history[history.length - 1] ?? null;
}

export function getNextActions(currentState: AttendanceState): AttendanceAction[] {
  switch (currentState) {
    case null:
      return ['Ingreso'];
    case 'Ingreso':
      return ['Inicio receso', 'Salida'];
    case 'Inicio receso':
      return ['Fin receso'];
    case 'Fin receso':
      return ['Salida'];
    case 'Salida':
      return [];
    default:
      return [];
  }
}

function getCurrentStateMessage(currentState: AttendanceState): string {
  switch (currentState) {
    case null:
      return 'No registras marcaciones hoy. Tu siguiente paso sugerido es Ingreso.';
    case 'Ingreso':
      return 'Tu ingreso ya fue registrado. Puedes iniciar tu receso o marcar tu salida.';
    case 'Inicio receso':
      return 'Tu receso está en curso. La siguiente acción disponible es Fin receso.';
    case 'Fin receso':
      return 'Tu receso finalizó. La siguiente acción disponible es Salida.';
    case 'Salida':
      return 'Tu jornada ya fue cerrada con una salida registrada.';
    default:
      return 'No se pudo determinar el siguiente paso.';
  }
}

function getFormattedTimestamp(date = new Date()): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export async function lookupEmployeeAttendance(dni: string): Promise<AttendanceLookupResult> {
  await delay(650);

  const employeeName = EMPLOYEE_DIRECTORY[dni];

  if (!employeeName) {
    return {
      success: false,
      dni,
      currentState: null,
      nextActions: [],
      message: `No encontramos un trabajador asociado al DNI ${dni}.`,
    };
  }

  const currentState = getCurrentState(attendanceHistoryByDni[dni] ?? []);

  return {
    success: true,
    dni,
    employeeName,
    currentState,
    nextActions: getNextActions(currentState),
    message: getCurrentStateMessage(currentState),
  };
}

export async function generateMockLocalDeviceToken(dni: string): Promise<string> {
  await delay(120);
  return `device-${dni.slice(-4)}-${Date.now().toString(36)}`;
}

export async function validateLocalDeviceAuthorization(dni: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 500);

  try {
    const response = await fetch(LOCAL_AGENT_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Unauthorized device');
    }

    const payload = (await response.json().catch(() => null)) as
      | { token?: string; deviceToken?: string }
      | null;

    return payload?.token ?? payload?.deviceToken ?? generateMockLocalDeviceToken(dni);
  } catch {
    throw new Error('Device not authorized or Local Agent offline.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function registerAttendance(
  dni: string,
  action: AttendanceAction,
  deviceToken: string,
): Promise<AttendanceRegistrationResult> {
  await delay(900);

  const employeeName = EMPLOYEE_DIRECTORY[dni];

  if (!employeeName) {
    return {
      success: false,
      message: `No encontramos un trabajador asociado al DNI ${dni}.`,
    };
  }

  if (!deviceToken) {
    return {
      success: false,
      message: 'No se recibió un token válido para autorizar la marcación.',
    };
  }

  const history = attendanceHistoryByDni[dni] ?? [];
  const allowedActions = getNextActions(getCurrentState(history));

  if (!allowedActions.includes(action)) {
    return {
      success: false,
      message: `La acción ${action} no está permitida para el estado actual del trabajador.`,
    };
  }

  attendanceHistoryByDni[dni] = [...history, action];

  return {
    success: true,
    employeeName,
    action,
    timestamp: getFormattedTimestamp(),
    message: `${action} registrado correctamente para ${employeeName}.`,
  };
}
