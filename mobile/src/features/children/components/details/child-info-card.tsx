import React from "react";
import { View, Text } from "react-native";
import { BookOpen, User, MapPin, Scale, Ruler, Activity, Calendar } from "lucide-react-native";
import { InfoRow } from "./info-row";
import type { Child } from "@/src/api/parent.api";

interface ChildInfoCardProps {
  child: Child;
}

export function ChildInfoCard({ child }: ChildInfoCardProps) {
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Manila",
    });
  };

  return (
    <View
      className="rounded-3xl bg-white p-5 mb-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="mb-4 flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
            <User size={20} color="#0D9488" />
          </View>
          <Text className="flex-1 text-xl font-bold text-gray-900">
            Child Information
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap">
        <View className="w-1/2 pr-2 mb-4">
          <InfoRow
            icon={<BookOpen size={18} color="#0D9488" />}
            label="Age"
            value={`${child.age} years old`}
          />
        </View>
        <View className="w-1/2 pl-2 mb-4">
          <InfoRow
            icon={<User size={18} color="#0D9488" />}
            label="Gender"
            value={child.gender}
          />
        </View>
        <View className="w-full mb-4">
          <InfoRow
            icon={<MapPin size={18} color="#0D9488" />}
            label="Complete Home Address"
            value={child.homeAddress || "Not provided"}
          />
        </View>
        <View className="w-1/2 pr-2 mb-4">
          <InfoRow
            icon={<Scale size={18} color="#0D9488" />}
            label="Weight"
            value={child.weight ? `${child.weight} kg` : "Not provided"}
          />
        </View>
        <View className="w-1/2 pl-2 mb-4">
          <InfoRow
            icon={<Ruler size={18} color="#0D9488" />}
            label="Height"
            value={child.height ? `${child.height} cm` : "Not provided"}
          />
        </View>
        <View className="w-full mb-4">
          <InfoRow
            icon={<Activity size={18} color="#0D9488" />}
            label="Body Type / Nutritional Status"
            value={child.nutritionalStatus || "Not classified"}
          />
        </View>
        <View className="w-1/2 pr-2 mb-4">
          <InfoRow
            icon={<Calendar size={18} color="#0D9488" />}
            label="School Year"
            value={child.schoolYear}
          />
        </View>
        <View className="w-1/2 pl-2 mb-4">
          <InfoRow
            icon={<Activity size={18} color="#0D9488" />}
            label="Status"
            value={child.status}
          />
        </View>
        {child.dateOfBirth && (
          <View className="w-1/2 pr-2 mb-4">
            <InfoRow
              icon={<Calendar size={18} color="#0D9488" />}
              label="Date of Birth"
              value={formatDate(child.dateOfBirth) || ""}
            />
          </View>
        )}
        <View className="w-1/2 pl-2 mb-4">
          <InfoRow
            icon={<Calendar size={18} color="#0D9488" />}
            label="Enrollment Date"
            value={formatDate(child.enrollmentDate) || ""}
          />
        </View>
      </View>
    </View>
  );
}
