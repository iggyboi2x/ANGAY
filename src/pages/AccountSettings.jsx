import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabase';
import FoodbankSidebar from '../components/foodbank/FoodbankSidebar';
import BarangaySidebar from '../components/barangay/BarangaySidebar';
import VerifiedBadge from '../components/VerifiedBadge';
import { 
  LayoutDashboard, MessageSquare, Package, Gift, Box, Camera, Eye, EyeOff,
  ShieldCheck, Upload, AlertCircle, CheckCircle2, Clock, Menu
} from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';

const foodbankNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/foodbank/dashboard' },
  { label: 'Messages', icon: MessageSquare, path: '/foodbank/messages' },
  { label: 'Inventory', icon: Package, path: '/foodbank/inventory' },
  { label: 'Packages', icon: Box, path: '/foodbank/packages' },
  { label: 'Donations', icon: Gift, path: '/foodbank/donations' },
];

const barangayNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/barangay/dashboard' },
  { label: 'Community', icon: Gift, path: '/barangay/community' },
  { label: 'Inventory', icon: Package, path: '/barangay/inventory' },
  { label: 'Reports', icon: Box, path: '/barangay/reports' },
];

export default function AccountSettings() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [donationReminders, setDonationReminders] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);
  const [role, setRole] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [vLoading, setVLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

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

      const userRole = user.user_metadata?.role;
      setRole(userRole);
      setCurrentEmail(user.email || '');

      // Load basic profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      setIsVerified(profile?.is_verified || false);

      let loaded = {
        org_name: '',
        contact: profile?.contact || '',
        address: '',
        operating_hours: '',
        website_url: '',
      };

      if (userRole === 'foodbank') {
        const { data: foodbank } = await supabase
          .from('foodbanks')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (foodbank?.logo_url) setPhotoUrl(foodbank.logo_url);
        loaded = {
          ...loaded,
          org_name: foodbank?.org_name || '',
          address: foodbank?.address || '',
          operating_hours: foodbank?.operating_hours || '',
          website_url: foodbank?.website_url || '',
        };

        const { data: vData } = await supabase
          .from('foodbank_verification')
          .select('*')
          .eq('foodbank_id', user.id)
          .maybeSingle();
        setVerificationData(vData);

      } else if (userRole === 'barangay') {
        const { data: barangay } = await supabase
          .from('barangays')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (barangay?.barangay_profile) setPhotoUrl(barangay.barangay_profile);
        loaded = {
          ...loaded,
          org_name: barangay?.barangay_name || '',
          address: barangay?.address || '',
          operating_hours: '',
          website_url: '',
        };

        const { data: vData } = await supabase
          .from('barangay_verification')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setVerificationData(vData);
      }

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

      // Save to correct table
      const table = role === 'foodbank' ? 'foodbanks' : 'barangays';
      const col = role === 'foodbank' ? 'logo_url' : 'barangay_profile';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ [col]: publicUrl })
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

      const table = role === 'foodbank' ? 'foodbanks' : 'barangays';
      const updateData = role === 'foodbank' ? {
        org_name: orgData.org_name,
        address: orgData.address,
        operating_hours: orgData.operating_hours,
        website_url: orgData.website_url,
      } : {
        barangay_name: orgData.org_name, // Using unified org_name field from state
        address: orgData.address,
      };

      const { error: tableError } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', user.id);

      if (tableError) throw tableError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ contact: orgData.contact })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setOriginalOrgData({ ...orgData });
      alert((role === 'foodbank' ? 'Organization' : 'Barangay') + ' info saved!');
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

      // Soft deactivate
      await supabase.from('foodbanks').update({ is_deactivated: true }).eq('id', user.id);
      await supabase.from('profiles').update({ is_deactivated: true }).eq('id', user.id);
      
      await supabase.auth.signOut();
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

  const Input = ({ label, value, onChange, placeholder = "", type = "text", className = "", ...props }) => (
    <div className="w-full">
      {label && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={!onChange}
        placeholder={placeholder}
        className={`w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9800]/10 focus:border-[#FE9800] transition-all disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );

  const handleVerificationUpload = async (fileKey, file) => {
    try {
      setVLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const fileExt = file.name.split('.').pop();
      const bucket = role === 'foodbank' ? 'logos' : 'documents';
      const fileName = `${user.id}/verification/${fileKey}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const table = role === 'foodbank' ? 'foodbank_verification' : 'barangay_verification';
      const idKey = role === 'foodbank' ? 'foodbank_id' : 'user_id';
      const urlCol = {
        secCert: 'sec_cert_url',
        dswdCert: 'dswd_cert_url',
        bir2303: 'bir_2303_url',
        sanitaryPermit: 'sanitary_permit_url',
        idFront: 'id_front_url',
        appointmentDoc: 'appointment_doc_url',
        authLetter: 'auth_letter_url'
      }[fileKey];

      const { error: updateError } = await supabase
        .from(table)
        .upsert({ 
          [idKey]: user.id, 
          [urlCol]: publicUrl,
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setVerificationData(prev => ({ ...prev, [urlCol]: publicUrl, verification_status: 'pending' }));
      alert('Document uploaded! Status set to pending.');
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setVLoading(false);
    }
  };

  const VerificationCard = ({ label, status, url, onUpload }) => (
    <div className="border border-[#F0F0F0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#333333] mb-1" style={{ fontFamily: 'DM Sans' }}>{label}</p>
        <div className="flex items-center gap-2">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline font-bold uppercase tracking-widest">
              View Document
            </a>
          ) : (
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Not Uploaded</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {url && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
            {status === 'approved' ? <CheckCircle2 size={12} className="text-green-500" /> :
             status === 'rejected' ? <AlertCircle size={12} className="text-red-500" /> :
             <Clock size={12} className="text-orange-500" />}
            <span className={`text-[10px] font-black uppercase tracking-tight ${
              status === 'approved' ? 'text-green-600' :
              status === 'rejected' ? 'text-red-600' :
              'text-orange-600'
            }`}>
              {status || 'Pending'}
            </span>
          </div>
        )}
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={(e) => onUpload(e.target.files[0])} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-[#FE9800] hover:text-[#FE9800] transition-all">
            <Upload size={12} />
            {url ? 'Update' : 'Upload'}
          </div>
        </label>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white relative overflow-x-hidden">
      {role === 'foodbank' && <FoodbankSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} navItems={foodbankNav} />}
      {role === 'barangay' && <BarangaySidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}
      
      <div className={`md:ml-60 flex-1 flex flex-col w-full min-w-0`}>
        {/* Mobile Top Bar */}
        <div className="md:hidden h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-4 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button className="p-2 -ml-2 text-[#888888] hover:text-[#FE9800]" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-tight">Account</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#FE9800] text-white text-[10px] font-bold flex items-center justify-center">
            {role === 'foodbank' ? 'FB' : 'BR'}
          </div>
        </div>
        <div className="p-8">
          <div className="max-w-[680px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">Account Settings</h1>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status:</span>
                <div className="flex items-center gap-1">
                  <VerifiedBadge isVerified={isVerified} size={14} />
                  <span className={`text-[10px] font-black uppercase tracking-tight ${isVerified ? 'text-blue-600' : 'text-gray-400'}`}>
                    {isVerified ? 'Verified Official' : 'Unverified Account'}
                  </span>
                </div>
              </div>
            </div>

            {!isVerified && (
              <div className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-orange-800">Verification Required</h3>
                    <p className="text-xs text-orange-600">Submit your documents below to earn your official badge and unlock all features.</p>
                  </div>
                </div>
              </div>
            )}

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

            {/* Verification Status Section */}
            <div className="border-b border-[#F0F0F0] pb-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-[#FE9800]">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">Trust & Verification</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    {role === 'barangay' 
                      ? 'Submit official documents to confirm your authority as a Barangay official' 
                      : 'Submit official documents for the foodbank verification badge'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 text-center">
                {!isVerified ? (
                  <>
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#FE9800] mx-auto mb-4 shadow-sm">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-base font-black text-[#1A1A1A] uppercase tracking-tight mb-2">
                      {verificationData?.verification_status === 'pending' ? 'Verification in Progress' : 'Verify Your Identity'}
                    </h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mb-6 leading-relaxed">
                      {verificationData?.verification_status === 'pending' 
                        ? 'Your documents are currently being reviewed by our administrative team. We will notify you once verified.' 
                        : 'Submit your official documentation to earn your verified badge and gain full access to platform features.'}
                    </p>
                    
                    <Button 
                      className="h-14 px-8 uppercase tracking-widest text-[10px] font-black"
                      disabled={verificationData?.verification_status === 'pending' || vLoading}
                      onClick={() => setShowVerificationModal(true)}
                    >
                      {vLoading ? 'Processing...' : 
                       verificationData?.verification_status === 'pending' ? 'Pending Review' : 
                       'Open Verification Portal'}
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-base font-black text-blue-600 uppercase tracking-tight mb-1">Account Verified</h3>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Official {role} Status Confirmed</p>
                  </div>
                )}
              </div>
            </div>
            {/* Organization Information */}
            <div className="border-b border-[#F0F0F0] pb-8 mb-8">
              <h2 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight mb-4">
                {role === 'barangay' ? 'Barangay Information' : 'Organization Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                          {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
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
 
      {/* Verification Portal Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        title="Verification Portal"
        width="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest leading-relaxed">
              Please upload high-quality scans or photos of your official documents. 
              Once all required files are uploaded, you can submit them for administrative review.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {role === 'foodbank' ? (
              <>
                <VerificationCard 
                  label="SEC Registration Certificate" 
                  status={verificationData?.verification_status} 
                  url={verificationData?.sec_cert_url} 
                  onUpload={(f) => handleVerificationUpload('secCert', f)} 
                />
                <VerificationCard 
                  label="DSWD License to Operate" 
                  status={verificationData?.verification_status} 
                  url={verificationData?.dswd_cert_url} 
                  onUpload={(f) => handleVerificationUpload('dswdCert', f)} 
                />
                <VerificationCard 
                  label="BIR 2303 Certificate" 
                  status={verificationData?.verification_status} 
                  url={verificationData?.bir_2303_url} 
                  onUpload={(f) => handleVerificationUpload('bir2303', f)} 
                />
                <VerificationCard 
                  label="LGU Sanitary Permit" 
                  status={verificationData?.verification_status} 
                  url={verificationData?.sanitary_permit_url} 
                  onUpload={(f) => handleVerificationUpload('sanitaryPermit', f)} 
                />
              </>
            ) : (
              <>
                <VerificationCard 
                  label="Barangay Official ID (Front)" 
                  status={verificationData?.verification_status} 
                  url={verificationData?.id_front_url} 
                  onUpload={(f) => handleVerificationUpload('idFront', f)} 
                />
                <VerificationCard 
                  label="Appointment Paper / Oath of Office" 
                  status={verificationData?.verification_status} 
                  url={verificationData?.appointment_doc_url} 
                  onUpload={(f) => handleVerificationUpload('appointmentDoc', f)} 
                />
                <VerificationCard 
                  label="LGU Authorization Letter" 
                  status={verificationData?.verification_status} 
                  url={verificationData?.auth_letter_url} 
                  onUpload={(f) => handleVerificationUpload('authLetter', f)} 
                />
              </>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowVerificationModal(false)}>Close</Button>
            <Button 
              disabled={vLoading}
              onClick={async () => {
                setShowVerificationModal(false);
                alert('Your documents have been queued for verification. The admin team will review them shortly.');
              }}
            >
              Finish Submission
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  
  );
}