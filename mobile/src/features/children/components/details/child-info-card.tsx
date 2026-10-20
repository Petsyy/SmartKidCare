import React from "react";
import { View, Text } from "react-native";
import {
  BookOpen,
  User,
  MapPin,
  Scale,
  Ruler,
  Activity,
  Calendar,
  GraduationCap,
  Sparkles,
} from "lucide-react-native";
import type { Child } from "@/src/api/parent.api";

interface ChildInfoCardProps {
  child: Child;
}

export function ChildInfoCard({ child }: ChildInfoCardProps) {
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Manila",
    });
  };

  const isActive = child.status?.toLowerCase() === "active";
  const nutritionalStatus = child.nutritionalStatus || "Not classified";
  const isNormalNutrition = nutritionalStatus.toLowerCase().includes("normal");

  return (
    <View
      className="rounded-3xl bg-white p-5 mb-4 border border-slate-100"
      style={{
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* ── Header ── */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
            <User size={20} color="#0D9488" />
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-900">
              Child Information
            </Text>
            {child.studentId ? (
              <Text className="text-xs font-semibold text-gray-400">
                ID: {child.studentId}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Status Badge */}
        <View
          className={`flex-row items-center rounded-full px-3 py-1 ${
            isActive ? "bg-emerald-50 border border-emerald-200" : "bg-gray-100 border border-gray-200"
          }`}
        >
          <View
            className={`mr-1.5 h-2 w-2 rounded-full ${
              isActive ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          <Text
            className={`text-xs font-bold ${
              isActive ? "text-emerald-700" : "text-gray-600"
            }`}
          >
            {child.status || "Unknown"}
          </Text>
        </View>
      </View>

      {/* ── Key Metrics Highlights ── */}
      <View className="mb-4 flex-row gap-2">
        <View className="flex-1 rounded-2xl bg-teal-50/60 p-3 items-center border border-teal-100/60">
          <View className="flex-row items-center gap-1 mb-1">
            <BookOpen size={14} color="#0D9488" />
            <Text className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Age
            </Text>
          </View>
          <Text className="text-base font-extrabold text-teal-950">
            {child.age ? `${child.age} yrs` : "—"}
          </Text>
        </View>

        <View className="flex-1 rounded-2xl bg-sky-50/60 p-3 items-center border border-sky-100/60">
          <View className="flex-row items-center gap-1 mb-1">
            <Scale size={14} color="#0284C7" />
            <Text className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
              Weight
            </Text>
          </View>
          <Text className="text-base font-extrabold text-sky-950">
            {child.weight ? `${child.weight} kg` : "—"}
          </Text>
        </View>

        <View className="flex-1 rounded-2xl bg-indigo-50/60 p-3 items-center border border-indigo-100/60">
          <View className="flex-row items-center gap-1 mb-1">
            <Ruler size={14} color="#4F46E5" />
            <Text className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Height
            </Text>
          </View>
          <Text className="text-base font-extrabold text-indigo-950">
            {child.height ? `${child.height} cm` : "—"}
          </Text>
        </View>
      </View>

      {/* ── Section: Health & Growth ── */}
      <View className="mb-3 rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={14} color="#0D9488" />
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Health & Vitals
            </Text>
          </View>
          <View
            className={`rounded-full px-2.5 py-0.5 ${
              isNormalNutrition ? "bg-emerald-100/80" : "bg-amber-100/80"
            }`}
          >
            <Text
              className={`text-[11px] font-bold ${
                isNormalNutrition ? "text-emerald-800" : "text-amber-800"
              }`}
            >
              {nutritionalStatus}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between pt-1">
          <View className="flex-1 pr-2">
            <Text className="text-[11px] font-medium text-gray-400">Gender</Text>
            <Text className="text-sm font-semibold text-gray-800 mt-0.5">
              {child.gender || "Not specified"}
            </Text>
          </View>
          {child.dateOfBirth ? (
            <View className="flex-1 pl-2">
              <Text className="text-[11px] font-medium text-gray-400">Date of Birth</Text>
              <Text className="text-sm font-semibold text-gray-800 mt-0.5">
                {formatDate(child.dateOfBirth)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Section: Enrollment Details ── */}
      <View className="mb-3 rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
        <View className="mb-2 flex-row items-center gap-1.5">
          <GraduationCap size={14} color="#0D9488" />
          <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">
            School & Enrollment
          </Text>
        </View>

        <View className="flex-row justify-between pt-1">
          <View className="flex-1 pr-2">
            <Text className="text-[11px] font-medium text-gray-400">School Year</Text>
            <Text className="text-sm font-semibold text-gray-800 mt-0.5">
              {child.schoolYear || "—"}
            </Text>
          </View>
          <View className="flex-1 pl-2">
            <Text className="text-[11px] font-medium text-gray-400">Enrolled On</Text>
            <Text className="text-sm font-semibold text-gray-800 mt-0.5">
              {formatDate(child.enrollmentDate) || "—"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Section: Address ── */}
      <View className="rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
        <View className="flex-row items-start gap-2.5">
          <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-lg bg-teal-100/60">
            <MapPin size={14} color="#0D9488" />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] font-medium text-gray-400">
              Home Address
            </Text>
            <Text className="text-sm font-medium text-gray-800 mt-0.5 leading-5">
              {child.homeAddress?.trim() ? child.homeAddress : "No address provided"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
