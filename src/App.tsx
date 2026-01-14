import { useState } from 'react';
import { Users, DollarSign, Calendar, FileText, Gift, CalendarRange, History, Car } from 'lucide-react';
import DriverManagement from './components/DriverManagement';
import OvertimeRateManagement from './components/OvertimeRateManagement';
import AllowanceRateManagement from './components/AllowanceRateManagement';
import DailyOvertimeInput from './components/DailyOvertimeInput';
import MonthlyInput from './components/MonthlyInput';
import MonthlyReport from './components/MonthlyReport';
import OvertimeHistory from './components/OvertimeHistory';
import CarStayReport from './components/CarStayReport';

type TabType = 'drivers' | 'rates' | 'allowance_rates' | 'daily' | 'monthly' | 'report' | 'history' | 'car_stay';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  const tabs = [
    { id: 'daily' as TabType, label: '日別入力', icon: Calendar },
    { id: 'history' as TabType, label: '勤務履歴', icon: History },
    { id: 'monthly' as TabType, label: '月別入力', icon: CalendarRange },
    { id: 'report' as TabType, label: '月次集計', icon: FileText },
    { id: 'car_stay' as TabType, label: '車泊集計', icon: Car },
    { id: 'drivers' as TabType, label: 'ドライバー管理', icon: Users },
    { id: 'rates' as TabType, label: '残業単価管理', icon: DollarSign },
    { id: 'allowance_rates' as TabType, label: '手当単価管理', icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">残業時間・手当集計システム</h1>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === 'drivers' && <DriverManagement />}
        {activeTab === 'rates' && <OvertimeRateManagement />}
        {activeTab === 'allowance_rates' && <AllowanceRateManagement />}
        {activeTab === 'daily' && <DailyOvertimeInput />}
        {activeTab === 'history' && <OvertimeHistory />}
        {activeTab === 'monthly' && <MonthlyInput />}
        {activeTab === 'report' && <MonthlyReport />}
        {activeTab === 'car_stay' && <CarStayReport />}
      </main>
    </div>
  );
}

export default App;
