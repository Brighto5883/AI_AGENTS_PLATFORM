// Single source of truth for every service on the platform.
// Adding a new agent later = one new entry here + one new route in routes.jsx.
// Nothing else needs to change to make it show up on the dashboard.

const services = [
  {
    id: "road-design",
    name: "Road Design Assistant",
    description: "Kenyan road design Agent",
    icon: "road",
    path: "/chat",
    status: "available",
    minPlan: "free",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Assistant",
    description: "Assistance in drafting replies to customers' messages. Approve or edit then send",
    icon: "whatsapp",
    path: "/drafts",
    status: "available",
    minPlan: "free",
  },
  {
    id: "email",
    name: "Email Assistant",
    description: "AI-drafted email replies, reviewed before sending",
    icon: "email",
    path: "/email",
    status: "coming-soon",
    minPlan: "pro",
  },
];

export default services;