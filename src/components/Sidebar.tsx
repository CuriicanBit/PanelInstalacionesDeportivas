import React from 'react';
import { LayoutDashboard, Compass, Hourglass, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReportModal: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onOpenReportModal }: SidebarProps) {
  
  const menuItems = [
    {
      id: 'overview',
      label: 'Vista General de KPIs',
      icon: LayoutDashboard,
      desc: 'Supervisión cruzada consolidada',
    },
    {
      id: 'facilities',
      label: 'Análisis de Instalaciones',
      icon: Compass,
      desc: 'Desglose detallado por recinto',
    },
    {
      id: 'density',
      label: 'Densidad y Horarios',
      icon: Hourglass,
      desc: 'Bloques y mapas de asistencia',
    },
  ];

  return (
    <aside id="bi-sidebar" className="w-[320px] bg-[#1E1E24] text-white border-r border-zinc-800 flex flex-col justify-between shrink-0 h-full relative">
      <div>
        {/* Campus Location Segment */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs uppercase font-extrabold text-zinc-400 tracking-widest">
              SISTEMA CRÍTICO TI ACTIVO
            </span>
          </div>
          <div className="mt-3 text-lg font-black text-rose-500 tracking-tight">
            Sede Regional Talca
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-0.5">
            Integrando Campus Alameda y Central
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-4 flex flex-col gap-1.5">
          <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest pl-2 mb-2">
            Módulos Analíticos
          </span>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`sidebar-tab-${item.id}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 group flex items-start gap-4 transform active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? 'bg-[#D32F2F] text-white shadow-xl shadow-[#D32F2F]/10 border border-[#ff4747]/20 font-bold'
                    : 'hover:bg-zinc-800/80 text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${
                  isActive ? 'text-white' : 'text-zinc-500 group-hover:text-white transition-all'
                }`} />
                <div>
                  <div className="text-xs font-bold leading-normal tracking-wide">
                    {item.label}
                  </div>
                  <div className={`text-[10px] mt-0.5 leading-normal ${
                    isActive ? 'text-[#ffb3b3]' : 'text-zinc-500 group-hover:text-zinc-400'
                  }`}>
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}

          <div className="border-t border-zinc-800/80 my-4" />

          {/* Prompt Report Access Button */}
          <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest pl-2 mb-2">
            Acciones Especiales
          </span>

          <button
            id="btn-open-report-sidebar"
            onClick={onOpenReportModal}
            className="w-full text-left p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-850 text-zinc-300 hover:text-white transition-all cursor-pointer transform active:scale-[0.98] flex items-start gap-4 shadow-sm"
          >
            <div className="bg-[#D32F2F]/10 p-2 rounded-lg text-[#ff4040]">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide">Reporte Formal PDF</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Generar informe membretado</div>
            </div>
          </button>
        </div>
      </div>

      {/* Corporate TI Footer (MANDATORY RULE AUTHORSHIP) */}
      <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center gap-2.5 mb-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <div className="text-[10px] text-zinc-400 font-semibold tracking-wide">
            KPI Sync: <span className="text-emerald-400 font-bold">En Línea</span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-bold border-l-2 border-[#D32F2F] pl-3">
          Plataforma desarrollada por el <br />
          <span className="text-white hover:text-[#ff4747] transition-all">Departamento TI - Sede Talca</span>.
        </p>
        <p className="text-[9px] text-zinc-600 mt-2 tracking-widest uppercase">
          Universidad Autónoma © 2026
        </p>
      </div>
    </aside>
  );
}
