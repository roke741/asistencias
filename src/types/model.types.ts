export interface Asistencia{
    asistencia_id: number
    persona_id: number
    incorrecto: boolean
    identificador: string
    nombre: string
    fecha: string
    marcacion: string
    marcacion_tipo_id: number
    marcacion_tipo: string
    almacen_id: number
    almacen: string
}