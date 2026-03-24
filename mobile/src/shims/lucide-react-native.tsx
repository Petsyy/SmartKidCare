import React from "react";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

export type LucideProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
  style?: any;
  className?: string;
  [key: string]: unknown;
};

export type LucideIcon = React.ComponentType<LucideProps>;

const withFeather = (name: React.ComponentProps<typeof Feather>["name"]): LucideIcon =>
  ({ color = "currentColor", size = 24, style }) => (
    <Feather name={name} color={color} size={size} style={style} />
  );

const withIonicons = (name: React.ComponentProps<typeof Ionicons>["name"]): LucideIcon =>
  ({ color = "currentColor", size = 24, style }) => (
    <Ionicons name={name} color={color} size={size} style={style} />
  );

const withMaterialCommunity = (
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"],
): LucideIcon =>
  ({ color = "currentColor", size = 24, style }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} style={style} />
  );

const withMaterialIcons = (
  name: React.ComponentProps<typeof MaterialIcons>["name"],
): LucideIcon =>
  ({ color = "currentColor", size = 24, style }) => (
    <MaterialIcons name={name} color={color} size={size} style={style} />
  );

export const Activity = withFeather("activity");
export const AlertCircle = withFeather("alert-circle");
export const Baby = withMaterialCommunity("baby-face-outline");
export const BarChart3 = withFeather("bar-chart-2");
export const Bell = withIonicons("notifications-outline");
export const BookOpen = withFeather("book-open");
export const Bot = withMaterialCommunity("robot-outline");
export const Calendar = withIonicons("calendar-outline");
export const CalendarDays = withIonicons("calendar-clear-outline");
export const Camera = withIonicons("camera-outline");
export const Check = withIonicons("checkmark");
export const CheckCircle = withFeather("check-circle");
export const CheckCircle2 = withFeather("check-circle");
export const ChevronDown = withIonicons("chevron-down");
export const ChevronLeft = withIonicons("chevron-back");
export const ChevronRight = withIonicons("chevron-forward");
export const ClipboardCheck = withMaterialCommunity("clipboard-check-outline");
export const Clock3 = withIonicons("time-outline");
export const Eye = withIonicons("eye-outline");
export const EyeOff = withIonicons("eye-off-outline");
export const FileText = withFeather("file-text");
export const Grid2X2 = withMaterialCommunity("view-grid-outline");
export const HelpCircle = withFeather("help-circle");
export const Home = withIonicons("home-outline");
export const Lightbulb = withFeather("sun");
export const Lock = withIonicons("lock-closed-outline");
export const LogOut = withMaterialIcons("logout");
export const Mail = withIonicons("mail-outline");
export const MailCheck = withMaterialCommunity("email-check-outline");
export const MapPin = withIonicons("location-outline");
export const MessageCircle = withIonicons("chatbubble-ellipses-outline");
export const Phone = withIonicons("call-outline");
export const Plus = withIonicons("add");
export const Search = withIonicons("search-outline");
export const Send = withIonicons("send-outline");
export const Shield = withIonicons("shield-checkmark-outline");
export const ShieldCheck = withIonicons("shield-checkmark-outline");
export const Upload = withIonicons("cloud-upload-outline");
export const User = withIonicons("person-outline");
export const UserCheck = withMaterialCommunity("account-check-outline");
export const UserRound = withIonicons("person-circle-outline");
export const Users = withIonicons("people-outline");
export const UserX = withMaterialCommunity("account-remove-outline");
export const Utensils = withMaterialCommunity("silverware");
export const UtensilsCrossed = withMaterialCommunity("silverware-fork-knife");
export const X = withIonicons("close");
export const XCircle = withIonicons("close-circle-outline");
export const Zap = withIonicons("flash-outline");

const Icons = {
  Activity,
  AlertCircle,
  Baby,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Grid2X2,
  HelpCircle,
  Home,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Upload,
  User,
  UserCheck,
  UserRound,
  Users,
  UserX,
  Utensils,
  UtensilsCrossed,
  X,
  XCircle,
  Zap,
};

export default Icons;
