export type ServiceStatus = "available" | "coming-soon";

export type Service = {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  status: ServiceStatus;
};

export const services: Service[] = [
  {
    id: "road-design",
    name: "Road Design Assistant",
    description: "AI assistance for Kenyan road design and engineering.",
    icon: "construct-outline",
    path: "/agents/road",
    status: "available",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Assistant",
    description:
      "Draft replies to customer messages, then review, edit and send.",
    icon: "logo-whatsapp",
    path: "/agents/whatsapp",
    status: "available",
  },
  {
    id: "ku-marketplace",
    name: "KU Marketplace",
    description:
      "Access the KU marketplace directly through the AI Agents Platform.",
    icon: "storefront-outline",
    path: "/marketplace",
    status: "available",
  },
  {
    id: "email",
    name: "Email Assistant",
    description: "AI-drafted email replies, reviewed before sending.",
    icon: "mail-outline",
    path: "/agents/email",
    status: "coming-soon",
  },
  {
    id: "podcast",
    name: "Podcast Assistant",
    description: "AI-powered tools for podcast workflows.",
    icon: "mic-outline",
    path: "/agents/podcast",
    status: "coming-soon",
  },
];