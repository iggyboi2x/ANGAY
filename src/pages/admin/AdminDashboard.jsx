import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement, 
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import AdminLayout from '../../components/admin/AdminLayout';
import { TrendingUp, Users, Package, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const barData = {
  labels: ['Brgy 1', 'Brgy 2', 'Brgy 3', 'Brgy 4', 'Brgy 5', 'Brgy 6'],
  datasets: [
    {
      label: 'Aid Received (kg)',
      data: [1200, 1900, 3000, 500, 2400, 1100],
      backgroundColor: '#FE9800',
      borderRadius: 12,
    },
    {
      label: 'Target Goal (kg)',
      data: [2000, 2000, 3000, 2000, 2500, 2000],
      backgroundColor: '#F5F5F5',
      borderRadius: 12,
    },
  ],
};

const doughnutData = {
  labels: ['Food Items', 'Medical', 'Hygiene', 'Clothing'],
  datasets: [{
    data: [65, 15, 12, 8],
    backgroundColor: ['#FE9800', '#2ECC71', '#3498DB', '#9B59B6'],
    borderWidth: 0,
    cutout: '75%'
  }]
};

const lineData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [{
    fill: true,
    label: 'Items Distributed',
    data: [450, 780, 520, 1100],
    borderColor: '#FE9800',
    backgroundColor: 'rgba(254, 152, 0, 0.1)',
    tension: 0.4,
    pointRadius: 6,
    pointBackgroundColor: '#FE9800',
    borderWidth: 3
  }]
};

const pieData = {
  labels: ['Targeted Packages', 'General Inventory'],
  datasets: [{
    data: [40, 60],
    backgroundColor: ['#FE9800', '#1A1A1A'],
    borderWidth: 0,
  }]
};

const stats = [
  { label: 'Total Active Users', value: '1,284', change: '+12%', icon: Users, color: 'blue' },
  { label: 'System Velocity', value: '84.2%', change: '+5.4%', icon: TrendingUp, color: 'orange' },
  { label: 'Pending Verifications', value: '42', change: '-2', icon: AlertCircle, color: 'red' },
  { label: 'Total Items Moved', value: '12.4k', change: '+18%', icon: Package, color: 'green' },
];

export default function AdminDashboard() {
  return (
    <AdminLayout title="System Intelligence">
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  stat.color === 'orange' ? 'bg-orange-50 text-orange-500' :
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                  stat.color === 'red' ? 'bg-red-50 text-red-500' :
                  'bg-green-50 text-green-500'
                } group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${
                  stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-[#1A1A1A] mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Distribution Equity */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight">Distribution Equity</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Aid Received vs Target Goals per Barangay</p>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <Package size={18} />
              </div>
            </div>
            <div className="h-[300px]">
              <Bar 
                data={barData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: { 
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                  },
                  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10, weight: 'bold' } } } }
                }} 
              />
            </div>
          </div>

          {/* System Velocity */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight">System Velocity</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Movement volume over last 30 days</p>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="h-[300px]">
              <Line 
                data={lineData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: { 
                    y: { beginAtZero: true, grid: { color: '#F8F9FA' } },
                    x: { grid: { display: false } }
                  },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>

          {/* Inventory Composition */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight">Inventory Composition</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ratio of Item Categories In Stock</p>
              </div>
            </div>
            <div className="h-[250px] relative flex items-center justify-center">
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-[#1A1A1A]">8.4k</span>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Total Units</span>
              </div>
              <Doughnut 
                data={doughnutData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { size: 10, weight: 'bold' } } } }
                }} 
              />
            </div>
          </div>

          {/* Package vs General */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight">Package vs General Ratio</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Targeted Packages vs Available Inventory</p>
              </div>
            </div>
            <div className="h-[250px]">
              <Pie 
                data={pieData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { size: 10, weight: 'bold' } } } }
                }} 
              />
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
