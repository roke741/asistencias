import './App.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Spinner,
} from '@heroui/react';
import Clock from './components/Clock';
import {
  AttendanceAction,
  AttendanceHistoryEntry,
  AttendanceLookupResult,
  AttendanceRegistrationResult,
  lookupEmployeeAttendance,
  registerAttendance,
} from './services/attendanceFlowService';

type Screen = 'idle' | 'employee' | 'success';

const ACTION_COLORS: Record<AttendanceAction, 'success' | 'warning' | 'secondary' | 'danger'> = {
  Ingreso: 'success',
  'Inicio receso': 'warning',
  'Fin receso': 'secondary',
  Salida: 'danger',
};

const ACTION_ICONS: Record<AttendanceAction, string> = {
  Ingreso: '→',
  'Inicio receso': '☕',
  'Fin receso': '↩',
  Salida: '←',
};

const AUTO_RESET_MS = 3500;
const ERROR_DISPLAY_MS = 2500;
const DNI_LENGTH = 8;

function sanitizeDni(v: string) {
  return v.replace(/\D/g, '').slice(0, DNI_LENGTH);
}

const slide = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

/* ── Timeline row ── */
function TimelineEntry({
  entry,
  index,
  total,
}: {
  entry: AttendanceHistoryEntry;
  index: number;
  total: number;
}) {
  const color = ACTION_COLORS[entry.action];
  const isLast = index === total - 1;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.08 }}
      className="flex items-start gap-3"
    >
      {/* dot + line */}
      <div className="flex flex-col items-center">
        <div
          className={`mt-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${
            color === 'success'
              ? 'bg-success-500 ring-success-200'
              : color === 'warning'
                ? 'bg-warning-500 ring-warning-200'
                : color === 'secondary'
                  ? 'bg-secondary-500 ring-secondary-200'
                  : 'bg-danger-500 ring-danger-200'
          }`}
        />
        {!isLast && <div className="mt-1 h-5 w-px bg-default-200 dark:bg-default-700" />}
      </div>
      <div className="flex flex-1 items-center justify-between pb-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {entry.action}
        </span>
        <span className="text-xs tabular-nums text-default-400">{entry.timestamp}</span>
      </div>
    </motion.div>
  );
}

function App() {
  const [dni, setDni] = useState('');
  const [screen, setScreen] = useState<Screen>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<AttendanceLookupResult | null>(null);
  const [result, setResult] = useState<AttendanceRegistrationResult | null>(null);
  const abortRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const resetToIdle = useCallback(() => {
    abortRef.current = true;
    setDni('');
    setScreen('idle');
    setLoading(false);
    setError(null);
    setLookup(null);
    setResult(null);
    focusInput();
  }, [focusInput]);

  // Auto-reset after success
  useEffect(() => {
    if (screen !== 'success') return;
    const t = setTimeout(resetToIdle, AUTO_RESET_MS);
    return () => clearTimeout(t);
  }, [screen, resetToIdle]);

  // Auto-reset when jornada finalizada
  useEffect(() => {
    if (screen === 'employee' && lookup?.nextActions.length === 0) {
      const t = setTimeout(resetToIdle, AUTO_RESET_MS);
      return () => clearTimeout(t);
    }
  }, [screen, lookup, resetToIdle]);

  // Escape key to go back
  useEffect(() => {
    if (screen === 'idle') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetToIdle();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, resetToIdle]);

  // Auto-focus on mount
  useEffect(() => { focusInput(); }, [focusInput]);

  // Auto-lookup at 8 digits
  useEffect(() => {
    if (dni.length !== DNI_LENGTH || screen !== 'idle') return;
    abortRef.current = false;
    setLoading(true);
    setError(null);

    lookupEmployeeAttendance(dni).then((res) => {
      if (abortRef.current) return;
      setLoading(false);
      if (res.success) {
        setLookup(res);
        setScreen('employee');
      } else {
        setError(res.message);
        setTimeout(() => {
          if (!abortRef.current) {
            setDni('');
            setError(null);
            focusInput();
          }
        }, ERROR_DISPLAY_MS);
      }
    });
  }, [dni, screen, focusInput]);

  const handleMark = useCallback(
    async (action: AttendanceAction) => {
      if (!lookup || loading) return;
      setLoading(true);
      setError(null);
      try {
        const token = 'bypass';
        const res = await registerAttendance(lookup.dni, action, token);
        if (res.success) {
          setResult(res);
          setScreen('success');
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al registrar la marcación.',
        );
      } finally {
        setLoading(false);
      }
    },
    [lookup, loading],
  );

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 px-4 dark:from-slate-950 dark:via-slate-925 dark:to-indigo-950/30">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Clock />
        </motion.div>

        <Card className="w-full border border-white/70 bg-white/85 shadow-xl shadow-indigo-100/60 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/85 dark:shadow-black/30">
          <CardBody className="p-6 sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {/* ── IDLE SCREEN ── */}
              {screen === 'idle' && (
                <motion.div key="idle" {...slide} transition={{ duration: 0.22 }}>
                  <div className="space-y-5">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                        Marca tu asistencia
                      </h1>
                      <p className="mt-1 text-sm text-default-500">
                        Ingresa tu DNI para continuar
                      </p>
                    </div>

                    {/* DNI Input boxes */}
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="flex justify-center gap-1.5 sm:gap-2">
                          {Array.from({ length: DNI_LENGTH }, (_, i) => {
                            const char = dni[i] ?? '';
                            const isActive = i === dni.length && !loading;
                            return (
                              <motion.div
                                key={i}
                                animate={
                                  char
                                    ? { scale: [1, 1.1, 1], transition: { duration: 0.15 } }
                                    : {}
                                }
                                className={`flex h-12 w-10 items-center justify-center rounded-lg border-2 text-xl font-bold transition-colors sm:h-14 sm:w-11 ${
                                  char
                                    ? 'border-primary/40 bg-primary-50/50 text-primary-600 dark:border-primary-400/30 dark:bg-primary-500/10 dark:text-primary-300'
                                    : isActive
                                      ? 'border-primary bg-white shadow-sm dark:bg-slate-800'
                                      : 'border-default-200 bg-default-50 dark:border-default-700 dark:bg-slate-800/60'
                                }`}
                              >
                                {char || (isActive && (
                                  <motion.div
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                                    className="h-5 w-0.5 rounded-full bg-primary"
                                  />
                                ))}
                              </motion.div>
                            );
                          })}
                        </div>
                        {/* Hidden real input */}
                        <input
                          ref={inputRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={8}
                          autoFocus
                          value={dni}
                          onChange={(e) => {
                            setDni(sanitizeDni(e.target.value));
                            if (error) setError(null);
                          }}
                          disabled={loading}
                          className="absolute inset-0 cursor-default opacity-0"
                          aria-label="Ingresa tu DNI"
                        />
                      </div>

                      {loading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center gap-2 text-sm text-primary"
                        >
                          <Spinner size="sm" color="primary" />
                          <span>Buscando trabajador...</span>
                        </motion.div>
                      )}
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="rounded-xl bg-danger-50 px-4 py-3 text-center text-sm font-medium text-danger-600 dark:bg-danger-500/10 dark:text-danger-400"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-center text-xs text-default-400">
                      Se buscará automáticamente al completar los 8 dígitos.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── EMPLOYEE SCREEN ── */}
              {screen === 'employee' && lookup && (
                <motion.div key="employee" {...slide} transition={{ duration: 0.22 }}>
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary"
                      >
                        {lookup.employeeName?.[0]?.toUpperCase() ?? '?'}
                      </motion.div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-slate-800 dark:text-white sm:text-xl">
                          {lookup.employeeName}
                        </h2>
                        <p className="text-xs text-default-500">DNI {lookup.dni}</p>
                      </div>
                    </div>

                    {/* Today's timeline */}
                    {lookup.historyLog.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl border border-default-100 bg-default-50/60 px-4 py-3 dark:border-default-800 dark:bg-slate-800/40"
                      >
                        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-default-400">
                          Registros de hoy
                        </p>
                        <div className="space-y-0">
                          {lookup.historyLog.map((entry, i) => (
                            <TimelineEntry
                              key={entry.action + i}
                              entry={entry}
                              index={i}
                              total={lookup.historyLog.length}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    {lookup.nextActions.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-center text-[11px] font-bold uppercase tracking-[0.15em] text-default-400">
                          Siguiente paso
                        </p>
                        <div
                          className={`grid gap-3 ${
                            lookup.nextActions.length > 1 ? 'grid-cols-2' : ''
                          }`}
                        >
                          {lookup.nextActions.map((action, i) => (
                            <motion.div
                              key={action}
                              initial={{ opacity: 0, scale: 0.92 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300, damping: 22 }}
                            >
                              <Button
                                color={ACTION_COLORS[action]}
                                variant={i === 0 ? 'solid' : 'flat'}
                                size="lg"
                                className="h-[4.5rem] w-full text-base font-bold shadow-md"
                                isLoading={loading}
                                isDisabled={loading}
                                onPress={() => handleMark(action)}
                                autoFocus={i === 0}
                                startContent={
                                  !loading ? (
                                    <span className="text-xl">{ACTION_ICONS[action]}</span>
                                  ) : undefined
                                }
                              >
                                {action}
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-warning-50 px-4 py-4 text-center dark:bg-warning-500/10">
                          <p className="text-sm font-semibold text-warning-700 dark:text-warning-400">
                            ✓ Jornada completa
                          </p>
                          <p className="mt-1 text-xs text-warning-600/80 dark:text-warning-400/70">
                            No hay más acciones pendientes por hoy.
                          </p>
                        </div>
                        <ProgressBar duration={AUTO_RESET_MS} color="bg-warning-400" />
                      </div>
                    )}

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="rounded-xl bg-danger-50 px-4 py-3 text-center text-sm font-medium text-danger-600 dark:bg-danger-500/10 dark:text-danger-400"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      variant="light"
                      size="sm"
                      className="w-full text-default-400 hover:text-default-600"
                      onPress={resetToIdle}
                      isDisabled={loading}
                    >
                      ← Volver · Esc
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── SUCCESS SCREEN ── */}
              {screen === 'success' && result && (
                <motion.div key="success" {...slide} transition={{ duration: 0.22 }}>
                  <div className="space-y-6 py-4 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20"
                    >
                      <svg
                        className="h-10 w-10 text-success-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <motion.path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        />
                      </svg>
                    </motion.div>

                    <div>
                      <motion.h2
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-2xl font-bold text-success-600 dark:text-success-400"
                      >
                        ¡Registrado!
                      </motion.h2>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                      >
                        <Chip
                          size="lg"
                          variant="flat"
                          color={ACTION_COLORS[result.action!]}
                          className="mt-2 text-sm font-semibold"
                        >
                          {result.action}
                        </Chip>
                        <p className="mt-3 text-sm text-default-500">
                          {result.employeeName}
                        </p>
                        <p className="text-lg font-bold tabular-nums text-slate-700 dark:text-slate-200">
                          {result.timestamp}
                        </p>
                      </motion.div>
                    </div>

                    <ProgressBar duration={AUTO_RESET_MS} color="bg-success-500" />

                    <Button
                      variant="light"
                      size="sm"
                      onPress={resetToIdle}
                      className="text-default-400"
                    >
                      Volver al inicio
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardBody>
        </Card>

        {/* Flow hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 text-[11px] text-default-400"
        >
          {['Ingreso', 'Receso', 'Fin receso', 'Salida'].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span>{step}</span>
              {i < arr.length - 1 && <span className="text-default-300">→</span>}
            </span>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

function ProgressBar({ duration, color }: { duration: number; color: string }) {
  return (
    <div className="mx-auto h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-default-100 dark:bg-default-800">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </div>
  );
}

export default App;
