import { View, Text, TextInput } from "react-native";
import { Users } from "lucide-react-native";


export default function ParentRegistration() {
  return (
    <View className="flex-1 px-6 pt-20 pb-12">
      {/* Header */}
      <View className='items-center mb-10'>
        <View className='w-16 h-16 items-center justify-center rounded-full bg-green-600 shadow-sm mb-4 mt-6'>
          <Users size={25} color="white" />
        </View>
        <Text className="text-xl text-green-600 font-bold">Worker Registration</Text>
        <Text className="text-center mt-2 px-6 text-gray-600">Fill out the form below to create your account</Text>
      </View>

      <View>
        <Text className="text-gray-700 font-semibold mb-2">First Name</Text>
        <View className="flex-row gap-3 w-full">
          <TextInput
            className='flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 mb-4'
            placeholder='First Name'
            placeholderTextColor='#9CA3AF'
          />
          <TextInput
            className='flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 mb-4'
            placeholder='Last Name'
            placeholderTextColor='#9CA3AF'
          />

        </View>
      </View>


    </View>
  )
}