import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabase';
import Sidebar from '../components/foodbank/FoodbankSidebar';
import Input from '../components/Input';
import Button from '../components/Button';
import { 
  LayoutDashboard, MessageSquare, Package, Gift, Box, Camera
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/foodbank/dashboard' },
  { label: 'Messages', icon: MessageSquare, path: '/foodbank/messages' },
  { label: 'Inventory', icon: Package, path: '/foodbank/inventory' },
  { label: 'Packages', icon: Box, path: '/foodbank/packages' },
  { label: 'Donations', icon: Gift, path: '/foodbank/donations' },
];

export default function AccountSettings() {
  const [photoUrl, setPhotoUrl] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [donationReminders, setDonationReminders] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);

  const [orgData, setOrgData] = useState({
    org_name: '',
    contact: '',
    address: '',
    operating_hours: '',
    website_url: '',
  });
  const [originalOrgData, setOriginalOrgData] = useState(null);

  const hasOrgChanges = originalOrgData &&
    JSON.stringify(orgData) !== JSON.stringify(originalOrgData);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('user.id:', user.id); // 👈 check this in console

      // Load contact + avatar from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('contact, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      console.log('profile:', profile, profileError);

      if (profile?.avatar_url) setPhotoUrl(profile.avatar_url);

      // Load from foodbanks
      const { data: foodbank, error: foodbankError } = await supabase
        .from('foodbanks')
        .select('org_name, address, operating_hours, website_url')
        .eq('id', user.id)
        .maybeSingle();

      console.log('foodbank:', foodbank, foodbankError);

      const loaded = {
        org_name: foodbank?.org_name || '',
        contact: profile?.contact || '',
        address: foodbank?.address || '',
        operating_hours: foodbank?.operating_hours || '',
        website_url: foodbank?.website_url || '',
      };

      setOrgData(loaded);
      setOriginalOrgData(loaded);
    };

    loadProfile();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('Image must be under 50MB.');
      return;
    }

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: publicUrl });

      if (updateError) throw updateError;

      setPhotoUrl(publicUrl);
      alert('Photo updated successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveOrg = async () => {
    try {
      setSavingOrg(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error: foodbankError } = await supabase
        .from('foodbanks')
        .update({
          org_name: orgData.org_name,
          address: orgData.address,
          operating_hours: orgData.operating_hours,
          website_url: orgData.website_url,
        })
        .eq('id', user.id);

      if (foodbankError) throw foodbankError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ contact: orgData.contact })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setOriginalOrgData({ ...orgData });
      alert('Organization info saved!');
    } catch (error) {
      alert('Failed to save: ' + error.message);
    } finally {
      setSavingOrg(false);
    }
  };

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
            <h1 className="text-2xl mb-8">Account Settings</h1>

            {/* Profile Photo Section */}
            <div className="border-b border-[#F0F0F0] pb-8 mb-8">
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full border-[3px] border-[#FE9800] object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-[3px] border-[#FE9800] bg-[#FE9800] flex items-center justify-center text-white text-3xl font-bold">
                      CF
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#FE9800] rounded-full flex items-center justify-center shadow-md hover:bg-[#C97700] transition-colors"
                  >
                    <Camera size={14} className="text-white" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Change Photo'}
                </Button>

                <p className="text-xs text-[#888888] mt-1" style={{ fontFamily: 'DM Sans' }}>
                  JPG, PNG or GIF · Max 50MB
                </p>
              </div>
            </div>

            {/* Organization Information */}
            <div className="border-b border-[#F0F0F0] pb-8 mb-8">
              <h2 className="text-lg mb-4">Organization Information</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  label="Organization Name"
                  value={orgData.org_name}
                  onChange={(e) => setOrgData({ ...orgData, org_name: e.target.value })}
                />
                <Input
                  label="Contact Number"
                  value={orgData.contact}
                  onChange={(e) => setOrgData({ ...orgData, contact: e.target.value })}
                />
                <div className="col-span-2">
                  <Input
                    label="Address"
                    value={orgData.address}
                    onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                  />
                </div>
                <Input
                  label="Operating Hours"
                  value={orgData.operating_hours}
                  onChange={(e) => setOrgData({ ...orgData, operating_hours: e.target.value })}
                />
                <Input
                  label="Website URL"
                  value={orgData.website_url}
                  onChange={(e) => setOrgData({ ...orgData, website_url: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveOrg}
                  disabled={!hasOrgChanges || savingOrg}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    hasOrgChanges
                      ? 'bg-[#FE9800] text-white hover:bg-[#C97700] cursor-pointer'
                      : 'bg-[#F0F0F0] text-[#BBBBBB] cursor-not-allowed'
                  }`}
                  style={{ fontFamily: 'DM Sans' }}
                >
                  {savingOrg ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Account Details */}
            <div className="border-b border-[#F0F0F0] pb-8 mb-8">
              <h2 className="text-lg mb-4">Account Details</h2>
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
              <h2 className="text-lg mb-4">Notifications</h2>
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
              <h2 className="text-lg mb-2 text-[#E74C3C]">Danger Zone</h2>
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