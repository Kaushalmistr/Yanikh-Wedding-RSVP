import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUser, findUserByMobile, generateOTP } from '../lib/db';
import { Heart, Phone, Shield, User, Mail, Copy, CheckCircle } from 'lucide-react';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, validateMobileNumber, formatMobileForDisplay, validateEmail } from '../lib/constants';
import CountryCodeSelect from '../components/CountryCodeSelect';

type AuthMode = 'login' | 'signup' | 'otp';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('OTP copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !mobile.trim()) {
      setError('All fields are required');
      return;
    }
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Please enter a valid email address');
      return;
    }
    
    // Validate mobile number based on country code
    const validation = validateMobileNumber(mobile, countryCode);
    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid mobile number');
      return;
    }
    
    try {
      createUser(name.trim(), email.trim(), mobile.trim());
      setSuccessMessage('Account created successfully! Please login with your mobile number.');
      setMode('login');
      setName('');
      setEmail('');
      setMobile('');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate mobile number based on country code
    const validation = validateMobileNumber(mobile, countryCode);
    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid mobile number');
      return;
    }

    const user = findUserByMobile(mobile.trim());
    if (!user) {
      setError('No account found with this mobile number. Please sign up first.');
      return;
    }

    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);
    setMode('otp');
    
    // Show OTP in alert for visibility on hosting
    setTimeout(() => {
      alert(`🔑 Your OTP is: ${newOtp}\n\nPlease copy this code and paste it in the field below.\n\n(This is for demo purposes. In real apps, OTP is sent via SMS.)`);
    }, 300);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }

    if (otp === generatedOtp) {
      const user = findUserByMobile(mobile.trim());
      if (user) {
        login(user);
        navigate('/dashboard');
      }
    } else {
      setError('Invalid OTP. Please check and try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
         <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white text-center">
          <div className="mb-8">
            <Heart className="w-20 h-20 mx-auto animate-pulse" fill="white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Wedding RSVP</h1>
          <p className="text-xl text-white/90 max-w-md">
            Beautifully crafted wedding invitation and guest management system
          </p>
          <div className="mt-12 flex gap-8 text-sm">
            <div>💒 Create Events</div>
            <div>📋 Smart RSVPs</div>
            <div>📊 Guest Analytics</div>
          </div>
        </div>
      </div>
     

      {/* Main Form Area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-rose-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <Heart className="w-10 h-10 text-rose-500" fill="currentColor" />
              <h1 className="text-3xl font-bold text-gray-900">Wedding RSVP</h1>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-rose-100">
            {/* Mode Tabs */}
            {mode !== 'otp' && (
              <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                    mode === 'login' 
                      ? 'bg-white shadow text-rose-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccessMessage(''); }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                    mode === 'signup' 
                      ? 'bg-white shadow text-rose-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {successMessage}
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleSendOTP}>
                <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                <p className="text-gray-500 mb-8">Sign in with your mobile number</p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      value={countryCode}
                      onChange={(newCountryCode) => {
                        setCountryCode(newCountryCode);
                        // Clear mobile if switching to a country with different length
                        const newCountry = COUNTRY_CODES.find(c => c.code === newCountryCode);
                        if (newCountry && mobile.length > newCountry.digitCount) {
                          setMobile(mobile.slice(0, newCountry.digitCount));
                        }
                      }}
                    />
                    <div className="flex-1 relative">
                      <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const maxLength = COUNTRY_CODES.find(c => c.code === countryCode)?.digitCount || 10;
                          if (value.length <= maxLength) {
                            setMobile(value);
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          const value = pastedText.replace(/\D/g, '');
                          const maxLength = COUNTRY_CODES.find(c => c.code === countryCode)?.digitCount || 10;
                          setMobile(value.slice(0, maxLength));
                        }}
                        placeholder={`Enter ${COUNTRY_CODES.find(c => c.code === countryCode)?.digitCount} digits`}
                        className={`w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl focus:border-rose-500 focus:ring-rose-500 outline-none ${
                          mobile && !validateMobileNumber(mobile, countryCode).isValid
                            ? 'border-red-300'
                            : mobile && validateMobileNumber(mobile, countryCode).isValid
                            ? 'border-green-300'
                            : ''
                        }`}
                        maxLength={COUNTRY_CODES.find(c => c.code === countryCode)?.digitCount}
                      />
                    </div>
                  </div>
                  {mobile && (() => {
                    const validation = validateMobileNumber(mobile, countryCode);
                    return (
                      <p className={`text-xs mt-1 font-medium ml-[148px] ${
                        validation.isValid ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {validation.isValid ? '✓ Valid' : validation.error}
                      </p>
                    );
                  })()}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-2xl text-lg transition-all shadow-lg shadow-rose-200"
                >
                  Send OTP
                </button>
              </form>
            )}

            {/* SIGNUP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup}>
                <h2 className="text-2xl font-bold mb-2">Create Account</h2>
                <p className="text-gray-500 mb-8">Join to manage wedding events</p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim())}
                        onBlur={() => {
                          const validation = validateEmail(email);
                          if (!validation.isValid && email) {
                            setError(validation.error || 'Invalid email address');
                          } else {
                            setError('');
                          }
                        }}
                        placeholder="name@example.com"
                        className={`w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-rose-500 outline-none ${
                          email && !validateEmail(email).isValid
                            ? 'border-red-300'
                            : email && validateEmail(email).isValid
                            ? 'border-green-300'
                            : ''
                        }`}
                      />
                    </div>
                    {email && (() => {
                      const validation = validateEmail(email);
                      return (
                        <p className={`text-xs mt-1 font-medium ${validation.isValid ? 'text-green-600' : 'text-orange-600'}`}>
                          {validation.isValid ? '✓ Valid email address' : validation.error}
                        </p>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <div className="flex gap-2">
                      <CountryCodeSelect
                        value={countryCode}
                        onChange={(newCountryCode) => {
                          setCountryCode(newCountryCode);
                          const newCountry = COUNTRY_CODES.find(c => c.code === newCountryCode);
                          if (newCountry && mobile.length > newCountry.digitCount) {
                            setMobile(mobile.slice(0, newCountry.digitCount));
                          }
                        }}
                      />
                      <div className="flex-1 relative">
                        <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const maxLength = COUNTRY_CODES.find(c => c.code === countryCode)?.digitCount || 10;
                            if (value.length <= maxLength) {
                              setMobile(value);
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const value = pastedText.replace(/\D/g, '');
                            const maxLength = COUNTRY_CODES.find(c => c.code === countryCode)?.digitCount || 10;
                            setMobile(value.slice(0, maxLength));
                          }}
                          placeholder={`Enter ${COUNTRY_CODES.find(c => c.code === countryCode)?.digitCount} digits`}
                          className={`w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:border-rose-500 outline-none ${
                            mobile && !validateMobileNumber(mobile, countryCode).isValid
                              ? 'border-red-300'
                              : mobile && validateMobileNumber(mobile, countryCode).isValid
                              ? 'border-green-300'
                              : ''
                          }`}
                          maxLength={COUNTRY_CODES.find(c => c.code === countryCode)?.digitCount}
                        />
                      </div>
                    </div>
                    {mobile && (() => {
                      const validation = validateMobileNumber(mobile, countryCode);
                      return (
                        <p className={`text-xs mt-1 font-medium ml-[148px] ${
                          validation.isValid ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {validation.isValid ? '✓ Valid' : validation.error}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-8 w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-2xl text-lg transition-all shadow-lg shadow-rose-200"
                >
                  Create My Account
                </button>
              </form>
            )}

            {/* OTP FORM */}
            {mode === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="text-center">
                  <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-1">Verify OTP</h2>
                  <p className="text-gray-600">Enter the 4-digit code sent to<br /><span className="font-medium">{formatMobileForDisplay(mobile, countryCode)}</span></p>
                </div>

                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center">
                  <p className="text-rose-500 text-xs font-medium tracking-widest mb-2">DEMO OTP CODE</p>
                  <div className="flex justify-center items-center gap-4">
                    <div className="text-5xl font-mono font-bold text-rose-600 tracking-widest bg-white px-6 py-3 rounded-2xl shadow-inner">
                      {generatedOtp || '----'}
                    </div>
                    {generatedOtp && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedOtp)}
                        className="p-3 hover:bg-white rounded-xl transition-colors"
                        title="Copy OTP"
                      >
                        <Copy className="w-6 h-6 text-rose-500" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-3">This OTP is visible for demo purposes only.<br/>In production, it would be sent via SMS.</p>
                </div>

                <div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Enter 4 digit OTP"
                    className="w-full text-center text-lg tracking-[6px] font-mono py-3 border-2 border-dashed border-gray-300 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none"
                    maxLength={4}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-2xl text-lg hover:brightness-110 transition-all"
                >
                  VERIFY OTP
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setOtp('');
                      setGeneratedOtp('');
                      setError('');
                    }}
                    className="text-gray-500 hover:text-rose-600 text-sm"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            Demo Project • Data is saved in browser
          </p>
        </div>
      </div>
    </div>
  );
}
