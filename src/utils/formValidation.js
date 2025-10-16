// Shared form validation utilities
export const isValidPhone = (phone) => /^\d{11}$/.test(phone);
export const isValidAccountNumber = (acct) => /^\d{10}$/.test(acct);
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Required field validation
export const isRequired = (value) => value && value.trim() !== '';

// File validation
export const isValidFileType = (file, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']) => {
  return file && allowedTypes.includes(file.type);
};

export const isValidFileSize = (file, maxSizeMB = 10) => {
  return file && file.size <= maxSizeMB * 1024 * 1024;
};

// Form validation helpers
export const validateFormField = (name, value, rules = {}) => {
  const errors = [];
  
  if (rules.required && !isRequired(value)) {
    errors.push(`${name} is required`);
  }
  
  if (rules.phone && value && !isValidPhone(value)) {
    errors.push('Phone number must be exactly 11 digits');
  }
  
  if (rules.accountNumber && value && !isValidAccountNumber(value)) {
    errors.push('Account number must be exactly 10 digits');
  }
  
  if (rules.email && value && !isValidEmail(value)) {
    errors.push('Please enter a valid email address');
  }
  
  if (rules.minLength && value && value.length < rules.minLength) {
    errors.push(`${name} must be at least ${rules.minLength} characters`);
  }
  
  if (rules.maxLength && value && value.length > rules.maxLength) {
    errors.push(`${name} must be no more than ${rules.maxLength} characters`);
  }
  
  return errors;
};

// Validate entire form
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(validationRules).forEach(field => {
    const fieldErrors = validateFormField(field, formData[field], validationRules[field]);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors[0]; // Take first error
      isValid = false;
    }
  });
  
  return { errors, isValid };
};

// Specific form validators
export const validateBiodataForm = (formData, passportPhoto, identificationFile) => {
  const errors = {};
  
  // Required fields validation
  const requiredFields = [
    'name', 'address', 'phone', 'religion', 'date_of_birth', 'marital_status',
    'state_of_origin', 'state_of_residence', 'mothers_maiden_name', 'school_attended',
    'means_of_identification', 'next_of_kin_name', 'next_of_kin_phone', 'next_of_kin_address',
    'next_of_kin_relationship', 'bank_name', 'account_name', 'account_number'
  ];
  
  requiredFields.forEach(field => {
    if (!isRequired(formData[field])) {
      errors[field] = `${field.replace('_', ' ')} is required`;
    }
  });
  
  // Format validation
  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.phone = 'Phone number must be exactly 11 digits';
  }
  
  if (formData.account_number && !isValidAccountNumber(formData.account_number)) {
    errors.account_number = 'Account number must be exactly 10 digits';
  }
  
  // File validation
  if (!passportPhoto) {
    errors.passport_photo = 'Passport photo is required';
  } else {
    if (!isValidFileSize(passportPhoto, 10)) {
      errors.passport_photo = 'Passport photo must be less than 10MB';
    }
    if (!isValidFileType(passportPhoto)) {
      errors.passport_photo = 'Passport photo must be PNG or JPG format';
    }
  }
  
  if (formData.means_of_identification && !identificationFile) {
    errors.identification_file = 'ID document is required';
  } else if (identificationFile) {
    if (!isValidFileSize(identificationFile, 10)) {
      errors.identification_file = 'ID document must be less than 10MB';
    }
    if (!isValidFileType(identificationFile)) {
      errors.identification_file = 'ID document must be PNG or JPG format';
    }
  }
  
  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validateGuarantorForm = (formData, identificationFile, signatureFile) => {
  const errors = {};
  
  // Debug: Log the form data
  console.log('🔍 validateGuarantorForm - formData:', formData);
  console.log('🔍 validateGuarantorForm - identificationFile:', identificationFile);
  console.log('🔍 validateGuarantorForm - signatureFile:', signatureFile);
  
  // Required fields validation
  const requiredFields = [
    'is_candidate_known', 'relationship', 'known_duration', 'occupation',
    'means_of_identification', 'guarantor_full_name', 'guarantor_home_address',
    'guarantor_office_address', 'guarantor_email', 'guarantor_phone', 'candidate_name'
  ];
  
  requiredFields.forEach(field => {
    const value = formData[field];
    const isValid = isRequired(value);
    console.log(`🔍 Field ${field}: "${value}" - Valid: ${isValid}`);
    if (!isValid) {
      errors[field] = `${field.replace('_', ' ')} is required`;
    }
  });
  
  // Email validation
  if (formData.guarantor_email && !isValidEmail(formData.guarantor_email)) {
    errors.guarantor_email = 'Please enter a valid email address';
  }
  
  // Phone validation
  if (formData.guarantor_phone && !isValidPhone(formData.guarantor_phone)) {
    errors.guarantor_phone = 'Phone number must be exactly 11 digits';
  }
  
  // File validation
  console.log('🔍 File validation - identificationFile:', identificationFile);
  console.log('🔍 File validation - signatureFile:', signatureFile);
  
  if (!identificationFile) {
    console.log('❌ Missing identification file');
    errors.identification_file = 'Identification file is required';
  } else {
    console.log('✅ Identification file present:', identificationFile.name, identificationFile.size, identificationFile.type);
    if (!isValidFileSize(identificationFile, 10)) {
      console.log('❌ Identification file too large');
      errors.identification_file = 'Identification file must be less than 10MB';
    }
    if (!isValidFileType(identificationFile)) {
      console.log('❌ Identification file wrong type');
      errors.identification_file = 'Identification file must be PNG or JPG format';
    }
  }
  
  if (!signatureFile) {
    console.log('❌ Missing signature file');
    errors.signature_file = 'Signature is required';
  } else {
    console.log('✅ Signature file present:', signatureFile.name, signatureFile.size, signatureFile.type);
    if (!isValidFileSize(signatureFile, 10)) {
      console.log('❌ Signature file too large');
      errors.signature_file = 'Signature must be less than 10MB';
    }
    if (!isValidFileType(signatureFile)) {
      console.log('❌ Signature file wrong type');
      errors.signature_file = 'Signature must be PNG or JPG format';
    }
  }
  
  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validateCommitmentForm = (formData, signatureFile) => {
  const errors = {};
  
  // Required fields validation
  const requiredFields = [
    'direct_sales_rep_name', 'date_signed'
  ];
  
  requiredFields.forEach(field => {
    if (!isRequired(formData[field])) {
      errors[field] = `${field.replace('_', ' ')} is required`;
    }
  });
  
  // File validation
  if (!signatureFile) {
    errors.signature_file = 'Signature is required';
  } else {
    if (!isValidFileSize(signatureFile, 10)) {
      errors.signature_file = 'Signature must be less than 10MB';
    }
    if (!isValidFileType(signatureFile)) {
      errors.signature_file = 'Signature must be PNG or JPG format';
    }
  }
  
  return { errors, isValid: Object.keys(errors).length === 0 };
};
