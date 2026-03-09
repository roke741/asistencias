import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Chip,
} from '@heroui/react';
import { markAttendance, MarkAttendanceResult } from '../services/attendanceService';
import { STATUS_OPTIONS } from '../constants/attendanceStatus';

interface AttendanceStatusProps {
  open: boolean;
  document: string;
  onClose: (value?: string) => void;
}

const AttendanceStatusDialog: React.FC<AttendanceStatusProps> = ({
  open,
  document,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarkAttendanceResult | null>(null);

  useEffect(() => {
    if (!open) {
      setResult(null);
      setLoading(false);
    }
  }, [open]);

  const handleSelectStatus = async (status: string) => {
    setLoading(true);
    const res = await markAttendance(document, status);
    setResult(res);
    setLoading(false);
  };

  const handleClose = () => {
    onClose(result?.marcacion_tipo);
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      aria-labelledby="attendance-dialog-title"
      placement="center"
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader id="attendance-dialog-title" className="flex flex-col gap-1">
          {result ? 'Resultado del registro' : 'Seleccione un estado'}
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-6" aria-live="polite" aria-busy="true">
              <Spinner size="lg" color="primary" label="Registrando asistencia..." />
            </div>
          ) : result ? (
            <div className="flex flex-col items-center gap-4 py-4" aria-live="polite">
              {result.success ? (
                <>
                  <div
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-success-100"
                    aria-hidden="true"
                  >
                    <svg
                      className="w-8 h-8 text-success-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-center font-semibold text-lg">{result.message}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Chip color="success" variant="flat">
                      {result.marcacion_tipo}
                    </Chip>
                    <Chip color="default" variant="flat">
                      {result.marcacion}
                    </Chip>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-danger-100"
                    aria-hidden="true"
                  >
                    <svg
                      className="w-8 h-8 text-danger-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <p className="text-center text-danger font-semibold">{result.message}</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 py-2" role="group" aria-label="Opciones de estado">
              {STATUS_OPTIONS.map(({ label, color }) => (
                <Button
                  key={label}
                  color={color}
                  variant="flat"
                  size="lg"
                  className="h-16 text-base font-medium"
                  onPress={() => handleSelectStatus(label)}
                  aria-label={`Marcar ${label}`}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="default"
            variant="light"
            onPress={handleClose}
            aria-label="Cerrar diálogo"
          >
            {result ? 'Cerrar' : 'Cancelar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AttendanceStatusDialog;

