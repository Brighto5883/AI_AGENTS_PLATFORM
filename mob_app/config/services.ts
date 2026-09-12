
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type ServiceStatus = "available" | "coming-soon";

export type UserPlan = "free" | "pro" | "enterprise";

export type Service = {
  id: string;
  name: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBackgroundColor: string;
  path: string;
  status: ServiceStatus;
  minPlan: UserPlan;
};

export const services: Service[] = [
  {
    id: "ku-marketplace",
    name: "KU Marketplace",
    description:
      "Buy, sell, and find services within the KU community.",
    icon: "storefront-outline",
    iconColor: "#2563eb",
    iconBackgroundColor: "#dbeafe",
    path: "/marketplace",
    status: "available",
    minPlan: "free",
  },

  {
    id: "whatsapp",
    name: "WhatsApp Assistant",
    description:
      "Draft replies to customer messages before you send them.",
    icon: "logo-whatsapp",
    iconColor: "#16a34a",
    iconBackgroundColor: "#dcfce7",
    path: "/agents/whatsapp",
    status: "available",
    minPlan: "free",
  },

  {
    id: "podcast",
    name: "Podcast Assistant",
    description:
      "AI tools for planning, producing, and managing podcasts.",
    icon: "mic-outline",
    iconColor: "#9333ea",
    iconBackgroundColor: "#f3e8ff",
    path: "/agents/podcast",
    status: "coming-soon",
    minPlan: "free",
  },

  {
    id: "email",
    name: "Email Assistant",
    description:
      "Draft thoughtful email replies for you to review and send.",
    icon: "mail-outline",
    iconColor: "#ea580c",
    iconBackgroundColor: "#ffedd5",
    path: "/agents/email",
    status: "coming-soon",
    minPlan: "free",
  },

  {
    id: "road-design",
    name: "Road Design Assistant",
    description:
      "AI assistance for Kenyan road design and engineering workflows.",
    icon: "construct-outline",
    iconColor: "#dc2626",
    iconBackgroundColor: "#fee2e2",
    path: "/agents/road",
    status: "available",
    minPlan: "free",
  },
];
