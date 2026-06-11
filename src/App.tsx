import React, { useState, useMemo } from 'react';
import { DashboardFilters, AttendanceRecord } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OverviewTab from './components/OverviewTab';
import FacilitiesTab from './components/FacilitiesTab';
import TemporalTab from './components/TemporalTab';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import { Menu, X, Landmark, FileText } from 'lucide-react';
import { DataProvider, useDataService } from './context/DataContext';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DEFAULT_FILTERS: DashboardFilters = {
  period: 'Personalizado',
  startDate: '2026-04-01',
  endDate: getLocalDateString(),
  userType: 'Todos',
};

function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const { allRecords, isLoading } = useDataService();

  // Filter records based on selected parameters
  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      // 1. Date filter
      const matchDate = record.date >= filters.startDate && record.date <= filters.endDate;
      if (!matchDate) return false;

      // 2. Demographic affiliation filter
      if (filters.userType !== 'Todos' && record.userType !== filters.userType) {
        return false;
      }

      return true;
    });
  }, [allRecords, filters]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div id="bi-root" className="flex flex-col h-screen overflow-hidden bg-[#0A0A0C] text-zinc-100 font-sans antialiased">
      
      {/* Executive Header Controls */}
      <Header
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
        recordsCount={isLoading ? 0 : filteredRecords.length}
      />

      {/* Main Structural Body */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* DESKTOP SIDEBAR (Hidden on mobile by default, shown as side drawers) */}
        <div className="hidden lg:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        </div>

        {/* MOBILE DRAWER TRIGGER CONTAINER */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-3">
          {/* Quick PDF button on mobile */}
          <button
            id="mobile-btn-pdf"
            onClick={() => setIsReportModalOpen(true)}
            className="p-4 bg-[#D32F2F] hover:bg-[#B71C1C] transition-all text-white rounded-full shadow-2xl flex items-center justify-center border border-rose-500/15"
          >
            <FileText className="h-6 w-6" />
          </button>
          
          <button
            id="mobile-sidebar-toggle"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-[#fff] rounded-full shadow-2xl flex items-center justify-center"
          >
            {mobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* MOBILE SIDEBAR MODAL PORTAL */}
        {mobileSidebarOpen && (
          <div 
            id="mobile-sidebar-backdrop"
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <div 
              className="w-[300px] h-full bg-[#1E1E24]"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setMobileSidebarOpen(false);
                }}
                onOpenReportModal={() => {
                  setMobileSidebarOpen(false);
                  setIsReportModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* WORKSTAGE VIEWPORT */}
        <main id="bi-viewport" className="flex-1 overflow-y-auto bg-[#1E1E24] text-zinc-100 relative">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#D32F2F]/20 border-t-[#D32F2F] animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-extrabold text-white tracking-tight">Sincronizando Base de Datos</h3>
                <p className="text-[11px] text-[#A0A0A5] mt-1 pr-4 pl-4 font-sans font-medium">Estableciendo conexión segura con planillas Google Sheets...</p>
              </div>
            </div>
          ) : (
            /* Dynamic tabs staging */
            <div className="py-2.5">
              {activeTab === 'overview' && (
                <OverviewTab
                  records={filteredRecords}
                  allRecords={allRecords}
                  filters={filters}
                />
              )}

              {activeTab === 'facilities' && (
                <FacilitiesTab
                  records={filteredRecords}
                />
              )}

              {activeTab === 'density' && (
                <TemporalTab
                  records={filteredRecords}
                />
              )}
            </div>
          )}

        </main>

      </div>

      {/* COMPILER REPORT CENTER MODAL PORTAL */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        records={filteredRecords}
        filters={filters}
      />

    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Dashboard />
    </DataProvider>
  );
}
