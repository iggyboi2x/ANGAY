import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabase';
import Sidebar from '../components/foodbank/FoodbankSidebar';
import Input from '../components/Input';
import Button from '../components/Button';
import { 
  LayoutDashboard, MessageSquare, Package, Gift, Box, Camera, Eye, EyeOff
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

  // Email change state
  const [currentEmail, setCurrentEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

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

      setCurrentEmail(user.email || '');

      // Load contact from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('contact')
        .eq('id', user.id)
        .maybeSingle();

      console.log('profile:', profile, profileError);

      // Load from foodbanks (including logo_url)
      const { data: foodbank, error: foodbankError } = await supabase
        .from('foodbanks')
        .select('org_name, address, operating_hours, website_url, logo_url')
        .eq('id', user.id)
        .maybeSingle();

      console.log('foodbank:', foodbank, foodbankError);

      if (foodbank?.logo_url) setPhotoUrl(foodbank.logo_url);

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
      const filePath = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Save to foodbanks.logo_url instead of profiles.avatar_url
      const { error: updateError } = await supabase
        .from('foodbanks')
        .update({ logo_url: publicUrl })
        .eq('id', user.id);

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

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    try {
      setEmailChanging(true);
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailSent(true);
    } catch (error) {
      alert('Failed to update email: ' + error.message);
    } finally {
      setEmailChanging(false);
    }
  };


  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    try {
      setPasswordChanging(true);
      // Re-authenticate with current password first
      const { data: { user } } = await supabase.auth.getUser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        setPasswordError('Current password is incorrect.');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError('Failed to update password: ' + error.message);
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setDeactivating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // Delete from foodbanks
      await supabase.from('foodbanks').delete().eq('id', user.id);
      // Delete from profiles
      await supabase.from('profiles').delete().eq('id', user.id);
      // Sign out and delete auth user via admin or RPC if available
      // Since client-side can't delete auth.users directly, we sign out
      // and rely on a Supabase database trigger or Edge Function to clean up auth.users
      await supabase.auth.signOut();

      // Redirect to home/login
      window.location.href = '/';
    } catch (error) {
      alert('Failed to deactivate account: ' + error.message);
      setDeactivating(false);
      setShowDeactivateModal(false);
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
              <div className="space-y-4">

                {/* Email Card */}
                <div className="border border-[#F0F0F0] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#333333]" style={{ fontFamily: 'DM Sans' }}>Email</span>
                    {!showEmailForm && !emailSent && (
                      <button
                        onClick={() => setShowEmailForm(true)}
                        className="text-xs font-medium px-3 py-1 border border-[#E0E0E0] rounded-lg text-[#555555] hover:border-[#FE9800] hover:text-[#FE9800] transition-colors"
                        style={{ fontFamily: 'DM Sans' }}
                      >
                        Change Email
                      </button>
                    )}
                  </div>
                  <Input
                    value={currentEmail}
                    disabled
                    className="bg-[#F5F5F5]"
                  />

                  {showEmailForm && !emailSent && (
                    <div className="mt-3 space-y-3">
                      <Input
                        label="New Email Address"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setShowEmailForm(false); setNewEmail(''); }}
                          className="px-4 py-2 rounded-lg text-sm text-[#888888] hover:bg-[#F0F0F0] transition-colors"
                          style={{ fontFamily: 'DM Sans' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleChangeEmail}
                          disabled={emailChanging || !newEmail}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            newEmail
                              ? 'bg-[#FE9800] text-white hover:bg-[#C97700]'
                              : 'bg-[#F0F0F0] text-[#BBBBBB] cursor-not-allowed'
                          }`}
                          style={{ fontFamily: 'DM Sans' }}
                        >
                          {emailChanging ? 'Sending...' : 'Send Verification'}
                        </button>
                      </div>
                    </div>
                  )}

                  {emailSent && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700" style={{ fontFamily: 'DM Sans' }}>
                      ✅ Verification email sent to <strong>{newEmail}</strong>. Please check your inbox to confirm the change.
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => { setShowEmailForm(false); setEmailSent(false); setNewEmail(''); }}
                          className="text-[#FE9800] text-xs underline hover:text-[#C97700]"
                          style={{ fontFamily: 'DM Sans' }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Card */}
                <div className="border border-[#F0F0F0] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#333333]" style={{ fontFamily: 'DM Sans' }}>Password</span>
                    {!showPasswordForm && !passwordSuccess && (
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="text-xs font-medium px-3 py-1 border border-[#E0E0E0] rounded-lg text-[#555555] hover:border-[#FE9800] hover:text-[#FE9800] transition-colors"
                        style={{ fontFamily: 'DM Sans' }}
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {/* Default masked display with single show/hide toggle */}
                  {!showPasswordForm && !passwordSuccess && (
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        value="password123"
                        disabled
                        className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm text-[#333333] pr-10 outline-none"
                        style={{ fontFamily: 'DM Sans' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555555] transition-colors"
                      >
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  )}

                  {/* Change password form */}
                  {showPasswordForm && !passwordSuccess && (
                    <div className="mt-3 space-y-3">
                      {/* Current Password */}
                      <div>
                        <label className="block text-xs text-[#888888] mb-1" style={{ fontFamily: 'DM Sans' }}>Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPw ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm text-[#333333] pr-10 outline-none focus:border-[#FE9800] transition-colors"
                            style={{ fontFamily: 'DM Sans' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555555] transition-colors"
                          >
                            {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-xs text-[#888888] mb-1" style={{ fontFamily: 'DM Sans' }}>New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                            placeholder="Enter new password"
                            className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm text-[#333333] pr-10 outline-none focus:border-[#FE9800] transition-colors"
                            style={{ fontFamily: 'DM Sans' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555555] transition-colors"
                          >
                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Password strength indicator */}
                      {newPassword.length > 0 && (() => {
                        const score = [
                          newPassword.length >= 8,
                          /[A-Z]/.test(newPassword),
                          /[0-9]/.test(newPassword),
                          /[^A-Za-z0-9]/.test(newPassword),
                        ].filter(Boolean).length;
                        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
                        const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
                        const textColors = ['', 'text-red-500', 'text-yellow-600', 'text-blue-600', 'text-green-600'];
                        return (
                          <div className="space-y-1">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((lvl) => (
                                <div
                                  key={lvl}
                                  className={`h-1 flex-1 rounded-full transition-colors ${score >= lvl ? colors[score] : 'bg-[#F0F0F0]'}`}
                                />
                              ))}
                            </div>
                            <p className={`text-xs ${textColors[score]}`} style={{ fontFamily: 'DM Sans' }}>
                              {labels[score]} password
                              {score < 3 && <span className="text-[#AAAAAA]"> — use 8+ chars, uppercase, numbers & symbols</span>}
                            </p>
                          </div>
                        );
                      })()}

                      {/* Confirm New Password */}
                      <div>
                        <label className="block text-xs text-[#888888] mb-1" style={{ fontFamily: 'DM Sans' }}>Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPw ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                            placeholder="Confirm new password"
                            className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm text-[#333333] pr-10 outline-none focus:border-[#FE9800] transition-colors"
                            style={{ fontFamily: 'DM Sans' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555555] transition-colors"
                          >
                            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Match indicator */}
                      {confirmPassword.length > 0 && (
                        <p className={`text-xs ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`} style={{ fontFamily: 'DM Sans' }}>
                          {newPassword === confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                        </p>
                      )}

                      {/* Error message */}
                      {passwordError && (
                        <p className="text-xs text-[#E74C3C]" style={{ fontFamily: 'DM Sans' }}>
                          {passwordError}
                        </p>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowPasswordForm(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setPasswordError('');
                          }}
                          className="px-4 py-2 rounded-lg text-sm text-[#888888] hover:bg-[#F0F0F0] transition-colors"
                          style={{ fontFamily: 'DM Sans' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleChangePassword}
                          disabled={passwordChanging || !currentPassword || !newPassword || !confirmPassword}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPassword && newPassword && confirmPassword
                              ? 'bg-[#FE9800] text-white hover:bg-[#C97700]'
                              : 'bg-[#F0F0F0] text-[#BBBBBB] cursor-not-allowed'
                          }`}
                          style={{ fontFamily: 'DM Sans' }}
                        >
                          {passwordChanging ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Success state */}
                  {passwordSuccess && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700" style={{ fontFamily: 'DM Sans' }}>
                      ✅ Password updated successfully.
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => { setPasswordSuccess(false); setShowPasswordForm(false); }}
                          className="text-[#FE9800] text-xs underline hover:text-[#C97700]"
                          style={{ fontFamily: 'DM Sans' }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
            <div className="bg-[#FDECEA] border border-[#E74C3C] rounded-[16px] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#E74C3C]" style={{ fontFamily: 'DM Sans' }}>Danger Zone</h2>
                  <p className="text-xs text-[#888888] mt-0.5" style={{ fontFamily: 'DM Sans' }}>
                    Deactivating your account cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="text-xs font-medium px-3 py-1.5 border border-[#E74C3C] rounded-lg text-[#E74C3C] hover:bg-[#E74C3C] hover:text-white transition-colors"
                  style={{ fontFamily: 'DM Sans' }}
                >
                  Deactivate Account
                </button>
              </div>
            </div>

            {/* Deactivate Confirmation Modal */}
            {showDeactivateModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#FDECEA] flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Deactivate Account</h3>
                      <p className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>This action cannot be undone</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#555555] mb-5" style={{ fontFamily: 'DM Sans' }}>
                    Are you sure you want to deactivate your account? All your organization data, inventory, and settings will be permanently removed from our system.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeactivateModal(false)}
                      disabled={deactivating}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-[#E0E0E0] text-[#555555] hover:bg-[#F5F5F5] transition-colors"
                      style={{ fontFamily: 'DM Sans' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeactivateAccount}
                      disabled={deactivating}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#E74C3C] text-white hover:bg-[#C0392B] transition-colors disabled:opacity-60"
                      style={{ fontFamily: 'DM Sans' }}
                    >
                      {deactivating ? 'Deactivating...' : 'Yes, Deactivate'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}