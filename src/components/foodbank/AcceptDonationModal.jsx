import { useState, useEffect } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { supabase } from '../../../supabase';
import { X, Check, Package, Calendar, Tag } from 'lucide-react';

const UNITS = ['kg', 'g', 'pcs', 'cans', 'packs', 'liters', 'bottles', 'boxes', 'sachets'];

export default function AcceptDonationModal({ donation, onClose, onConfirm }) {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    parseItems();
  }, [donation]);

  async function fetchCategories() {
    const { data } = await supabase.from('item_categories').select('*').order('name');
    setCategories(data || []);
  }

  function parseItems() {
    if (!donation?.items) return;
    
    // Example items: "Rice 10kg, Canned Goods 5packs, Water 2bottles"
    const itemParts = donation.items.split(',').map(s => s.trim());
    const parsedRows = itemParts.map(part => {
      // Basic regex to find the last occurrence of space followed by a number
      // This is a bit fragile but matches the insertion logic: `${name} ${qty}${unit}`
      const match = part.match(/(.+)\s+(\d+)([a-zA-Z]+)$/);
      if (match) {
        return {
          item_name: match[1],
          quantity: match[2],
          unit: match[3],
          category_id: '',
          expiration_date: ''
        };
      }
      return {
        item_name: part,
        quantity: '1',
        unit: 'pcs',
        category_id: '',
        expiration_date: ''
      };
    });
    setRows(parsedRows);
  }

  function updateRow(idx, field, val) {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: val };
    setRows(newRows);
    
    // Clear error for this field
    const key = `${idx}-${field}`;
    if (errors[key]) {
      const newErrors = { ...errors };
      delete newErrors[key];
      setErrors(newErrors);
    }
  }

  function validate() {
    const newErrors = {};
    rows.forEach((row, idx) => {
      if (!row.item_name) newErrors[`${idx}-item_name`] = true;
      if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) 
        newErrors[`${idx}-quantity`] = true;
      if (!row.category_id) newErrors[`${idx}-category_id`] = true;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    await onConfirm(rows);
    setLoading(false);
  }

  const isPackage = !!donation?.barangay_name;

  return (
    <Modal isOpen={true} onClose={onClose} title={isPackage ? "Create Donation Package" : "Accept & Inventory Donation"} width="xl">
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 items-start">
          <Package className="text-[#FE9800] mt-0.5" size={18} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#1A1A1A]">
                {isPackage ? 'Create Direct Package' : 'Verify Items for Inventory'}
              </p>
              {isPackage && (
                <span className="text-[10px] bg-[#FE9800] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                  Target: {donation.barangay_name}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isPackage 
                ? `This donor requested these items be sent to ${donation.barangay_name}. Confirming will create a pre-packed bundle ready for distribution.`
                : 'Please review the donor\'s items below. Assign categories and verify quantities to add them to your foodbank\'s inventory.'}
            </p>
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-100">
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">Item Name</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-wider w-32">Qty</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-wider w-24">Unit</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-wider w-40">Category</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-wider w-40">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2">
                    <input 
                      value={row.item_name}
                      onChange={e => updateRow(idx, 'item_name', e.target.value)}
                      className={`w-full px-3 py-1.5 bg-transparent border-2 rounded-lg outline-none transition-all text-xs font-medium ${errors[`${idx}-item_name`] ? 'border-red-200 focus:border-red-500 bg-red-50' : 'border-transparent focus:border-[#FE9800] focus:bg-white'}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input 
                      type="number"
                      value={row.quantity}
                      onChange={e => updateRow(idx, 'quantity', e.target.value)}
                      className={`w-full px-3 py-1.5 bg-transparent border-2 rounded-lg outline-none transition-all text-xs font-medium ${errors[`${idx}-quantity`] ? 'border-red-200 focus:border-red-500 bg-red-50' : 'border-transparent focus:border-[#FE9800] focus:bg-white'}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select 
                      value={row.unit}
                      onChange={e => updateRow(idx, 'unit', e.target.value)}
                      className="w-full px-1 py-1.5 bg-transparent border-2 border-transparent rounded-lg outline-none focus:border-[#FE9800] focus:bg-white text-xs font-medium"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select 
                      value={row.category_id}
                      onChange={e => updateRow(idx, 'category_id', e.target.value)}
                      className={`w-full px-1 py-1.5 bg-transparent border-2 rounded-lg outline-none transition-all text-xs font-medium ${errors[`${idx}-category_id`] ? 'border-red-200 focus:border-red-500 bg-red-50' : 'border-transparent focus:border-[#FE9800] focus:bg-white'}`}
                    >
                      <option value="">Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input 
                      type="date"
                      value={row.expiration_date}
                      onChange={e => updateRow(idx, 'expiration_date', e.target.value)}
                      className="w-full px-1 py-1.5 bg-transparent border-2 border-transparent rounded-lg outline-none focus:border-[#FE9800] focus:bg-white text-xs font-medium"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button 
            variant="primary" 
            icon={<Check size={18} />} 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? 'Processing...' : (isPackage ? 'Confirm & Create Package' : 'Confirm & Add to Inventory')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
