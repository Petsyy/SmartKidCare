export interface WorkerFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    documents: string[];
}

export const formatPhoneNumber = (text: string) => {
  const numbers = text.replace(/\D/g, '');
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`;
};

export const validateForm = (formData: WorkerFormData, isChecked: boolean) => {
  const newErrors: { [key: string]: string } = {};

  if (!formData.firstName.trim()) {
    newErrors.firstName = 'First name is required';
  }

  if (!formData.lastName.trim()) {
    newErrors.lastName = 'Last name is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
    newErrors.email = 'Invalid email format';
  }

  if (!formData.phone.trim()) {
    newErrors.phone = 'Phone number is required';
  } else if (formData.phone.replace(/\s/g, '').length < 11) {
    newErrors.phone = 'Phone number must be 11 digits';
  }

  if (!formData.password) {
    newErrors.password = 'Password is required';
  } else if (formData.password.length < 8) {
    newErrors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.password)) {
    newErrors.password = 'Password must contain letters and numbers';
  }

  if (!formData.confirmPassword) {
    newErrors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match';
  }

  if (!isChecked) {
    newErrors.terms = 'Please agree to the Terms of Service and Privacy Policy';
  }

  return { errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
};

