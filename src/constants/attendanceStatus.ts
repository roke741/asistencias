export interface StatusOption {
  label: string;
  color: 'success' | 'primary' | 'warning' | 'secondary' | 'danger';
  id: number;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { id: 1, label: 'Entrada', color: 'success' },
  { id: 2, label: 'Salida', color: 'primary' },
  { id: 3, label: 'Receso', color: 'warning' },
  { id: 4, label: 'Fin Receso', color: 'secondary' },
];

export const STATUS_COLOR_MAP: Record<number, StatusOption['color']> = Object.fromEntries(
  STATUS_OPTIONS.map(({ id, color }) => [id, color]),
) as Record<number, StatusOption['color']>;
