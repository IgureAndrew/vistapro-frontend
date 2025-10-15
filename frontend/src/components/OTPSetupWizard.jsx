import React, { useState } from 'react';
import { 
  Mail, Lock, CheckCircle, ArrowRight, ArrowLeft, 
  Shield, AlertCircle, Loader, X 
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import emailVerificationApi from '../api/emailVerificationApi';
import otpApiService from '../api/otpApi';

const OTPSetupWizard = ({ isOpen, onClose, user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(user?.otp_enabled || false);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  if (!isOpen) return null;

  const handleUpdateEmail = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await otpApiService.updateEmail(email, token);
      setSuccess('Email updated successfully!');
      setTimeout(() => {
        setCurrentStep(2);
        setSuccess(null);
      }, 1500);
    } catch (error) {
      setError(error.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await emailVerificationApi.sendVerificationEmail(email);
      setVerificationSent(true);
      setSuccess('Verification email sent! Check your inbox.');
      setTimeout(() => {
        setCurrentStep(3);
        setSuccess(null);
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableOTP = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await otpApiService.toggleOTP(true, token);
      setOtpEnabled(true);
      setSuccess('OTP login enabled successfully!');
      setTimeout(() => {
        if (onComplete) onComplete();
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to enable OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (window.confirm('Are you sure you want to skip the OTP setup? You can complete this later in Account Settings.')) {
      onClose();
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Mail className="h-16 w-16 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Update Your Email Address</h3>
        <p className="text-gray-600 text-sm">
          First, let's make sure we have your current email address for OTP delivery.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your current email"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <p className="text-xs text-gray-500">
          Make sure this is an email you have access to and check regularly.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          onClick={handleUpdateEmail}
          disabled={loading || !email}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Verify Your Email</h3>
        <p className="text-gray-600 text-sm">
          We'll send a verification link to <strong>{email}</strong>
        </p>
      </div>

      {verificationSent ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 mb-1">Verification Email Sent!</h4>
              <p className="text-sm text-green-700 mb-2">
                Check your inbox at <strong>{email}</strong> and click the verification link.
              </p>
              <p className="text-xs text-green-600">
                Don't see it? Check your spam folder. The link expires in 24 hours.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Email Verification</h4>
              <p className="text-sm text-blue-700">
                Click the button below to receive a verification email. You'll need to verify your 
                email before enabling OTP login.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          onClick={() => setCurrentStep(1)}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSendVerification}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : verificationSent ? (
            <>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Send Verification Email
              <Mail className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Shield className="h-16 w-16 text-purple-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Enable OTP Login</h3>
        <p className="text-gray-600 text-sm">
          Final step! Enable secure one-time password login.
        </p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-purple-800 mb-2">Benefits of OTP Login:</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Enhanced security - no password to remember or steal</li>
              <li>• Quick access - receive code via email instantly</li>
              <li>• Modern authentication - industry-standard security</li>
              <li>• Peace of mind - secure your account with ease</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Important Note:</h4>
            <p className="text-sm text-yellow-700">
              After enabling OTP, you'll need to verify your email before you can use OTP login. 
              Make sure you've clicked the verification link in your email.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          onClick={() => setCurrentStep(2)}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleEnableOTP}
          disabled={loading}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Enabling...
            </>
          ) : (
            <>
              Enable OTP Login
              <CheckCircle className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">OTP Setup Wizard</CardTitle>
              <CardDescription>
                Complete these 3 simple steps to enable secure OTP login
              </CardDescription>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Step {currentStep} of {totalSteps}</span>
              <span className="text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep > 1 ? 'bg-green-500 text-white' : currentStep === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Update Email</span>
            </div>
            
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep > 2 ? 'bg-green-500 text-white' : currentStep === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Verify Email</span>
            </div>
            
            <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="text-sm font-medium hidden sm:inline">Enable OTP</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Skip Option */}
          {currentStep < 3 && (
            <div className="text-center mt-6">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                I'll do this later
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPSetupWizard;
