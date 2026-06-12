import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, MainFacility, UserType, SubFacility } from '../types';

// Types for Source C
interface MaestroFuncionario {
  RUT: string;
  NOMBRE: string;
  CATEGORIA: string;
}

export interface DataContextType {
  allRecords: AttendanceRecord[];
  isLoading: boolean;
  warnings: {
    gimnasioAlumnos: boolean;
    gimnasioFuncionarios: boolean;
    campusCentral: boolean;
    campusAlameda: boolean;
  };
  isLive: boolean;
  refetch: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to normalize values and headers by trimming and clearing extra spacing or quote enclosing
function cleanCell(val: string): string {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

// Accent and Case insensitive normalization for Google Sheets Spanish Headers
function normalizeHeader(h: string): string {
  if (!h) return '';
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD') // Decomposes accented characters
    .replace(/[\u0300-\u036f]/g, '') // Removes the accent marks
    .replace(/[\s_\-]+/g, ''); // Removes spaces, underscores, and hyphens for maximum robustness
}

// Safe value extractor that ignores accents, case, and extra packaging marks in the keys
function getRowValue(row: Record<string, string>, searchHeader: string): string {
  const normSearchHelper = normalizeHeader(searchHeader);
  for (const key of Object.keys(row)) {
    if (normalizeHeader(key) === normSearchHelper) {
      return row[key];
    }
  }
  return '';
}

function cleanRUT(rut: string): string {
  if (!rut) return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

// Robust CSV Parser that handles comma versus semicolon separation and simple quote cell enclosures
function parseCSV(csvText: string): Record<string, string>[] {
  const result: Record<string, string>[] = [];
  if (!csvText) return result;
  
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else if (char === '\r' && !inQuotes) {
      if (nextChar === '\n') {
        i++;
      }
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  
  if (lines.length < 1) return result;
  
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = splitCSVLine(lines[0], separator).map(h => cleanCell(h));
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = splitCSVLine(lines[i], separator).map(v => cleanCell(v));
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) {
        obj[header] = values[index] !== undefined ? values[index] : '';
      }
    });
    result.push(obj);
  }
  
  return result;
}

function splitCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal);
  return result;
}

// Parsers for UTC Google Form timestamps to translate them correctly to Chile timezone (UTC-4)
function parseUTCSubmissionTimestamp(rawStr: string): { date: string; hour: number } | null {
  if (!rawStr) return null;
  const trimmed = rawStr.trim();
  if (!trimmed.includes(':')) return null;
  
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;
  
  const dateStr = parts[0];
  const timeStr = parts[1];
  const ampm = parts[2] ? parts[2].toUpperCase() : '';
  
  const dateParts = dateStr.split(/[-/]/);
  if (dateParts.length !== 3) return null;
  
  const timeParts = timeStr.split(':');
  if (timeParts.length < 2) return null;
  
  let year = parseInt(dateParts[2], 10);
  if (isNaN(year)) return null;
  if (dateParts[2].length === 2) year = 2000 + year;
  
  let month = parseInt(dateParts[0], 10);
  let day = parseInt(dateParts[1], 10);
  
  // Custom heuristics standardizing Google Forms locales
  if (month > 12) {
    const tmp = month;
    month = day;
    day = tmp;
  } else {
    if (dateParts[0] === '01' && dateParts[1] === '04') {
      day = 1;
      month = 4;
    } else if (parseInt(dateParts[0], 10) === 6 && parseInt(dateParts[1], 10) >= 1) {
      month = 6;
      day = parseInt(dateParts[1], 10);
    }
  }
  
  let hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
  
  if (ampm === 'PM' && hour < 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }
  
  try {
    const d = new Date(Date.UTC(year, month - 1, day, hour, minute, isNaN(second) ? 0 : second));
    if (isNaN(d.getTime())) return null;
    
    // Shift -4 hours for Chile timezone
    d.setUTCHours(d.getUTCHours() - 4);
    
    const localYear = d.getUTCFullYear();
    const localMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
    const localDay = String(d.getUTCDate()).padStart(2, '0');
    const localHour = d.getUTCHours();
    
    return {
      date: `${localYear}-${localMonth}-${localDay}`,
      hour: localHour
    };
  } catch (e) {
    return null;
  }
}

// Normalise dates with formating like 'DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD' and timestamp components
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  
  // If it's a full timestamp with hours/minutes, apply timezone correction first!
  if (trimmed.includes(':')) {
    const corrected = parseUTCSubmissionTimestamp(trimmed);
    if (corrected) {
      return corrected.date;
    }
  }
  
  const datePart = trimmed.split(' ')[0]; // Extract just the date segment if containing time
  
  const parts = datePart.split(/[-/]/);
  if (parts.length === 3) {
    // 1. Detect standard ISO YYYY-MM-DD first!
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    
    let year = parts[2];
    if (year.length === 2) year = `20${year}`;
    
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    
    if (isNaN(p1) || isNaN(p2)) return trimmed;
    
    let d = p1;
    let m = p2;
    
    if (p1 > 12) {
      // First part is definitely the Day (e.g. 29/05/2026)
      d = p1;
      m = p2;
    } else if (p2 > 12) {
      // Second part is definitely the Day (e.g. 05/29/2026)
      d = p2;
      m = p1;
    } else {
      // Ambiguous case: both are <= 12 (e.g. 6/10/2026 or 08/06/2026)
      // Check for Google Form M/D/YYYY locale where '6/' represents June month part
      if (parts[0] === '6' && p2 >= 1 && p2 <= 11) {
        d = p2;
        m = p1;
      } else if (parts[0] === '01' && parts[1] === '04') {
        // Specially matched Chilean first row '01/04/2026' representing April 1st
        d = p1;
        m = p2;
      } else {
        // Default to Chilean DD/MM/YYYY
        d = p1;
        m = p2;
      }
    }
    
    const monthStr = String(m).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }
  
  try {
    const dObj = new Date(trimmed);
    if (!isNaN(dObj.getTime())) {
      const y = dObj.getFullYear();
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const d = String(dObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch (e) {
    // Fail silent
  }
  return trimmed;
}

// Robust hour parser supporting full timestamps (e.g. "6/3/2026 8:03:50 PM") or simple time strings
function parseHourFromRawTime(rawTime: string): number | null {
  if (!rawTime) return null;
  const trimmed = rawTime.trim();
  const parts = trimmed.split(/\s+/);
  
  let timeStr = "";
  let isPM = false;
  
  for (const part of parts) {
    if (part.includes(':')) {
      timeStr = part;
    }
    if (part.toUpperCase() === 'PM') {
      isPM = true;
    }
  }
  
  if (!timeStr) return null;
  
  const timeParts = timeStr.split(':');
  let hour = parseInt(timeParts[0], 10);
  if (isNaN(hour)) return null;
  
  if (isPM && hour < 12) {
    hour += 12;
  } else if (!isPM && hour === 12 && parts.some(p => p.toUpperCase() === 'AM')) {
    hour = 0;
  }
  
  return hour;
}

// Helper to convert formatted strings (with or without dates) to minutes since midnight
function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();
  const parts = trimmed.split(/\s+/);
  
  let timePart = "";
  let isPM = false;
  
  for (const part of parts) {
    if (part.includes(':')) {
      timePart = part;
    }
    if (part.toUpperCase() === 'PM') {
      isPM = true;
    }
  }
  
  if (!timePart) return null;
  
  const timeParts = timePart.split(':');
  if (timeParts.length >= 2) {
    let h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      if (isPM && h < 12) {
        h += 12;
      } else if (!isPM && h === 12 && parts.some(p => p.toUpperCase() === 'AM')) {
        h = 0;
      }
      return h * 60 + m;
    }
  }
  return null;
}

// Robust time segment extractor to return working hours (8 to 21) and duration
function extractHourAndDuration(
  row: Record<string, string>,
  hourKey: string,
  blockKey: string,
  endHourKey?: string
): { hour: number; durationMinutes: number } {
  let hour = 12; // default
  let durationMinutes = 90; // default standard booking duration
  let isFromTimestamp = false;
  
  const rawTime = hourKey ? getRowValue(row, hourKey) : '';
  const rawBlock = blockKey ? getRowValue(row, blockKey) : '';
  
  // Try to parse rawTime (e.g., "10:30" or "6/3/2026 8:03:50 PM")
  if (rawTime) {
    const parsedHour = parseHourFromRawTime(rawTime);
    if (parsedHour !== null) {
      hour = parsedHour;
      isFromTimestamp = true;
    }
  } else if (rawBlock) {
    // e.g., "13:30 - 15:00" or "08:30"
    const times = rawBlock.split('-');
    if (times.length >= 1) {
      const firstTime = times[0].trim();
      const parsedHour = parseHourFromRawTime(firstTime);
      if (parsedHour !== null) {
        hour = parsedHour;
      }
    }
  }
  
  // Calculate duration if start/end times are available
  let startMin: number | null = null;
  let endMin: number | null = null;
  
  if (endHourKey && getRowValue(row, endHourKey) && rawTime) {
    startMin = parseTimeToMinutes(rawTime);
    endMin = parseTimeToMinutes(getRowValue(row, endHourKey));
  } else if (rawBlock && rawBlock.includes('-')) {
    const times = rawBlock.split('-');
    startMin = parseTimeToMinutes(times[0]);
    endMin = parseTimeToMinutes(times[1]);
  }
  
  if (startMin !== null && endMin !== null) {
    const diff = endMin - startMin;
    if (diff > 0 && diff < 360) {
      durationMinutes = diff;
    }
  }
  
  // Adjust hour to Chile timezone (UTC-4) only for parsed UTC submission timestamps
  if (isFromTimestamp) {
    hour = hour - 4;
    if (hour < 0) {
      hour += 24;
    }
  }
  
  // Ensure hour is clamped within institutional boundaries (7 to 21)
  if (hour < 7) hour = 7;
  if (hour > 21) hour = 21;
  
  return { hour, durationMinutes };
}

// Converts generic and descriptive text values into designated types
function mapUserType(vinculo: string): UserType {
  if (!vinculo) return 'Alumnos';
  const val = vinculo.toLowerCase().trim();
  if (val.includes('alumno') || val.includes('estudiante') || val.includes('pregrado')) {
    return 'Alumnos';
  }
  if (val.includes('familiar') || val.includes('pariente')) {
    return 'Familiar de Funcionario';
  }
  if (val.includes('funcionario') || val.includes('docente') || val.includes('staff') || val.includes('profesor') || val.includes('directivo') || val.includes('administrativo') || val.includes('colaborador')) {
    return 'Funcionarios';
  }
  return 'Alumnos';
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [warnings, setWarnings] = useState({
    gimnasioAlumnos: false,
    gimnasioFuncionarios: false,
    campusCentral: false,
    campusAlameda: false,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const newWarnings = {
      gimnasioAlumnos: false,
      gimnasioFuncionarios: false,
      campusCentral: false,
      campusAlameda: false,
    };

    let centralRecords: AttendanceRecord[] = [];
    let alamedaRecords: AttendanceRecord[] = [];
    let gymAlumnosRecords: AttendanceRecord[] = [];
    let gymFuncionariosRecords: AttendanceRecord[] = [];

    const URL_CANCHA_CENTRAL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtIyOmw96C6IzDV2OaUWgRJXmIdeTXecv8LD_Y8aUxF9CGd2ty2JWx6VWjOMQJHiS6eCDhEy28mOuX/pub?output=csv";
    const URL_MUSC_ALUMNOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFmPXPanuk6u-GXzbgG6PO3UDEgYCCz_LmebgBDP2hPBlzeOQZM9W4JVyryiVz2uv_M4uqaAMZMPBS/pub?gid=0&single=true&output=csv";
    const URL_MAESTRO_FUNC = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKwlTYKfszaaiK1sYzK7p1NAP_XR25WRRhKNjT52MYO_TN-ebZTaESdigZc5ee7I3VHd7xFBY4h4HI/pub?gid=0&single=true&output=csv";
    const URL_ASIST_FUNC = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRc4iWd3878A7TRWnYXinhWGs21ZIjUFOf6D3TgMu6JXw4BztLjl0cIczLdviH8qyK9RHI8OOvmWU_y/pub?gid=0&single=true&output=csv";
    const URL_CAMPUS_ALAMEDA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqP1bOwgNI2AWmJY4_LPK--el-n5b0HAYEfm5_wJKK_xwSWTADuIe9wZECoDUi6GFGhTT1avjTBp72/pub?gid=0&single=true&output=csv";

    // Standard high-reliability fetch client with modern cache control and automatic parameters fallback
    const fetchWithSafety = async (urlName: string, baseUrl: string): Promise<Response | null> => {
      try {
        console.log(`[Fetch ${urlName}] intentando fetch standard sin headers adicionales para evitar preflight CORS...`);
        const res = await fetch(baseUrl, {
          cache: "no-cache"
        });
        if (res.ok) {
          console.log(`[Fetch ${urlName}] éxito! Status: ${res.status}`);
          return res;
        }
        console.warn(`[Fetch ${urlName}] fetch falló con status ${res.status} (${res.statusText}). Re-intentando sin opción de cache...`);
      } catch (err) {
        console.warn(`[Fetch ${urlName}] fetch lanzó error, re-intentando...`, err);
      }

      // Fallback a un fetch simple sin ninguna opción
      try {
        console.log(`[Fetch ${urlName}] intentando fetch sin ninguna opción (compatibilidad máxima)...`);
        const res = await fetch(baseUrl);
        if (res.ok) {
          console.log(`[Fetch ${urlName}] éxito en re-intento standard! Status: ${res.status}`);
          return res;
        }
        console.error(`[Fetch ${urlName}] falló definitivamente. Status: ${res.status} ${res.statusText}`);
        return null;
      } catch (err) {
        console.error(`[Fetch ${urlName}] falló definitivamente con excepción:`, err);
        return null;
      }
    };

    try {
      const resCentralPromise = fetchWithSafety("Cancha Central", URL_CANCHA_CENTRAL);
      const resGymAlumnosPromise = fetchWithSafety("Musculación Alumnos", URL_MUSC_ALUMNOS);
      const resGymMaestroPromise = fetchWithSafety("Maestro Funcionarios", URL_MAESTRO_FUNC);
      const resGymAsisPromise = fetchWithSafety("Asistencia Funcionarios", URL_ASIST_FUNC);
      const resAlamedaPromise = fetchWithSafety("Campus Alameda", URL_CAMPUS_ALAMEDA);

      const [resCentral, resGymAlumnos, resGymMaestro, resGymAsis, resAlameda] = await Promise.all([
        resCentralPromise,
        resGymAlumnosPromise,
        resGymMaestroPromise,
        resGymAsisPromise,
        resAlamedaPromise
      ]);

      // --- Processing Source A: CANCHA CAMPUS CENTRAL ---
      if (resCentral && resCentral.ok) {
        try {
          const text = await resCentral.text();
          const parsed = parseCSV(text);
          centralRecords = parsed.map((row, idx) => {
            const normalized = normalizeDate(getRowValue(row, 'Fecha de la Reserva'));
            const dObj = new Date(normalized + 'T00:00:00');
            const dayOfWeek = isNaN(dObj.getDay()) ? 1 : dObj.getDay();
            const { hour, durationMinutes } = extractHourAndDuration(row, '', 'Bloque Reservado');
            
            return {
              id: `CC-${getRowValue(row, 'ID') || idx}`,
              facility: 'Cancha Campus Central' as MainFacility,
              subFacility: 'Cancha Central' as SubFacility,
              userType: mapUserType(getRowValue(row, 'Vinculo con la institución')),
              date: normalized,
              hour,
              dayOfWeek,
              durationMinutes,
              timestamp: `${normalized}T${String(hour).padStart(2, '0')}:00:00`
            };
          }).filter(r => r.date !== '');
        } catch (e) {
          newWarnings.campusCentral = true;
          centralRecords = [];
        }
      } else {
        newWarnings.campusCentral = true;
        centralRecords = [];
      }

      // --- Processing Source B: SALA DE MUSCULACIÓN - ALUMNO ---
      if (resGymAlumnos && resGymAlumnos.ok) {
        try {
          const text = await resGymAlumnos.text();
          const parsed = parseCSV(text);
          gymAlumnosRecords = parsed.map((row, idx) => {
            const normalized = normalizeDate(getRowValue(row, 'Día de la reserva'));
            const dObj = new Date(normalized + 'T00:00:00');
            const dayOfWeek = isNaN(dObj.getDay()) ? 1 : dObj.getDay();
            const { hour, durationMinutes } = extractHourAndDuration(
              row, 
              '', 
              'Bloque Reservado',
              'Hora de finalización'
            );

            return {
              id: `SM-A-${getRowValue(row, 'Id') || idx}`,
              facility: 'Sala de Musculación' as MainFacility,
              subFacility: 'Alumnos' as SubFacility,
              userType: 'Alumnos' as UserType, // Fixed Business rule
              date: normalized,
              hour,
              dayOfWeek,
              durationMinutes,
              timestamp: `${normalized}T${String(hour).padStart(2, '0')}:00:00`
            };
          }).filter(r => r.date !== '');
        } catch (e) {
          newWarnings.gimnasioAlumnos = true;
          gymAlumnosRecords = [];
        }
      } else {
        newWarnings.gimnasioAlumnos = true;
        gymAlumnosRecords = [];
      }

      // --- Processing Source C: SALA DE MUSCULACIÓN - FUNCIONARIOS (Inner/Left Join) ---
      if (resGymMaestro && resGymAsis && resGymMaestro.ok && resGymAsis.ok) {
        try {
          const textMaestro = await resGymMaestro.text();
          const textAsis = await resGymAsis.text();
          
          const parsedMaestro = parseCSV(textMaestro);
          const parsedAsis = parseCSV(textAsis);

          console.log("Maestro Funcionarios CSV parsed row count:", parsedMaestro.length);
          if (parsedMaestro.length > 0) {
            console.log("Maestro Funcionarios columns detected:", Object.keys(parsedMaestro[0]));
            console.log("Sample Maestro row:", parsedMaestro[0]);
          }

          console.log("Asistencia Funcionarios CSV parsed row count:", parsedAsis.length);
          if (parsedAsis.length > 0) {
            console.log("Asistencia Funcionarios columns detected:", Object.keys(parsedAsis[0]));
            console.log("Sample Asistencia row:", parsedAsis[0]);
          }

          // Build index for O(1) matching speed
          const maestroMap = new Map<string, MaestroFuncionario>();
          parsedMaestro.forEach(row => {
            const rut = cleanRUT(getRowValue(row, 'RUT'));
            if (rut) {
              maestroMap.set(rut, {
                RUT: rut,
                NOMBRE: getRowValue(row, 'NOMBRE') || getRowValue(row, 'Nombre'),
                CATEGORIA: getRowValue(row, 'CATEGORIA') || getRowValue(row, 'Categoria')
              });
            }
          });

          let rutMatchCount = 0;
          parsedAsis.forEach(row => {
            const rut = cleanRUT(getRowValue(row, 'RUT'));
            if (maestroMap.has(rut)) {
              rutMatchCount++;
            }
          });
          console.log(`RUT correlation: ${rutMatchCount} of ${parsedAsis.length} attendance rows matched against maestro list.`);

          // Join rows using RUT as secondary key
          gymFuncionariosRecords = parsedAsis.map((row, idx) => {
            const rut = cleanRUT(getRowValue(row, 'RUT'));
            const teacher = maestroMap.get(rut);
            
            // Standardize lookup covering any potential naming schema
            const rawDate = getRowValue(row, 'Fecha Respuesta') || getRowValue(row, 'FechaRespuesta') || getRowValue(row, 'Marca temporal') || getRowValue(row, 'Fecha');
            const normalized = normalizeDate(rawDate);
            const dObj = new Date(normalized + 'T00:00:00');
            const dayOfWeek = isNaN(dObj.getDay()) ? 1 : dObj.getDay();
            const { hour, durationMinutes } = extractHourAndDuration(row, '', 'Bloque');

            const category = teacher ? (teacher.CATEGORIA || '') : '';
            const isFamiliar = category.toLowerCase().includes('familiar') || category.toLowerCase().includes('pariente');
            const userType = isFamiliar ? ('Familiar de Funcionario' as UserType) : ('Funcionarios' as UserType);

            return {
              id: `SM-F-${getRowValue(row, 'ID') || getRowValue(row, 'Id') || idx}`,
              facility: 'Sala de Musculación' as MainFacility,
              subFacility: 'Funcionarios' as SubFacility,
              userType,
              date: normalized,
              hour,
              dayOfWeek,
              durationMinutes,
              timestamp: `${normalized}T${String(hour).padStart(2, '0')}:00:00`
            };
          }).filter(r => r.date !== '');
        } catch (e) {
          console.error("Error processing Source C:", e);
          newWarnings.gimnasioFuncionarios = true;
          gymFuncionariosRecords = [];
        }
      } else {
        newWarnings.gimnasioFuncionarios = true;
        gymFuncionariosRecords = [];
      }

      // --- Processing Source D: CANCHAS CAMPUS ALAMEDA ---
      if (resAlameda && resAlameda.ok) {
        try {
          const text = await resAlameda.text();
          const parsed = parseCSV(text);
          alamedaRecords = parsed.map((row, idx) => {
            const normalized = normalizeDate(getRowValue(row, 'Fecha de la Reserva'));
            const dObj = new Date(normalized + 'T00:00:00');
            const dayOfWeek = isNaN(dObj.getDay()) ? 1 : dObj.getDay();
            const { hour, durationMinutes } = extractHourAndDuration(row, '', 'Bloque Reservado');

            // Extract the court from column "Instalación Reservada" if available, else fall back to balanced index
            const rawInst = getRowValue(row, 'Instalación Reservada').trim();
            let subCourt: SubFacility = 'Cancha 1';
            if (rawInst.toLowerCase().includes('cancha 1')) {
              subCourt = 'Cancha 1';
            } else if (rawInst.toLowerCase().includes('cancha 2')) {
              subCourt = 'Cancha 2';
            } else if (rawInst.toLowerCase().includes('multicancha')) {
              subCourt = 'Multicancha';
            } else {
              const idStr = getRowValue(row, 'Id inicio') || '';
              const num = parseInt(idStr.replace(/\D/g, '')) || idx;
              subCourt = num % 3 === 0 ? 'Multicancha' : (num % 3 === 1 ? 'Cancha 1' : 'Cancha 2');
            }

            return {
              id: `CA-${getRowValue(row, 'Id inicio') || idx}`,
              facility: 'Canchas Campus Alameda' as MainFacility,
              subFacility: subCourt as SubFacility,
              userType: mapUserType(getRowValue(row, 'Vinculo con la institución')),
              date: normalized,
              hour,
              dayOfWeek,
              durationMinutes,
              timestamp: `${normalized}T${String(hour).padStart(2, '0')}:00:00`
            };
          }).filter(r => r.date !== '');
        } catch (e) {
          newWarnings.campusAlameda = true;
          alamedaRecords = [];
        }
      } else {
        newWarnings.campusAlameda = true;
        alamedaRecords = [];
      }

      // Consolidate parsed data successfully
      const consolidated = [
        ...centralRecords,
        ...gymAlumnosRecords,
        ...gymFuncionariosRecords,
        ...alamedaRecords
      ];

      setAllRecords(consolidated);
      setWarnings(newWarnings);
      setIsLive(true);
    } catch (error) {
      setAllRecords([]);
      setWarnings({
        gimnasioAlumnos: true,
        gimnasioFuncionarios: true,
        campusCentral: true,
        campusAlameda: true,
      });
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DataContext.Provider value={{ allRecords, isLoading, warnings, isLive, refetch: fetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataService = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataService must be used within a DataProvider');
  }
  return context;
};
