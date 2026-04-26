import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, Pencil, Trash2, Clock, Calendar as CalIcon } from 'lucide-react';
import { supabase } from '../../supabase';
import { useProfile } from '../hooks/useProfile';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function CalendarPanel({ isOpen, onClose }) {
  const today = new Date();
  const { id: barangayId } = useProfile();
  
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', start_time: '', end_time: '' });

  const grid = getGrid(year, month);

  useEffect(() => {
    if (isOpen && barangayId) {
      fetchEvents();
    }
  }, [isOpen, year, month, barangayId]);

  const fetchEvents = async () => {
    setLoading(true);
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

    try {
      const { data, error } = await supabase
        .from('barangay_events')
        .select('*')
        .eq('barangay_id', barangayId)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !barangayId) return;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const payload = {
      ...form,
      barangay_id: barangayId,
      event_date: dateStr,
    };

    try {
      let error;
      if (editingEvent) {
        const { error: err } = await supabase
          .from('barangay_events')
          .update(payload)
          .eq('id', editingEvent.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('barangay_events')
          .insert([payload]);
        error = err;
      }

      if (error) throw error;
      setIsModalOpen(false);
      setEditingEvent(null);
      setForm({ title: '', description: '', start_time: '', end_time: '' });
      fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const { error } = await supabase.from('barangay_events').delete().eq('id', id);
      if (error) throw error;
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const openEdit = (e) => {
    setEditingEvent(e);
    setForm({ 
      title: e.title, 
      description: e.description || '', 
      start_time: e.start_time || '', 
      end_time: e.end_time || '' 
    });
    setIsModalOpen(true);
  };

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const selectedDateEvents = events.filter(e => {
    const d = new Date(e.event_date).getDate();
    return d === selectedDay;
  });

  const eventDays = events.map(e => new Date(e.event_date).getDate());

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />}

      {/* Sliding Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-[350px] bg-white z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Panel Header */}
        <div className="h-14 border-b border-[#F0F0F0] flex items-center justify-between px-5 shrink-0">
          <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Calendar</span>
          <button onClick={onClose} className="p-1.5 text-[#888888] hover:text-[#1A1A1A] transition-colors rounded-full hover:bg-[#F5F5F5]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 text-[#888888] hover:text-[#FE9800] transition-colors rounded-full hover:bg-[#FFF3DC]">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 text-[#888888] hover:text-[#FE9800] transition-colors rounded-full hover:bg-[#FFF3DC]">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[11px] font-semibold text-[#AAAAAA] py-1" style={{ fontFamily: 'DM Sans' }}>{d}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {grid.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                {d ? (
                  <>
                    <div
                      onClick={() => setSelectedDay(d)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-xs cursor-pointer transition-all
                        ${d === selectedDay ? 'ring-2 ring-[#FE9800] ring-offset-2' : ''}
                        ${d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                          ? 'bg-[#FE9800] text-white font-bold shadow-md shadow-orange-100'
                          : 'text-[#333] hover:bg-[#FFF3DC]'
                        }`}
                      style={{ fontFamily: 'DM Sans' }}
                    >
                      {d}
                    </div>
                    {eventDays.includes(d) && (
                      <div className="w-1 h-1 rounded-full bg-[#FE9800] mt-0.5" />
                    )}
                  </>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>
            ))}
          </div>

          <hr className="border-[#F0F0F0] my-5" />

          {/* Events for Selected Day */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-[#AAAAAA] tracking-widest uppercase" style={{ fontFamily: 'DM Sans' }}>
              Events for {MONTH_NAMES[month]} {selectedDay}
            </h3>
            <button 
              onClick={() => { setEditingEvent(null); setForm({ title: '', description: '', start_time: '', end_time: '' }); setIsModalOpen(true); }}
              className="p-1 text-[#FE9800] hover:bg-[#FFF3DC] rounded-lg transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {selectedDateEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-[#F9FAFB] rounded-full flex items-center justify-center mx-auto mb-2">
                <CalIcon size={18} className="text-[#AAAAAA]" />
              </div>
              <p className="text-[11px] text-[#AAAAAA]" style={{ fontFamily: 'DM Sans' }}>No events scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map(e => (
                <div key={e.id} className="group relative bg-[#F9FAFB] border border-[#F0F0F0] rounded-xl p-3 hover:border-[#FE9800]/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#1A1A1A] mb-0.5" style={{ fontFamily: 'DM Sans' }}>{e.title}</p>
                      {e.description && <p className="text-[10px] text-[#888888] line-clamp-2 mb-1.5">{e.description}</p>}
                      <div className="flex items-center gap-1.5 text-[10px] text-[#FE9800] font-medium">
                        <Clock size={10} />
                        {e.start_time ? e.start_time.slice(0, 5) : 'Anytime'} 
                        {e.end_time ? ` - ${e.end_time.slice(0, 5)}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(e)} className="p-1 text-[#888888] hover:text-[#FE9800] transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1 text-[#888888] hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in duration-200">
            <h2 className="text-base font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: 'DM Sans' }}>
              {editingEvent ? 'Edit Event' : 'New Event'} - {MONTH_NAMES[month]} {selectedDay}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider mb-1.5">Event Title</label>
                <input 
                  type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Community Cleanup"
                  className="w-full px-4 py-2 bg-[#F9FAFB] border border-[#F0F0F0] rounded-xl text-xs outline-none focus:border-[#FE9800] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <textarea 
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Tell us more about the event..."
                  className="w-full px-4 py-2 bg-[#F9FAFB] border border-[#F0F0F0] rounded-xl text-xs outline-none focus:border-[#FE9800] transition-all h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider mb-1.5">Start Time</label>
                  <input 
                    type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                    className="w-full px-4 py-2 bg-[#F9FAFB] border border-[#F0F0F0] rounded-xl text-xs outline-none focus:border-[#FE9800] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wider mb-1.5">End Time</label>
                  <input 
                    type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                    className="w-full px-4 py-2 bg-[#F9FAFB] border border-[#F0F0F0] rounded-xl text-xs outline-none focus:border-[#FE9800] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-[#F0F0F0] text-[#888888] hover:bg-[#F9FAFB] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#FE9800] text-white hover:bg-[#e58a00] shadow-lg shadow-orange-100 transition-all active:scale-95"
              >
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
