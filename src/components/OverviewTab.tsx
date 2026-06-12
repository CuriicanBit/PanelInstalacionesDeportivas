import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CalendarRange, 
  TrendingUp, 
  Clock, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { AttendanceRecord, DashboardFilters, MainFacility } from '../types';

interface OverviewTabProps {
  records: AttendanceRecord[];
  allRecords: AttendanceRecord[]; // prior comparison period
  filters: DashboardFilters;
}

export default function OverviewTab({ records, allRecords, filters }: OverviewTabProps) {
  const [targetFacility, setTargetFacility] = useState<MainFacility | 'Todos'>('Todos');

  // Filter records based on selected facility
  const filteredRecords = records.filter(r => targetFacility === 'Todos' || r.facility === targetFacility);

  // Calculate total visits
  const totalVisits = filteredRecords.length;

  // Calculate comparisons (Previous identical period)
  // Let's compute start & end range length in days
  const rawStart = new Date(filters.startDate || '2026-04-01');
  const rawEnd = new Date(filters.endDate || '2026-06-11');
  
  const start = isNaN(rawStart.getTime()) ? new Date('2026-04-01') : rawStart;
  const end = isNaN(rawEnd.getTime()) ? new Date('2026-06-11') : rawEnd;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  // Previous Period: start date - diffDays to start date - 1
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - diffDays);

  let prevStartStr = '2026-04-01';
  let prevEndStr = '2026-06-11';
  
  try {
    if (!isNaN(prevStart.getTime())) {
      prevStartStr = prevStart.toISOString().split('T')[0];
    }
  } catch (e) {
    // Fail silent fallback
  }

  try {
    if (!isNaN(prevEnd.getTime())) {
      prevEndStr = prevEnd.toISOString().split('T')[0];
    }
  } catch (e) {
    // Fail silent fallback
  }

  const prevPeriodRecords = allRecords.filter(r => {
    const d = r.date;
    return d >= prevStartStr && d <= prevEndStr && 
           (filters.userType === 'Todos' || r.userType === filters.userType) &&
           (targetFacility === 'Todos' || r.facility === targetFacility);
  });

  const prevTotalVisits = prevPeriodRecords.length;
  let pctChange = 0;
  if (prevTotalVisits > 0) {
    pctChange = ((totalVisits - prevTotalVisits) / prevTotalVisits) * 100;
  } else {
    pctChange = totalVisits > 0 ? 100 : 0;
  }

  // Calculate Peak Hour of day (hour with highest count)
  const hourCounts: { [key: number]: number } = {};
  filteredRecords.forEach(r => {
    hourCounts[r.hour] = (hourCounts[r.hour] || 0) + 1;
  });
  let peakHour = -1;
  let maxHourCount = 0;
  Object.entries(hourCounts).forEach(([h, count]) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      peakHour = Number(h);
    }
  });

  // Calculate Peak Hour for previous period
  const prevHourCounts: { [key: number]: number } = {};
  prevPeriodRecords.forEach(r => {
    prevHourCounts[r.hour] = (prevHourCounts[r.hour] || 0) + 1;
  });
  let prevPeakHour = -1;
  let prevMaxHourCount = 0;
  Object.entries(prevHourCounts).forEach(([h, count]) => {
    if (count > prevMaxHourCount) {
      prevMaxHourCount = count;
      prevPeakHour = Number(h);
    }
  });

  // Demography
  const alumnosCount = filteredRecords.filter(r => r.userType === 'Alumnos').length;
  const funcionariosCount = filteredRecords.filter(r => r.userType === 'Funcionarios').length;
  const familiaresCount = filteredRecords.filter(r => r.userType === 'Familiar de Funcionario').length;

  // Top Facility/Sub-Facility
  let topFacility = 'N/A';
  let topCount = 0;
  if (targetFacility === 'Todos') {
    const facilityCounts = filteredRecords.reduce((acc: { [key: string]: number }, curr) => {
      acc[curr.facility] = (acc[curr.facility] || 0) + 1;
      return acc;
    }, {});
    Object.entries(facilityCounts).forEach(([fac, count]) => {
      if (count > topCount) {
        topCount = count;
        topFacility = fac;
      }
    });
  } else {
    const subFacilityCounts = filteredRecords.reduce((acc: { [key: string]: number }, curr) => {
      acc[curr.subFacility] = (acc[curr.subFacility] || 0) + 1;
      return acc;
    }, {});
    Object.entries(subFacilityCounts).forEach(([sub, count]) => {
      if (count > topCount) {
        topCount = count;
        topFacility = sub;
      }
    });
  }

  // Recharts: Distribution of facilities data
  const isAll = targetFacility === 'Todos';
  const chartDataColors = ['#D32F2F', '#FF5722', '#FFC107', '#4CAF50', '#00BCD4'];
  const chartFacilitiesData = isAll 
    ? [
        { name: 'Gimnasio', Visitas: filteredRecords.filter(r => r.facility === 'Sala de Musculación').length, fill: '#D32F2F' },
        { name: 'Central', Visitas: filteredRecords.filter(r => r.facility === 'Cancha Campus Central').length, fill: '#FF5722' },
        { name: 'Alameda', Visitas: filteredRecords.filter(r => r.facility === 'Canchas Campus Alameda').length, fill: '#FFC107' },
      ]
    : (() => {
        // Group by sub-facility
        const subMap: { [key: string]: number } = {};
        filteredRecords.forEach(r => {
          subMap[r.subFacility] = (subMap[r.subFacility] || 0) + 1;
        });
        return Object.entries(subMap).map(([name, count], index) => ({
          name,
          Visitas: count,
          fill: chartDataColors[index % chartDataColors.length]
        }));
      })();

  // Recharts: Demographics Pie data
  const pieData = [
    { name: 'Alumnos', value: alumnosCount, color: '#D32F2F' },
    { name: 'Funcionarios', value: funcionariosCount, color: '#1E1E24' },
    { name: 'Familiares', value: familiaresCount, color: '#9E9E9E' },
  ].filter(item => item.value > 0);

  // Recharts: Timeline attendance trends
  // Let's aggregate records by month (or by date if weekly)
  const getTimelineData = () => {
    const timelineMap: { [key: string]: { date: string, visitas: number, timestamp: number } } = {};
    
    // Fill in last 12 chronological months if Anual, other formats if Semanal/Mensual
    filteredRecords.forEach(r => {
      // Grouping format based on range size
      let key = r.date; // default to day
      if (diffDays > 35) {
        // Group by month
        const [year, month] = r.date.split('-');
        key = `${year}-${month}`; // YYYY-MM
      }

      if (!timelineMap[key]) {
        const parsedDate = new Date(key + (diffDays > 35 ? '-01' : ''));
        timelineMap[key] = {
          date: key,
          visitas: 0,
          timestamp: isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime()
        };
      }
      timelineMap[key].visitas++;
    });

    const sorted = Object.values(timelineMap).sort((a, b) => a.timestamp - b.timestamp);
    
    // Format Month key beautifully (e.g. YYYY-MM to Spanish Month Short)
    return sorted.map(item => {
      if (diffDays > 35) {
        const [y, m] = item.date.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return {
          label: `${monthNames[parseInt(m, 10) - 1]} ${y.slice(2)}`,
          Visitas: item.visitas
        };
      } else {
        const [y, m, d] = item.date.split('-');
        return {
          label: `${d}/${m}`,
          Visitas: item.visitas
        };
      }
    });
  };

  const timelineData = getTimelineData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 max-w-[1600px] mx-auto"
    >
      {/* Target Facility Selector Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#1E1E24] p-5 rounded-3xl border border-white/5 text-white shadow-md">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-rose-500" />
            Vista General de KPIs
          </h2>
          <p className="text-xs text-[#A0A0A5] mt-0.5">
            Monitoreo general de afluencia y métricas clave consolidado
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
              id={`btn-overview-facility-${fac.id.replace(/ /g, '-')}`}
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

      {/* 3 Executive High Contrast KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Visitas Totales */}
        <div id="kpi-card-visits" className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl relative overflow-hidden flex flex-col justify-between h-[180px]">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#A0A0A5]">
                Afluencia Registrada
              </span>
              <div className="p-3 rounded-2xl bg-[#D32F2F]/15 text-[#D32F2F]">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-4xl font-black text-white tracking-tight mt-3">
              {totalVisits.toLocaleString('es-CL')}
            </h3>
            <p className="text-xs text-[#A0A0A5] font-medium mt-1">
              Ingresos deportivos totales
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
            {pctChange >= 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <ArrowUpRight className="h-3 w-3 shrink-0" /> +{pctChange.toFixed(1)}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/20">
                <ArrowDownRight className="h-3 w-3 shrink-0" /> {pctChange.toFixed(1)}%
              </span>
            )}
            <span className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase">
              vs período anterior
            </span>
          </div>
        </div>

        {/* KPI 2: Hora de Mayor Demanda */}
        <div id="kpi-card-duration" className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl relative overflow-hidden flex flex-col justify-between h-[180px]">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#A0A0A5]">
                Horario Punta
              </span>
              <div className="p-3 rounded-2xl bg-[#D32F2F]/15 text-[#ff5757]">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-4xl font-black text-white tracking-tight mt-3">
              {peakHour !== -1 ? `${String(peakHour).padStart(2, '0')}:00` : '--:--'}{' '}
              <span className="text-xl font-bold text-zinc-500">Hrs</span>
            </h3>
            <p className="text-xs text-[#A0A0A5] font-medium mt-1">
              Bloque de mayor afluencia general
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
            {peakHour !== -1 && prevPeakHour !== -1 ? (
              peakHour === prevPeakHour ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Sin Variación
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#D32F2F]/10 text-rose-400 px-2 py-0.5 rounded-md border border-[#D32F2F]/20">
                  Previo: {String(prevPeakHour).padStart(2, '0')}:00 h
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-500/20">
                Sin datos previos
              </span>
            )}
            <span className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase">
              vs período anterior
            </span>
          </div>
        </div>

        {/* KPI 3: Cancha o Espacio Más Solicitado */}
        <div id="kpi-card-demographics" className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl relative overflow-hidden flex flex-col justify-between h-[180px]">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#A0A0A5]">
                {targetFacility === 'Todos' ? 'Sector Más Demandado' : 'Sub-Sector Más Demandado'}
              </span>
              <div className="p-3 rounded-2xl bg-[#D32F2F]/15 text-[#ff5757]">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight mt-3 truncate" title={topFacility}>
              {topFacility}
            </h3>
            <p className="text-xs text-[#A0A0A5] font-medium mt-1">
              {targetFacility === 'Todos' ? 'Concentra la mayor afluencia' : 'Sub-sala o cancha más solicitada'}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#D32F2F]/15 text-[#ff4f4f] px-2 py-0.5 rounded-md border border-[#D32F2F]/30">
              {topCount.toLocaleString('es-CL')} accesos
            </span>
            <span className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase">
              concurridos
            </span>
          </div>
        </div>

      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Timeline Engagement Area Graph (Span 2 to balance width) */}
        <div className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Curva Cronológica de Asistencias
              </h2>
              <p className="text-xs text-[#A0A0A5] mt-0.5">
                Volumen acumulado por período seleccionado
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#D32F2F]/15 text-[#ff4c4c] font-bold px-3 py-1.5 rounded-xl border border-[#D32F2F]/20 text-xs">
              <CalendarRange className="h-4 w-4" /> Evolutivo de uso
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#D32F2F" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="label" 
                    stroke="#A0A0A5" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#A0A0A5" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E24', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}
                    labelClassName="font-bold text-[#f5c6c6]"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Visitas" 
                    stroke="#D32F2F" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorVisits)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#A0A0A5] text-sm">
                No hay suficientes registros para el rango temporal asignado.
              </div>
            )}
          </div>
        </div>

        {/* Demographics Pie Chart Segment */}
        <div className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Vinculación Demográfica
            </h2>
            <p className="text-xs text-[#A0A0A5] mt-0.5 mb-6">
              Distribución porcentual por estamento UA
            </p>
          </div>

          <div className="h-[200px] relative flex items-center justify-center">
            {totalVisits > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color === '#1E1E24' ? '#5E5E66' : entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${Number(value).toLocaleString('es-CL')} accesos`}
                    contentStyle={{ backgroundColor: '#1E1E24', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[#A0A0A5] text-sm">Sin datos demográficos</div>
            )}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xs text-[#A0A0A5] font-bold uppercase tracking-widest">{targetFacility === 'Todos' ? 'Global' : 'Sector'}</span>
              <span className="text-2xl font-black text-white">{totalVisits.toLocaleString('es-CL')}</span>
            </div>
          </div>

          {/* Custom Legends */}
          <div className="grid grid-cols-3 gap-1 pt-4 border-t border-white/5 text-center">
            {pieData.map((item, idx) => {
              const displayColor = item.color === '#1E1E24' ? '#5E5E66' : item.color;
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: displayColor }} />
                    <span className="text-[10px] text-zinc-400 font-extrabold truncate max-w-[85px] uppercase">
                      {item.name === 'Familiar de Funcionario' ? 'Familiar' : item.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-white">
                    {totalVisits ? ((item.value / totalVisits) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Facilities Comparative Bar Chart */}
      <div className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              {targetFacility === 'Todos' 
                ? 'Carga Comparativa por Instalación Central' 
                : `Carga Interna: ${targetFacility}`}
            </h2>
            <p className="text-xs text-[#A0A0A5] mt-0.5">
              {targetFacility === 'Todos' 
                ? 'Volumen global de accesos y reservas cruzadas' 
                : 'Distribución de accesos por sub-sala o tipo de uso'}
            </p>
          </div>
          <div className="flex bg-zinc-950 p-1 rounded-xl self-start border border-white/5">
            <span className="text-[11px] text-zinc-300 font-bold px-3 py-1.5 bg-zinc-900 rounded-lg border border-white/5 shadow-sm flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-[#D32F2F]" /> Total de Accesos Convalidados
            </span>
          </div>
        </div>

        <div className="h-[250px] w-full">
          {totalVisits > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFacilitiesData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#A0A0A5" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#A0A0A5" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} 
                  contentStyle={{ backgroundColor: '#1E1E24', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <Bar 
                  dataKey="Visitas" 
                  radius={[12, 12, 0, 0]} 
                  barSize={50}
                >
                  {chartFacilitiesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[#A0A0A5] text-sm">
              Sin datos de instalaciones disponibles.
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
}
