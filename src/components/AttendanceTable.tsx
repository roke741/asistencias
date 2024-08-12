import React, { useState, useEffect } from "react";
import axios from "axios";
import { Asistencia } from "../types/model.types";
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
} from "@mui/material";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";

interface AttendanceTableProps {
  document: string;
  isDocumentChanged: boolean;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  document,
  isDocumentChanged,
}) => {
  const [attendances, setAttendances] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchAttendances = async () => {
      if (isDocumentChanged && document.length === 8) {
        setLoading(true);
        let url = `http://127.0.0.1:8000/api/compuusasoft/asistencia/${document}/historial`;
        const response = await axios.get(url);
        if (response.data.error) {
          setAttendances([]);
        } else {
          setAttendances(response.data.data);
          console.log(response.data.data);
          if (response.data.data.length === 0) {
            setError('No se encontraron registros');
          }
          setLoading(false);
        }
      }
    };

    fetchAttendances();
  }, [document, isDocumentChanged]); // Dependencias del useEffect

  useEffect(() => {
    const fetchAttendances = async () => {
      let url = 'http://127.0.0.1:8000/api/compuusasoft/asistencia/historial';
        const response = await axios.get(url);
        if (response.data.error) {
          setAttendances([]);
        } else {
          setAttendances(response.data.data);
          if (response.data.data.length === 0) {
            setError('No se encontraron registros');
          }
          setLoading(false);
        }
    }
    fetchAttendances();
  } , []);
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>N°</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Marcacion</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Almacen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>

          {loading && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          )}
          {error ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                {error}
              </TableCell>
            </TableRow>
          ) : (
            attendances.map((attendance, index) => (
              <TableRow key={attendance.asistencia_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{attendance.nombre}</TableCell>
                <TableCell>{attendance.marcacion}</TableCell>
                <TableCell align="center">
                  {attendance.marcacion_tipo_id === 1 ? (
                    <Chip label={attendance.marcacion_tipo} color="success" />
                  ) : attendance.marcacion_tipo_id === 2 ? (
                    <Chip label={attendance.marcacion_tipo} color="primary" />
                  ) : attendance.marcacion_tipo_id === 3 ? (
                    <Chip label={attendance.marcacion_tipo} color="warning" />
                  ) : attendance.marcacion_tipo_id === 4 ? (
                    <Chip label={attendance.marcacion_tipo} color="error" />
                  ) : null}
                </TableCell>
                <TableCell>{attendance.almacen}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AttendanceTable;
