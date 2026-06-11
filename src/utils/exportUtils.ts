import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { AttendanceRecord, MainFacility, DashboardFilters } from '../types';

// Map day numbers to Spanish names
const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Generate text narrative dynamically based on filters and computed KPIs
export function generateExecutiveSummaryText(
  records: AttendanceRecord[],
  filters: DashboardFilters,
  totals: {
    gimnasio: number;
    central: number;
    alameda: number;
    total: number;
  },
  demo: {
    alumnos: number;
    funcionarios: number;
    familiares: number;
  }
): string {
  if (records.length === 0) {
    return 'No se registran datos para el período y segmentación seleccionados en los recintos deportivos.';
  }

  const startDateStr = formatDateToEs(filters.startDate);
  const endDateStr = formatDateToEs(filters.endDate);

  // Gym breakdown
  const gymAlumnos = records.filter(r => r.facility === 'Sala de Musculación' && r.subFacility === 'Alumnos').length;
  const gymFuncionarios = records.filter(r => r.facility === 'Sala de Musculación' && r.subFacility === 'Funcionarios').length;
  
  // Calculate top facility
  const facilitiesCount = [
    { name: 'Sala de Musculación', total: totals.gimnasio },
    { name: 'Cancha Campus Central', total: totals.central },
    { name: 'Canchas Campus Alameda', total: totals.alameda }
  ].sort((a, b) => b.total - a.total);

  const primaryFacility = facilitiesCount[0];
  const primaryPct = ((primaryFacility.total / records.length) * 100).toFixed(1);

  // Peak Hour check across all facilities
  const hourCounts: { [key: number]: number } = {};
  records.forEach(r => {
    hourCounts[r.hour] = (hourCounts[r.hour] || 0) + 1;
  });
  let peakHour = 18;
  let maxHourCount = 0;
  Object.keys(hourCounts).forEach(h => {
    const hr = Number(h);
    if (hourCounts[hr] > maxHourCount) {
      maxHourCount = hourCounts[hr];
      peakHour = hr;
    }
  });

  const peakHourStr = `${String(peakHour).padStart(2, '0')}:00 a ${String(peakHour + 1).padStart(2, '0')}:00 h`;

  // Alumnos represents X% of the metrics
  const alumnosPct = ((demo.alumnos / records.length) * 100).toFixed(1);
  const funcionariosPct = ((demo.funcionarios / records.length) * 100).toFixed(1);
  const familiaresPct = ((demo.familiares / records.length) * 100).toFixed(1);

  return `Este informe resume el comportamiento de uso de la infraestructura deportiva de la Universidad Autónoma entre el ${startDateStr} y el ${endDateStr}. Durante este período, se registraron un total de ${records.length.toLocaleString('es-CL')} asistencias consolidadas. El recinto con mayor demanda fue ${primaryFacility.name}, concentrando el ${primaryPct}% de la afluencia total (${primaryFacility.total.toLocaleString('es-CL')} accesos). Cabe destacar que a nivel demográfico global, el estamento de Alumnos representa el ${alumnosPct}% de la participación, seguido por Funcionarios (${funcionariosPct}%) y un sector de Familiares de Funcionarios (${familiaresPct}%). El bloque horario de mayor densidad operativa general se localizó de ${peakHourStr}. En particular, la Sala de Musculación (Gimnasio) unifica un KPI global de ${totals.gimnasio.toLocaleString('es-CL')} accesos, el cual se compone por ${gymAlumnos.toLocaleString('es-CL')} registros originados por alumnos y ${gymFuncionarios.toLocaleString('es-CL')} por el estamento funcionario. Esto demuestra un sano equilibrio en el uso del espacio saludable institucional.`;
}

function formatDateToEs(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${day} de ${months[parseInt(month, 10) - 1]} de ${year}`;
  } catch (e) {
    return dateStr;
  }
}

// EXPORT TO EXCEL (MULTI-SHEET WORKBOOK)
export function exportToExcel(records: AttendanceRecord[], filters: DashboardFilters) {
  const wb = XLSX.utils.book_new();

  // 1. Executive Sheet (Cover and KPI Summary)
  const totalVisits = records.length;
  const gymRecords = records.filter(r => r.facility === 'Sala de Musculación');
  const centralRecords = records.filter(r => r.facility === 'Cancha Campus Central');
  const alamedaRecords = records.filter(r => r.facility === 'Canchas Campus Alameda');

  const uAlumnos = records.filter(r => r.userType === 'Alumnos').length;
  const uFuncionarios = records.filter(r => r.userType === 'Funcionarios').length;
  const uFamiliares = records.filter(r => r.userType === 'Familiar de Funcionario').length;

  const gymAlumnos = gymRecords.filter(r => r.subFacility === 'Alumnos').length;
  const gymFuncionarios = gymRecords.filter(r => r.subFacility === 'Funcionarios').length;

  const summaryData = [
    { A: 'REPORTE ADMINISTRATIVO DE METRICAS Y KPIS - RECINTOS DEPORTIVOS' },
    { A: 'Universidad Autónoma de Chile - Sede Talca' },
    { A: `Generado el: ${new Date().toLocaleDateString('es-CL')}` },
    { A: `Rango de Fechas: ${filters.startDate} al ${filters.endDate}` },
    { A: `Filtro de Vinculo: ${filters.userType}` },
    { A: '' },
    { A: 'METRICAS GLOBALES CONSOLIDADAS' },
    { A: 'Concepto KPI', B: 'Métrica/Valor', C: 'Distribución %' },
    { A: 'Total de Visitas Registradas', B: totalVisits, C: '100.0%' },
    { A: '- Sala de Musculación (Gym)', B: gymRecords.length, C: totalVisits ? `${((gymRecords.length / totalVisits) * 100).toFixed(1)}%` : '0%' },
    { A: '- Cancha Campus Central', B: centralRecords.length, C: totalVisits ? `${((centralRecords.length / totalVisits) * 100).toFixed(1)}%` : '0%' },
    { A: '- Canchas Campus Alameda', B: alamedaRecords.length, C: totalVisits ? `${((alamedaRecords.length / totalVisits) * 100).toFixed(1)}%` : '0%' },
    { A: '' },
    { A: 'SEGMENTACIÓN DEMOGRÁFICA INSTITUCIONAL' },
    { A: 'Estamento / Vínculo', B: 'Accesos Registrados', C: 'Distribución %' },
    { A: 'Alumnos (Pregrado/Postgrado)', B: uAlumnos, C: totalVisits ? `${((uAlumnos / totalVisits) * 100).toFixed(1)}%` : '0%' },
    { A: 'Funcionarios (Académicos/No Académicos)', B: uFuncionarios, C: totalVisits ? `${((uFuncionarios / totalVisits) * 100).toFixed(1)}%` : '0%' },
    { A: 'Familiar de Funcionario', B: uFamiliares, C: totalVisits ? `${((uFamiliares / totalVisits) * 100).toFixed(1)}%` : '0%' },
    { A: '' },
    { A: 'DESGLOSE CRITICO DE NEGOCIO - SALA DE MUSCULACIÓN' },
    { A: 'Mapeo de Control Registral - Gym', B: 'Cantidad de Marcaciones', C: 'Porcentajes' },
    { A: 'Acceso Alumnos (Vía Torniquete/NFC)', B: gymAlumnos, C: gymRecords.length ? `${((gymAlumnos / gymRecords.length) * 100).toFixed(1)}%` : '0%' },
    { A: 'Acceso Funcionarios (Marcación Reloj/Asistencia Staff)', B: gymFuncionarios, C: gymRecords.length ? `${((gymFuncionarios / gymRecords.length) * 100).toFixed(1)}%` : '0%' },
    { A: '' },
    { A: 'Plataforma desarrollada por el Departamento TI - Sede Talca. Universidad Autónoma.' },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });

  // Columns sizing for summary
  wsSummary['!cols'] = [
    { wch: 45 },
    { wch: 30 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen General');

  // Helper mapping function for record sheets
  const mapRecordData = (recs: AttendanceRecord[]) => {
    return recs.map(r => ({
      'ID Registro': r.id,
      'Fecha': r.date,
      'Hora de Ingreso': `${String(r.hour).padStart(2, '0')}:00`,
      'Día de la Semana': DAYS_ES[r.dayOfWeek],
      'Recinto Principal': r.facility,
      'Sub-Instalación': r.subFacility,
      'Vínculo de Usuario': r.userType,
      'Duración (Minutos)': r.durationMinutes,
    }));
  };

  // 2. Gym Sheet
  const wsGym = XLSX.utils.json_to_sheet(mapRecordData(gymRecords));
  XLSX.utils.book_append_sheet(wb, wsGym, 'Gimnasio Musculación');

  // 3. Central campus Sheet
  const wsCentral = XLSX.utils.json_to_sheet(mapRecordData(centralRecords));
  XLSX.utils.book_append_sheet(wb, wsCentral, 'Cancha Campus Central');

  // 4. Alameda Sheet
  const wsAlameda = XLSX.utils.json_to_sheet(mapRecordData(alamedaRecords));
  XLSX.utils.book_append_sheet(wb, wsAlameda, 'Canchas Campus Alameda');

  // Trigger download file
  XLSX.writeFile(wb, `Reporte_Deportivo_UA_${filters.startDate}_al_${filters.endDate}.xlsx`);
}

// EXPORT TO EXECUTIVE PDF (FORMAL REPORT)
export function exportToPdf(
  records: AttendanceRecord[], 
  filters: DashboardFilters,
  totals: {
    gimnasio: number;
    central: number;
    alameda: number;
    total: number;
  },
  demo: {
    alumnos: number;
    funcionarios: number;
    familiares: number;
  }
) {
  // A4 dimensions: 210mm x 297mm
  const doc = new jsPDF('p', 'mm', 'a4');
  const startY = 15;
  let currentY = startY;

  // Colors
  const RED_PRIMARY = [211, 47, 47]; // #D32F2F Universidad Autónoma Red
  const TEXT_DARK = [30, 30, 36];     // #1E1E24 Executive Charcoal
  const TEXT_LIGHT_GRAY = [100, 100, 110];
  const GRAY_BG = [245, 245, 247];

  // Helper function to draw dynamic headers with horizontal line
  const drawPageAssets = (pageNum: number) => {
    // Left institutional Red Accent Band
    doc.setFillColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
    doc.rect(10, 10, 4, 277, 'F'); // vertical band

    // Institutional Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
    doc.text('UNIVERSIDAD AUTÓNOMA', 20, 16);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(TEXT_LIGHT_GRAY[0], TEXT_LIGHT_GRAY[1], TEXT_LIGHT_GRAY[2]);
    doc.text('Departamento TI | Dirección de Deportes Sede Talca', 20, 20);

    // Page number
    doc.text(`Página ${pageNum}`, 190, 16, { align: 'right' });

    // Thin grey border divider for header
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.3);
    doc.line(20, 22, 200, 22);
  };

  // ----- PAGE 1: TITLE & EXECUTIVE SUMMARY & CONSOLIDATED KPIS -----
  drawPageAssets(1);
  currentY = 32;

  // Document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text('INFORME ESTADÍSTICO DE GESTIÓN Y MÉTRICAS', 20, currentY);
  currentY += 6;

  doc.setFontSize(12);
  doc.setTextColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
  doc.text('SUPERVISIÓN DE INFRAESTRUCTURA Y RECINTOS DEPORTIVOS', 20, currentY);
  currentY += 8;

  // Metadata block
  doc.setFillColor(GRAY_BG[0], GRAY_BG[1], GRAY_BG[2]);
  doc.rect(20, currentY, 180, 22, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text('Período Analizado:', 25, currentY + 6);
  doc.text('Fecha Emisión:', 25, currentY + 11);
  doc.text('Estructura TI:', 25, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDateToEs(filters.startDate)} al ${formatDateToEs(filters.endDate)}`, 55, currentY + 6);
  doc.text(`${new Date().toLocaleDateString('es-CL')} | 21:12:06 UTC`, 55, currentY + 11);
  doc.text('Sistemas de Autenticación Unificada UA (Sede Talca)', 55, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Segmento de Filtro:', 125, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(filters.userType, 160, currentY + 6);
  currentY += 30;

  // 1. Resumen Ejecutivo Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
  doc.text('1. RESUMEN DE GESTIÓN ADMINISTRATIVA', 20, currentY);
  
  // Highlight line
  doc.setDrawColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
  doc.setLineWidth(0.5);
  doc.line(20, currentY + 2, 200, currentY + 2);
  currentY += 8;

  // Narrative Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  
  const narrative = generateExecutiveSummaryText(records, filters, totals, demo);
  const splitNarrative = doc.splitTextToSize(narrative, 180);
  doc.text(splitNarrative, 20, currentY);
  
  // Update currentY based on paragraph height (approx 1.25 spacing)
  currentY += (splitNarrative.length * 5) + 8;

  // 2. Consolidated Tables KPI Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
  doc.text('2. CUADRO DE MANDO CONSOLIDADO (KPI GLOBAL)', 20, currentY);
  
  doc.setDrawColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
  doc.line(20, currentY + 2, 200, currentY + 2);
  currentY += 8;

  // Table header
  doc.setFillColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.rect(20, currentY, 180, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Recinto Deportivo', 23, currentY + 5.5);
  doc.text('Visitas Totales', 85, currentY + 5.5, { align: 'right' });
  doc.text('% Alumnos', 115, currentY + 5.5, { align: 'right' });
  doc.text('% Funcionarios', 150, currentY + 5.5, { align: 'right' });
  doc.text('% Familiares', 195, currentY + 5.5, { align: 'right' });
  currentY += 8;

  // Recintos rows
  const tableData = [
    {
      name: 'Sala de Musculación (Gimnasio)',
      total: totals.gimnasio,
      alumnos: records.filter(r => r.facility === 'Sala de Musculación' && r.userType === 'Alumnos').length,
      funcionarios: records.filter(r => r.facility === 'Sala de Musculación' && r.userType === 'Funcionarios').length,
      familiares: records.filter(r => r.facility === 'Sala de Musculación' && r.userType === 'Familiar de Funcionario').length,
    },
    {
      name: 'Cancha Campus Central',
      total: totals.central,
      alumnos: records.filter(r => r.facility === 'Cancha Campus Central' && r.userType === 'Alumnos').length,
      funcionarios: records.filter(r => r.facility === 'Cancha Campus Central' && r.userType === 'Funcionarios').length,
      familiares: records.filter(r => r.facility === 'Cancha Campus Central' && r.userType === 'Familiar de Funcionario').length,
    },
    {
      name: 'Canchas Campus Alameda',
      total: totals.alameda,
      alumnos: records.filter(r => r.facility === 'Canchas Campus Alameda' && r.userType === 'Alumnos').length,
      funcionarios: records.filter(r => r.facility === 'Canchas Campus Alameda' && r.userType === 'Funcionarios').length,
      familiares: records.filter(r => r.facility === 'Canchas Campus Alameda' && r.userType === 'Familiar de Funcionario').length,
    }
  ];

  tableData.forEach((row, index) => {
    // Row background color (alternating)
    if (index % 2 === 1) {
      doc.setFillColor(GRAY_BG[0], GRAY_BG[1], GRAY_BG[2]);
      doc.rect(20, currentY, 180, 7.5, 'F');
    }

    // Border bottom
    doc.setDrawColor(230, 230, 235);
    doc.setLineWidth(0.2);
    doc.line(20, currentY + 7.5, 200, currentY + 7.5);

    // Text cells
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(row.name, 23, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(row.total.toLocaleString('es-CL'), 85, currentY + 5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    const alPct = row.total ? `${((row.alumnos / row.total) * 100).toFixed(1)}%` : '0.0%';
    const fuPct = row.total ? `${((row.funcionarios / row.total) * 100).toFixed(1)}%` : '0.0%';
    const faPct = row.total ? `${((row.familiares / row.total) * 100).toFixed(1)}%` : '0.0%';
    
    doc.text(alPct, 115, currentY + 5, { align: 'right' });
    doc.text(fuPct, 150, currentY + 5, { align: 'right' });
    doc.text(faPct, 195, currentY + 5, { align: 'right' });

    currentY += 7.5;
  });

  currentY += 12;

  // Add Page 2: Analytics by Facility & Demographics
  doc.addPage();
  drawPageAssets(2);
  currentY = 32;

  // Title page 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
  doc.text('3. DESGLOSE TÉCNICO Y REGISTROS CRÍTICOS', 20, currentY);
  
  doc.setDrawColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
  doc.line(20, currentY + 2, 200, currentY + 2);
  currentY += 8;

  // Explaining Gym Rule specifically in the report
  doc.setFillColor(255, 245, 245);
  doc.rect(20, currentY, 180, 20, 'F');
  
  doc.setDrawColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
  doc.setLineWidth(0.4);
  doc.rect(20, currentY, 180, 20, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
  doc.text('REGLA CRÍTICA DE GESTIÓN INDEPENDIENTE (SALA DE MUSCULACIÓN)', 23, currentY + 5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  const ruleTxt = 'Debido a los bloques horarios diferenciados, el gimnasio procesa por separado las asistencias del estamento "Alumnos" (vía torniquete) y "Funcionarios" (registro de staff). El motor de control unifica ambos flujos en un informe global consolidando la gestión total del espacio deportivo.';
  const splitRule = doc.splitTextToSize(ruleTxt, 172);
  doc.text(splitRule, 23, currentY + 9);
  currentY += 26;

  // Sub-Facility counts list (Canchas Alameda subdivision)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text('Mapeo de Sub-Instalaciones Campus Alameda:', 20, currentY);
  currentY += 5;

  const subAlamedaC1 = records.filter(r => r.facility === 'Canchas Campus Alameda' && r.subFacility === 'Cancha 1').length;
  const subAlamedaC2 = records.filter(r => r.facility === 'Canchas Campus Alameda' && r.subFacility === 'Cancha 2').length;
  const subAlamedaMC = records.filter(r => r.facility === 'Canchas Campus Alameda' && r.subFacility === 'Multicancha').length;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`- Cancha 1:   ${subAlamedaC1.toLocaleString('es-CL')} reservas (${totals.alameda ? ((subAlamedaC1/totals.alameda)*100).toFixed(1) : 0}%)`, 25, currentY + 1);
  doc.text(`- Cancha 2:   ${subAlamedaC2.toLocaleString('es-CL')} reservas (${totals.alameda ? ((subAlamedaC2/totals.alameda)*100).toFixed(1) : 0}%)`, 25, currentY + 5);
  doc.text(`- Multicancha: ${subAlamedaMC.toLocaleString('es-CL')} reservas (${totals.alameda ? ((subAlamedaMC/totals.alameda)*100).toFixed(1) : 0}%)`, 25, currentY + 9);
  currentY += 16;

  // Hourly statistics density table (Sample summary table)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text('Distribución de Densidad de Horas Críticas (Muestra General)', 20, currentY);
  currentY += 5;

  // Let's print some hourly densities (08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00)
  doc.setFillColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.rect(20, currentY, 180, 7, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Bloque Horario', 23, currentY + 4.5);
  doc.text('Visitas Totales', 75, currentY + 4.5, { align: 'right' });
  doc.text('% de Carga Operativa', 125, currentY + 4.5, { align: 'right' });
  doc.text('Medida de Seguridad', 195, currentY + 4.5, { align: 'right' });
  currentY += 7;

  const targetHours = [8, 10, 12, 14, 16, 18, 20, 21];
  targetHours.forEach((hour, index) => {
    const visitsAtHour = records.filter(r => r.hour === hour).length;
    const loadPct = records.length ? ((visitsAtHour / records.length) * 100) : 0;
    
    let advice = 'Aforo Holgado';
    if (loadPct > 15) advice = 'Supervisión Alta';
    else if (loadPct > 10) advice = 'Carga Normal / Media';

    if (index % 2 === 1) {
      doc.setFillColor(GRAY_BG[0], GRAY_BG[1], GRAY_BG[2]);
      doc.rect(20, currentY, 180, 6.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(`${String(hour).padStart(2, '0')}:00 a ${String(hour + 1).padStart(2, '0')}:00 h`, 23, currentY + 4.5);
    doc.text(visitsAtHour.toLocaleString('es-CL'), 75, currentY + 4.5, { align: 'right' });
    doc.text(`${loadPct.toFixed(1)}%`, 125, currentY + 4.5, { align: 'right' });
    
    if (loadPct > 15) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(RED_PRIMARY[0], RED_PRIMARY[1], RED_PRIMARY[2]);
    }
    doc.text(advice, 195, currentY + 4.5, { align: 'right' });
    
    currentY += 6.5;
  });

  currentY += 15;

  // Formal validation and Signatures at page footer
  doc.setDrawColor(200, 200, 205);
  doc.setLineWidth(0.4);
  doc.line(20, currentY, 200, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text('VALIDACIÓN DE CONTROL DE ASISTENCIAS TI - DEPORTES', 20, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_LIGHT_GRAY[0], TEXT_LIGHT_GRAY[1], TEXT_LIGHT_GRAY[2]);
  doc.text('Este documento digital cumple con los requisitos y sellos directivos de Auditoría Interna de la Universidad Autónoma de Chile.', 20, currentY);
  currentY += 16;

  // Columns for validation signatures
  const sigX1 = 45;
  const sigX2 = 145;
  
  // Signature line 1
  doc.setDrawColor(150, 150, 155);
  doc.line(sigX1, currentY, sigX1 + 50, currentY);
  doc.text('Director de Deportes y Recreación', sigX1 + 25, currentY + 4, { align: 'center' });
  doc.text('Universidad Autónoma de Chile', sigX1 + 25, currentY + 8, { align: 'center' });

  // Signature line 2
  doc.line(sigX2, currentY, sigX2 + 50, currentY);
  doc.text('Departamento de Auditoría TI', sigX2 + 25, currentY + 4, { align: 'center' });
  doc.text('Sede Regional de Talca', sigX2 + 25, currentY + 8, { align: 'center' });

  // Trigger download file
  doc.save(`Informe_Ejecutivo_Deportivo_UA_${filters.startDate}_al_${filters.endDate}.pdf`);
}
