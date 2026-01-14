import { useState, useEffect } from 'react';
import { supabase, Driver } from '../lib/supabase';
import { Car } from 'lucide-react';

type DailyCarStayData = {
  [driverId: string]: {
    [date: string]: number;
  };
};

type DriverInfo = {
  id: string;
  name: string;
};

export default function CarStayReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [dailyData, setDailyData] = useState<DailyCarStayData>({});
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCarStayData();
  }, [year, month]);

  const loadCarStayData = async () => {
    setLoading(true);

    const prevMonth = month === 1 ? 12 : month - 1;
    const yearForPrevMonth = month === 1 ? year - 1 : year;

    const startDate = `${yearForPrevMonth}-${String(prevMonth).padStart(2, '0')}-21`;
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-20`;

    const allDates: string[] = [];

    const daysInPrevMonth = new Date(yearForPrevMonth, prevMonth, 0).getDate();
    for (let day = 21; day <= daysInPrevMonth; day++) {
      allDates.push(`${yearForPrevMonth}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }

    for (let day = 1; day <= 20; day++) {
      allDates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }

    setDates(allDates);

    const { data: driversData } = await supabase
      .from('drivers')
      .select('id, name')
      .eq('is_active', true)
      .order('dispatch_order', { ascending: true, nullsLast: true });

    if (!driversData) {
      setLoading(false);
      return;
    }
    setDrivers(driversData);

    const { data: dailyRecords } = await supabase
      .from('daily_overtime_records')
      .select('driver_id, work_date, car_stay_count')
      .gte('work_date', startDate)
      .lte('work_date', endDateStr);

    const dataByDriver: DailyCarStayData = {};
    driversData.forEach((driver: Driver) => {
      dataByDriver[driver.id] = {};
      allDates.forEach(date => {
        dataByDriver[driver.id][date] = 0;
      });
    });

    dailyRecords?.forEach(record => {
      if (dataByDriver[record.driver_id]) {
        dataByDriver[record.driver_id][record.work_date] = record.car_stay_count || 0;
      }
    });

    setDailyData(dataByDriver);
    setLoading(false);
  };

  const getDriverTotal = (driverId: string): number => {
    return Object.values(dailyData[driverId] || {}).reduce((sum, count) => sum + count, 0);
  };

  const getDayTotal = (date: string): number => {
    return drivers.reduce((sum, driver) => {
      return sum + (dailyData[driver.id]?.[date] || 0);
    }, 0);
  };

  const grandTotal = drivers.reduce((sum, driver) => sum + getDriverTotal(driver.id), 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <Car className="text-blue-600" size={24} />
        <h3 className="text-xl font-bold text-gray-800">車泊集計</h3>
      </div>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">年</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">月</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10">
                  ドライバー
                </th>
                {dates.map((date) => {
                  const [y, m, d] = date.split('-').map(Number);
                  const displayLabel = `${m}/${d}`;
                  return (
                    <th
                      key={date}
                      className="px-2 py-2 text-center text-xs font-semibold text-gray-700 min-w-[50px]"
                    >
                      {displayLabel}
                    </th>
                  );
                })}
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 bg-gray-100 sticky right-0 z-10">
                  合計
                </th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr
                  key={driver.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-2 py-2 text-xs text-gray-800 font-medium sticky left-0 bg-white z-10">
                    {driver.name}
                  </td>
                  {dates.map((date) => {
                    const count = dailyData[driver.id]?.[date] || 0;
                    return (
                      <td
                        key={date}
                        className={`px-2 py-2 text-xs text-center ${
                          count > 0 ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-400'
                        }`}
                      >
                        {count > 0 ? '●' : '-'}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-xs text-center font-semibold text-gray-800 bg-gray-50 sticky right-0 z-10">
                    {getDriverTotal(driver.id)}
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={dates.length + 2} className="px-4 py-8 text-center text-gray-500">
                    データがありません
                  </td>
                </tr>
              )}
            </tbody>
            {drivers.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td className="px-2 py-2 text-xs font-bold text-gray-800 sticky left-0 bg-gray-100 z-10">
                    合計
                  </td>
                  {dates.map((date) => {
                    const total = getDayTotal(date);
                    return (
                      <td
                        key={date}
                        className="px-2 py-2 text-xs text-center font-semibold text-gray-800"
                      >
                        {total > 0 ? total : '-'}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-xs text-center font-bold text-gray-800 bg-gray-100 sticky right-0 z-10">
                    {grandTotal}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
