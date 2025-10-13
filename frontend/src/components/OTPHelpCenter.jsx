import React, { useState } from 'react';
import { 
  HelpCircle, ChevronDown, ChevronUp, Mail, Lock, Shield, 
  Clock, AlertCircle, CheckCircle, X, Search 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';

const OTPHelpCenter = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  if (!isOpen) return null;

  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      icon: Shield,
      question: 'What is OTP login and why do I need it?',
      answer: 'OTP (One-Time Password) login is a secure authentication method where you receive a unique code via email each time you log in. This enhances security by eliminating the need for a static password that could be stolen or forgotten. VistaPro is transitioning to OTP login to provide better security for all users.'
    },
    {
      id: 2,
      category: 'Grace Period',
      icon: Clock,
      question: 'What is the grace period?',
      answer: 'The grace period is a 2-week transition window where you can still use password login while setting up OTP. During this time, you need to: 1) Update your email address, 2) Verify your email, and 3) Enable OTP login. After the grace period ends, only OTP login will be available.'
    },
    {
      id: 3,
      category: 'Email Verification',
      icon: Mail,
      question: 'How do I verify my email address?',
      answer: 'Go to Account Settings > Security tab and click "Verify Email Address". We\'ll send a verification link to your email. Click the link in the email to complete verification. The link expires in 24 hours, so verify promptly. If you don\'t see the email, check your spam folder.'
    },
    {
      id: 4,
      category: 'OTP Setup',
      icon: Lock,
      question: 'How do I enable OTP login?',
      answer: 'After verifying your email, go to Account Settings > Security tab and toggle on "OTP Login". You can also use the OTP Setup Wizard which will guide you through all steps. Once enabled, you\'ll receive a one-time code via email each time you log in.'
    },
    {
      id: 5,
      category: 'Troubleshooting',
      icon: AlertCircle,
      question: 'I\'m not receiving the verification email. What should I do?',
      answer: '1) Check your spam/junk folder, 2) Make sure the email address is correct, 3) Wait a few minutes - email delivery can be delayed, 4) Try resending the verification email, 5) Contact support if the issue persists.'
    },
    {
      id: 6,
      category: 'Troubleshooting',
      icon: AlertCircle,
      question: 'I\'m not receiving OTP codes. What should I do?',
      answer: 'If you\'re not receiving OTP codes: 1) Check your spam/junk folder, 2) Verify your email address is correct in Account Settings, 3) Wait a few minutes, 4) Try requesting a new code, 5) Make sure your email inbox isn\'t full, 6) Contact support if the problem continues.'
    },
    {
      id: 7,
      category: 'Grace Period',
      icon: Clock,
      question: 'What happens after the grace period ends?',
      answer: 'After the grace period ends, password login will be disabled. You\'ll only be able to log in using OTP codes sent to your verified email. Make sure to complete email verification and enable OTP before the grace period ends to avoid being locked out.'
    },
    {
      id: 8,
      category: 'Email Verification',
      icon: Mail,
      question: 'The verification link expired. What now?',
      answer: 'Verification links expire after 24 hours for security. Simply go to Account Settings > Security and click "Resend Verification Email" to get a new link. Make sure to verify within 24 hours this time.'
    },
    {
      id: 9,
      category: 'OTP Setup',
      icon: Lock,
      question: 'Can I still use my password after enabling OTP?',
      answer: 'During the grace period, yes. You can use both password and OTP login. However, after the grace period ends, only OTP login will be available. This is to ensure all users benefit from enhanced security.'
    },
    {
      id: 10,
      category: 'Getting Started',
      icon: Shield,
      question: 'Is my email address secure?',
      answer: 'Yes! We use industry-standard encryption to protect your email address and all communications. OTP codes are one-time use only and expire quickly. This method is more secure than traditional passwords.'
    },
    {
      id: 11,
      category: 'Troubleshooting',
      icon: AlertCircle,
      question: 'I entered the wrong email address. How do I fix it?',
      answer: 'Go to Account Settings > Security and update your email address in the Email field. You\'ll need to verify the new email address before you can use it for OTP login. Make sure to use an email you have access to.'
    },
    {
      id: 12,
      category: 'Grace Period',
      icon: Clock,
      question: 'How do I check how much time is left in my grace period?',
      answer: 'You can see your grace period countdown in several places: 1) The grace period banner on your dashboard, 2) Account Settings > Security tab, 3) The login page. It will show you exactly how many days remain.'
    }
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center space-x-2">
                <HelpCircle className="h-6 w-6 text-blue-500" />
                <span>OTP Transition Help Center</span>
              </CardTitle>
              <CardDescription>
                Find answers to common questions about the OTP login transition
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for help..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-blue-900 mb-1">Getting Started</h3>
                <p className="text-sm text-blue-700">Learn about OTP and why it matters</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <Clock className="h-8 w-8 text-yellow-600 mb-2" />
                <h3 className="font-semibold text-yellow-900 mb-1">Grace Period</h3>
                <p className="text-sm text-yellow-700">Understand the transition timeline</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-green-900 mb-1">Troubleshooting</h3>
                <p className="text-sm text-green-700">Solve common issues quickly</p>
              </CardContent>
            </Card>
          </div>

          {/* FAQs by Category */}
          {Object.keys(groupedFaqs).length > 0 ? (
            Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">{category}</h3>
                <div className="space-y-2">
                  {categoryFaqs.map((faq) => {
                    const IconComponent = faq.icon;
                    return (
                      <Card 
                        key={faq.id} 
                        className={`cursor-pointer transition-all ${
                          expandedFaq === faq.id ? 'border-blue-300 bg-blue-50' : 'hover:border-gray-300'
                        }`}
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <IconComponent className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                expandedFaq === faq.id ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                              <div className="flex-1">
                                <h4 className={`font-medium ${
                                  expandedFaq === faq.id ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {faq.question}
                                </h4>
                                {expandedFaq === faq.id && (
                                  <p className="text-sm text-blue-800 mt-2 leading-relaxed">
                                    {faq.answer}
                                  </p>
                                )}
                              </div>
                            </div>
                            {expandedFaq === faq.id ? (
                              <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No results found for "{searchQuery}"</p>
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Clear Search
              </Button>
            </div>
          )}

          {/* Still Need Help */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Still need help?</h3>
              <p className="text-sm text-purple-700 mb-3">
                If you couldn't find the answer you're looking for, our support team is here to help.
              </p>
              <Button
                onClick={() => window.location.href = 'mailto:support@vistapro.ng'}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPHelpCenter;
