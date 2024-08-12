import React from 'react';
import Dialog from '@mui/material/Dialog';

interface AttendanceStatusProps {
  open: boolean;
  status: string;
  onClose: (value: string) => void;
}

const AttendanceStatus: React.FC<AttendanceStatusProps> = ({
  open,
  status,
  onClose,
}) => {

  const handleClose = () => {
    onClose(status);
  };
  const handleListItemClick = (value: string) => {
    onClose(value);
  };


  return (
    <Dialog onClose={handleClose} open={open}>
    
    </Dialog>
    
  );
}

export default AttendanceStatus;