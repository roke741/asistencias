import './App.css';
import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Spinner,
} from '@heroui/react';
import Clock from './components/Clock';
import {
  AttendanceAction,
  AttendanceLookupResult,
  AttendanceRegistrationResult,
  lookupEmployeeAttendance,
  registerAttendance,
  validateLocalDeviceAuthorization,
} from './services/attendanceFlowService';

type NoticeTone = 'primary' | 'success' | 'warning' | 'danger';

interface NoticeState {
  color: NoticeTone;
  title: string;
  description: string;
}

interface LookupActionState {
  status: 'idle' | 'success' | 'error';
  result: AttendanceLookupResult | null;
  message: string;
}

interface MarkActionState {
  status: 'idle' | 'success' | 'error';
  result: AttendanceRegistrationResult | null;
  message: string;
}

const LOOKUP_INITIAL_STATE: LookupActionState = {
  status: 'idle',
  result: null,
  message: '',
};

const MARK_INITIAL_STATE: MarkActionState = {
  status: 'idle',
  result: null,
  message: '',
};

const DNI_INPUT_ID = 'attendance-dni-input';

function sanitizeDni(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}

function getStateLabel(currentState: AttendanceLookupResult['currentState']): string {
  return currentState ?? 'Sin marcaciones';
}

function focusDniInput() {
  setTimeout(() => {
    document.getElementById(DNI_INPUT_ID)?.focus();
  }, 0);
}

function App() {
  const [dni, setDni] = useState('');
  const [activeLookup, setActiveLookup] = useState<AttendanceLookupResult | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [screenEpoch, setScreenEpoch] = useState(0);
  const [isTransitionPending, startTransition] = useTransition();

  const [lookupState, submitLookupAction, isLookupPending] = useActionState(
    async (_previousState: LookupActionState, formData: FormData): Promise<LookupActionState> => {
      const submittedDni = sanitizeDni(String(formData.get('dni') ?? ''));

      if (submittedDni.length !== 8) {
        return {
          status: 'error',
          result: null,
          message: 'El DNI debe tener exactamente 8 dígitos numéricos.',
        };
      }

      const lookupResult = await lookupEmployeeAttendance(submittedDni);

      if (!lookupResult.success) {
        return {
          status: 'error',
          result: null,
          message: lookupResult.message,
        };
      }

      return {
        status: 'success',
        result: lookupResult,
        message: lookupResult.message,
      };
    },
    LOOKUP_INITIAL_STATE,
  );

  const [markState, submitMarkAction, isMarkPending] = useActionState(
    async (_previousState: MarkActionState, formData: FormData): Promise<MarkActionState> => {
      const currentDni = sanitizeDni(String(formData.get('dni') ?? activeLookup?.dni ?? ''));
      const selectedAction = String(formData.get('attendanceAction') ?? '') as AttendanceAction;

      if (!activeLookup || currentDni.length !== 8) {
        return {
          status: 'error',
          result: null,
          message: 'Primero valida un DNI antes de registrar una marcación.',
        };
      }

      if (!activeLookup.nextActions.includes(selectedAction)) {
        return {
          status: 'error',
          result: null,
          message: 'La acción seleccionada ya no está disponible para este trabajador.',
        };
      }

      try {
        const deviceToken = await validateLocalDeviceAuthorization(currentDni);
        const registrationResult = await registerAttendance(currentDni, selectedAction, deviceToken);

        if (!registrationResult.success) {
          return {
            status: 'error',
            result: null,
            message: registrationResult.message,
          };
        }

        return {
          status: 'success',
          result: registrationResult,
          message: registrationResult.message,
        };
      } catch (error) {
        return {
          status: 'error',
          result: null,
          message:
            error instanceof Error
              ? error.message
              : 'Device not authorized or Local Agent offline.',
        };
      }
    },
    MARK_INITIAL_STATE,
  );

  const isBusy = isLookupPending || isMarkPending || isTransitionPending;
  const isDniInvalid = dni.length > 0 && dni.length < 8;
  const helperText = useMemo(() => {
    if (isDniInvalid) {
      return 'El DNI debe tener exactamente 8 dígitos.';
    }

    if (activeLookup?.employeeName) {
      return `Trabajador identificado: ${activeLookup.employeeName}`;
    }

    return 'Ingresa el DNI y presiona Enter para ver la siguiente acción disponible.';
  }, [activeLookup?.employeeName, isDniInvalid]);

  useEffect(() => {
    focusDniInput();
  }, [screenEpoch]);

  useEffect(() => {
    if (lookupState.status === 'success' && lookupState.result) {
      const lookupResult = lookupState.result;

      startTransition(() => {
        setActiveLookup(lookupResult);
        setNotice({
          color: 'primary',
          title: lookupResult.employeeName ?? 'Trabajador encontrado',
          description: lookupState.message,
        });
      });
      return;
    }

    if (lookupState.status === 'error' && lookupState.message) {
      startTransition(() => {
        setActiveLookup(null);
        setNotice({
          color: 'danger',
          title: 'No se pudo validar el DNI',
          description: lookupState.message,
        });
      });
      focusDniInput();
    }
  }, [lookupState, startTransition]);

  useEffect(() => {
    if (markState.status === 'success' && markState.result) {
      startTransition(() => {
        setActiveLookup(null);
        setNotice({
          color: 'success',
          title: 'Marcación registrada',
          description: `${markState.message} La pantalla se reiniciará automáticamente.`,
        });
      });

      const timer = setTimeout(() => {
        startTransition(() => {
          setDni('');
          setActiveLookup(null);
          setNotice(null);
          setScreenEpoch((previous) => previous + 1);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }

    if (markState.status === 'error' && markState.message) {
      startTransition(() => {
        setNotice({
          color: markState.message.includes('Device not authorized')
            ? 'warning'
            : 'danger',
          title: markState.message.includes('Device not authorized')
            ? 'Validación local requerida'
            : 'No se pudo registrar la marcación',
          description: markState.message,
        });
      });
    }
  }, [markState, startTransition]);

  useEffect(() => {
    if (!activeLookup?.nextActions.length) {
      return;
    }

    const timer = setTimeout(() => {
      document.querySelector<HTMLButtonElement>('[data-primary-action="true"]')?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [activeLookup]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 px-4 py-6 text-left dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <Card className="w-full overflow-hidden border border-white/60 bg-white/90 shadow-2xl shadow-indigo-950/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
          <CardHeader className="flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8">
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                Marcación de asistencias
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Ingresa tu DNI y deja que la interfaz te guíe.
              </h1>
              <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                El sistema detecta tu estado actual y solo muestra la siguiente acción válida
                para marcar tu asistencia sin fricción.
              </p>
            </div>
            <div className="mx-auto">
              <Clock />
            </div>
          </CardHeader>

          <Divider />

          <CardBody className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Lookup panel */}
            <section className="space-y-5">
              <form
                action={submitLookupAction}
                className="space-y-4"
                key={`lookup-form-${screenEpoch}`}
              >
                <Input
                  id={DNI_INPUT_ID}
                  name="dni"
                  autoFocus
                  label="DNI"
                  labelPlacement="outside"
                  placeholder="Ingresa 8 dígitos y presiona Enter"
                  value={dni}
                  onValueChange={(value) => {
                    setDni(sanitizeDni(value));
                    if (notice?.color === 'danger') {
                      setNotice(null);
                    }
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  variant="bordered"
                  size="lg"
                  isRequired
                  isInvalid={isDniInvalid}
                  errorMessage={isDniInvalid ? 'Completa los 8 dígitos del DNI.' : undefined}
                  description={!isDniInvalid ? helperText : undefined}
                  classNames={{
                    input: 'text-lg tracking-[0.3em]',
                  }}
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    className="w-full sm:w-auto"
                    isLoading={isLookupPending}
                    isDisabled={dni.length !== 8 || isMarkPending}
                  >
                    Validar DNI
                  </Button>
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                    Presiona <span className="mx-1 font-semibold text-slate-700 dark:text-slate-200">Enter</span> para continuar.
                  </div>
                </div>
              </form>

              {notice && (
                <Alert
                  color={notice.color}
                  variant="flat"
                  title={notice.title}
                  description={notice.description}
                />
              )}

              {activeLookup && (
                <Card shadow="none" className="border border-primary/15 bg-primary-50/60 dark:bg-primary-500/10">
                  <CardBody className="gap-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Trabajador
                        </p>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {activeLookup.employeeName}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          DNI {activeLookup.dni}
                        </p>
                      </div>
                      <Chip color="primary" variant="flat" className="text-sm font-semibold">
                        Estado actual: {getStateLabel(activeLookup.currentState)}
                      </Chip>
                    </div>

                    <form
                      action={submitMarkAction}
                      className="space-y-4"
                      key={`mark-form-${screenEpoch}-${activeLookup.dni}`}
                    >
                      <input type="hidden" name="dni" value={activeLookup.dni} />

                      <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          Siguiente acción disponible
                        </p>
                        {activeLookup.nextActions.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {activeLookup.nextActions.map((action, index) => (
                              <Button
                                key={action}
                                type="submit"
                                name="attendanceAction"
                                value={action}
                                color={index === 0 ? 'success' : 'primary'}
                                variant={index === 0 ? 'solid' : 'flat'}
                                size="lg"
                                isDisabled={isBusy}
                                data-primary-action={index === 0 ? 'true' : undefined}
                                className="h-16 justify-center text-base font-semibold"
                              >
                                {action}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <Alert
                            color="warning"
                            variant="flat"
                            title="Jornada finalizada"
                            description="Este trabajador ya registró su salida y no tiene más acciones disponibles por hoy."
                          />
                        )}
                      </div>

                      {isMarkPending && (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Spinner size="sm" color="primary" />
                          Validando el dispositivo y registrando la marcación...
                        </div>
                      )}

                      {markState.status === 'success' && markState.result && (
                        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300">
                          <strong>{markState.result.action}</strong> registrado a las{' '}
                          <strong>{markState.result.timestamp}</strong>.
                        </div>
                      )}
                    </form>
                  </CardBody>
                </Card>
              )}
            </section>

            {/* Guidance panel */}
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                  Flujo guiado
                </p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  El trabajador no necesita adivinar qué debe marcar.
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Cada consulta del DNI revisa el estado actual del turno y habilita únicamente
                  las acciones válidas del ciclo: Ingreso, Inicio receso, Fin receso y Salida.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  'Sin marcaciones → Ingreso',
                  'Ingreso → Inicio receso o Salida',
                  'Inicio receso → Fin receso',
                  'Fin receso → Salida',
                ].map((step) => (
                  <div
                    key={step}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {step}
                  </div>
                ))}
              </div>

              <Divider />

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Validación local silenciosa
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Antes de enviar la marcación al backend, el sistema valida la autorización del
                  equipo contra el servicio local en segundo plano. Si el agente local no responde,
                  se muestra una advertencia clara para evitar registros no autorizados.
                </p>
              </div>
            </section>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}

export default App;
