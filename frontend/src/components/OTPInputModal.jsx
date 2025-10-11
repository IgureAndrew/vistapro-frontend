import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const OTPInputModal = ({ 
  isOpen, 
  onClose, 
  email, 
  onVerifyOTP, 
  onResendOTP, 
  isLoading = false,
  error = null,
  onBackToPassword 
}) => {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Start countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(60); // 60 seconds countdown
    }
  }, [isOpen]);

  // Handle OTP input changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtpCode.every(digit => digit !== '') && newOtpCode.join('').length === 6) {
      handleVerifyOTP(newOtpCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtpCode = [...otpCode];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtpCode[i] = pastedData[i];
    }
    
    setOtpCode(newOtpCode);
    
    // Focus the next empty field or the last field
    const nextEmptyIndex = newOtpCode.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  // Verify OTP
  const handleVerifyOTP = (code) => {
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      onVerifyOTP(code);
    }
  };

  // Resend OTP
  const handleResendOTP = () => {
    if (countdown === 0) {
      onResendOTP();
      setCountdown(60); // Reset countdown
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOtpCode(['', '', '', '', '', '']);
      setCountdown(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            {onBackToPassword && (
              <button
                onClick={onBackToPassword}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <Mail className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">Enter Verification Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">
              We've sent a 6-digit code to:
            </p>
            <p className="font-medium text-gray-900">{email}</p>
            <p className="text-sm text-gray-500 mt-2">
              This code will expire in 5 minutes
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* OTP Input Fields */}
          <div className="flex justify-center space-x-3 mb-6">
            {otpCode.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-bold border-2 focus:border-orange-500 focus:ring-orange-500"
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleVerifyOTP(otpCode.join(''))}
              disabled={otpCode.some(digit => digit === '') || isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResendOTP}
                disabled={countdown > 0 || isLoading}
                className={`text-sm font-medium ${
                  countdown > 0 || isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-orange-500 hover:text-orange-600'
                }`}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Security:</strong> Never share this code with anyone. VistaPro will never ask for your verification code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPInputModal;