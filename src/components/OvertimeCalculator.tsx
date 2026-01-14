import { useState, useEffect } from 'react';
import { supabase, Driver } from '../lib/supabase';
import { Calculator, Save } from 'lucide-react';

type CalculationResult = {
  late_night_hours: number;
  inner_late_night_hours: number;
  early_hours: number;
  saturday_hours: number;
  saturday_late_night_hours: number;
  holiday_hours: number;
  holiday_late_night_hours: number;
  legal_holiday_hours: number;
  legal_holiday_late_night_hours: number;
};

export default function OvertimeCalculator() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakTime, setBreakTime] = useState('');
  const [breakSign, setBreakSign] = useState<'+' | '-'>('+');
  const [transferTime, setTransferTime] = useState('');
  const [isSaturday, setIsSaturday] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [isLegalHoliday, setIsLegalHoliday] = useState(false);
  const [isCarStay, setIsCarStay] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    const { data } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_active', true)
      .order('dispatch_order', { ascending: true, nullsLast: true });

    if (data) {
      setDrivers(data);
    }
  };

  const timeToMinutes = (time: string): number => {
    const parts = time.split(':').map(Number);
    if (parts.length !== 2) return 0;
    const [hours, minutes] = parts;
    return hours * 60 + minutes;
  };

  const minutesToHours = (minutes: number): number => {
    return minutes / 60;
  };

  const isInRange = (time: number, start: number, end: number): boolean => {
    if (start <= end) {
      return time >= start && time < end;
    } else {
      return time >= start || time < end;
    }
  };

  const calculateOvertime = () => {
    if (!startTime || !endTime) return;

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const breakDiffMinutes = timeToMinutes(breakTime);
    const transferMinutes = timeToMinutes(transferTime);

    // 拘束時間を計算（日をまたぐ場合の処理）
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    // 終了時刻（日をまたぐ場合を考慮）
    let workEndMinutes = startMinutes + totalMinutes;

    // 実休憩時間を計算（祝日・法定休日の実労働時間計算用）
    const actualBreakMinutes = breakSign === '+' 
      ? (60 - breakDiffMinutes)
      : (60 + breakDiffMinutes);

    // 深夜帯の設定
    const LATE_NIGHT_END = 5 * 60; // 5:00
    // 5:00より前に開始 → 22:00から深夜、5:00以降に開始 → 22:15から深夜
    const LATE_NIGHT_START = startMinutes < LATE_NIGHT_END ? 22 * 60 : 22 * 60 + 15;
    const STANDARD_WITH_BREAK = 9 * 60; // 所定8時間 + 休憩基準1時間 = 9時間（固定）

    // 基準終了時刻 = 開始 + 9時間（固定）
    const standardEndMinutes = startMinutes + STANDARD_WITH_BREAK;

    // 残業時間 = 終了時刻 - 基準終了時刻（マイナスなら0）
    const overtimeMinutes = Math.max(0, workEndMinutes - standardEndMinutes);

    // 休憩マイナスの場合、深夜帯判定用の終業時刻を調整
    let effectiveWorkEndMinutes = workEndMinutes;
    if (breakSign === '-') {
      effectiveWorkEndMinutes = workEndMinutes - breakDiffMinutes;
    }

    // 結果オブジェクト初期化
    let calculationResult: CalculationResult = {
      late_night_hours: 0,
      inner_late_night_hours: 0,
      early_hours: 0,
      saturday_hours: 0,
      saturday_late_night_hours: 0,
      holiday_hours: 0,
      holiday_late_night_hours: 0,
      legal_holiday_hours: 0,
      legal_holiday_late_night_hours: 0,
    };

    // 深夜帯の勤務時間を計算する共通関数
    const calculateLateNightMinutes = (start: number, end: number): number => {
      let lateNightMinutes = 0;
      let currentTime = start;
      const duration = end - start;
      
      for (let i = 0; i < duration; i++) {
        const normalizedTime = currentTime % (24 * 60);
        // 深夜帯: 22:00/22:15〜24:00 または 0:00〜5:00
        const isInLateNight = normalizedTime >= LATE_NIGHT_START || normalizedTime < LATE_NIGHT_END;
        if (isInLateNight) {
          lateNightMinutes++;
        }
        currentTime++;
      }
      return lateNightMinutes;
    };

    // 深夜帯の勤務時間を取得
    const lateNightMinutes = calculateLateNightMinutes(startMinutes, effectiveWorkEndMinutes);

    // ========== 祝日・法定休日: 全て残業扱い ==========
    if (isLegalHoliday || isHoliday) {
      const totalWorkTime = totalMinutes - actualBreakMinutes;

      const lateNightHours = minutesToHours(lateNightMinutes);
      const totalHours = minutesToHours(totalWorkTime);
      const normalHours = totalHours - lateNightHours;

      if (isLegalHoliday) {
        calculationResult.legal_holiday_hours = normalHours + minutesToHours(transferMinutes);
        calculationResult.legal_holiday_late_night_hours = lateNightHours;
      } else {
        calculationResult.holiday_hours = normalHours + minutesToHours(transferMinutes);
        calculationResult.holiday_late_night_hours = lateNightHours;
      }
    }
    // ========== 土曜: 8時間超が残業 ==========
    else if (isSaturday) {
      // 内深夜 = 深夜帯で勤務した時間（残業と独立）
      calculationResult.inner_late_night_hours = minutesToHours(lateNightMinutes);

      if (overtimeMinutes > 0) {
        // 残業を深夜帯と早出帯に振り分け
        // 残業のうち深夜帯にかかる分を計算
        const lateNightOvertimeMinutes = Math.min(lateNightMinutes, overtimeMinutes);
        const normalOvertimeMinutes = overtimeMinutes - lateNightOvertimeMinutes;

        calculationResult.saturday_late_night_hours = minutesToHours(lateNightOvertimeMinutes);
        calculationResult.saturday_hours = minutesToHours(normalOvertimeMinutes) + minutesToHours(transferMinutes);
      }
    }
    // ========== 平日: 8時間超が残業 ==========
    else {
      // 内深夜 = 深夜帯で勤務した時間（残業と独立）
      calculationResult.inner_late_night_hours = minutesToHours(lateNightMinutes);

      if (overtimeMinutes > 0) {
        // 残業を深夜帯と早出帯に振り分け
        // 残業のうち深夜帯にかかる分を計算
        const lateNightOvertimeMinutes = Math.min(lateNightMinutes, overtimeMinutes);
        const normalOvertimeMinutes = overtimeMinutes - lateNightOvertimeMinutes;

        calculationResult.late_night_hours = minutesToHours(lateNightOvertimeMinutes);
        calculationResult.early_hours = minutesToHours(normalOvertimeMinutes) + minutesToHours(transferMinutes);
      } else {
        // 残業なしでも乗り換え時間があれば早出に加算
        if (transferMinutes > 0) {
          calculationResult.early_hours = minutesToHours(transferMinutes);
        }
      }
    }

    setResult(calculationResult);
  };

  const saveToDatabase = async () => {
    if (!result || !selectedDriver || !selectedDate) {
      return;
    }

    setSaving(true);

    const { data: existing } = await supabase
      .from('daily_overtime_records')
      .select('id')
      .eq('driver_id', selectedDriver)
      .eq('work_date', selectedDate)
      .maybeSingle();

    const recordData = {
      driver_id: selectedDriver,
      work_date: selectedDate,
      late_night_hours: result.late_night_hours,
      inner_late_night_hours: result.inner_late_night_hours,
      early_hours: result.early_hours,
      saturday_hours: result.saturday_hours,
      saturday_late_night_hours: result.saturday_late_night_hours,
      holiday_hours: result.holiday_hours,
      holiday_late_night_hours: result.holiday_late_night_hours,
      legal_holiday_hours: result.legal_holiday_hours,
      legal_holiday_late_night_hours: result.legal_holiday_late_night_hours,
      start_time: startTime,
      end_time: endTime,
      break_time: breakSign === '+' ? breakTime : `-${breakTime}`,
      transfer_time: transferTime,
      vacuum_count: 0,
      car_stay_count: isCarStay ? 1 : 0,
      boarding_count: 0,
      training_count: 0,
      guidance_count: 0,
    };

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('daily_overtime_records')
        .update(recordData)
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('daily_overtime_records')
        .insert([recordData]));
    }

    setSaving(false);

    if (error) {
      console.error('Save error:', error);
    } else {
      setStartTime('');
      setEndTime('');
      setBreakTime('');
      setBreakSign('+');
      setTransferTime('');
      setIsSaturday(false);
      setIsHoliday(false);
      setIsLegalHoliday(false);
      setIsCarStay(false);
      setResult(null);

      setTimeout(() => {
        document.getElementById('start-time-input')?.focus();
      }, 0);
    }
  };

  const formatHours = (hours: number): string => {
    if (hours === 0) return '0:00';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  const renderTimeline = () => {
    const hasData = startTime && endTime;

    let startMinutes = 0;
    let workEndMinutes = 0;
    let transferMinutes = 0;
    let transferEndMinutes = 0;
    let standardStart = 0;
    let standardEnd = 0;
    let shortageMinutes = 0;
    let overtimeStart = 0;
    let overtimeEnd = 0;
    let breakStartMinutes = 0;
    let breakEndMinutes = 0;
    let isInnerLateNightCase = false;
    const lateNightEnd = 5 * 60;

    if (hasData) {
      startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      const breakDiffMinutes = timeToMinutes(breakTime);
      transferMinutes = timeToMinutes(transferTime);

      workEndMinutes = endMinutes;
      if (endMinutes < startMinutes) {
        workEndMinutes += 24 * 60;
      }

      const actualBreakMinutes = breakSign === '+'
        ? 60 - breakDiffMinutes
        : breakDiffMinutes;

      if (breakSign === '-') {
        breakStartMinutes = workEndMinutes - breakDiffMinutes;
        breakEndMinutes = workEndMinutes;
      }

      transferEndMinutes = workEndMinutes + transferMinutes;

      const totalWorkTime = workEndMinutes - startMinutes - actualBreakMinutes;
      const standardWorkMinutes = 8 * 60;
      const standardWithBreakMinutes = 9 * 60;
      const isOver8Hours = totalWorkTime > standardWithBreakMinutes;
      const lateNightEnd = 5 * 60;

      isInnerLateNightCase = !isOver8Hours && !isSaturday && !isHoliday && !isLegalHoliday && startMinutes < lateNightEnd;

      shortageMinutes = breakSign === '+' ? breakDiffMinutes : 0;

      const totalStandardMinutes = 9 * 60;
      const blueMinutes = totalStandardMinutes - shortageMinutes;

      if (isInnerLateNightCase) {
        standardStart = startMinutes;
        standardEnd = standardStart + blueMinutes;
      } else {
        standardStart = startMinutes < 5 * 60 ? 5 * 60 : startMinutes;
        standardEnd = standardStart + blueMinutes;
      }

      overtimeStart = standardEnd;
      overtimeEnd = standardStart + totalStandardMinutes;
    }

    const getPosition = (minutes: number) => {
      const normalizedMinutes = minutes >= 30 * 60 ? minutes - 30 * 60 : minutes;
      return (normalizedMinutes / (30 * 60)) * 100;
    };

    const getWidth = (startMin: number, endMin: number) => {
      let width = ((endMin - startMin) / (30 * 60)) * 100;
      return Math.max(0, width);
    };

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">時間帯表示</h4>

        <div className="relative">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            {Array.from({ length: 31 }, (_, i) => (
              <span key={i} className="w-0">{i}</span>
            ))}
          </div>

          <div className="relative h-16 border-t border-b border-gray-300 bg-white">
            <div className="absolute top-0 left-0 right-0 h-8 border-b border-gray-200">
              {hasData && (
                <>
                  <div
                    className="absolute h-full bg-red-500 opacity-70"
                    style={{
                      left: `${getPosition(startMinutes)}%`,
                      width: `${getWidth(startMinutes, workEndMinutes)}%`
                    }}
                  />
                  {breakSign === '-' && breakStartMinutes > 0 && (
                    <div
                      className="absolute h-full bg-black opacity-70"
                      style={{
                        left: `${getPosition(breakStartMinutes)}%`,
                        width: `${getWidth(breakStartMinutes, breakEndMinutes)}%`
                      }}
                    />
                  )}
                  {transferMinutes > 0 && (
                    <div
                      className="absolute h-full bg-orange-500 opacity-70"
                      style={{
                        left: `${getPosition(workEndMinutes)}%`,
                        width: `${getWidth(workEndMinutes, transferEndMinutes)}%`
                      }}
                    />
                  )}
                  {isInnerLateNightCase && (
                    <div
                      className="absolute h-full bg-green-700 opacity-70"
                      style={{
                        left: `${getPosition(startMinutes)}%`,
                        width: `${getWidth(startMinutes, Math.min(lateNightEnd, workEndMinutes))}%`
                      }}
                    />
                  )}
                </>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-8">
              {hasData && (
                <>
                  {shortageMinutes > 0 && (
                    <div
                      className="absolute h-full bg-green-500 opacity-70"
                      style={{
                        left: `${getPosition(overtimeStart)}%`,
                        width: `${getWidth(overtimeStart, overtimeEnd)}%`
                      }}
                    />
                  )}
                  <div
                    className={`absolute h-full opacity-70 ${
                      isLegalHoliday
                        ? 'bg-pink-500'
                        : isHoliday
                        ? 'bg-orange-500'
                        : isSaturday
                        ? 'bg-orange-300'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      left: `${getPosition(standardStart)}%`,
                      width: `${getWidth(standardStart, standardEnd)}%`
                    }}
                  />
                </>
              )}
            </div>

            <div className="absolute inset-0 flex">
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i} className="flex-1 border-r border-gray-200 last:border-r-0" />
              ))}
            </div>
          </div>

          <div className="flex mt-3 gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-red-500 opacity-70" />
              <span>勤務時間</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-black opacity-70" />
              <span>休憩時間（マイナス休憩）</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-orange-500 opacity-70" />
              <span>乗り換え時間</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-blue-500 opacity-70" />
              <span>所定労働時間（平日）</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-orange-300 opacity-70" />
              <span>所定労働時間（土曜）</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-orange-500 opacity-70" />
              <span>所定労働時間（祝日）</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-pink-500 opacity-70" />
              <span>所定労働時間（法定休日）</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-green-500 opacity-70" />
              <span>休憩不足分</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-green-700 opacity-70" />
              <span>内深夜時間</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold text-gray-800">残業時間計算ツール</h3>
        </div>

        {renderTimeline()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                勤務開始時間
              </label>
              <input
                id="start-time-input"
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('end-time-input')?.focus();
                  }
                }}
                placeholder="例: 08:00"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                勤務終了時間
              </label>
              <input
                id="end-time-input"
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('break-time-input')?.focus();
                  }
                }}
                placeholder="例: 17:00 または 25:00"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                休憩時間（1時間基準との差分）
              </label>
              <div className="flex gap-2">
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setBreakSign('+')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                      breakSign === '+'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ＋
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakSign('-')}
                    className={`px-4 py-2 font-semibold border-l border-gray-300 transition-colors ${
                      breakSign === '-'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ー
                  </button>
                </div>
                <input
                  id="break-time-input"
                  type="text"
                  value={breakTime}
                  onChange={(e) => setBreakTime(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('transfer-time-input')?.focus();
                    }
                  }}
                  placeholder="例: 00:10"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                ＋：休憩1時間未満（労働時間プラス） / ー：休憩1時間超過（労働時間マイナス）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                乗り換え時間
              </label>
              <input
                id="transfer-time-input"
                type="text"
                value={transferTime}
                onChange={(e) => setTransferTime(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    calculateOvertime();
                  }
                }}
                placeholder="例: 00:30"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSaturday}
                  onChange={(e) => {
                    setIsSaturday(e.target.checked);
                    if (e.target.checked) {
                      setIsHoliday(false);
                      setIsLegalHoliday(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">土曜</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHoliday}
                  onChange={(e) => {
                    setIsHoliday(e.target.checked);
                    if (e.target.checked) {
                      setIsSaturday(false);
                      setIsLegalHoliday(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">祝日</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLegalHoliday}
                  onChange={(e) => {
                    setIsLegalHoliday(e.target.checked);
                    if (e.target.checked) {
                      setIsSaturday(false);
                      setIsHoliday(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">法定休日（日曜）</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCarStay}
                  onChange={(e) => setIsCarStay(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">車泊</span>
              </label>
            </div>

            <button
              onClick={calculateOvertime}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              計算する
            </button>
          </div>

          {result && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-gray-800 mb-3">計算結果</h4>
                {result.late_night_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">深夜時間:</span>
                    <span className="font-medium">{formatHours(result.late_night_hours)}</span>
                  </div>
                )}
                {result.inner_late_night_hours > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">内深夜時間:</span>
                      <span className="font-medium">{formatHours(result.inner_late_night_hours)}</span>
                    </div>
                    {result.early_hours > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">早出時間:</span>
                        <span className="font-medium">{formatHours(result.early_hours)}</span>
                      </div>
                    )}
                  </>
                )}
                {result.early_hours > 0 && !result.inner_late_night_hours && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">早出時間:</span>
                    <span className="font-medium">{formatHours(result.early_hours)}</span>
                  </div>
                )}
                {result.saturday_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">土曜時間:</span>
                    <span className="font-medium">{formatHours(result.saturday_hours)}</span>
                  </div>
                )}
                {result.saturday_late_night_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">土曜深夜:</span>
                    <span className="font-medium">{formatHours(result.saturday_late_night_hours)}</span>
                  </div>
                )}
                {result.holiday_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">祝日時間:</span>
                    <span className="font-medium">{formatHours(result.holiday_hours)}</span>
                  </div>
                )}
                {result.holiday_late_night_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">祝日深夜:</span>
                    <span className="font-medium">{formatHours(result.holiday_late_night_hours)}</span>
                  </div>
                )}
                {result.legal_holiday_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">法定休日:</span>
                    <span className="font-medium">{formatHours(result.legal_holiday_hours)}</span>
                  </div>
                )}
                {result.legal_holiday_late_night_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">法定休日深夜:</span>
                    <span className="font-medium">{formatHours(result.legal_holiday_late_night_hours)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 mt-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-800">合計時間:</span>
                    <span className="text-blue-600">{formatHours(
                      result.late_night_hours +
                      result.early_hours +
                      result.saturday_hours +
                      result.saturday_late_night_hours +
                      result.holiday_hours +
                      result.holiday_late_night_hours +
                      result.legal_holiday_hours +
                      result.legal_holiday_late_night_hours
                    )}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ドライバー選択
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日付選択
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={saveToDatabase}
                disabled={saving || !selectedDriver}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save size={20} />
                {saving ? '保存中...' : 'データベースに保存'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
