import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { X, UserCheck, Camera, IdCard, CheckCircle2, Image as ImageIcon, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useGuardians } from "../hooks/useGuardian";
import type { Guardian } from "@/src/api/api.types";
import { useDocumentPicker } from "@/src/features/enrollment/hooks/useDocumentPicker";
import { mobileQueryKeys } from "@/src/lib/query-keys";

interface AddGuardianBottomSheetProps {
  childId: string | null;
  childName: string;
  visible: boolean;
  onClose: () => void;
  editGuardian?: Guardian | null;
  editIndex?: number | null;
}

export function AddGuardianBottomSheet({
  childId,
  childName,
  visible,
  onClose,
  editGuardian = null,
  editIndex = null,
}: AddGuardianBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { pickDocument } = useDocumentPicker();
  
  const isEditMode = editGuardian !== null && editIndex !== null;
  
  const { addGuardian, updateGuardian, isMutating } = useGuardians(childId || undefined);

  const [formData, setFormData] = useState<Partial<Guardian>>(() => 
    editGuardian ? { ...editGuardian } : {
      firstName: "",
      lastName: "",
      relationship: "Guardian",
      customRelationship: null,
      phone: "",
      photoUrl: null,
      idUrl: null,
    }
  );
  const [guardianPhotoFile, setGuardianPhotoFile] = useState<any>(null);
  const [guardianIdFile, setGuardianIdFile] = useState<any>(null);

  // Sync form when editGuardian changes (opening in edit mode)
  React.useEffect(() => {
    if (editGuardian) {
      setFormData({ ...editGuardian });
    } else {
      resetForm();
    }
  }, [editGuardian]);

  const resetForm = () => {
    setGuardianPhotoFile(null);
    setGuardianIdFile(null);
    setFormData({
      firstName: "",
      lastName: "",
      relationship: "Guardian",
      customRelationship: null,
      phone: "",
      photoUrl: null,
      idUrl: null,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!childId) return;
    
    try {
      if (
        !formData.firstName?.trim() ||
        !formData.lastName?.trim() ||
        !formData.phone?.trim()
      ) {
        Alert.alert(
          "Required Fields",
          "Please provide a first name, last name, and contact phone number.",
        );
        return;
      }

      if (
        formData.relationship === "Other" &&
        !formData.customRelationship?.trim()
      ) {
        Alert.alert(
          "Required Field",
          "Please specify the relationship when selecting 'Other'.",
        );
        return;
      }

      const payload: Partial<Guardian> = {
        ...(formData as Guardian),
        photoUrl: formData.photoUrl || null,
        idUrl: formData.idUrl || null,
      };

      if (isEditMode) {
        await updateGuardian({
          index: editIndex!,
          data: payload,
          files: {
            guardianPhoto: guardianPhotoFile,
            guardianId: guardianIdFile,
          },
        });
      } else {
        await addGuardian({
          data: payload,
          files: {
            guardianPhoto: guardianPhotoFile,
            guardianId: guardianIdFile,
          },
        });
      }

      // After successful add, refresh the main overview list so the badge counts update
      queryClient.invalidateQueries({
        queryKey: mobileQueryKeys.teacherChildrenOverview(),
      });
      if (childId) {
        queryClient.invalidateQueries({
          queryKey: mobileQueryKeys.teacherChildDetails(childId),
        });
      }
      
      handleClose();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save guardian.");
    }
  };

  const handlePickGuardianPhoto = async () => {
    const file = await pickDocument("parentId", "image");
    if (file) setGuardianPhotoFile(file);
  };

  const handlePickGuardianId = async () => {
    const file = await pickDocument("parentId", "image");
    if (file) setGuardianIdFile(file);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <Pressable className="flex-1" onPress={handleClose} />
          
          <View
            className="bg-gray-50 rounded-t-3xl pt-5 shadow-lg"
            style={{ maxHeight: "85%", paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-5 border-b border-gray-200/60 pb-3 px-5">
              <View className="flex-row items-center flex-1 pr-4">
                <View className="h-10 w-10 rounded-xl bg-teal-100 items-center justify-center mr-3">
                  <UserCheck size={20} color="#0D9488" />
                </View>
                <View>
                <Text className="text-lg font-black text-gray-900">
                    {isEditMode ? "Edit Guardian" : "Add Guardian"}
                  </Text>
                  <Text className="text-xs text-gray-500 font-medium" numberOfLines={1}>
                    For {childName}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleClose}
                className="h-8 w-8 rounded-full bg-gray-200/80 items-center justify-center active:opacity-85"
              >
                <X size={18} color="#4B5563" />
              </Pressable>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            >
              <Text className="text-base font-extrabold text-gray-700 mb-2 ml-2">
                First Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.firstName}
                onChangeText={(t) => setFormData({ ...formData, firstName: t })}
                placeholder="Jane"
                placeholderTextColor="#9CA3AF"
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 text-base text-gray-900 font-semibold"
              />

              <Text className="text-base font-extrabold text-gray-700 mb-2 ml-2">
                Last Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.lastName}
                onChangeText={(t) => setFormData({ ...formData, lastName: t })}
                placeholder="Doe"
                placeholderTextColor="#9CA3AF"
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 text-base text-gray-900 font-semibold"
              />

              <Text className="text-base font-extrabold text-gray-700 mb-3 ml-2">
                Relationship to Child
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {["Mother", "Father", "Guardian", "Grandparent", "Other"].map(
                  (rel) => {
                    const isSelected = formData.relationship === rel;
                    return (
                      <Pressable
                        key={rel}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            relationship: rel as any,
                            customRelationship:
                              rel === "Other" ? formData.customRelationship : null,
                          })
                        }
                        className={`mr-3 px-5 py-3 rounded-xl border active:opacity-85 ${
                          isSelected
                            ? "bg-teal-600 border-teal-600 shadow-sm"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <Text
                          className={`font-black text-base ${
                            isSelected ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {rel}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </ScrollView>

              {formData.relationship === "Other" && (
                <>
                  <Text className="text-base font-extrabold text-gray-700 mb-2 ml-2">
                    Specify Relationship <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    value={formData.customRelationship || ""}
                    onChangeText={(t) =>
                      setFormData({ ...formData, customRelationship: t })
                    }
                    placeholder="e.g. Uncle, Nanny, Family Friend"
                    placeholderTextColor="#9CA3AF"
                    maxLength={50}
                    className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 text-base text-gray-900 font-semibold"
                  />
                </>
              )}

              <Text className="text-base font-extrabold text-gray-700 mb-2 ml-2">
                Contact Phone Number <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                placeholder="0912 345 6789"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 text-base text-gray-900 font-semibold"
              />

              <Text className="text-base font-extrabold text-gray-700 mb-2 ml-2">
                Guardian Photo
              </Text>
              {guardianPhotoFile ? (
                <View className="relative mb-5 border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 items-center justify-center">
                  <Image 
                    source={{ uri: guardianPhotoFile.uri }} 
                    style={{ width: "100%", height: 160 }} 
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/20" />
                  <Pressable
                    onPress={() => {
                      setGuardianPhotoFile(null);
                      setFormData(prev => ({ ...prev, photoUrl: null }));
                    }}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 items-center justify-center active:bg-black/70"
                  >
                    <Trash2 size={16} color="white" />
                  </Pressable>
                  <View className="absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 rounded-lg flex-row items-center">
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text className="ml-1.5 text-xs font-bold text-gray-800">Photo Attached</Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handlePickGuardianPhoto}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl px-5 py-8 mb-5 items-center justify-center active:bg-gray-100"
                >
                  <View className="h-12 w-12 rounded-full bg-teal-100 items-center justify-center mb-3">
                    <Camera size={24} color="#0D9488" />
                  </View>
                  <Text className="text-base font-bold text-gray-800 mb-1">
                    Upload Guardian Photo
                  </Text>
                  <Text className="text-xs text-gray-500 font-medium">
                    Tap to select a clear photo (JPG, PNG)
                  </Text>
                </Pressable>
              )}

              <Text className="text-base font-extrabold text-gray-700 mb-2 ml-2">
                Valid ID
              </Text>
              {guardianIdFile ? (
                <View className="relative mb-5 border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 items-center justify-center">
                  <Image 
                    source={{ uri: guardianIdFile.uri }} 
                    style={{ width: "100%", height: 160 }} 
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/20" />
                  <Pressable
                    onPress={() => {
                      setGuardianIdFile(null);
                      setFormData(prev => ({ ...prev, idUrl: null }));
                    }}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 items-center justify-center active:bg-black/70"
                  >
                    <Trash2 size={16} color="white" />
                  </Pressable>
                  <View className="absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 rounded-lg flex-row items-center">
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text className="ml-1.5 text-xs font-bold text-gray-800">ID Attached</Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handlePickGuardianId}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl px-5 py-8 mb-5 items-center justify-center active:bg-gray-100"
                >
                  <View className="h-12 w-12 rounded-full bg-teal-100 items-center justify-center mb-3">
                    <IdCard size={24} color="#0D9488" />
                  </View>
                  <Text className="text-base font-bold text-gray-800 mb-1">
                    Upload Valid ID
                  </Text>
                  <Text className="text-xs text-gray-500 font-medium">
                    Tap to scan or select a document
                  </Text>
                </Pressable>
              )}

              <View className="flex-row gap-3 mt-2 mb-8">
                <Pressable
                  onPress={handleClose}
                  className="flex-1 items-center justify-center py-4 rounded-2xl border border-gray-300 bg-white active:opacity-85"
                >
                  <Text className="text-gray-700 font-black text-base">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={isMutating}
                  className={`flex-1 items-center justify-center py-4 rounded-2xl shadow-sm active:opacity-90 ${
                    isMutating ? "bg-teal-400" : "bg-teal-600"
                  }`}
                >
                  {isMutating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-black text-base">
                      {isEditMode ? "Update Guardian" : "Save Guardian"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
