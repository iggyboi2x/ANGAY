import React, { useState } from 'react';
import Sidebar from '../components/foodbank/FoodbankSidebar';
import Input from '../components/Input';
import Button from '../components/Button';
import { 
  LayoutDashboard, MessageSquare, Package, Gift, Box
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/foodbank/dashboard' },
  { label: 'Messages', icon: MessageSquare, path: '/foodbank/messages' },
  { label: 'Inventory', icon: Package, path: '/foodbank/inventory' },
  { label: 'Packages', icon: Box, path: '/foodbank/packages' },
  { label: 'Donations', icon: Gift, path: '/foodbank/donations' },
];

export default function AccountSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [donationReminders, setDonationReminders] = useState(true);

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-[#FE9800]' : 'bg-[#CCCCCC]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
      <div className="flex min-h-screen bg-white">
      <Sidebar navItems={navItems} />
      
      <div className="ml-60 flex-1">
        <div className="p-8">
          <div className="max-w-[680px] mx-auto">
            <h1 className="text-2xl mb-8">
              Account Settings
            </h1>

            {/* Profile Photo Section */}
            <div className="border-b border-[#F0F0F0] pb-8 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-[3px] border-[#FE9800] bg-[#FE9800] flex items-center justify-center text-white text-3xl font-bold mb-3">
                  CF
                </div>
                <Button variant="ghost">Change Photo</Button>
              </div>
            </div>

            {/* Organization Information */}
            <div className="border-b border-[#F0F0F0] pb-8 mb-8">
              <h2 className="text-lg mb-4">
                Organization Information
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input label="Organization Name" defaultValue="Cebu City Food Bank" />
                <Input label="Contact Number" defaultValue="+63 917 123 4567" />
                <div className="col-span-2">
                  <Input label="Address" defaultValue="123 Main St, Cebu City, Philippines" />
                </div>
                <Input label="Operating Hours" defaultValue="Mon-Fri 8AM-5PM" />
                <Input label="Website" defaultValue="www.cebufoodbank.org" />
              </div>
              <div className="flex justify-end">
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>

            {/* Account Details */}
            <div className="border-b border-[#F0F0F0] pb-8 mb-8">
              <h2 className="text-lg mb-4">
                Account Details
              </h2>
              <div className="space-y-4 mb-4">
                <div className="flex items-center gap-4">
                  <Input 
                    label="Email" 
                    defaultValue="foodbank@cebu.org" 
                    disabled
                    className="bg-[#F5F5F5] flex-1"
                  />
                  <button className="text-[#FE9800] text-sm underline hover:text-[#C97700] mt-5" style={{ fontFamily: 'DM Sans' }}>
                    Change Email →
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <Input 
                    label="Password" 
                    type="password"
                    defaultValue="••••••••" 
                    disabled
                    className="bg-[#F5F5F5] flex-1"
                  />
                  <Button variant="secondary" className="mt-5">Change Password</Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>

            {/* Notifications */}
            <div className="border-b border-[#F0F0F0] pb-8 mb-8">
              <h2 className="text-lg mb-4">
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ fontFamily: 'DM Sans' }}>
                      Email Notifications
                    </div>
                    <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
                      Receive updates and alerts via email
                    </div>
                  </div>
                  <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ fontFamily: 'DM Sans' }}>
                      SMS Alerts
                    </div>
                    <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
                      Receive urgent notifications via SMS
                    </div>
                  </div>
                  <Toggle checked={smsAlerts} onChange={setSmsAlerts} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ fontFamily: 'DM Sans' }}>
                      Donation Reminders
                    </div>
                    <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
                      Get reminders for pending donations
                    </div>
                  </div>
                  <Toggle checked={donationReminders} onChange={setDonationReminders} />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#FDECEA] border border-[#E74C3C] rounded-[16px] p-6">
              <h2 className="text-lg mb-2 text-[#E74C3C]">
                Danger Zone
              </h2>
              <p className="text-sm text-[#888888] mb-4" style={{ fontFamily: 'DM Sans' }}>
                Deactivating your account will remove all your data and cannot be undone.
              </p>
              <Button variant="destructive" className="!border !border-[#E74C3C] !bg-transparent !text-[#E74C3C] hover:!bg-[#E74C3C] hover:!text-white">
                Deactivate Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}