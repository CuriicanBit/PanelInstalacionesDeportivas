import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Sparkles, 
  CheckSquare, 
  HelpCircle, 
  Info,
  Layers,
  ArrowRight,
  MapPin,
  Flame,
  ShieldCheck,
  Calendar
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
  Legend
} from 'recharts';
import { AttendanceRecord, MainFacility, UserType } from '../types';
import { useDataService } from '../context/DataContext';

interface FacilitiesTabProps {
  records: AttendanceRecord[];
}

export default function FacilitiesTab({ records }: FacilitiesTabProps) {
  const { warnings } = useDataService();
  const [selectedFacility, setSelectedFacility] = useState<MainFacility>('Sala de Musculación');
  const [gymDrilldown, setGymDrilldown] = useState<'Unified' | 'Alumnos' | 'Funcionarios'>('Unified');

  // Filter records for the selected facility
  const facilityRecords = records.filter(r => r.facility === selectedFacility);
  const totalVisits = facilityRecords.length;

  // Demographics
  const fAlumnos = facilityRecords.filter(r => r.userType === 'Alumnos').length;
  const fFuncionarios = facilityRecords.filter(r => r.userType === 'Funcionarios').length;
  const fFamiliares = facilityRecords.filter(r => r.userType === 'Familiar de Funcionario').length;

  // Selected facility Peak Hour of day (hour with highest count)
  const facHourCounts: { [key: number]: number } = {};
  facilityRecords.forEach(r => {
    facHourCounts[r.hour] = (facHourCounts[r.hour] || 0) + 1;
  });
  let facPeakHour = -1;
  let facMaxHourCount = 0;
  Object.entries(facHourCounts).forEach(([h, count]) => {
    if (count > facMaxHourCount) {
      facMaxHourCount = count;
      facPeakHour = Number(h);
    }
  });
  const facPeakHourStr = facPeakHour !== -1 ? `${String(facPeakHour).padStart(2, '0')}:00 h` : 'N/A';

  // Selected facility Peak Day of week (highest count)
  const facDayCounts: { [key: number]: number } = {};
  facilityRecords.forEach(r => {
    facDayCounts[r.dayOfWeek] = (facDayCounts[r.dayOfWeek] || 0) + 1;
  });
  let facPeakDay = -1;
  let facMaxDayCount = 0;
  Object.entries(facDayCounts).forEach(([d, count]) => {
    if (count > facMaxDayCount) {
      facMaxDayCount = count;
      facPeakDay = Number(d);
    }
  });
  const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const facPeakDayStr = facPeakDay !== -1 ? DAYS_ES[facPeakDay] : 'N/A';

  // --- 1. SPECIAL BUSINESS RULE: SGM (GIMNASIO) ---
  const gymAlumnosRecords = records.filter(r => r.facility === 'Sala de Musculación' && r.subFacility === 'Alumnos');
  const gymFuncionariosRecords = records.filter(r => r.facility === 'Sala de Musculación' && r.subFacility === 'Funcionarios');
  
  const gymAlumnosCount = gymAlumnosRecords.length;
  const gymFuncionariosCount = gymFuncionariosRecords.length;
  const gymFuncionariosOnlyCount = gymFuncionariosRecords.filter(r => r.userType === 'Funcionarios').length;
  const gymFamiliaresCount = gymFuncionariosRecords.filter(r => r.userType === 'Familiar de Funcionario').length;
  const gymUnifiedCount = gymAlumnosCount + gymFuncionariosCount;

  // Gym peak hour splits
  const gymAlumnosHourCounts: { [key: number]: number } = {};
  gymAlumnosRecords.forEach(r => {
    gymAlumnosHourCounts[r.hour] = (gymAlumnosHourCounts[r.hour] || 0) + 1;
  });
  let gymAlumnosPeakHour = -1;
  let gymAlumnosMaxHourCount = 0;
  Object.entries(gymAlumnosHourCounts).forEach(([h, count]) => {
    if (count > gymAlumnosMaxHourCount) {
      gymAlumnosMaxHourCount = count;
      gymAlumnosPeakHour = Number(h);
    }
  });
  const gymAlumnosPeakHourStr = gymAlumnosPeakHour !== -1 ? `${String(gymAlumnosPeakHour).padStart(2, '0')}:00 h` : 'N/A';

  const gymFuncionariosHourCounts: { [key: number]: number } = {};
  gymFuncionariosRecords.forEach(r => {
    gymFuncionariosHourCounts[r.hour] = (gymFuncionariosHourCounts[r.hour] || 0) + 1;
  });
  let gymFuncionariosPeakHour = -1;
  let gymFuncionariosMaxHourCount = 0;
  Object.entries(gymFuncionariosHourCounts).forEach(([h, count]) => {
    if (count > gymFuncionariosMaxHourCount) {
      gymFuncionariosMaxHourCount = count;
      gymFuncionariosPeakHour = Number(h);
    }
  });
  const gymFuncionariosPeakHourStr = gymFuncionariosPeakHour !== -1 ? `${String(gymFuncionariosPeakHour).padStart(2, '0')}:00 h` : 'N/A';

  // --- 2. CAMPUS ALAMEDA SUBDIVISIONS ---
  const subAlameda1 = records.filter(r => r.facility === 'Canchas Campus Alameda' && r.subFacility === 'Cancha 1').length;
  const subAlameda2 = records.filter(r => r.facility === 'Canchas Campus Alameda' && r.subFacility === 'Cancha 2').length;
  const subAlamedaMC = records.filter(r => r.facility === 'Canchas Campus Alameda' && r.subFacility === 'Multicancha').length;

  const alamedaSubdivisionData = [
    { name: 'Cancha 1', Visitas: subAlameda1, fill: '#D32F2F' },
    { name: 'Cancha 2', Visitas: subAlameda2, fill: '#FF5722' },
    { name: 'Multicancha', Visitas: subAlamedaMC, fill: '#FFC107' },
  ];

  // demographic pie visual layout
  const facDemoData = [
    { name: 'Alumnos', value: fAlumnos, color: '#D32F2F' },
    { name: 'Funcionarios', value: fFuncionarios, color: '#1E1E24' },
    { name: 'Familiares', value: fFamiliares, color: '#9E9E9E' },
  ].filter(d => d.value > 0);

  // facility details descriptions
  const getFacilityDescription = () => {
    switch (selectedFacility) {
      case 'Sala de Musculación':
        return 'Visualización consolidada en tiempo real a partir de los datos unificados del gimnasio (alumnos y personal dependiente).';
      case 'Cancha Campus Central':
        return 'Métricas operativas procesadas y actualizadas de forma automatizada mediante la lectura del repositorio de asistencias.';
      case 'Canchas Campus Alameda':
        return 'Desglose dinámico de reservas agregadas por sub-sectores y canchas, útil para la toma de decisiones espaciales.';
      default:
        return 'Distribución de accesos calculada a partir de los registros consolidados.';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Target Selector bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['Sala de Musculación', 'Cancha Campus Central', 'Canchas Campus Alameda'] as MainFacility[]).map((fac) => {
          const isActive = selectedFacility === fac;

          return (
            <button
              id={`btn-facility-selector-${fac.replace(/ /g, '-')}`}
              key={fac}
              onClick={() => setSelectedFacility(fac)}
              className={`p-5 rounded-3xl text-left transition-all duration-200 cursor-pointer transform active:scale-[0.98] border ${
                isActive
                  ? 'bg-[#2A2A32] text-white border-rose-500/30 shadow-xl shadow-rose-950/10'
                  : 'bg-[#2A2A32]/40 text-zinc-300 border-white/5 hover:border-zinc-700 hover:bg-[#2A2A32]/80 shadow-md'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                  isActive ? 'text-rose-500 font-black' : 'text-zinc-500'
                }`}>
                  INSTALACIÓN REQUERIDA
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#D32F2F] text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {fac === 'Sala de Musculación' ? 'Musculación' : fac === 'Cancha Campus Central' ? 'Campus Central' : 'Campus Alameda'}
                  </span>
                </span>
              </div>
              <h4 className="text-lg font-bold tracking-tight mt-2">{fac}</h4>
              <p className={`text-xs mt-1.5 ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {fac === 'Sala de Musculación' 
                  ? `${gymUnifiedCount.toLocaleString('es-CL')} accesos unificados`
                  : fac === 'Cancha Campus Central'
                    ? `${records.filter(r => r.facility === 'Cancha Campus Central').length.toLocaleString('es-CL')} accesos totales`
                    : `${records.filter(r => r.facility === 'Canchas Campus Alameda').length.toLocaleString('es-CL')} reservas registradas`
                }
              </p>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedFacility}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          
          {/* LEFT: Structural Info Panel & Demography */}
          <div className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between lg:col-span-1 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4.5 w-4.5 text-[#D32F2F]" />
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#D32F2F]">Universidad Autónoma</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-3">
                {selectedFacility}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                {getFacilityDescription()}
              </p>
            </div>

            {/* Demographics Circular Panel */}
            <div className="pt-6 border-t border-white/5">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#A0A0A5] block mb-4">
                Estamento Asistente
              </span>
              <div className="flex items-center gap-6 justify-between">
                <div className="h-[120px] w-[120px] relative">
                  {totalVisits > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={facDemoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          dataKey="value"
                        >
                          {facDemoData.map((e, i) => (
                            <Cell key={`cell-${i}`} fill={e.color === '#1E1E24' ? '#5E5E66' : e.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#A0A0A5]">Sin datos</div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  {facDemoData.map((item, idx) => {
                    const displayColor = item.color === '#1E1E24' ? '#5E5E66' : item.color;
                    return (
                      <div key={idx} className="flex justify-between items-center bg-[#1E1E24]/60 px-3 py-1.5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: displayColor }} />
                          <span className="text-[11px] text-zinc-400 font-extrabold truncate uppercase">{item.name === 'Familiar de Funcionario' ? 'Familiar' : item.name}</span>
                        </div>
                        <span className="text-xs font-black text-white">
                          {totalVisits ? ((item.value / totalVisits) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Attendance Details Metrics */}
            <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="bg-[#1E1E24]/60 p-4 rounded-2xl border border-white/5">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#A0A0A5] block">Total Visitas</span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {totalVisits.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="bg-[#1E1E24]/60 p-4 rounded-2xl border border-white/5">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#A0A0A5] block">Hora de Más Uso</span>
                <span className="text-xl font-black text-white mt-1 block">
                  {facPeakHourStr}
                </span>
              </div>
            </div>
          </div>

          {/* MIDDLE & RIGHT: Content Customizers based on Business Rules */}
          <div className="bg-[#2A2A32] rounded-3xl p-6 border border-white/5 shadow-xl lg:col-span-2 flex flex-col justify-between min-h-[450px]">
            
            {/* CONDITIONAL COMPONENT 1: SALA DE MUSCULACIÓN (GIMNASIO) TRACKING DRILL-DOWN */}
            {selectedFacility === 'Sala de Musculación' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-4 pb-4 border-b border-white/5">
                    <div>
                      <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                        <Layers className="h-5 w-5 text-[#D32F2F]" />
                        Análisis de Canales de Marcación
                      </h3>
                      <p className="text-xs text-[#A0A0A5] mt-0.5">
                        [REGLA DE NEGOCIO] Marcación segregada unificada
                      </p>
                    </div>
                    
                    {/* Segment Switcher controls */}
                    <div className="flex bg-[#1E1E24] p-1 rounded-2xl border border-white/5">
                      {(['Unified', 'Alumnos', 'Funcionarios'] as const).map((mode) => (
                        <button
                          id={`btn-gym-drill-${mode}`}
                          key={mode}
                          onClick={() => setGymDrilldown(mode)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 transform active:scale-95 cursor-pointer ${
                            gymDrilldown === mode
                              ? 'bg-[#D32F2F] text-white shadow-md'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {mode === 'Unified' ? 'Consolidado' : mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                    {/* Left: Interactive Card explanation */}
                    <div className="bg-[#1E1E24] text-white p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
                      <div className="relative">
                        <h4 className="text-base font-bold text-white tracking-tight">Marcaciones</h4>
                        <div className="mt-5 space-y-2 text-xs">
                          <div className="flex items-center gap-2 bg-zinc-950/50 p-2.5 rounded-xl border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="text-zinc-300 font-medium">Marcaciones Alumnos: <b className="text-[#ff4b4b] font-bold">{gymAlumnosCount.toLocaleString('es-CL')}</b></span>
                          </div>
                          <div className="flex items-center gap-2 bg-zinc-950/50 p-2.5 rounded-xl border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="text-zinc-300 font-medium">Marcaciones Funcionarios: <b className="text-white font-bold">{gymFuncionariosOnlyCount.toLocaleString('es-CL')}</b></span>
                          </div>
                          <div className="flex items-center gap-2 bg-zinc-950/50 p-2.5 rounded-xl border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="text-zinc-300 font-medium">Marcaciones Familiares de Funcionarios: <b className="text-white font-bold">{gymFamiliaresCount.toLocaleString('es-CL')}</b></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Comparative analytics widgets based on Drilldown Mode */}
                    <div className="flex flex-col justify-center space-y-4">
                      {gymDrilldown === 'Unified' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <div className="p-4 rounded-2xl bg-[#1E1E24]/60 border border-white/5">
                            <span className="text-[10px] uppercase font-extrabold text-[#A0A0A5] block tracking-widest">Asistencia Unificada</span>
                            <span className="text-3xl font-black text-white tracking-tight mt-1 mb-1 block">
                              {gymUnifiedCount.toLocaleString('es-CL')} <span className="text-sm font-medium text-zinc-500">accesos</span>
                            </span>
                            <p className="text-xs text-zinc-400 font-medium">Canal consolidado global</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-2xl bg-[#1E1E24]/60 border border-white/5 text-center">
                              <span className="text-[9px] font-extrabold text-zinc-400 tracking-widest uppercase block">Ratio Alumnos</span>
                              <span className="text-lg font-black text-white block mt-1">
                                {gymUnifiedCount ? ((gymAlumnosCount / gymUnifiedCount) * 100).toFixed(0) : 0}%
                              </span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-[#1E1E24]/60 border border-white/5 text-center">
                              <span className="text-[9px] font-extrabold text-zinc-400 tracking-widest uppercase block">Ratio Funcionarios</span>
                              <span className="text-lg font-black text-white block mt-1">
                                {gymUnifiedCount ? ((gymFuncionariosCount / gymUnifiedCount) * 100).toFixed(0) : 0}%
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {gymDrilldown === 'Alumnos' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-2xl bg-[#D32F2F]/10 border border-[#D32F2F]/20 space-y-3">
                          <span className="text-[10px] uppercase font-extrabold text-rose-400 tracking-widest block">Sincronización de Estudiantes</span>
                          <h4 className="text-2xl font-black text-white tracking-tight">{gymAlumnosCount.toLocaleString('es-CL')} Ingresos</h4>
                          <p className="text-xs text-zinc-300 leading-normal">
                            Asistencias obtenidas a través de la integración en vivo con la planilla Google Sheets publicada en formato CSV. Los registros cuentan con un tiempo de desfase máximo de 5 minutos, correspondiente al intervalo de propagación de datos y actualización en la nube de Google.
                          </p>
                          <div className="text-xs bg-[#D32F2F]/20 px-3.5 py-2.5 rounded-xl text-[#ff5b5b] font-semibold">
                            Horario Punta de Demanda: {gymAlumnosPeakHourStr}
                          </div>
                        </motion.div>
                      )}

                      {gymDrilldown === 'Funcionarios' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-2xl bg-zinc-950/60 text-zinc-100 border border-white/5 space-y-3">
                          <span className="text-[10px] uppercase font-extrabold text-rose-500 tracking-widest block">Sincronización Personal / Staff</span>
                          <h4 className="text-2xl font-black text-white tracking-tight">{gymFuncionariosCount.toLocaleString('es-CL')} Registros</h4>
                          <p className="text-xs text-zinc-400 leading-normal">
                            Marcaciones recuperadas mediante actualización programada desde el feed web CSV de Google Sheets. Gracias a esta arquitectura cloud, el desfase entre las asistencias tomadas físicamente y su integración en este panel está garantizado por debajo de los 5 minutos sin requerir sistemas intermediarios.
                          </p>
                          <div className="text-xs bg-zinc-900/60 px-3.5 py-2.5 rounded-xl text-zinc-100 font-semibold border border-white/5">
                            Horario Punta de Demanda: {gymFuncionariosPeakHourStr}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3 mt-6">
                  <span className="bg-[#D32F2F] text-white text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded shrink-0 mt-0.5">Nota</span>
                  <p className="text-xs text-orange-300 leading-relaxed font-semibold">
                    Los accesos consolidados de la Sala de Musculación se extraen periódicamente desde la base de datos distribuida en Google Sheets (origen CSV). El sistema unifica de forma autónoma los registros de alumnos y personal funcionario en la nube, con un desfase máximo garantizado de 5 minutos.
                  </p>
                </div>
              </div>
            )}

            {/* CONDITIONAL COMPONENT 2: CANCHA CAMPUS CENTRAL */}
            {selectedFacility === 'Cancha Campus Central' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="pb-4 border-b border-white/5 font-bold">
                    <h3 className="text-lg font-extrabold text-white tracking-tight animate-fade-in">
                      Carga Operativa Campus Central
                    </h3>
                    <p className="text-xs text-[#A0A0A5] mt-0.5">
                      Seguimiento de uso en cancha sintética principal
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                    {/* Left stats */}
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl bg-[#1E1E24]/60 border border-white/5 relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-y-4 translate-x-4 text-zinc-800">
                          <Calendar className="h-28 w-28 opacity-25" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Día de Mayor Uso</span>
                        <h4 className="text-2xl font-black text-white tracking-tight mt-1">{facPeakDayStr}</h4>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                          Día de la semana con mayor concentración de reservas y asistencias validadas para este recinto deportivo.
                        </p>
                      </div>

                      <div className="p-5 rounded-3xl bg-[#1E1E24]/60 border border-white/5 space-y-3">
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block">Comportamiento Demográfico</span>
                        
                        <div className="space-y-2.5">
                          {/* Alumnos */}
                          <div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-zinc-400">Alumnos</span>
                              <span className="font-black text-white">{((fAlumnos / (totalVisits || 1)) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-zinc-950/40 h-1.5 rounded-full mt-1 relative overflow-hidden">
                              <div className="bg-[#D32F2F] h-full transition-all duration-300" style={{ width: `${(fAlumnos / (totalVisits || 1)) * 100}%` }} />
                            </div>
                          </div>

                          {/* Funcionarios */}
                          <div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-zinc-400">Funcionarios</span>
                              <span className="font-black text-white">{((fFuncionarios / (totalVisits || 1)) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-zinc-950/40 h-1.5 rounded-full mt-1 relative overflow-hidden">
                              <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${(fFuncionarios / (totalVisits || 1)) * 100}%` }} />
                            </div>
                          </div>

                          {/* Familiares */}
                          <div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-zinc-400">Familiares</span>
                              <span className="font-black text-white">{((fFamiliares / (totalVisits || 1)) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-zinc-950/40 h-1.5 rounded-full mt-1 relative overflow-hidden">
                              <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${(fFamiliares / (totalVisits || 1)) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right summary info */}
                    <div className="p-6 bg-[#16161B] text-zinc-100 rounded-3xl border border-white/5 flex flex-col justify-between relative overflow-hidden h-full min-h-[196px]">
                      <div className="absolute right-0 bottom-0 text-zinc-800/10 translate-x-4 translate-y-4 pointer-events-none">
                        <Flame className="h-28 w-28 text-orange-500 opacity-20 animate-pulse" />
                      </div>
                      
                      <div className="relative">
                        <span className="text-rose-500 text-[10px] uppercase font-black tracking-widest block mb-1">MÉTRICA DESTACADA</span>
                        <h4 className="text-lg font-bold tracking-tight text-white mb-1">Carga por Temporada</h4>
                        
                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-zinc-400">Nivel de Carga:</span>
                              <span className={`font-black ${totalVisits > 50 ? 'text-red-400' : totalVisits > 15 ? 'text-amber-400' : 'text-teal-400'}`}>
                                {totalVisits > 50 ? 'Alta' : totalVisits > 15 ? 'Moderada' : 'Baja'} ({totalVisits} usos)
                              </span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${totalVisits > 50 ? 'bg-red-500' : totalVisits > 15 ? 'bg-amber-500' : 'bg-teal-500'}`}
                                style={{ width: `${Math.min(100, Math.max(5, (totalVisits / 80) * 100))}%` }} 
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400">Hora de Mayor Demanda:</span>
                            <span className="font-extrabold text-white bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                              {facPeakHourStr}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-500 leading-normal mt-4 border-t border-white/5 pt-3 pr-2">
                        Esta métrica consolida el total de {totalVisits} registros de la planilla. Si ve una carga baja, es debido a la cantidad actual de reservas en su planilla base de Google Sheets.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3 mt-6">
                  <span className="bg-[#D32F2F] text-white text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded shrink-0 mt-0.5">Nota</span>
                  <p className="text-xs text-teal-300 leading-relaxed font-semibold">
                    Las métricas de carga del Campus Central se sincronizan mediante la planilla de Google Sheets (formato CSV) procesada en la nube. Esta sincronización directa garantiza que la afluencia de reservas y asistencias físicas registradas se refleje en este panel con un desfase máximo de 5 minutos.
                  </p>
                </div>
              </div>
            )}

            {/* CONDITIONAL COMPONENT 3: CANCHAS CAMPUS ALAMEDA */}
            {selectedFacility === 'Canchas Campus Alameda' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="pb-4 border-b border-white/5">
                    <h3 className="text-lg font-extrabold text-white tracking-tight animate-fade-in">
                      Carga Comparativa Sub-Recintos Alameda
                    </h3>
                    <p className="text-xs text-[#A0A0A5] mt-0.5">
                      Desglose de reservas en Cancha 1, Cancha 2, y Multicancha
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                    {/* Left: Interactive Recharts bar */}
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={alamedaSubdivisionData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                          <XAxis type="number" fontSize={11} stroke="#A0A0A5" axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" width={90} fontSize={10} stroke="#A0A0A5" axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="Visitas" radius={[0, 8, 8, 0]} barSize={20}>
                            {alamedaSubdivisionData.map((e, i) => (
                              <Cell key={`cell-${i}`} fill={e.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Right: Numeric distribution lists */}
                    <div className="space-y-2.5 flex flex-col justify-center">
                      <div className="p-3 bg-[#1E1E24]/60 rounded-xl border border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-[#D32F2F] rounded-full" />
                          <span className="text-xs font-bold text-zinc-300 font-medium">Cancha 1</span>
                        </div>
                        <span className="text-sm font-black text-white">{subAlameda1.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="p-3 bg-[#1E1E24]/60 rounded-xl border border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-[#FF5722] rounded-full" />
                          <span className="text-xs font-bold text-zinc-300 font-medium">Cancha 2</span>
                        </div>
                        <span className="text-sm font-black text-white">{subAlameda2.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="p-3 bg-[#1E1E24]/60 rounded-xl border border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-[#FFC107] rounded-full" />
                          <span className="text-xs font-bold text-zinc-300 font-medium">Multicancha</span>
                        </div>
                        <span className="text-sm font-black text-white">{subAlamedaMC.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3 mt-6">
                  <span className="bg-[#D32F2F] text-white text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded shrink-0 mt-0.5">Nota</span>
                  <p className="text-xs text-orange-300 leading-relaxed font-semibold">
                    Los datos de Campus Alameda se obtienen directamente mediante la sincronización automática de la planilla Google Sheets publicada en formato CSV. El desfase de actualización de estos registros físicos a nivel cloud es de un máximo de 5 minutos, garantizando un flujo constante sin intermediarios.
                  </p>
                </div>
              </div>
            )}

          </div>

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
