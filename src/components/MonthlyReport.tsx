import { useState, useEffect, useRef } from 'react';
import { supabase, Driver, OvertimeRate, AllowanceRate, MonthlyRecord } from '../lib/supabase';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

type MonthlyOvertimeData = {
  late_night_hours: number;
  inner_late_night_hours: number;
  early_hours: number;
  sat_holiday_hours: number;
  sat_holiday_late_night_hours: number;
  legal_holiday_hours: number;
  legal_holiday_late_night_hours: number;
  late_night_amount: number;
  inner_late_night_amount: number;
  early_amount: number;
  sat_holiday_amount: number;
  sat_holiday_late_night_amount: number;
  legal_holiday_amount: number;
  legal_holiday_late_night_amount: number;
  vacuum_count: number;
  car_stay_count: number;
  boarding_count: number;
  training_count: number;
  guidance_count: number;
  vacuum_amount: number;
  car_stay_amount: number;
  boarding_amount: number;
  training_amount: number;
  guidance_amount: number;
  phone_allowance: number;
  revenue_sales: number;
  accident_free_amount: number;
  total_hours: number;
  total_amount: number;
  allowance_total: number;
  monthly_total: number;
};

type AllDriversReportData = {
  driver_id: string;
  driver_name: string;
} & MonthlyOvertimeData;

const getDefaultDateRange = () => {
  const today = new Date();
  const day = today.getDate();

  let year = today.getFullYear();
  let month = today.getMonth() + 1;

  if (day >= 21) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-21`;

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const endDate = `${year}-${String(month).padStart(2, '0')}-20`;

    return { startDate, endDate };
  } else {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    const startDate = `${year}-${String(month).padStart(2, '0')}-21`;

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const endDate = `${year}-${String(month).padStart(2, '0')}-20`;

    return { startDate, endDate };
  }
};

export default function MonthlyReport() {
  const defaultRange = getDefaultDateRange();
  const [activeTab, setActiveTab] = useState<'individual' | 'all'>('individual');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [individualStartDate, setIndividualStartDate] = useState(defaultRange.startDate);
  const [individualEndDate, setIndividualEndDate] = useState(defaultRange.endDate);
  const [allStartDate, setAllStartDate] = useState(defaultRange.startDate);
  const [allEndDate, setAllEndDate] = useState(defaultRange.endDate);
  const [multipleReportsData, setMultipleReportsData] = useState<Array<{ driverName: string; data: MonthlyOvertimeData }>>([]);
  const [allDriversData, setAllDriversData] = useState<AllDriversReportData[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_active', true)
      .order('dispatch_order', { ascending: true, nullsLast: true });

    if (!error && data) {
      setDrivers(data);
    }
  };

  const generateMultipleReports = async () => {
    if (selectedDriverIds.length === 0 || !individualStartDate || !individualEndDate) return;

    const reportsData: Array<{ driverName: string; data: MonthlyOvertimeData }> = [];

    for (const driverId of selectedDriverIds) {
      const { data: records } = await supabase
        .from('daily_overtime_records')
        .select('*')
        .eq('driver_id', driverId)
        .gte('work_date', individualStartDate)
        .lte('work_date', individualEndDate);

      const driver = drivers.find((d) => d.id === driverId);
      const driverName = driver?.name || '';

      const reportData = await calculateReportData(records || [], driverId);
      reportsData.push({ driverName, data: reportData });
    }

    setMultipleReportsData(reportsData);
  };

  const calculateReportData = async (records: any[], driverId: string): Promise<MonthlyOvertimeData> => {
    if (records.length === 0) {
      return {
        late_night_hours: 0,
        inner_late_night_hours: 0,
        early_hours: 0,
        sat_holiday_hours: 0,
        sat_holiday_late_night_hours: 0,
        legal_holiday_hours: 0,
        legal_holiday_late_night_hours: 0,
        late_night_amount: 0,
        inner_late_night_amount: 0,
        early_amount: 0,
        sat_holiday_amount: 0,
        sat_holiday_late_night_amount: 0,
        legal_holiday_amount: 0,
        legal_holiday_late_night_amount: 0,
        vacuum_count: 0,
        car_stay_count: 0,
        boarding_count: 0,
        training_count: 0,
        guidance_count: 0,
        vacuum_amount: 0,
        car_stay_amount: 0,
        boarding_amount: 0,
        training_amount: 0,
        guidance_amount: 0,
        phone_allowance: 0,
        revenue_sales: 0,
        accident_free_amount: 0,
        total_hours: 0,
        total_amount: 0,
        allowance_total: 0,
        monthly_total: 0,
      };
    }

    const totals = records.reduce(
      (acc, record) => ({
        late_night_hours: acc.late_night_hours + Number(record.late_night_hours),
        inner_late_night_hours: acc.inner_late_night_hours + Number(record.inner_late_night_hours),
        early_hours: acc.early_hours + Number(record.early_hours),
        sat_holiday_hours: acc.sat_holiday_hours + Number(record.sat_holiday_hours),
        sat_holiday_late_night_hours: acc.sat_holiday_late_night_hours + Number(record.sat_holiday_late_night_hours),
        legal_holiday_hours: acc.legal_holiday_hours + Number(record.legal_holiday_hours),
        legal_holiday_late_night_hours: acc.legal_holiday_late_night_hours + Number(record.legal_holiday_late_night_hours),
        vacuum_count: acc.vacuum_count + Number(record.vacuum_count),
        car_stay_count: acc.car_stay_count + Number(record.car_stay_count),
        boarding_count: acc.boarding_count + Number(record.boarding_count),
        training_count: acc.training_count + Number(record.training_count),
        guidance_count: acc.guidance_count + Number(record.guidance_count),
      }),
      {
        late_night_hours: 0,
        inner_late_night_hours: 0,
        early_hours: 0,
        sat_holiday_hours: 0,
        sat_holiday_late_night_hours: 0,
        legal_holiday_hours: 0,
        legal_holiday_late_night_hours: 0,
        vacuum_count: 0,
        car_stay_count: 0,
        boarding_count: 0,
        training_count: 0,
        guidance_count: 0,
      }
    );

    const { data: rates } = await supabase
      .from('overtime_rates')
      .select('*')
      .lte('effective_date', individualEndDate)
      .order('effective_date', { ascending: false });

    const { data: allowanceRates } = await supabase
      .from('allowance_rates')
      .select('*')
      .lte('effective_date', individualEndDate)
      .order('effective_date', { ascending: false });

    const { data: monthlyRecord } = await supabase
      .from('monthly_records')
      .select('*')
      .eq('driver_id', driverId)
      .gte('period_start', individualStartDate)
      .lte('period_start', individualEndDate)
      .maybeSingle();

    const getRateForType = (type: string): number => {
      const rate = rates?.find((r) => r.overtime_type === type);
      return rate?.hourly_rate || 0;
    };

    const getAllowanceRateForType = (type: string): number => {
      const rate = allowanceRates?.find((r) => r.allowance_type === type);
      return rate?.amount || 0;
    };

    const late_night_amount = totals.late_night_hours * getRateForType('深夜時間');
    const inner_late_night_amount = totals.inner_late_night_hours * getRateForType('内深夜時間');
    const early_amount = totals.early_hours * getRateForType('早出時間');
    const sat_holiday_amount = totals.sat_holiday_hours * getRateForType('土・祝時間');
    const sat_holiday_late_night_amount = totals.sat_holiday_late_night_hours * getRateForType('土・祝深夜時間');
    const legal_holiday_amount = totals.legal_holiday_hours * getRateForType('法定休日');
    const legal_holiday_late_night_amount = totals.legal_holiday_late_night_hours * getRateForType('法定休日深夜');

    const vacuum_amount = totals.vacuum_count * getAllowanceRateForType('バキューム');
    const car_stay_amount = totals.car_stay_count * getAllowanceRateForType('車泊');
    const boarding_amount = totals.boarding_count * getAllowanceRateForType('乗船');
    const training_amount = totals.training_count * getAllowanceRateForType('研修/会議');
    const guidance_amount = totals.guidance_count * getAllowanceRateForType('指導');

    const total_hours =
      totals.late_night_hours +
      totals.inner_late_night_hours +
      totals.early_hours +
      totals.sat_holiday_hours +
      totals.sat_holiday_late_night_hours +
      totals.legal_holiday_hours +
      totals.legal_holiday_late_night_hours;

    const total_amount =
      late_night_amount +
      inner_late_night_amount +
      early_amount +
      sat_holiday_amount +
      sat_holiday_late_night_amount +
      legal_holiday_amount +
      legal_holiday_late_night_amount;

    const allowance_total =
      vacuum_amount +
      car_stay_amount +
      boarding_amount +
      training_amount +
      guidance_amount +
      (monthlyRecord?.accident_free_amount || 0);

    return {
      ...totals,
      late_night_amount,
      inner_late_night_amount,
      early_amount,
      sat_holiday_amount,
      sat_holiday_late_night_amount,
      legal_holiday_amount,
      legal_holiday_late_night_amount,
      vacuum_amount,
      car_stay_amount,
      boarding_amount,
      training_amount,
      guidance_amount,
      phone_allowance: monthlyRecord?.phone_allowance || 0,
      revenue_sales: monthlyRecord?.revenue_sales || 0,
      accident_free_amount: monthlyRecord?.accident_free_amount || 0,
      total_hours,
      total_amount,
      allowance_total,
      monthly_total: (monthlyRecord?.phone_allowance || 0) + (monthlyRecord?.revenue_sales || 0),
    };
  };


  const generateAllDriversReport = async () => {
    if (!allStartDate || !allEndDate) return;

    const { data: records } = await supabase
      .from('daily_overtime_records')
      .select('*')
      .gte('work_date', allStartDate)
      .lte('work_date', allEndDate);

    if (!records || records.length === 0) {
      setAllDriversData([]);
      return;
    }

    const driverIds = [...new Set(records.map(r => r.driver_id))];
    const { data: driverList } = await supabase
      .from('drivers')
      .select('*')
      .in('id', driverIds)
      .order('dispatch_order', { ascending: true, nullsLast: true });

    const { data: rates } = await supabase
      .from('overtime_rates')
      .select('*')
      .lte('effective_date', allEndDate)
      .order('effective_date', { ascending: false });

    const { data: allowanceRates } = await supabase
      .from('allowance_rates')
      .select('*')
      .lte('effective_date', allEndDate)
      .order('effective_date', { ascending: false });

    const { data: monthlyRecords } = await supabase
      .from('monthly_records')
      .select('*')
      .gte('period_start', allStartDate)
      .lte('period_start', allEndDate);

    const getRateForType = (type: string): number => {
      const rate = rates?.find((r) => r.overtime_type === type);
      return rate?.hourly_rate || 0;
    };

    const getAllowanceRateForType = (type: string): number => {
      const rate = allowanceRates?.find((r) => r.allowance_type === type);
      return rate?.amount || 0;
    };

    const allData: AllDriversReportData[] = driverList?.map(driver => {
      const driverRecords = records.filter(r => r.driver_id === driver.id);

      const totals = driverRecords.reduce(
        (acc, record) => ({
          late_night_hours: acc.late_night_hours + Number(record.late_night_hours),
          inner_late_night_hours: acc.inner_late_night_hours + Number(record.inner_late_night_hours),
          early_hours: acc.early_hours + Number(record.early_hours),
          sat_holiday_hours: acc.sat_holiday_hours + Number(record.sat_holiday_hours),
          sat_holiday_late_night_hours: acc.sat_holiday_late_night_hours + Number(record.sat_holiday_late_night_hours),
          legal_holiday_hours: acc.legal_holiday_hours + Number(record.legal_holiday_hours),
          legal_holiday_late_night_hours: acc.legal_holiday_late_night_hours + Number(record.legal_holiday_late_night_hours),
          vacuum_count: acc.vacuum_count + Number(record.vacuum_count),
          car_stay_count: acc.car_stay_count + Number(record.car_stay_count),
          boarding_count: acc.boarding_count + Number(record.boarding_count),
          training_count: acc.training_count + Number(record.training_count),
          guidance_count: acc.guidance_count + Number(record.guidance_count),
        }),
        {
          late_night_hours: 0,
          inner_late_night_hours: 0,
          early_hours: 0,
          sat_holiday_hours: 0,
          sat_holiday_late_night_hours: 0,
          legal_holiday_hours: 0,
          legal_holiday_late_night_hours: 0,
          vacuum_count: 0,
          car_stay_count: 0,
          boarding_count: 0,
          training_count: 0,
          guidance_count: 0,
        }
      );

      const driverMonthlyData = monthlyRecords?.find(r => r.driver_id === driver.id);

      const data = {
        driver_id: driver.id,
        driver_name: driver.name,
        ...totals,
        late_night_amount: totals.late_night_hours * getRateForType('深夜時間'),
        inner_late_night_amount: totals.inner_late_night_hours * getRateForType('内深夜時間'),
        early_amount: totals.early_hours * getRateForType('早出時間'),
        sat_holiday_amount: totals.sat_holiday_hours * getRateForType('土・祝時間'),
        sat_holiday_late_night_amount: totals.sat_holiday_late_night_hours * getRateForType('土・祝深夜時間'),
        legal_holiday_amount: totals.legal_holiday_hours * getRateForType('法定休日'),
        legal_holiday_late_night_amount: totals.legal_holiday_late_night_hours * getRateForType('法定休日深夜'),
        vacuum_amount: totals.vacuum_count * getAllowanceRateForType('バキューム'),
        car_stay_amount: totals.car_stay_count * getAllowanceRateForType('車泊'),
        boarding_amount: totals.boarding_count * getAllowanceRateForType('乗船'),
        training_amount: totals.training_count * getAllowanceRateForType('研修/会議'),
        guidance_amount: totals.guidance_count * getAllowanceRateForType('指導'),
        phone_allowance: driverMonthlyData?.phone_allowance || 0,
        revenue_sales: driverMonthlyData?.revenue_sales || 0,
        accident_free_amount: driverMonthlyData?.accident_free_amount || 0,
        total_hours: 0,
        total_amount: 0,
        allowance_total: 0,
        monthly_total: 0,
      };

      data.total_hours =
        data.late_night_hours +
        data.inner_late_night_hours +
        data.early_hours +
        data.sat_holiday_hours +
        data.sat_holiday_late_night_hours +
        data.legal_holiday_hours +
        data.legal_holiday_late_night_hours;

      data.total_amount =
        data.late_night_amount +
        data.inner_late_night_amount +
        data.early_amount +
        data.sat_holiday_amount +
        data.sat_holiday_late_night_amount +
        data.legal_holiday_amount +
        data.legal_holiday_late_night_amount;

      data.allowance_total =
        data.vacuum_amount +
        data.car_stay_amount +
        data.boarding_amount +
        data.training_amount +
        data.guidance_amount +
        data.accident_free_amount;

      data.monthly_total =
        data.phone_allowance +
        data.revenue_sales;

      return data;
    }) || [];

    setAllDriversData(allData);
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape orientation
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const reportElements = reportRef.current.querySelectorAll(':scope > div');

      for (let i = 0; i < reportElements.length; i++) {
        const element = reportElements[i] as HTMLElement;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;
        const imgX = (pdfWidth - scaledWidth) / 2;
        const imgY = 0;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'PNG', imgX, imgY, scaledWidth, scaledHeight);
      }

      const filename = `period_reports_${individualStartDate}_${individualEndDate}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF生成に失敗しました。');
    }
  };

  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">月次集計・帳票表示</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md print:hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'individual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              個人別
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              全体
            </button>
          </nav>
        </div>

        <div className="p-6 space-y-4">
          {activeTab === 'individual' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                  <input
                    type="date"
                    value={individualStartDate}
                    onChange={(e) => setIndividualStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                  <input
                    type="date"
                    value={individualEndDate}
                    onChange={(e) => setIndividualEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">ドライバー選択（複数可）</label>
                  <button
                    onClick={() => setSelectedDriverIds(drivers.map(d => d.id))}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                  >
                    全選択
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {drivers.map((driver) => (
                    <label key={driver.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDriverIds.includes(driver.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDriverIds([...selectedDriverIds, driver.id]);
                          } else {
                            setSelectedDriverIds(selectedDriverIds.filter(id => id !== driver.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{driver.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={generateMultipleReports}
                  disabled={selectedDriverIds.length === 0 || !individualStartDate || !individualEndDate}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  集計表示
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                  <input
                    type="date"
                    value={allStartDate}
                    onChange={(e) => setAllStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                  <input
                    type="date"
                    value={allEndDate}
                    onChange={(e) => setAllEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={generateAllDriversReport}
                  disabled={!allStartDate || !allEndDate}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  集計表示
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'individual' && multipleReportsData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md print:shadow-none print:rounded-none">
          <div className="flex gap-2 mb-4 print:hidden">
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileDown size={20} />
              PDF保存
            </button>
          </div>
          <div ref={reportRef}>
            {multipleReportsData.map(({ driverName, data: reportData }, index) => (
              <div key={index} className="p-8 print:p-8 print:break-after-page" style={{ pageBreakAfter: index < multipleReportsData.length - 1 ? 'always' : 'auto', breakAfter: index < multipleReportsData.length - 1 ? 'page' : 'auto' }}>
                <div className="mb-6 print:mb-4">
                  <h3 className="text-base font-bold mb-2 print:text-sm">
                    期間集計 {individualStartDate} 〜 {individualEndDate}
                  </h3>
                  <p className="text-xl font-bold text-gray-800 print:text-lg">{driverName}</p>
                </div>

            <div className="space-y-5 print:space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs">① 基本情報</h4>
                <div className="border-2 border-gray-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-800 bg-gray-100">
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6">基準内出勤数</th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6">出勤日数</th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6">土・祝日出勤</th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6">法定休日出勤</th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6">有給日数</th>
                        <th className="px-3 py-2 text-xs font-medium w-1/6">振替休日</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs"></td>
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs"></td>
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs"></td>
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs"></td>
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs"></td>
                        <td className="px-3 py-2.5 text-center text-xs"></td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="w-full border-t-2 border-gray-800">
                    <thead>
                      <tr className="border-b-2 border-gray-800 bg-gray-100">
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/2">有給取得日</th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6"></th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6"></th>
                        <th className="px-3 py-2 text-xs font-medium w-1/6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-r border-gray-800 px-3 py-3 text-center text-xs"></td>
                        <td className="border-r border-gray-800 px-3 py-3 text-center text-xs"></td>
                        <td className="border-r border-gray-800 px-3 py-3 text-center text-xs"></td>
                        <td className="px-3 py-3 text-center text-xs"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs">② 残業時間・金額</h4>
                <div className="border-2 border-gray-800">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b-2 border-gray-800 bg-gray-100">
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[11.1%]"></th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[11.1%]">深夜時間</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[11.1%]">内深夜時間</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[11.1%]">早出時間</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[11.1%]">土・祝時間</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[11.1%]">土・祝深夜</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[11.1%]">法定休日</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[11.1%]">法定休日深夜</th>
                        <th className="px-2 py-2 text-[10px] font-medium w-[11.1%]">合計</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="border-r border-gray-800 px-2 py-2 text-center font-medium text-[10px] bg-gray-50">時間</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {formatHours(reportData.late_night_hours)}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {formatHours(reportData.inner_late_night_hours)}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {formatHours(reportData.early_hours)}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {formatHours(reportData.sat_holiday_hours)}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {formatHours(reportData.sat_holiday_late_night_hours)}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {formatHours(reportData.legal_holiday_hours)}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {formatHours(reportData.legal_holiday_late_night_hours)}
                        </td>
                        <td className="px-2 py-2 text-center text-xs font-bold">
                          {formatHours(reportData.total_hours)}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="border-r border-gray-800 px-2 py-2 text-center font-medium text-[10px] bg-gray-50">金額</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {reportData.late_night_amount.toLocaleString()}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {reportData.inner_late_night_amount.toLocaleString()}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {reportData.early_amount.toLocaleString()}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {reportData.sat_holiday_amount.toLocaleString()}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {reportData.sat_holiday_late_night_amount.toLocaleString()}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {reportData.legal_holiday_amount.toLocaleString()}
                        </td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">
                          {reportData.legal_holiday_late_night_amount.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-center text-xs font-bold">
                          {reportData.total_amount.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs">③ 手当</h4>
                <div className="border-2 border-gray-800">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b-2 border-gray-800 bg-gray-100">
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[12.5%]"></th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[12.5%]">バキューム</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[12.5%]">車泊</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[12.5%]">乗船</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[12.5%]">研修/会議</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[12.5%]">指導</th>
                        <th className="border-r border-gray-800 px-2 py-2 text-[10px] font-medium w-[12.5%]">無事故</th>
                        <th className="px-2 py-2 text-[10px] font-medium w-[12.5%]">合計</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="border-r border-gray-800 px-2 py-2 text-center font-medium text-[10px] bg-gray-50">件数</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.vacuum_count}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.car_stay_count}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.boarding_count}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.training_count}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.guidance_count}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">-</td>
                        <td className="px-2 py-2 text-center text-xs font-bold">
                          {reportData.vacuum_count + reportData.car_stay_count + reportData.boarding_count + reportData.training_count + reportData.guidance_count}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="border-r border-gray-800 px-2 py-2 text-center font-medium text-[10px] bg-gray-50">金額</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.vacuum_amount.toLocaleString()}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.car_stay_amount.toLocaleString()}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.boarding_amount.toLocaleString()}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.training_amount.toLocaleString()}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.guidance_amount.toLocaleString()}</td>
                        <td className="border-r border-gray-800 px-2 py-2 text-center text-xs">{reportData.accident_free_amount.toLocaleString()}</td>
                        <td className="px-2 py-2 text-center text-xs font-bold">{reportData.allowance_total.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs">④ その他</h4>
                <div className="border-2 border-gray-800">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-800 bg-gray-100">
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6">携帯代</th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6">運賃売上(10%)</th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6"></th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6"></th>
                        <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium w-1/6"></th>
                        <th className="px-3 py-2 text-xs font-medium w-1/6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs">{reportData.phone_allowance.toLocaleString()}</td>
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs">{reportData.revenue_sales.toLocaleString()}</td>
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs"></td>
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs"></td>
                        <td className="border-r border-gray-800 px-3 py-2.5 text-center text-xs"></td>
                        <td className="px-3 py-2.5 text-center text-xs"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 print:text-xs">⑤ まとめ</h4>
                <div className="border-2 border-gray-800 bg-gray-50">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-300 pb-3">
                      <span className="text-sm font-semibold">支払金額</span>
                      <span className="text-lg font-bold text-blue-600">{(reportData.total_amount + reportData.allowance_total + reportData.monthly_total).toLocaleString()}円</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">超過残業時間</span>
                      <span className="text-sm font-medium"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'all' && allDriversData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md print:shadow-none print:rounded-none">
          <div className="p-6 print:p-0">
            <div className="mb-6 print:mb-4">
              <h3 className="text-xl font-bold mb-2 print:text-lg">
                全体集計 {allStartDate} 〜 {allEndDate}
              </h3>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="min-w-full border-2 border-gray-800">
                <thead>
                  <tr className="border-b-2 border-gray-800 bg-gray-100">
                    <th className="border-r border-gray-800 px-3 py-2 text-sm font-medium sticky left-0 bg-gray-100 print:static">ドライバー名</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">深夜時間</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">内深夜時間</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">早出時間</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">土・祝時間</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">土・祝深夜</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">法定休日</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">法定休日深夜</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">合計時間</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">残業金額</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">手当合計</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">携帯代</th>
                    <th className="border-r border-gray-800 px-3 py-2 text-xs font-medium print:text-[10px]">運賃売上10%</th>
                    <th className="px-3 py-2 text-xs font-medium print:text-[10px]">総合計</th>
                  </tr>
                </thead>
                <tbody>
                  {allDriversData.map((data) => (
                    <tr key={data.driver_id} className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-3 py-2 text-sm font-medium sticky left-0 bg-white print:static print:text-xs">
                        {data.driver_name}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center text-xs print:text-[10px]">
                        {formatHours(data.late_night_hours)}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center text-xs print:text-[10px]">
                        {formatHours(data.inner_late_night_hours)}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center text-xs print:text-[10px]">
                        {formatHours(data.early_hours)}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center text-xs print:text-[10px]">
                        {formatHours(data.sat_holiday_hours)}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center text-xs print:text-[10px]">
                        {formatHours(data.sat_holiday_late_night_hours)}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center text-xs print:text-[10px]">
                        {formatHours(data.legal_holiday_hours)}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center text-xs print:text-[10px]">
                        {formatHours(data.legal_holiday_late_night_hours)}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center text-xs font-medium print:text-[10px]">
                        {formatHours(data.total_hours)}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-right text-xs font-medium print:text-[10px]">
                        {data.total_amount.toLocaleString()}円
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-right text-xs font-medium print:text-[10px]">
                        {data.allowance_total.toLocaleString()}円
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-right text-xs print:text-[10px]">
                        {data.phone_allowance.toLocaleString()}円
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-right text-xs print:text-[10px]">
                        {data.revenue_sales.toLocaleString()}円
                      </td>
                      <td className="px-2 py-1 text-right text-xs font-bold text-blue-600 print:text-[10px]">
                        {(data.total_amount + data.allowance_total + data.monthly_total).toLocaleString()}円
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}