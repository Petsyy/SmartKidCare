import {
  Clock3,
  Eye,
  FileText,
  Key,
  Mail,
  Phone,
  Search,
  XCircle,
} from "lucide-react-native";
import {
  Pressable,
  Text,
  TextInput,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import React, { useEffect } from "react";
import type { TeacherEnrollmentRequest } from "@/src/api/teacher.api";
import {
  EnrollmentRequestBlockchainStatus,
  FilterChips,
  SearchBar,
} from "@/src/features/enrollment/components/ui";
import {
  buildRequestChildName,
  formatRequestDate,
  getStatusColors,
} from "@/src/features/enrollment/utils/enrollment-utils";
import { useSubmittedRequests } from "@/src/features/enrollment/hooks/useSubmittedRequests";
import { ENROLL_COLORS } from "@/src/features/enrollment/constants";

export function SubmittedRequestsPanel({
  onViewParentPassword,
  onResetParentPassword,
  contentPadding,
  contentMaxWidth,
}: {
  onViewParentPassword: (request: TeacherEnrollmentRequest) => void;
  onResetParentPassword: (
    request: TeacherEnrollmentRequest,
    onRefresh: () => void,
  ) => void;
  contentPadding?: number;
  contentMaxWidth?: number;
}) {
  const {
    submittedSummary,
    submittedStatusFilter,
    setSubmittedStatusFilter,
    submittedSearchQuery,
    setSubmittedSearchQuery,
    loadingSubmitted,
    submittedRequests,
    filteredSubmittedRequests,
    refreshSubmitted,
  } = useSubmittedRequests();

  useEffect(() => {
    refreshSubmitted();
  }, [refreshSubmitted]);

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={loadingSubmitted}
          onRefresh={() => void refreshSubmitted()}
          tintColor="#0D9488"
        />
      }
      contentContainerStyle={{
        paddingHorizontal: contentPadding,
        paddingTop: 16,
        paddingBottom: 36,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        className="w-full self-center"
        style={{ maxWidth: contentMaxWidth }}
      >
        <View className="mb-5 rounded-3xl overflow-hidden bg-white shadow-lg shadow-teal-600/20">
          {/* Teal header banner */}
          <View className="bg-[#0F766E] px-[20px] pt-[20px] pb-[18px]">
            <View className="flex-row items-center gap-[14px]">
              <View className="h-[48px] w-[48px] rounded-[16px] bg-[rgba(255,255,255,0.2)] items-center justify-center">
                <FileText size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-[22px] font-black text-[#FFFFFF] tracking-[-0.5px]">
                  Enrollment Requests
                </Text>
                <Text className="text-[12px] font-bold text-[#99F6E4] uppercase tracking-[1px] mt-[2px]">
                  Track and manage submissions
                </Text>
              </View>
            </View>
          </View>

          {/* Filter chips */}
          <FilterChips
            options={[
              {
                key: "all",
                label: "All",
                count: submittedSummary.all,
                activeColor: ENROLL_COLORS.primary,
                activeBg: ENROLL_COLORS.primary,
                inactiveBg: ENROLL_COLORS.primaryBg,
                inactiveBorder: ENROLL_COLORS.primaryBorder,
                inactiveText: ENROLL_COLORS.primary,
              },
              {
                key: "pending",
                label: "Pending",
                count: submittedSummary.pending,
                activeColor: ENROLL_COLORS.white,
                activeBg: ENROLL_COLORS.pending,
                inactiveBg: ENROLL_COLORS.pendingBg,
                inactiveBorder: ENROLL_COLORS.pendingBorder,
                inactiveText: ENROLL_COLORS.pendingText,
              },
              {
                key: "rejected",
                label: "Rejected",
                count: submittedSummary.rejected,
                activeColor: ENROLL_COLORS.white,
                activeBg: ENROLL_COLORS.rejected,
                inactiveBg: ENROLL_COLORS.rejectedBg,
                inactiveBorder: ENROLL_COLORS.rejectedBorder,
                inactiveText: ENROLL_COLORS.rejectedText,
              },
            ]}
            activeFilter={submittedStatusFilter}
            onSelectFilter={setSubmittedStatusFilter as any}
          />

          {/* Search bar */}
          <SearchBar
            value={submittedSearchQuery}
            onChangeText={setSubmittedSearchQuery}
            placeholder="Search child or parent name..."
          />
        </View>

        {/* ── Content ─────────────────────────────────── */}
        {loadingSubmitted ? (
          <View className="rounded-3xl bg-white p-10 items-center shadow-sm">
            <Text className="text-[16px] font-bold text-[#6B7280] mt-[16px]">
              Loading requests...
            </Text>
          </View>
        ) : submittedRequests.length === 0 ? (
          <View className="rounded-3xl bg-white p-10 items-center shadow-md shadow-teal-600/20">
            <View className="h-[84px] w-[84px] rounded-[24px] bg-[#F0FDFA] items-center justify-center mb-[16px]">
              <FileText size={44} color="#0D9488" />
            </View>
            <Text className="text-[24px] font-black text-[#111827] text-center">
              No Requests Yet
            </Text>
            <Text className="mt-[8px] max-w-[240px] text-center text-[16px] font-bold text-[#6B7280] leading-[24px]">
              Switch to &quot;New Request&quot; to submit a child enrollment for
              review.
            </Text>
          </View>
        ) : filteredSubmittedRequests.length === 0 ? (
          <View className="rounded-3xl bg-white p-10 items-center shadow-md">
            <View className="h-[84px] w-[84px] rounded-[24px] bg-[#F1F5F9] items-center justify-center mb-[16px]">
              <Search size={44} color="#64748B" />
            </View>
            <Text className="text-[24px] font-black text-[#111827] text-center">
              No Matches Found
            </Text>
            <Text className="mt-[8px] max-w-[240px] text-center text-[16px] font-bold text-[#6B7280] leading-[24px]">
              We couldn&apos;t find any requests matching your current filters.
            </Text>
            <Pressable
              onPress={() => {
                setSubmittedSearchQuery("");
                setSubmittedStatusFilter("all");
              }}
              className="mt-5 rounded-[16px] bg-[#0D9488] px-[32px] py-[14px] shadow-md shadow-teal-600/30"
            >
              <Text className="text-[16px] font-black text-[#FFFFFF]">
                Clear All Filters
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-4">
            {filteredSubmittedRequests.map((request) => {
              const status = getStatusColors(request.status);
              const isRejected = request.status === "rejected";
              const isApproved = request.status === "approved";
              const statusAccentColor = isRejected
                ? "#DC2626"
                : isApproved
                  ? "#059669"
                  : "#D97706";
              const statusSoftBackground = isRejected
                ? "#FFF1F2"
                : isApproved
                  ? "#ECFDF5"
                  : "#FFFBEB";
              const childFullName =
                buildRequestChildName(request) || "Child not specified";
              const parentFullName = [
                request.parent.firstName,
                request.parent.lastName,
              ]
                .filter((value) => String(value || "").trim().length > 0)
                .join(" ");
              const programLabel =
                request.child.programType === "4Ps Beneficiary"
                  ? "4Ps Beneficiary"
                  : "Regular Enrollee";

              return (
                <View
                  key={request._id}
                  className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-lg"
                  style={{ shadowColor: statusAccentColor }}
                >
                  <View
                    className="h-[6px]"
                    style={{ backgroundColor: statusAccentColor }}
                  />
                  <View className="p-[18px]">
                    <View className="flex-row items-flex-start justify-between">
                      <View className="flex-1 pr-[12px]">
                        <View className="flex-row items-center">
                          <View
                            className="h-[46px] w-[46px] rounded-[14px] items-center justify-center"
                            style={{ backgroundColor: statusSoftBackground }}
                          >
                            <FileText size={20} color={statusAccentColor} />
                          </View>
                          <View className="flex-1 ml-[10px]">
                            <Text className="text-[12px] font-black tracking-[0.7px] uppercase text-[#334155]">
                              Child Name
                            </Text>
                            <Text className="text-[22px] font-black text-[#111827] tracking-[-0.4px]">
                              {childFullName}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View
                        className="rounded-[12px] px-[12px] py-[8px]"
                        style={{ backgroundColor: status.badgeBackgroundColor }}
                      >
                        <Text
                          className="text-[12px] font-black uppercase tracking-[0.8px]"
                          style={{ color: status.textColor }}
                        >
                          {status.label}
                        </Text>
                      </View>
                    </View>

                    <View className="mt-[14px] rounded-[16px] border-[1px] border-[#E2E8F0] bg-[#FFFFFF] p-[13px]">
                      <Text className="text-[12px] font-black uppercase tracking-[0.7px] text-[#334155]">
                        Enrollment Details
                      </Text>
                      <View className="mt-[10px] gap-[9px]">
                        <View className="flex-row gap-[10px]">
                          <View className="flex-1 rounded-[12px] border-[1px] border-[#E2E8F0] bg-[#F8FAFC] px-[10px] py-[9px]">
                            <Text className="text-[11px] font-black uppercase tracking-[0.65px] text-[#334155]">
                              Parent Name
                            </Text>
                            <Text
                              numberOfLines={1}
                              className="mt-[4px] text-[14px] font-extrabold text-[#1F2937]"
                            >
                              {parentFullName || "Parent not specified"}
                            </Text>
                          </View>
                          <View className="flex-1 rounded-[12px] border-[1px] border-[#E2E8F0] bg-[#F8FAFC] px-[10px] py-[9px]">
                            <Text className="text-[11px] font-black uppercase tracking-[0.65px] text-[#334155]">
                              Program Type
                            </Text>
                            <Text
                              numberOfLines={1}
                              className="mt-[4px] text-[14px] font-extrabold text-[#1F2937]"
                            >
                              {programLabel}
                            </Text>
                          </View>
                        </View>
                        <View className="rounded-[12px] border-[1px] border-[#E2E8F0] bg-[#F8FAFC] px-[10px] py-[9px]">
                          <Text className="text-[11px] font-black uppercase tracking-[0.65px] text-[#334155]">
                            Submitted Date
                          </Text>
                          <View className="mt-[4px] flex-row items-center">
                            <Clock3 size={13} color="#64748B" />
                            <Text className="ml-[6px] text-[14px] font-extrabold text-[#1F2937]">
                              {formatRequestDate(request.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View className="mt-[14px] rounded-[16px] border-[1px] border-[#E2E8F0] bg-[#F8FAFC] p-[13px]">
                      <Text className="text-[12px] font-black uppercase tracking-[0.7px] text-[#334155]">
                        Parent Contact
                      </Text>
                      <View className="mt-[8px] gap-[8px]">
                        <View className="flex-row items-center">
                          <Mail size={14} color="#475569" />
                          <Text
                            numberOfLines={1}
                            className="flex-1 ml-[8px] text-[13px] font-bold text-[#334155]"
                          >
                            {request.parent.email || "No email provided"}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Phone size={14} color="#475569" />
                          <Text className="ml-[8px] text-[13px] font-bold text-[#334155]">
                            {request.parent.phone || "No phone provided"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {isRejected && request.review?.reason ? (
                      <View className="mt-[14px] rounded-[16px] bg-[#FFF1F2] border-[1px] border-[#FECDD3] p-[14px]">
                        <View className="flex-row items-center gap-[8px] mb-[6px]">
                          <XCircle size={14} color="#B91C1C" />
                          <Text className="text-[12px] font-black uppercase tracking-[0.8px] text-[#B91C1C]">
                            Rejection Reason
                          </Text>
                        </View>
                        <Text className="text-[14px] font-bold text-[#991B1B] leading-[20px]">
                          {request.review.reason}
                        </Text>
                      </View>
                    ) : null}

                    <View className="mt-[2px]">
                      <EnrollmentRequestBlockchainStatus request={request} />
                    </View>

                    <View className="mt-[14px] flex-row flex-wrap justify-end gap-[8px] border-t border-[#E5E7EB] pt-[14px]">
                      <Pressable
                        onPress={() => onViewParentPassword(request)}
                        className="flex-row items-center gap-[8px] rounded-[16px] border-[1.5px] border-[#BFDBFE] bg-[#EFF6FF] px-[16px] py-[10px]"
                      >
                        <Eye size={14} color="#1D4ED8" />
                        <Text className="text-[15px] font-bold text-[#1E40AF]">
                          View Password
                        </Text>
                      </Pressable>
                      {request.showResetParentPassword !== false ? (
                        <Pressable
                          onPress={() =>
                            onResetParentPassword(request, refreshSubmitted)
                          }
                          className="flex-row items-center gap-[8px] rounded-[16px] border-[1.5px] border-[#FDE68A] bg-[#FFFBEB] px-[16px] py-[10px]"
                        >
                          <Key size={14} color="#B45309" />
                          <Text className="text-[15px] font-bold text-[#92400E]">
                            Reset Password
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
