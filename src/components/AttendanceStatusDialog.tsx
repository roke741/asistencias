import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

interface AttendanceStatusProps {
  open: boolean;
  status: string;
  onClose: (value: string) => void;
}

const AttendanceStatusDialog: React.FC<AttendanceStatusProps> = ({
  open,
  status,
  onClose,
}) => {
  const statusText = ['Entrada', 'Salida', 'Receso', 'Fin Receso'];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer); // Clean up the timer
  }, [open]);


  const handleClose = () => {
    onClose(status);
    setLoading(true);
  };

  const handleListItemClick = (value: string) => {
    onClose(value);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Seleccione un estado</DialogTitle>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <CircularProgress />
        </div>
      ) : (
        <List>
          {statusText.map((text) => (
            <ListItem key={text} disablePadding>
              <ListItemButton onClick={() => handleListItemClick(text)} aria-label={`Select ${text}`}>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Dialog>
  );
};

export default AttendanceStatusDialog;
