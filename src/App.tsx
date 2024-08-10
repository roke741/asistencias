import './App.css';
import { useState } from 'react';
import BasicTable from './components/BasicTable';
import Clock from './components/Clock';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AttendanceTable from './components/AttendanceTable';

function App() {
  const [documento, setDocumento] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string>('');
  const [isDocumentChanged, setIsDocumentChanged] = useState<boolean>(false); // State to track document change

  const handleMarcar = () => {
    if (documento.length !== 8) {
      setHasError(true);
      setMessageError('El documento debe tener 8 caracteres');
      return;
    }
    setHasError(false);
  };

  const handleConsultar = () => {
    if (documento.length !== 8) {
      setHasError(true);
      setMessageError('El documento debe tener 8 caracteres');
      return;
    }
    setHasError(false);
    setIsDocumentChanged(prev => !prev); 
  };

  return (
    <>
      <h1 className='text-3xl font-bold text-center mb-4'>Registrar Asistencia</h1>
      <section className='mt-4 mx-auto p-4 max-w-4xl'>
        <div className='flex flex-col items-center justify-center gap-4 mb-6'>
          <Clock />
          <TextField
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
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
              onClick={handleMarcar}
            >
              Marcar
            </Button>
            <Button
              variant='outlined'
              color='primary'
              onClick={handleConsultar}
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
          <AttendanceTable document={documento} isDocumentChanged={isDocumentChanged} />
        </div>
      </section>
    </>
  );
}

export default App;
