import { useState, useEffect } from 'react';
import { supabase, Driver } from '../lib/supabase';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';

type OvertimeRecord = {
  id: string;
  work_date: string;
  late_night_hours: number;
  inner_late_night_hours: number;
  early_hours: number;
  sat_holiday_hours: number;
  sat_holiday_late_night_hours: number;
  legal_holiday_hours: number;
  legal_holiday_late_night_hours: number;
  start_time?: string;
  end_time?: string;
  break_time?: string;
  transfer_time?: string;
};

export default function OvertimeHistory() {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    if (selectedDriver && selectedMonth) {
      loadRecords();
    }
  }, [selectedDriver, selectedMonth]);

  const loadDrivers = async () => {
    const { data } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_active', true)
      .order('dispatch_order', { ascending: true, nullsLast: true });

    if (data) {
      setDrivers(data);
      if (data.length > 0) {
        setSelectedDriver(data[0].id);
      }
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDateStr = `${year}-${month}-${endDate}`;

    const { data } = await supabase
      .from('daily_overtime_records')
      .select('*')
      .eq('driver_id', selectedDriver)
      .gte('work_date', startDate)
      .lte('work_date', endDateStr)
      .order('work_date', { ascending: true });

    setRecords(data || []);
    setLoading(false);
  };

  const formatHours = (hours: number): string => {
    if (hours === 0) return '0:00';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  const getTotalHours = (record: OvertimeRecord): number => {
    return (
      record.late_night_hours +
      record.early_hours +
      record.sat_holiday_hours +
      record.sat_holiday_late_night_hours +
      record.legal_holiday_hours +
      record.legal_holiday_late_night_hours
    );
  };

  const renderTimeline = (record: OvertimeRecord) => {
    if (!record.start_time || !record.end_time) {
      return (
        <div className="h-4 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-400">データなし</span>
        </div>
      );
    }

    const timeToMinutes = (time: string): number => {
      const isNegative = time.startsWith('-');
      const cleanTime = isNegative ? time.substring(1) : time;
      const parts = cleanTime.split(':').map(Number);
      if (parts.length !== 2) return 0;
      const [hours, minutes] = parts;
      const totalMinutes = hours * 60 + minutes;
      return isNegative ? -totalMinutes : totalMinutes;
    };

    const startMinutes = timeToMinutes(record.start_time);
    let endMinutes = timeToMinutes(record.end_time);
    const breakDiffMinutes = timeToMinutes(record.break_time || '00:00');
    const transferMinutes = timeToMinutes(record.transfer_time || '00:00');

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const transferEndMinutes = endMinutes + transferMinutes;

    const standardStart = startMinutes < 5 * 60 ? 5 * 60 : startMinutes;
    const shortageMinutes = breakDiffMinutes >= 0 ? breakDiffMinutes : 0;
    const totalStandardMinutes = 9 * 60;
    const blueMinutes = totalStandardMinutes - shortageMinutes;
    const standardEnd = standardStart + blueMinutes;
    const overtimeEnd = standardStart + totalStandardMinutes;

    const getPosition = (minutes: number) => {
      const normalizedMinutes = minutes >= 30 * 60 ? minutes - 30 * 60 : minutes;
      return (normalizedMinutes / (30 * 60)) * 100;
    };

    const getWidth = (startMin: number, endMin: number) => {
      return Math.max(0, ((endMin - startMin) / (30 * 60)) * 100);
    };

    return (
      <div className="relative h-16 border-t border-b border-gray-300 bg-white">
        <div className="absolute top-0 left-0 right-0 h-8 border-b border-gray-200">
          <div
            className="absolute h-full bg-red-500 opacity-70"
            style={{
              left: `${getPosition(startMinutes)}%`,
              width: `${getWidth(startMinutes, endMinutes)}%`,
            }}
          />
          {transferMinutes > 0 && (
            <div
              className="absolute h-full bg-orange-500 opacity-70"
              style={{
                left: `${getPosition(endMinutes)}%`,
                width: `${getWidth(endMinutes, transferEndMinutes)}%`,
              }}
            />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-8">
          <div
            className={`absolute h-full opacity-70 ${
              record.legal_holiday_hours > 0
                ? 'bg-pink-500'
                : record.sat_holiday_hours > 0
                ? 'bg-orange-500'
                : 'bg-blue-500'
            }`}
            style={{
              left: `${getPosition(standardStart)}%`,
              width: `${getWidth(standardStart, standardEnd)}%`,
            }}
          />
          {shortageMinutes > 0 && (
            <div
              className="absolute h-full bg-green-500 opacity-70"
              style={{
                left: `${getPosition(standardEnd)}%`,
                width: `${getWidth(standardEnd, overtimeEnd)}%`,
              }}
            />
          )}
        </div>

        <div className="absolute inset-0 flex">
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="flex-1 border-r border-gray-200 last:border-r-0" />
          ))}
        </div>
      </div>
    );
  };

  const changeMonth = (direction: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const selectedDriverName = drivers.find(d => d.id === selectedDriver)?.name || '';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <History className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold text-gray-800">勤務履歴</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ドライバー選択
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              月選択
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ChevronLeft size={20} />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => changeMonth(1)}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {selectedDriverName}さんの{selectedMonth}のデータがありません
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const totalHours = getTotalHours(record);
              return (
                <div
                  key={record.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-gray-800">
                      {new Date(record.work_date + 'T00:00:00').toLocaleDateString('ja-JP', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
                      合計: {formatHours(totalHours)}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      {Array.from({ length: 31 }, (_, i) => (
                        <span key={i} className="w-0">{i}</span>
                      ))}
                    </div>
                    {renderTimeline(record)}
                  </div>

                  {record.start_time && record.end_time && (
                    <div className="mt-2 text-xs text-gray-600 flex gap-4">
                      <span>開始: {record.start_time}</span>
                      <span>終了: {record.end_time}</span>
                      <span>休憩差分: {record.break_time || '00:00'}</span>
                      {record.transfer_time && record.transfer_time !== '00:00' && (
                        <span>乗換: {record.transfer_time}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {record.late_night_hours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">深夜:</span>
                        <span>{formatHours(record.late_night_hours)}</span>
                      </div>
                    )}
                    {record.inner_late_night_hours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">内深夜:</span>
                        <span>{formatHours(record.inner_late_night_hours)}</span>
                      </div>
                    )}
                    {record.early_hours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">早出:</span>
                        <span>{formatHours(record.early_hours)}</span>
                      </div>
                    )}
                    {record.sat_holiday_hours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">土・祝:</span>
                        <span>{formatHours(record.sat_holiday_hours)}</span>
                      </div>
                    )}
                    {record.sat_holiday_late_night_hours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">土・祝深夜:</span>
                        <span>{formatHours(record.sat_holiday_late_night_hours)}</span>
                      </div>
                    )}
                    {record.legal_holiday_hours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">法定休日:</span>
                        <span>{formatHours(record.legal_holiday_hours)}</span>
                      </div>
                    )}
                    {record.legal_holiday_late_night_hours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">法定休日深夜:</span>
                        <span>{formatHours(record.legal_holiday_late_night_hours)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
