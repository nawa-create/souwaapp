import { useState, useEffect } from 'react';
import { supabase, OvertimeRate } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Save, X } from 'lucide-react';

const overtimeTypes = [
  '深夜時間',
  '内深夜時間',
  '早出時間',
  '土・祝時間',
  '土・祝深夜時間',
  '法定休日',
  '法定休日深夜',
];

export default function OvertimeRateManagement() {
  const [rates, setRates] = useState<OvertimeRate[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    overtime_type: overtimeTypes[0],
    hourly_rate: '',
    effective_date: '',
  });

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    const { data, error } = await supabase
      .from('overtime_rates')
      .select('*')
      .order('effective_date', { ascending: false });

    if (!error && data) {
      setRates(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('overtime_rates')
        .update({
          overtime_type: formData.overtime_type,
          hourly_rate: parseFloat(formData.hourly_rate),
          effective_date: formData.effective_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (!error) {
        setEditingId(null);
        resetForm();
        fetchRates();
      }
    } else {
      const { error } = await supabase.from('overtime_rates').insert([
        {
          overtime_type: formData.overtime_type,
          hourly_rate: parseFloat(formData.hourly_rate),
          effective_date: formData.effective_date,
        },
      ]);

      if (!error) {
        setIsAdding(false);
        resetForm();
        fetchRates();
      }
    }
  };

  const handleEdit = (rate: OvertimeRate) => {
    setEditingId(rate.id);
    setFormData({
      overtime_type: rate.overtime_type,
      hourly_rate: rate.hourly_rate.toString(),
      effective_date: rate.effective_date,
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      overtime_type: overtimeTypes[0],
      hourly_rate: '',
      effective_date: '',
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">残業単価管理</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            新規登録
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                残業種類 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.overtime_type}
                onChange={(e) => setFormData({ ...formData, overtime_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {overtimeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                時間単価（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                適用開始日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X size={20} />
              キャンセル
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={20} />
              {editingId ? '更新' : '登録'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                残業種類
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                時間単価（円）
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                適用開始日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rates.map((rate) => (
              <tr key={rate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {rate.overtime_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {rate.hourly_rate.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {rate.effective_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => handleEdit(rate)}
                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                  >
                    <Edit2 size={16} />
                    編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
