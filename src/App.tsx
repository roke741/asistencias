import './App.css';
import { useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from '@heroui/react';
import Clock from './components/Clock';
import AttendanceTable from './components/AttendanceTable';
import AttendanceStatusDialog from './components/AttendanceStatusDialog';

function App() {
  const [inputDocument, setInputDocument] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDocumentChanged, setIsDocumentChanged] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  const validateDocument = (doc: string): boolean => {
    if (doc.length !== 8 || isNaN(Number(doc)) || doc.includes('.')) {
      setErrorMessage('El documento debe tener exactamente 8 dígitos numéricos');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleDocumentChange = (value: string) => {
    setInputDocument(value.replace(/\D/g, '').slice(0, 8));
    if (errorMessage) setErrorMessage('');
  };

  const markAttendance = () => {
    if (!validateDocument(inputDocument)) return;
    setDialogOpen(true);
  };

  const consultAttendances = () => {
    if (!validateDocument(inputDocument)) return;
    setIsDocumentChanged((prev) => !prev);
  };

  const handleDialogClose = (status?: string) => {
    setDialogOpen(false);
    if (status) {
      setLastStatus(status);
      setIsDocumentChanged((prev) => !prev);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-1">
            Sistema de Asistencias
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Registre y consulte su historial de asistencias
          </p>
        </header>

        {/* Clock + Input Card */}
        <Card shadow="sm" className="w-full">
          <CardHeader className="flex flex-col items-center pb-0 pt-6">
            <Clock />
          </CardHeader>
          <Divider className="my-4" />
          <CardBody className="flex flex-col items-center gap-4 px-6 pb-6">
            <div className="w-full max-w-sm">
              <Input
                id="documentoID"
                label="Documento de identidad"
                labelPlacement="outside"
                placeholder="Ingrese 8 dígitos"
                value={inputDocument}
                onValueChange={handleDocumentChange}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                variant="bordered"
                color={errorMessage ? 'danger' : 'default'}
                isInvalid={!!errorMessage}
                errorMessage={errorMessage}
                description={
                  !errorMessage && inputDocument.length > 0
                    ? `${inputDocument.length}/8 dígitos`
                    : undefined
                }
                startContent={
                  <svg
                    className="w-4 h-4 text-default-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                    />
                  </svg>
                }
                aria-label="Ingrese su número de documento de identidad"
              />
            </div>

            {lastStatus && (
              <p className="text-sm text-success-600 font-medium" role="status" aria-live="polite">
                ✓ Última marcación registrada: <strong>{lastStatus}</strong>
              </p>
            )}

            <div className="flex gap-3">
              <Button
                color="success"
                variant="solid"
                onPress={markAttendance}
                isDisabled={inputDocument.length === 0}
                startContent={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                aria-label="Marcar asistencia"
              >
                Marcar
              </Button>
              <Button
                color="primary"
                variant="bordered"
                onPress={consultAttendances}
                isDisabled={inputDocument.length === 0}
                startContent={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                }
                aria-label="Consultar asistencias por documento"
              >
                Consultar
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Attendance Table Card */}
        <Card shadow="sm">
          <CardHeader className="px-6 pt-4 pb-2">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Historial de Asistencias
            </h2>
          </CardHeader>
          <CardBody className="px-4 pb-4">
            <AttendanceTable
              document={inputDocument}
              isDocumentChanged={isDocumentChanged}
            />
          </CardBody>
        </Card>
      </div>

      <AttendanceStatusDialog
        open={dialogOpen}
        document={inputDocument}
        onClose={handleDialogClose}
      />
    </main>
  );
}

export default App;

