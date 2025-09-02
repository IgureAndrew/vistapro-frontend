import React from 'react';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';

export default function ToastDemo() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Toast Notification Demo</h2>
      <p className="text-gray-600">Click the buttons below to test different types of toast notifications.</p>
      
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={() => showSuccess('This is a success message!', 'Success')}
          className="bg-green-600 hover:bg-green-700"
        >
          Show Success Toast
        </Button>
        
        <Button 
          onClick={() => showError('This is an error message!', 'Error')}
          className="bg-red-600 hover:bg-red-700"
        >
          Show Error Toast
        </Button>
        
        <Button 
          onClick={() => showWarning('This is a warning message!', 'Warning')}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Show Warning Toast
        </Button>
        
        <Button 
          onClick={() => showInfo('This is an info message!', 'Information')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Show Info Toast
        </Button>
      </div>
    </div>
  );
}
