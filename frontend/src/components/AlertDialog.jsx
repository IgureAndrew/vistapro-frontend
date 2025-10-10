import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const AlertDialog = ({
  open,
  type = 'info',
  title = '',
  message = '',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = false,
  variant = 'default'
}) => {
  if (!open) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'border-red-200 bg-red-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onCancel}
      />
      <Card className={`relative z-10 w-full max-w-md mx-4 ${getVariantStyles()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            {getIcon()}
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {message && (
            <CardDescription className="text-sm text-gray-600">
              {message}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex justify-center space-x-3">
          {showCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="min-w-[80px]"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            className="min-w-[80px]"
          >
            {confirmText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertDialog;
