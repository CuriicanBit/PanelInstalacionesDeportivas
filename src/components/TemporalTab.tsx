import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hourglass, Sun, Moon, Calendar, Info, Layers, CheckCircle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { AttendanceRecord, MainFacility } from '../types';

interface TemporalTabProps {
  records: AttendanceRecord[];
}

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function TemporalTab({ records }: TemporalTabProps) {
  
  const [targetFacility, setTargetFacility] = useState<MainFacility | 'Todos'>('Todos');
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; count: number } | null>(null);

  // Filter records by selected facility
  const filteredRecords = records.filter(r => targetFacility === 'Todos' || r.facility === targetFacility);

  // 1. Calculate Hourly Loads (08:00 to 20:00)
  const hourlyData = HOURS.map(hour => {
    const matching = filteredRecords.filter(r => r.hour === hour);
    const total = matching.length;
    return {
      hour,
      hourStr: `${String(hour).padStart(2, '0')}:00`,
      'Asistencias': total,
      alumnos: matching.filter(r => r.userType === 'Alumnos').length,
      funcionarios: matching.filter(r => r.userType === 'Funcionarios').length,
    };
  });

  // 2. Generate Heatmap data (Matrix of Day vs Hour)
  // Rows: Days (1 to 6, let's keep Mon-Sat since Sunday is mostly empty we can skip or include all)
  const daysToShow = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
  
  // Calculate grid counts and find max count for scaling color opacity
  let maxCellCount = 0;
  const heatmapGrid = daysToShow.map(dayIdx => {
    return HOURS.map(hour => {
      const count = filteredRecords.filter(r => r.dayOfWeek === dayIdx && r.hour === hour).length;
      if (count > maxCellCount) maxCellCount = count;
      return { dayIdx, hour, count };
    });
  });  // Calculate cell intensity color step
  const getCellColorClass = (count: number) => {
    if (count === 0) return 'bg-[#1E1E24]/50 hover:bg-zinc-800 border border-white/5 text-zinc-650';
    if (!maxCellCount) return 'bg-zinc-800';
    
    const intensity = count / maxCellCount;
    if (intensity < 0.2) return 'bg-[#D32F2F]/15 hover:bg-[#D32F2F]/25 text-[#ff4c4c] border border-rose-500/10';
    if (intensity < 0.45) return 'bg-[#D32F2F]/35 hover:bg-[#D32F2F]/45 text-[#ff6a6a] border border-[#D32F2F]/20';
    if (intensity < 0.75) return 'bg-[#D32F2F]/65 hover:bg-[#D32F2F]/75 text-white border border-[#D32F2F]/30';
    return 'bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold shadow-md shadow-rose-950/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 max-w-[1600px] mx-auto"
    >
      
      {/* Target Facility selector header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#1E1E24] p-5 rounded-3xl border border-white/5 text-white shadow-md">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-rose-500" />
            Análisis de Carga Temporal y Saturación
          </h2>
          <p className="text-xs text-[#A0A0A5] mt-0.5">
            Inspección de afluencia por bloques y mapa térmico operativo
          </p>
        </div>

        {/* Facility Selector Filters */}
        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-white/5 self-start lg:self-center">
          {([
            { id: 'Todos', label: 'Consolidado General' },
            { id: 'Sala de Musculación', label: 'Gimnasio' },
            { id: 'Cancha Campus Central', label: 'Cancha Central' },
            { id: 'Canchas Campus Alameda', label: 'Canchas Alameda' }
          ] as const).map((fac) => (
            <button
              id={`btn-temporal-facility-${fac.id.replace(/ /g, '-')}`}
              key={fac.id}
              onClick={() => setTargetFacility(fac.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 transform active:scale-95 ${
                targetFacility === fac.id
                  ? 'bg-[#D32F2F] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {fac.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Density Chart */}
        <div className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl">
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Densidad por Bloque Horario
              </h3>
              <p className="text-xs text-[#A0A0A5] mt-0.5">
                Volumen acumulado entre las 08:00 y las 22:00 h
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 bg-sky-500/10 text-sky-400 px-3 py-1.5 rounded-lg border border-sky-500/20">
                <Sun className="h-3.5 w-3.5" /> Mañana (08-14)
              </span>
              <span className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg border border-orange-500/20">
                <Moon className="h-3.5 w-3.5" /> Tarde/Noche (15-22)
              </span>
            </div>
          </div>

          {/* Bar chart representing hourly loads */}
          <div className="h-[300px] w-full">
            {filteredRecords.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="hourStr" 
                    stroke="#A0A0A5" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={(props: any) => {
                      const { x, y, payload } = props;
                      if (!payload) return null;
                      const hourVal = parseInt(payload.value.split(':')[0], 10);
                      const isMorning = hourVal >= 8 && hourVal <= 14;
                      const isAfternoonNight = hourVal >= 15 && hourVal <= 22;
                      const color = isMorning ? '#38bdf8' : (isAfternoonNight ? '#fb923c' : '#A0A0A5');
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={14}
                            textAnchor="middle"
                            fill={color}
                            fontSize={11}
                            fontWeight="bold"
                          >
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <YAxis 
                    stroke="#A0A0A5" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#1E1E24', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <Bar 
                    dataKey="Asistencias" 
                    radius={[10, 10, 0, 0]} 
                    barSize={28}
                  >
                    {hourlyData.map((entry, index) => {
                      // Coloring: Dynamic color degradation from UA Red (#D32F2F) for maximum value to neutral gray (#5a5a66) for minimum
                      const maxAsistencias = Math.max(...hourlyData.map(h => h.Asistencias));
                      const ratio = maxAsistencias > 0 ? (entry.Asistencias / maxAsistencias) : 0;
                      // Linearly interpolate between #5a5a66 (gray-zinc) and #D32F2F (red-UA)
                      // #5a5a66 -> RGB(90, 90, 102)
                      // #D32F2F -> RGB(211, 47, 47)
                      const r = Math.round(90 + (211 - 90) * ratio);
                      const g = Math.round(90 + (47 - 90) * ratio);
                      const b = Math.round(102 + (47 - 102) * ratio);
                      const cellColor = `rgb(${r}, ${g}, ${b})`;
                      return (
                        <Cell 
                           key={`cell-${index}`} 
                           fill={cellColor} 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#A0A0A5] text-sm">
                No hay datos disponibles para graficar.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MATRIX HEATMAP: 2D GRID AS SPECIFICALLY REQUESTED */}
      <div className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl">
        <div>
          <h3 className="text-lg font-extrabold text-white tracking-tight">
            Mapa de Calor Operativo (Día vs Bloque Horario)
          </h3>
          <p className="text-xs text-[#A0A0A5] mt-0.5 mb-6">
            Saturación cruzada de lunes a sábado de {String(HOURS[0]).padStart(2, '0')}:00 h a {String(HOURS[HOURS.length - 1] + 1).padStart(2, '0')}:00 h
          </p>
        </div>

        {/* Matrix Render */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px] select-none p-1 bg-zinc-950/40 rounded-2xl border border-white/5">
            {/* Header Columns: Hour Blocks */}
            <div className="grid grid-cols-16 text-center pb-2 border-b border-white/5 mb-1 pt-2">
              <div className="text-[10px] font-black uppercase text-zinc-500 text-left pl-4">Día</div>
              {HOURS.map(h => (
                <div key={h} className="text-[10px] font-bold text-zinc-400">
                  {String(h).padStart(2, '0')} h
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            <div className="space-y-1">
              {daysToShow.map((dayIdx) => (
                <div key={dayIdx} className="grid grid-cols-16 items-center">
                  {/* Day Row Label */}
                  <div className="text-[11px] font-extrabold text-[#A0A0A5] pl-4">{DAYS_ES[dayIdx]}</div>
                  
                  {/* Hour Cells */}
                  {HOURS.map((hour) => {
                    const count = filteredRecords.filter(r => r.dayOfWeek === dayIdx && r.hour === hour).length;
                    return (
                      <div
                        id={`cell-${dayIdx}-${hour}`}
                        key={hour}
                        onMouseEnter={() => setHoveredCell({ day: dayIdx, hour, count })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-11 mx-0.5 rounded-lg flex items-center justify-center text-[10px] font-extrabold transition-all duration-150 cursor-pointer ${getCellColorClass(count)}`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap Tooltip Live Output */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center bg-[#1E1E24]/60 p-4 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-[#D32F2F]" />
            <div className="text-xs text-zinc-400">
              {hoveredCell ? (
                <span className="font-semibold text-zinc-300">
                  Bloque Evaluado: <b className="text-white">{DAYS_ES[hoveredCell.day]} a las {String(hoveredCell.hour).padStart(2, '0')}:00 h</b> tiene <b className="text-[#ff4c4c] text-sm">{hoveredCell.count.toLocaleString('es-CL')} asistencias</b> registradas.
                </span>
              ) : (
                <span>Sitúe el cursor del mouse sobre cualquier celda para auditar el aforo específico.</span>
              )}
            </div>
          </div>

          {/* Color Guides LEGENDS */}
          <div className="flex items-center gap-1.5 text-[10px] text-[#A0A0A5] font-bold border-l border-white/5 pl-4 mt-2 sm:mt-0">
            <span>Baja</span>
            <div className="w-3.5 h-3.5 bg-[#D32F2F]/10 rounded" title="0-20% de carga Máxima" />
            <div className="w-3.5 h-3.5 bg-[#D32F2F]/30 rounded" title="21-45% de carga" />
            <div className="w-3.5 h-3.5 bg-[#D32F2F]/60 rounded" title="46-75% de carga" />
            <div className="w-3.5 h-3.5 bg-[#D32F2F] rounded" title="Sobresaturado / Horario Punta Máximo" />
            <span>Saturado</span>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
