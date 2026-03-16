import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import * as Icons from "lucide-react-native";

type UserRole = "teacher" | "parent";

type GuideItem = {
	title: string;
	description: string;
};

type UserGuideContent = {
	intro: string;
	items: GuideItem[];
	tips: string[];
	helpText: string;
};

type UserGuideModalProps = {
	visible: boolean;
	onClose: () => void;
	role: UserRole;
};

const GUIDE_BY_ROLE: Record<UserRole, UserGuideContent> = {
	teacher: {
		intro:
			"This guide explains the teacher workflow so you can keep child records accurate, timely, and easy for families to follow.",
		items: [
			{
				title: "1. Start your day with attendance",
				description:
					"Open Attendance first and mark each child as Present or Absent. Review the list before submitting so parent notifications reflect accurate status.",
			},
			{
				title: "2. Record feeding updates on time",
				description:
					"Use Feeding to track completed and missed meals. Submit right after mealtime to keep family updates timely and useful.",
			},
			{
				title: "3. Review alerts and notifications",
				description:
					"Check Notifications for reminders, submission confirmations, and follow-up items from your center admin.",
			},
			{
				title: "4. Keep profile information current",
				description:
					"Confirm your phone number and assigned center on this Profile page. If details are outdated, ask your admin to update them in the dashboard.",
			},
			{
				title: "5. Handle mistakes quickly",
				description:
					"If you submit an incorrect attendance or feeding entry, notify your admin immediately so records can be corrected and parent trust remains high.",
			},
			{
				title: "6. Protect your account",
				description:
					"Change your password regularly, avoid sharing your account, and always log out from shared devices.",
			},
		],
		tips: [
			"Submit records as soon as classroom events happen.",
			"Double-check child names before final submission.",
			"Use clear notes when reporting any issue to admin.",
		],
		helpText:
			"If you experience issues, contact your center administrator and include a screenshot, the child involved, and the time the issue occurred so support can resolve it faster.",
	},
	parent: {
		intro:
			"This guide helps parents understand where to find daily child updates and how to use each feature effectively.",
		items: [
			{
				title: "1. Check your dashboard daily",
				description:
					"Use the Home screen for a quick view of attendance, feeding updates, and recent activity for your child.",
			},
			{
				title: "2. Review attendance history",
				description:
					"Open attendance history to track Present and Absent days across weeks and months, and follow up early when patterns change.",
			},
			{
				title: "3. Track feeding records",
				description:
					"Use feeding records to monitor completed and missed meals and support conversations with your teacher about routines.",
			},
			{
				title: "4. Stay updated through notifications",
				description:
					"Read notifications for new submissions and important updates. Open each item to mark it as read and keep your inbox clear.",
			},
			{
				title: "5. Keep profile and contact details updated",
				description:
					"Review your phone and email on this page so the center can reach you quickly when needed.",
			},
			{
				title: "6. Secure your account",
				description:
					"Change your password regularly and log out on shared phones to protect your account and child information.",
			},
		],
		tips: [
			"Check notifications at least once in the morning and once in the evening.",
			"Report any missing record to the teacher on the same day.",
			"Keep your phone number updated so urgent alerts reach you quickly.",
		],
		helpText:
			"If something does not look right, contact your child's teacher or center admin and share a screenshot with the date and time so they can investigate quickly.",
	},
};

export default function UserGuideModal({
	visible,
	onClose,
	role,
}: UserGuideModalProps) {
	const content = GUIDE_BY_ROLE[role];

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent={true}
			onRequestClose={onClose}
		>
			<View className="flex-1 bg-black/50 items-center justify-end">
				<View className="w-full h-[80%] rounded-t-3xl bg-white p-6">
					<View className="flex-row items-center justify-between mb-4">
						<Text className="text-2xl font-bold text-gray-900">Help & User Guide</Text>
						<TouchableOpacity onPress={onClose}>
							<Icons.X size={24} color="#6B7280" />
						</TouchableOpacity>
					</View>

					<ScrollView
						className="flex-1"
						contentContainerClassName="pb-4"
						showsVerticalScrollIndicator={false}
					>
						<Text className="text-sm text-gray-600 mb-4">{content.intro}</Text>

						{content.items.map((item) => (
							<View key={item.title} className="mb-4">
								<Text className="text-base font-semibold text-gray-900 mb-1">
									{item.title}
								</Text>
								<Text className="text-sm text-gray-600 leading-5">
									{item.description}
								</Text>
							</View>
						))}

						<View className="mb-4 rounded-2xl bg-teal-50 p-4 border border-teal-100">
							<Text className="text-base font-semibold text-teal-800 mb-2">Quick Tips</Text>
							{content.tips.map((tip) => (
								<Text key={tip} className="text-sm text-teal-700 leading-5 mb-1">
									- {tip}
								</Text>
							))}
						</View>

						<View className="mb-2">
							<Text className="text-base font-semibold text-gray-900 mb-1">Need more help?</Text>
							<Text className="text-sm text-gray-600 leading-5">{content.helpText}</Text>
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}
