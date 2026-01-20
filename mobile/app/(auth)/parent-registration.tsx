import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Users, Eye, EyeOff, ChevronLeft, Mail, Phone, Lock, User, Check } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ParentRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const FormField = ({ label, required, children, icon: Icon }: any) => (
    <View className="mb-5">
      <View className="flex-row items-center mb-2">
        {Icon && <Icon size={14} color="#6b7280" style={{ marginRight: 6 }} />}
        <Text className="text-base font-semibold text-gray-700">{label}</Text>
        {required && <Text className="ml-0.5 text-red-500">*</Text>}
      </View>
      {children}
    </View>
  );

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`;
  };

  const handleSubmit = () => {
    if (!isChecked) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    // Add validation logic here
    router.push('/parent-dashboard');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
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
                      className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:border-green-500 focus:bg-white'
                      placeholder='First Name'
                      placeholderTextColor='#9CA3AF'
                      value={formData.firstName}
                      onChangeText={(text) => updateField('firstName', text)}
                    />
                  </FormField>
                </View>
                <View className="flex-1">
                  <FormField label="Last Name" required icon={User}>
                    <TextInput
                      className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:border-green-500 focus:bg-white'
                      placeholder='Last Name'
                      placeholderTextColor='#9CA3AF'
                      value={formData.lastName}
                      onChangeText={(text) => updateField('lastName', text)}
                    />
                  </FormField>
                </View>
              </View>

              <FormField label="Email Address" required icon={Mail}>
                <TextInput
                  className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:border-green-500 focus:bg-white'
                  placeholder='email@example.com'
                  placeholderTextColor='#9CA3AF'
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  keyboardType="email-address"
                  autoCapitalize='none'
                  autoCorrect={false}
                />
              </FormField>

              <FormField label="Contact Number" required icon={Phone}>
                <TextInput
                  className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 focus:border-green-500 focus:bg-white'
                  placeholder='09XX XXX XXXX'
                  placeholderTextColor='#9CA3AF'
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', formatPhoneNumber(text))}
                  keyboardType='phone-pad'
                  maxLength={13}
                />
              </FormField>

              <FormField label="Password" required icon={Lock}>
                <View className="relative">
                  <TextInput
                    className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 pr-12 focus:border-green-500 focus:bg-white'
                    placeholder='Enter your password'
                    placeholderTextColor='#9CA3AF'
                    value={formData.password}
                    onChangeText={(text) => updateField('password', text)}
                    secureTextEntry={!showPassword}
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
              </FormField>

              <FormField label="Confirm Password" required icon={Lock}>
                <View className="relative">
                  <TextInput
                    className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-900 pr-12 focus:border-green-500 focus:bg-white'
                    placeholder='Confirm your password'
                    placeholderTextColor='#9CA3AF'
                    value={formData.confirmPassword}
                    onChangeText={(text) => updateField('confirmPassword', text)}
                    secureTextEntry={!showConfirmPassword}
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
              </FormField>

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

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.85}
                className="w-full rounded-2xl shadow-lg shadow-green-200"
                style={{ overflow: 'hidden' }} // IMPORTANT
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16, // MUST match parent
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-white text-lg font-bold">
                    Create Account
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