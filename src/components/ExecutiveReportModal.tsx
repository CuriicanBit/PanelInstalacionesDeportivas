import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Award,
  Calendar,
  Send
} from 'lucide-react';
import { AttendanceRecord, DashboardFilters } from '../types';
import { generateExecutiveSummaryText, exportToPdf, exportToExcel } from '../utils/exportUtils';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  filters: DashboardFilters;
}

export default function ExecutiveReportModal({ isOpen, onClose, records, filters }: ExecutiveReportModalProps) {
  if (!isOpen) return null;

  // Compute stats needed for report
  const totalVisits = records.length;
  const totals = {
    gimnasio: records.filter(r => r.facility === 'Sala de Musculación').length,
    central: records.filter(r => r.facility === 'Cancha Campus Central').length,
    alameda: records.filter(r => r.facility === 'Canchas Campus Alameda').length,
    total: totalVisits
  };

  const demo = {
    alumnos: records.filter(r => r.userType === 'Alumnos').length,
    funcionarios: records.filter(r => r.userType === 'Funcionarios').length,
    familiares: records.filter(r => r.userType === 'Familiar de Funcionario').length,
  };

  const executiveSummary = generateExecutiveSummaryText(records, filters, totals, demo);

  const handleDownloadPdf = () => {
    exportToPdf(records, filters, totals, demo);
  };

  const handleDownloadExcel = () => {
    exportToExcel(records, filters);
  };

  return (
    <AnimatePresence>
      <div id="report-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        
        {/* Animated modal box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#2A2A32] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative border border-white/5"
        >
          {/* Top colored accent */}
          <div className="h-1.5 bg-[#D32F2F] w-full" />

          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#1E1E24]/40">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#D32F2F]" />
              <div>
                <h2 className="text-lg font-extrabold text-white tracking-tight">Centro de Reportes Ejecutivos</h2>
                <p className="text-xs text-[#A0A0A5] font-medium">Universidad Autónoma de Chile · Departamento TI Sede Talca</p>
              </div>
            </div>
            
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all transform active:scale-95 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#2A2A32]">
            
            {/* Warning / Notification for directors */}
            <div className="bg-[#D32F2F]/10 border border-[#D32F2F]/20 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[#D32F2F] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-rose-500 uppercase tracking-wide">COMPILACIÓN FORMAL DE ESTADÍSTICAS</h4>
                <p className="text-xs text-zinc-300 leading-relaxed mt-1 font-medium">
                  Este módulo consolida y formatea las métricas filtradas en un formato ejecutivo oficial. Los archivos generados cumplen con las normativas de auditoría interna de la Sede regional Talca para la justificación y planificación presupuestaria de infraestructuras en el período 2025/2026.
                </p>
              </div>
            </div>

            {/* Simulated Live Report Preview */}
            <div className="bg-[#1E1E24] border border-white/5 rounded-2xl p-6 space-y-5 relative font-serif">
              {/* Draft watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                <span className="text-6xl font-black text-white tracking-widest uppercase rotate-12">BORRADOR TI</span>
              </div>

              {/* Membrane */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xs font-bold font-sans text-[#D32F2F] tracking-wide">UNIVERSIDAD AUTÓNOMA DE CHILE</h3>
                  <p className="text-[9px] font-sans text-[#A0A0A5] mt-0.5 uppercase tracking-widest font-semibold">Dirección de Deportes • Sede Regional Talca</p>
                </div>
                <div className="text-right text-[9px] font-sans text-zinc-400 space-y-0.5">
                  <p>CÓDIGO DE CONTROL: TI-DEP-TAL-2026</p>
                  <p className="font-bold text-zinc-300">FECHA: {new Date().toLocaleDateString('es-CL')}</p>
                </div>
              </div>

              {/* Title inside report */}
              <div className="text-center py-2 space-y-1">
                <h1 className="text-sm font-bold font-sans uppercase tracking-tight text-white">
                  DOCUMENTO ADJUNTO: GLOSA ESTADÍSTICA DE RECINTOS DEPORTIVOS
                </h1>
                <p className="text-[10px] font-sans text-[#D32F2F] font-bold">
                  RANGO EVALUADO: {filters.startDate} AL {filters.endDate}
                </p>
              </div>

              {/* Automated dynamic narrative */}
              <div className="text-xs text-zinc-200 leading-relaxed bg-[#2A2A32]/65 p-4.5 rounded-xl border border-white/5 italic shadow-inner">
                {executiveSummary}
              </div>

              {/* Footer inside report template */}
              <div className="grid grid-cols-2 pt-6 text-[9px] font-sans text-zinc-400 text-center">
                <div className="border-t border-dashed border-white/10 pt-3">
                  <p className="font-bold text-zinc-350 text-zinc-200">Comité de Dirección</p>
                  <p>Dirección de Deportes Sede Regional</p>
                </div>
                <div className="border-t border-dashed border-white/10 pt-3">
                  <p className="font-bold text-zinc-350 text-zinc-200">Departamento de Auditoría TI</p>
                  <p>Soporte de Sistemas de Información</p>
                </div>
              </div>
            </div>

            {/* Quick stats grid inside modal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
              <div className="p-4 rounded-2xl bg-[#1E1E24]/60 border border-white/5 text-center">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">Registros Capturados</span>
                <span className="text-xl font-black text-white block mt-1">{totalVisits.toLocaleString('es-CL')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#1E1E24]/60 border border-white/5 text-center">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">Sala de Musculación</span>
                <span className="text-xl font-black text-[#D32F2F] block mt-1">{totals.gimnasio.toLocaleString('es-CL')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#1E1E24]/60 border border-white/5 text-center">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">Campus Alameda</span>
                <span className="text-xl font-black text-white block mt-1">{totals.alameda.toLocaleString('es-CL')}</span>
              </div>
            </div>

          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 bg-[#1E1E24] border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-4">
            
            <div className="text-xs text-zinc-400 font-semibold text-center sm:text-left">
              Seleccione el formato oficial de exportación para su descarga inmediata:
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Excel Download button */}
              <button
                id="btn-download-excel"
                onClick={handleDownloadExcel}
                className="bg-[#2A2A32] hover:bg-zinc-800 text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-bold tracking-wide shadow-md cursor-pointer transition-all duration-150 transform active:scale-95 border border-white/5"
              >
                <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-400" />
                Exportar a Excel (.xlsx)
              </button>

              {/* PDF Download button */}
              <button
                id="btn-download-pdf"
                onClick={handleDownloadPdf}
                className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-bold tracking-wide shadow-lg cursor-pointer shadow-[#D32F2F]/20 transition-all duration-150 transform active:scale-95 border border-rose-500/10"
              >
                <FileText className="h-4.5 w-4.5 text-white" />
                Exportar a PDF (Reporte Formal)
              </button>
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
