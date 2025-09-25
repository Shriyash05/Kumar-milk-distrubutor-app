/**
 * Comprehensive Input Validation Utilities
 * For Kumar Milk Distributor Mobile App
 */

export const ValidationUtils = {
  
  // Email validation with comprehensive regex
  validateEmail: (email) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return {
      isValid: emailRegex.test(email),
      message: !email ? 'Email is required' :
               !emailRegex.test(email) ? 'Please enter a valid email address' :
               ''
    };
  },

  // Password validation with security requirements
  validatePassword: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < minLength) {
      return { isValid: false, message: `Password must be at least ${minLength} characters long` };
    }
    
    if (!hasLowerCase) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!hasNumbers) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    return { isValid: true, message: '' };
  },

  // Phone number validation (Indian format)
  validatePhoneNumber: (phone) => {
    const phoneRegex = /^[+]?[0-9]{10,14}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    return {
      isValid: phoneRegex.test(cleanPhone),
      message: !phone ? 'Phone number is required' :
               !phoneRegex.test(cleanPhone) ? 'Please enter a valid phone number' :
               ''
    };
  },

  // Name validation
  validateName: (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return {
      isValid: nameRegex.test(name?.trim()),
      message: !name ? 'Name is required' :
               name.trim().length < 2 ? 'Name must be at least 2 characters long' :
               !nameRegex.test(name.trim()) ? 'Name can only contain letters and spaces' :
               ''
    };
  },

  // Address validation
  validateAddress: (address) => {
    return {
      isValid: address?.trim().length >= 10,
      message: !address ? 'Address is required' :
               address.trim().length < 10 ? 'Please enter a complete address (minimum 10 characters)' :
               ''
    };
  },

  // Price validation
  validatePrice: (price) => {
    const numPrice = parseFloat(price);
    return {
      isValid: !isNaN(numPrice) && numPrice > 0,
      message: !price ? 'Price is required' :
               isNaN(numPrice) ? 'Please enter a valid price' :
               numPrice <= 0 ? 'Price must be greater than 0' :
               ''
    };
  },

  // Quantity validation
  validateQuantity: (quantity) => {
    const numQuantity = parseInt(quantity);
    return {
      isValid: !isNaN(numQuantity) && numQuantity > 0 && numQuantity <= 100,
      message: !quantity ? 'Quantity is required' :
               isNaN(numQuantity) ? 'Please enter a valid quantity' :
               numQuantity <= 0 ? 'Quantity must be greater than 0' :
               numQuantity > 100 ? 'Maximum quantity is 100' :
               ''
    };
  },

  // Product name validation
  validateProductName: (name) => {
    return {
      isValid: name?.trim().length >= 3 && name?.trim().length <= 100,
      message: !name ? 'Product name is required' :
               name.trim().length < 3 ? 'Product name must be at least 3 characters long' :
               name.trim().length > 100 ? 'Product name must be less than 100 characters' :
               ''
    };
  },

  // Brand validation
  validateBrand: (brand) => {
    return {
      isValid: brand?.trim().length >= 2 && brand?.trim().length <= 50,
      message: !brand ? 'Brand is required' :
               brand.trim().length < 2 ? 'Brand must be at least 2 characters long' :
               brand.trim().length > 50 ? 'Brand must be less than 50 characters' :
               ''
    };
  },

  // Delivery date validation
  validateDeliveryDate: (date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30); // Maximum 30 days in advance
    
    return {
      isValid: selectedDate >= today && selectedDate <= maxDate,
      message: !date ? 'Delivery date is required' :
               selectedDate < today ? 'Delivery date cannot be in the past' :
               selectedDate > maxDate ? 'Delivery date cannot be more than 30 days from now' :
               ''
    };
  },

  // Sanitize input to prevent XSS
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .substring(0, 1000); // Limit length to prevent DoS
  },

  // Validate multiple fields at once
  validateForm: (fields) => {
    const errors = {};
    let isValid = true;

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      let validation = { isValid: true, message: '' };

      switch (fieldName) {
        case 'email':
          validation = ValidationUtils.validateEmail(field);
          break;
        case 'password':
          validation = ValidationUtils.validatePassword(field);
          break;
        case 'phone':
          validation = ValidationUtils.validatePhoneNumber(field);
          break;
        case 'name':
          validation = ValidationUtils.validateName(field);
          break;
        case 'address':
          validation = ValidationUtils.validateAddress(field);
          break;
        case 'price':
          validation = ValidationUtils.validatePrice(field);
          break;
        case 'quantity':
          validation = ValidationUtils.validateQuantity(field);
          break;
        case 'productName':
          validation = ValidationUtils.validateProductName(field);
          break;
        case 'brand':
          validation = ValidationUtils.validateBrand(field);
          break;
        case 'deliveryDate':
          validation = ValidationUtils.validateDeliveryDate(field);
          break;
        default:
          // Generic validation for required fields
          validation = {
            isValid: field?.toString().trim().length > 0,
            message: !field ? `${fieldName} is required` : ''
          };
      }

      if (!validation.isValid) {
        errors[fieldName] = validation.message;
        isValid = false;
      }
    });

    return { isValid, errors };
  }
};

export default ValidationUtils;