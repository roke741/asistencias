
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import './App.css'
import BasicTable from './components/BasicTable';
import Clock from './components/Clock';

function App() {
  return (
    <>
      <h1 className='text-3xl'>Registrar Asistencia</h1>
      <section className='mt-4'>
        <div className='mb-6'>
          <Clock />
        </div>
        <div className='flex gap-3 items-center justify-center mb-4'>
          <TextField 
            id='outlined-basic' 
            label='Ingrese su documento' 
            variant='outlined' 
            size='small'
            type='number'
            
          />
          <Button variant='contained'>Marcar</Button>
          <Button variant='outlined'>Consultar</Button>
        </div>
        <BasicTable />
      </section>
    </>
  )
}

export default App
