export type UserType = 'Alumnos' | 'Funcionarios' | 'Familiar de Funcionario';

export type MainFacility = 'Sala de Musculación' | 'Cancha Campus Central' | 'Canchas Campus Alameda';

export type GymSubFacility = 'Alumnos' | 'Funcionarios';
export type AlamedaSubFacility = 'Cancha 1' | 'Cancha 2' | 'Multicancha';
export type CentralSubFacility = 'Cancha Central';

export type SubFacility = GymSubFacility | AlamedaSubFacility | CentralSubFacility;

export interface AttendanceRecord {
  id: string;
  timestamp: string; // ISO String format
  date: string; // YYYY-MM-DD
  hour: number; // 7 to 21
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  facility: MainFacility;
  subFacility: SubFacility;
  userType: UserType;
  durationMinutes: number;
}

export type FilterPeriod = 'Hoy' | 'Semanal' | 'Mensual' | 'Anual' | 'Personalizado';

export interface DashboardFilters {
  period: FilterPeriod;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  userType: UserType | 'Todos';
}

export interface KpiCardData {
  title: string;
  value: number;
  subtext: string;
  changePercent: number; // positive or negative
  isPositive: boolean;
}

export interface HourlyDensity {
  hour: number;
  hourStr: string;
  total: number;
  alumnos: number;
  funcionarios: number;
  familiares: number;
}

export interface DailyDensity {
  dayName: string;
  dayIndex: number;
  total: number;
}

export interface FacilityStats {
  facility: MainFacility;
  totalVisits: number;
  alumnosCount: number;
  funcionariosCount: number;
  familiaresCount: number;
  avgDuration: number;
  peakHour: string;
  subFacilities: {
    name: string;
    total: number;
  }[];
}
