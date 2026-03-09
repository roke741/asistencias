import './App.css';
import { useState } from 'react';
import Clock from './components/Clock';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AttendanceTable from './components/AttendanceTable';
import AttendanceStatusDialog from './components/AttendanceStatusDialog';

function App() {
  const [inputDocument, setInputDocument] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string>('');
  const [isDocumentChanged, setIsDocumentChanged] = useState<boolean>(false);

  const [open, setOpen] = useState<boolean>(false);

  const handleOpenDialog = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const validateDocument = (document: string) => {
    if (document.length !== 8 || isNaN(Number(document)) || document.includes('.')) {
      setHasError(true);
      setMessageError('El documento debe tener 8 caracteres');
      return false;
    }
    return true;
  };

  const markAttendance = () => {
    if (!validateDocument(inputDocument)) return;
    setHasError(false);
    handleOpenDialog();    
  };

  const consultAttendances = () => {
    if (!validateDocument(inputDocument)) return;
    setHasError(false);
    setIsDocumentChanged((prev) => !prev);
  };

  return (
    <>
      <h1 className='text-3xl font-bold text-center mb-4'>Registrar Asistencia</h1>
      <section className='mt-4 mx-auto p-4 max-w-4xl'>
        <div className='flex flex-col items-center justify-center gap-4 mb-6'>
          <Clock />
          <TextField
            value={inputDocument}
            onChange={(e) => setInputDocument(e.target.value)}
            id='documentoID'
            label='Ingrese su documento'
            variant='outlined'
            size='small'
            type='number'
          />
          <div className='flex gap-2'>
            <Button
              variant='contained'
              color='success'
              onClick={markAttendance}
            >
              Marcar
            </Button>
            <Button
              variant='outlined'
              color='primary'
              onClick={consultAttendances}
            >
              Consultar
            </Button>
          </div>
        </div>
        {hasError && (
          <div className='text-red-700 rounded-lg mb-6' role='alert'>
            <Alert
              className='border border-amber-400'
              severity='warning'
              onClose={() => {
                setHasError(false);
                setMessageError('');
              }}
            >
              {messageError}
            </Alert>
          </div>
        )}
        <div className='my-2'>
          <AttendanceTable document={inputDocument} isDocumentChanged={isDocumentChanged} />
        </div>
      </section>
      <AttendanceStatusDialog open={open} status='Entrada' onClose={handleClose} />
    </>
  );
}

export default App;
