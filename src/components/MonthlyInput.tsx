import { useState, useEffect } from 'react';
import { supabase, Driver, MonthlyRecord } from '../lib/supabase';
import { Calendar, Save, CreditCard as Edit2, X } from 'lucide-react';

type MonthlyData = {
  driver_id: string;
  driver_name: string;
  phone_allowance: string;
  revenue_sales: string;
  accident_free_amount: string;
};

const generatePeriodOptions = () => {
  const options = [];
  const today = new Date();
  const currentYear = today.getFullYear();

  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-21`;
      let endMonth = month + 1;
      let endYear = year;
      if (endMonth > 12) {
        endMonth = 1;
        endYear += 1;
      }
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-20`;
      const label = `${endYear}年${endMonth}月(${year}/${month}/${21}~${endYear}/${endMonth}/${20})`;
      options.push({ startDate, endDate, label });
    }
  }
  return options;
};

const getDefaultPeriod = () => {
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

export default function MonthlyInput() {
  const defaultPeriod = getDefaultPeriod();
  const periodOptions = generatePeriodOptions();
  const [selectedPeriod, setSelectedPeriod] = useState(`${defaultPeriod.startDate}|${defaultPeriod.endDate}`);
  const [periodStart, setPeriodStart] = useState(defaultPeriod.startDate);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.endDate);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedData, setSavedData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    loadDataForPeriod();
  }, [periodStart, periodEnd]);

  const loadDataForPeriod = async () => {
    setLoading(true);

    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .lte('hire_date', periodEnd)
      .eq('is_active', true)
      .order('dispatch_order', { ascending: true, nullsLast: true });

    if (driversError || !drivers) {
      setLoading(false);
      return;
    }

    const activeDrivers = drivers.filter((driver) => {
      if (!driver.termination_date) return true;
      return driver.termination_date >= periodStart;
    });

    const { data: records } = await supabase
      .from('monthly_records')
      .select('*')
      .eq('period_start', periodStart);

    const recordMap = new Map<string, MonthlyRecord>();
    records?.forEach((record) => {
      recordMap.set(record.driver_id, record);
    });

    const data: MonthlyData[] = activeDrivers.map((driver) => {
      const record = recordMap.get(driver.id);
      return {
        driver_id: driver.id,
        driver_name: driver.name,
        phone_allowance: record?.phone_allowance?.toString() || '0',
        revenue_sales: record?.revenue_sales?.toString() || '0',
        accident_free_amount: record?.accident_free_amount?.toString() || '0',
      };
    });

    setMonthlyData(data);
    setSavedData(data);
    setIsEditing(false);
    setLoading(false);
  };

  const updateValue = (driverId: string, field: string, value: string) => {
    setMonthlyData((prev) =>
      prev.map((data) =>
        data.driver_id === driverId ? { ...data, [field]: value } : data
      )
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setMonthlyData(savedData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setLoading(true);

    for (const data of monthlyData) {
      const { error } = await supabase.from('monthly_records').upsert(
        {
          driver_id: data.driver_id,
          period_start: periodStart,
          period_end: periodEnd,
          phone_allowance: parseFloat(data.phone_allowance) || 0,
          revenue_sales: parseFloat(data.revenue_sales) || 0,
          accident_free_amount: parseFloat(data.accident_free_amount) || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'driver_id,period_start' }
      );

      if (error) {
        console.error('Error saving data:', error);
      }
    }

    setSavedData(monthlyData);
    setIsEditing(false);
    setLoading(false);
  };

  const handlePeriodChange = (value: string) => {
    const [start, end] = value.split('|');
    setSelectedPeriod(value);
    setPeriodStart(start);
    setPeriodEnd(end);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">月別入力</h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <Calendar className="text-blue-600" size={24} />
          <label className="text-sm font-medium text-gray-700">対象月:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periodOptions.map((option) => (
              <option key={option.startDate} value={`${option.startDate}|${option.endDate}`}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : monthlyData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            選択した期間に在籍しているドライバーはいません
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ドライバー名
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      携帯代（円）
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      運賃売上（10%）（円）
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      無事故（円）
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyData.map((data) => (
                    <tr key={data.driver_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.driver_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.phone_allowance}
                            onChange={(e) => updateValue(data.driver_id, 'phone_allowance', e.target.value)}
                            className="w-32 px-3 py-2 text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-700 block text-right">
                            {parseFloat(data.phone_allowance).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.revenue_sales}
                            onChange={(e) => updateValue(data.driver_id, 'revenue_sales', e.target.value)}
                            className="w-32 px-3 py-2 text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-700 block text-right">
                            {parseFloat(data.revenue_sales).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.accident_free_amount}
                            onChange={(e) => updateValue(data.driver_id, 'accident_free_amount', e.target.value)}
                            className="w-32 px-3 py-2 text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-700 block text-right">
                            {parseFloat(data.accident_free_amount).toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <X size={20} />
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={20} />
                    保存
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 size={20} />
                  編集
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
