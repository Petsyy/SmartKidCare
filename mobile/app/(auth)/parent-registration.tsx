import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Users, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function ParentRegistration() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const FormField = ({ label, required, children }: any) => (
    <View className="mb-4">
      <View className="flex-row mb-1.5 ml-1">
        <Text className="text-sm font-semibold text-gray-700">{label}</Text>
        {required && <Text className="ml-0.5 text-red-500">*</Text>}
      </View>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className='flex-1 bg-white'
    >
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-6 z-10 p-2 bg-gray-50 rounded-full"
      >
        <ChevronLeft size={24} color="#374151" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View className='flex-1 px-6 pt-20 pb-12'>

          {/* Header */}
          <View className='items-center mb-10'>
            <View className='w-20 h-20 items-center justify-center rounded-3xl bg-green-50 shadow-sm mb-4'>
              <Users size={40} color="#16a34a" />
            </View>
            <Text className='text-3xl font-bold text-gray-900'>Create Account</Text>
            <Text className='text-gray-500 mt-2'>Join the SmartKidCare community</Text>
          </View>

          {/* Form */}
          <View>
            <View className="flex-row gap-x-4">
              <View className="flex-1">
                <FormField label="First Name" required>
                  <TextInput
                    className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900'
                    placeholder='John'
                    placeholderTextColor='#9CA3AF'
                  />
                </FormField>
              </View>
              <View className="flex-1">
                <FormField label="Last Name" required>
                  <TextInput
                    className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900'
                    placeholder='Doe'
                    placeholderTextColor='#9CA3AF'
                  />
                </FormField>
              </View>
            </View>

            <FormField label="Email Address" required>
              <TextInput
                className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900'
                placeholder='email@example.com'
                placeholderTextColor='#9CA3AF'
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize='none'
              />
            </FormField>

            <FormField label="Contact Number" required>
              <TextInput
                className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900'
                placeholder='0912 345 6789'
                placeholderTextColor='#9CA3AF'
                keyboardType='numeric'
                maxLength={11}
              />
            </FormField>

            <FormField label="Password" required>
              <View className="relative justify-center">
                <TextInput
                  className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 pr-12'
                  placeholder='••••••••'
                  placeholderTextColor='#9CA3AF'
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  className='absolute right-4'
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} color="#16a34a" /> : <Eye size={20} color="#16a34a" />}
                </TouchableOpacity>
              </View>
            </FormField>

            <FormField label="Confirm Password" required>
              <View className="relative justify-center">
                <TextInput
                  className='px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 pr-12'
                  placeholder='••••••••'
                  placeholderTextColor='#9CA3AF'
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  className='absolute right-4'
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} color="#16a34a" /> : <Eye size={20} color="#16a34a" />}
                </TouchableOpacity>
              </View>
            </FormField>

            {/* Submit Button */}
            <TouchableOpacity
              className='w-full bg-green-600 py-4 rounded-2xl mt-4 shadow-md shadow-green-200'
              onPress={() => router.push('/parent-dashboard')}
              activeOpacity={0.8}
            >
              <Text className='text-white text-center text-lg font-bold'>Create Account</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View className='mt-8 flex-row justify-center'>
              <Text className='text-gray-500'>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className='text-green-600 font-bold'>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}