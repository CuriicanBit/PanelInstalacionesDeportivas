import React from 'react';
import { Calendar, Users, RotateCcw } from 'lucide-react';
import { DashboardFilters, FilterPeriod, UserType } from '../types';
import UALogo from './UALogo';

interface HeaderProps {
  filters: DashboardFilters;
  onFilterChange: (newFilters: DashboardFilters) => void;
  onReset: () => void;
  recordsCount: number;
}

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Header({ filters, onFilterChange, onReset, recordsCount }: HeaderProps) {
  const startRef = React.useRef<HTMLInputElement>(null);
  const endRef = React.useRef<HTMLInputElement>(null);
  
  const setQuickPeriod = (period: FilterPeriod) => {
    const nowLocalDateStr = getLocalDateString(new Date());
    const end = new Date(nowLocalDateStr + 'T12:00:00'); // dynamic local date
    let start = new Date(nowLocalDateStr + 'T12:00:00');

    if (period === 'Hoy') {
      // Keep start and end as nowLocalDateStr
    } else if (period === 'Semanal') {
      start.setDate(end.getDate() - 7);
    } else if (period === 'Mensual') {
      start.setMonth(end.getMonth() - 1);
    } else if (period === 'Anual') {
      start.setFullYear(end.getFullYear() - 1);
    } else {
      // For personalizado, leave as is
      onFilterChange({ ...filters, period });
      return;
    }

    const startStr = getLocalDateString(start);
    const endStr = getLocalDateString(end);

    onFilterChange({
      ...filters,
      period,
      startDate: startStr,
      endDate: endStr,
    });
  };

  const setStartDate = (date: string) => {
    onFilterChange({
      ...filters,
      period: 'Personalizado',
      startDate: date,
    });
  };

  const setEndDate = (date: string) => {
    onFilterChange({
      ...filters,
      period: 'Personalizado',
      endDate: date,
    });
  };

  const setUserTypeFilter = (userType: UserType | 'Todos') => {
    onFilterChange({
      ...filters,
      userType,
    });
  };

  return (
    <header id="bi-header" className="bg-[#1E1E24] text-white border-b border-zinc-800 shadow-xl relative overflow-hidden">
      {/* Visual Accent Banner Red UA */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D32F2F]" />

      <div className="max-w-[1600px] mx-auto px-6 py-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        
        {/* Institutional Branding */}
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          <div className="flex-shrink-0 transform hover:scale-[1.03] transition-transform duration-200">
            <UALogo className="h-28 w-auto drop-shadow-[0_10px_15px_rgba(211,47,47,0.15)]" />
          </div>
          <div className="flex flex-col justify-center text-center sm:text-left h-auto sm:h-28 sm:border-l sm:border-zinc-800 sm:pl-6 gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-[#D32F2F]/15 text-[#ff4b4b] text-[10px] sm:text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full border border-[#D32F2F]/40 shadow-sm leading-none">
                Sede Talca
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-300 font-semibold max-w-sm sm:max-w-md leading-relaxed tracking-wide">
              Desarrollado por el Departamento de Tecnologías de la Información de la UA, Sede Talca.
            </p>
          </div>
        </div>

        {/* Dynamic Controls & Filters Area */}
        <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
          
          {/* Quick Period Buttons */}
          <div className="flex flex-col gap-1.5 justify-center">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#D32F2F]" /> Rango Temático
            </span>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
              {(['Hoy', 'Semanal', 'Mensual', 'Anual', 'Personalizado'] as FilterPeriod[]).map((p) => (
                <button
                  id={`btn-period-${p}`}
                  key={p}
                  onClick={() => setQuickPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 transform active:scale-95 select-none ${
                    filters.period === p
                      ? 'bg-[#D32F2F] text-white shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker Range Inputs (Show for Custom range) */}
          <div className="flex flex-col gap-1.5 justify-center">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
              Fechas (Rango Operativo)
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <input
                  ref={startRef}
                  id="input-start-date"
                  type="date"
                  value={filters.startDate}
                  min="2025-06-01"
                  max="2026-06-15"
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-9 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#D32F2F] tracking-wide w-[130px] cursor-text [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10"
                />
                <div
                  className="absolute right-2.5 text-zinc-500 pointer-events-none z-0"
                >
                  <Calendar className="h-3.5 w-3.5" />
                </div>
              </div>
              <span className="text-zinc-600 text-xs font-bold">AL</span>
              <div className="relative flex items-center">
                <input
                  ref={endRef}
                  id="input-end-date"
                  type="date"
                  value={filters.endDate}
                  min="2025-06-01"
                  max="2026-06-15"
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-9 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#D32F2F] tracking-wide w-[130px] cursor-text [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10"
                />
                <div
                  className="absolute right-2.5 text-zinc-500 pointer-events-none z-0"
                >
                  <Calendar className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Vínculo Demographic Filter */}
          <div className="flex flex-col gap-1.5 justify-center">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider flex items-center gap-1">
              <Users className="h-3 w-3 text-[#D32F2F]" /> Estamento
            </span>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
              {(['Todos', 'Alumnos', 'Funcionarios', 'Familiar de Funcionario'] as const).map((vt) => (
                <button
                  id={`btn-vinc-${vt}`}
                  key={vt}
                  onClick={() => setUserTypeFilter(vt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none tracking-wide transition-all duration-200 transform active:scale-95 ${
                    filters.userType === vt
                      ? 'bg-white text-zinc-900 shadow-md font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters & Active counter Indicator */}
          <div className="flex items-end gap-2 shrink-0 self-end md:self-center mt-4 md:mt-0">
            <button
              id="btn-reset-filters"
              onClick={onReset}
              title="Restaurar valores de fábrica"
              className="p-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all duration-150 transform active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 text-right">
              <div className="text-[9px] uppercase text-zinc-500 font-bold leading-none tracking-wide">
                Registros Filtrados
              </div>
              <div className="text-sm font-black text-rose-500 leading-none mt-1">
                {recordsCount.toLocaleString('es-CL')}
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
