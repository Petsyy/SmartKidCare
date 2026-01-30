import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Users, Eye, EyeOff, ChevronLeft, Mail, Phone, Lock, User, Check, Upload, FileText } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { registerWorker } from '@/src/api/api';
import { formatPhoneNumber, validateForm } from '@/src/validations/worker-registration-validation';

function FormField({ label, required, children, icon: Icon }: { label: string; required?: boolean; children: React.ReactNode; icon?: any }) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center mb-2">
        {Icon && <Icon size={14} color="#6b7280" style={{ marginRight: 6 }} />}
        <Text className="text-base font-semibold text-gray-700">{label}</Text>
        {required && <Text className="ml-0.5 text-red-500">*</Text>}
      </View>
      {children}
    </View>
  );
}

export default function ParentRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    documents: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { errors, isValid } = validateForm(formData, isChecked);
    
    if (!isValid) {
      setErrors(errors);
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerWorker({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        documents: formData.documents,
      });

      Alert.alert(
        'Registration Successful',
        response.message || 'Your account has been created and is pending verification.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'An error occurred during registration. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newDocuments = result.assets.map(asset => asset.name);
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, ...newDocuments],
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick documents');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        className='flex-1'
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps='always'
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        >
          {/* HEADER CARD */}
          <View className="mx-5 rounded-3xl overflow-hidden shadow-lg shadow-green-300">
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="pb-16 pt-6 px-5"
            >
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-6"
              >
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>

              {/* Header Content */}
              <View className="items-center">
                <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4 border border-white/30">
                  <Users size={32} color="white" />
                </View>

                <Text className="text-2xl font-bold text-white mb-1">
                  Create Account
                </Text>

                <Text className="text-white/90 text-sm text-center">
                  Join SmartKidCare community
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Form */}
          <View className="px-5 -mt-8">
            <View className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200">
              <View className="flex-row gap-x-3">
                <View className="flex-1">
                  <FormField label="First Name" required icon={User}>
                    <TextInput
                      className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:border-blue-500 focus:bg-white'
                      placeholder='First Name'
                      placeholderTextColor='#9CA3AF'
                      value={formData.firstName}
                      onChangeText={(text) => {
                        updateField('firstName', text);
                        if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                      }}
                      editable={true}
                      contextMenuHidden={false}
                      selectionColor='#3b82f6'
                    />
                    {errors.firstName && <Text className="text-red-500 text-xs mt-1">{errors.firstName}</Text>}
                  </FormField>
                </View>
                <View className="flex-1">
                  <FormField label="Last Name" required icon={User}>
                    <TextInput
                      className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:border-blue-500 focus:bg-white'
                      placeholder='Last Name'
                      placeholderTextColor='#9CA3AF'
                      value={formData.lastName}
                      onChangeText={(text) => {
                        updateField('lastName', text);
                        if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                      }}
                      editable={true}
                      contextMenuHidden={false}
                      selectionColor='#3b82f6'
                    />
                    {errors.lastName && <Text className="text-red-500 text-xs mt-1">{errors.lastName}</Text>}
                  </FormField>
                </View>
              </View>

              <FormField label="Email Address" required icon={Mail}>
                <TextInput
                  className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:border-blue-500 focus:bg-white'
                  placeholder='email@example.com'
                  placeholderTextColor='#9CA3AF'
                  value={formData.email}
                  onChangeText={(text) => {
                    updateField('email', text);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize='none'
                  autoCorrect={false}
                  editable={true}
                  contextMenuHidden={false}
                  selectionColor='#3b82f6'
                />
                {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>}
              </FormField>

              <FormField label="Contact Number" required icon={Phone}>
                <TextInput
                  className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:border-blue-500 focus:bg-white'
                  placeholder='09XX XXX XXXX'
                  placeholderTextColor='#9CA3AF'
                  value={formData.phone}
                  onChangeText={(text) => {
                    updateField('phone', formatPhoneNumber(text));
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  keyboardType='phone-pad'
                  maxLength={13}
                  editable={true}
                  contextMenuHidden={false}
                  selectionColor='#3b82f6'
                />
                {errors.phone && <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>}
              </FormField>

              <FormField label="Password" required icon={Lock}>
                <View className="relative">
                  <TextInput
                    className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 pr-12 focus:border-green-500 focus:bg-white'
                    placeholder='Enter your password'
                    placeholderTextColor='#9CA3AF'
                    value={formData.password}
                    onChangeText={(text) => {
                      updateField('password', text);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    secureTextEntry={!showPassword}
                    editable={true}
                    contextMenuHidden={false}
                    selectionColor='#3b82f6'
                  />
                  <TouchableOpacity
                    className='absolute right-4 h-full justify-center'
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    {showPassword ?
                      <EyeOff size={22} color="#6b7280" /> :
                      <Eye size={22} color="#6b7280" />
                    }
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-gray-500 mt-2 ml-1">
                  Must be at least 8 characters with letters and numbers
                </Text>
                {errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>}
              </FormField>

              <FormField label="Confirm Password" required icon={Lock}>
                <View className="relative">
                  <TextInput
                    className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 pr-12 focus:border-green-500 focus:bg-white'
                    placeholder='Confirm your password'
                    placeholderTextColor='#9CA3AF'
                    value={formData.confirmPassword}
                    onChangeText={(text) => {
                      updateField('confirmPassword', text);
                      if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    secureTextEntry={!showConfirmPassword}
                    editable={true}
                    contextMenuHidden={false}
                    selectionColor='#3b82f6'
                  />
                  <TouchableOpacity
                    className='absolute right-4 h-full justify-center'
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    {showConfirmPassword ?
                      <EyeOff size={22} color="#6b7280" /> :
                      <Eye size={22} color="#6b7280" />
                    }
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword}</Text>}
              </FormField>

              {/* Documents Section */}
              <View className="mb-6">
                <FormField label="Documents" required icon={FileText}>
                  <View className="bg-green-50 border-2 border-dashed border-green-300 rounded-xl p-6 items-center">
                    <Upload size={32} color="#10b981" style={{ marginBottom: 8 }} />
                    <Text className="text-sm text-gray-700 font-semibold mb-1">
                      Upload Documents for Verification
                    </Text>
                    <Text className="text-xs text-gray-600 text-center mb-4">
                      Admin will verify your documents after registration
                    </Text>
                    <TouchableOpacity
                      onPress={handleAddDocument}
                      className="bg-green-500 px-6 py-2.5 rounded-lg"
                      activeOpacity={0.7}
                    >
                      <Text className="text-white font-semibold text-sm">
                        Choose Documents
                      </Text>
                    </TouchableOpacity>
                  </View>
                </FormField>

                {/* Uploaded Documents List */}
                {formData.documents.length > 0 && (
                  <View className="mt-3 bg-green-50 rounded-lg p-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Uploaded Files ({formData.documents.length})
                    </Text>
                    {formData.documents.map((doc: string, index: number) => (
                      <View key={index} className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center flex-1">
                          <FileText size={16} color="#10b981" style={{ marginRight: 8 }} />
                          <Text className="text-xs text-gray-700 flex-1">{doc}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            const updatedDocs = formData.documents.filter((_: string, i: number) => i !== index);
                            setFormData(prev => ({ ...prev, documents: updatedDocs }));
                          }}
                          activeOpacity={0.7}
                        >
                          <Text className="text-red-500 font-semibold text-xs">Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <Text className="text-xs text-gray-500 ml-1">
                  You can upload: ID, certifications, background check, or other relevant documents
                </Text>
              </View>

              {/* Terms and Conditions */}
              <TouchableOpacity
                className="flex-row items-start mb-6 active:opacity-70"
                onPress={() => setIsChecked(!isChecked)}
                activeOpacity={0.8}
              >
                <View className={`w-5 h-5 border-2 ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'} rounded mr-3 items-center justify-center flex-shrink-0`}>
                  {isChecked && (
                    <Check size={14} color="white" strokeWidth={3} />
                  )}
                </View>
                <Text className="text-sm text-gray-600 flex-1 leading-5">
                  I agree to the{' '}
                  <Text className="text-green-600 font-semibold">Terms of Service</Text>
                  {' '}and{' '}
                  <Text className="text-green-600 font-semibold">Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms && <Text className="text-red-500 text-xs mt-1">{errors.terms}</Text>}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={isLoading}
                className="w-full rounded-2xl shadow-lg shadow-green-200"
                style={{ overflow: 'hidden' }} // IMPORTANT
              >
                <LinearGradient
                  colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16, // MUST match parent
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  {isLoading && <ActivityIndicator color="white" style={{ marginRight: 8 }} />}
                  <Text className="text-white text-lg font-bold">
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

            </View>

            {/* Footer */}
            <View className='mt-4 flex-row justify-center items-center mb-4'>
              <Text className='text-gray-600'>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                activeOpacity={0.7}
              >
                <Text className='text-green-600 font-bold text-base'>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}