import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  getKeyValue,
} from '@heroui/react';
import { Asistencia } from '../types/model.types';
import {
  getAttendanceHistory,
  getAttendanceByDocument,
} from '../services/attendanceService';
import { STATUS_COLOR_MAP } from '../constants/attendanceStatus';

interface AttendanceTableProps {
  document: string;
  isDocumentChanged: boolean;
}

const COLUMNS = [
  { key: 'index', label: 'N°' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'marcacion', label: 'Marcación' },
  { key: 'marcacion_tipo', label: 'Estado' },
  { key: 'almacen', label: 'Almacén' },
];

type TableRow = Asistencia & { index: number };

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  document,
  isDocumentChanged,
}) => {
  const [attendances, setAttendances] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAttendanceHistory();
        setAttendances(data);
        if (data.length === 0) setError('No se encontraron registros');
      } catch {
        setError('Error al cargar los registros');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!isDocumentChanged || document.length !== 8) return;

    const fetchByDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAttendanceByDocument(document);
        setAttendances(data);
        if (data.length === 0) setError('No se encontraron registros para este documento');
      } catch {
        setError('Error al cargar los registros');
      } finally {
        setLoading(false);
      }
    };

    fetchByDocument();
  }, [document, isDocumentChanged]);

  const rows: TableRow[] = attendances.map((a, i) => ({ ...a, index: i + 1 }));

  const renderCell = (item: TableRow, columnKey: string) => {
    if (columnKey === 'marcacion_tipo') {
      const color = STATUS_COLOR_MAP[item.marcacion_tipo_id] ?? 'default';
      return (
        <Chip color={color} variant="flat" size="sm" aria-label={item.marcacion_tipo}>
          {item.marcacion_tipo}
        </Chip>
      );
    }
    return getKeyValue(item, columnKey);
  };

  return (
    <Table
      aria-label="Historial de asistencias"
      isStriped
      removeWrapper={false}
      classNames={{
        wrapper: 'shadow-sm rounded-xl',
        th: 'bg-default-100 text-default-700 font-semibold',
      }}
    >
      <TableHeader columns={COLUMNS}>
        {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
      </TableHeader>
      <TableBody
        items={rows}
        isLoading={loading}
        loadingContent={
          <div className="flex justify-center py-8">
            <Spinner label="Cargando registros..." color="primary" />
          </div>
        }
        emptyContent={
          <div className="text-center py-6 text-default-400" role="status">
            {error ?? 'No hay registros para mostrar'}
          </div>
        }
      >
        {(item) => (
          <TableRow key={item.asistencia_id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey as string)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default AttendanceTable;

