import { Ionicons } from "@expo/vector-icons";
import { Link, usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { services } from "@/config/services";
import { useAuth } from "@/context/AuthContext";

const primaryRoutes = [
  { href: "/home", label: "Home", icon: "home-outline" as const },
  {
    href: "/marketplace",
    label: "Marketplace",
    icon: "storefront-outline" as const,
  },
  { href: "/account", label: "Account", icon: "person-outline" as const },
] as const;

const marketplaceRoutes = [
  {
    href: "/marketplace/listings",
    label: "Browse listings",
    icon: "bag-handle-outline" as const,
  },
  {
    href: "/marketplace/wanted",
    label: "What buyers need",
    icon: "search-outline" as const,
  },
  {
    href: "/marketplace/my-marketplace",
    label: "My marketplace",
    icon: "briefcase-outline" as const,
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationItem({
  href,
  label,
  icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  pathname: string;
}) {
  const active = isActive(pathname, href);

  return (
    <Link href={href as never} asChild>
      <Pressable
        className={`mb-1 flex-row items-center rounded-xl px-3 py-2.5 ${
          active ? "bg-gray-950" : "bg-transparent"
        }`}
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={active ? "#ffffff" : "#4b5563"}
        />
        <Text
          className={`ml-3 text-sm font-semibold ${
            active ? "text-white" : "text-gray-700"
          }`}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <View className="w-64 shrink-0 border-r border-gray-200 bg-white px-4 py-5">
      <View className="mb-7 flex-row items-center px-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-gray-950">
          <Ionicons name="sparkles" size={17} color="#ffffff" />
        </View>
        <Text className="ml-2.5 text-base font-bold tracking-tight text-gray-950">
          Campus Hub
        </Text>
      </View>

      <Text className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        Workspace
      </Text>

      {primaryRoutes.map((item) => (
        <NavigationItem key={item.href} {...item} pathname={pathname} />
      ))}

      <Text className="mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        Marketplace
      </Text>

      {marketplaceRoutes.map((item) => (
        <NavigationItem key={item.href} {...item} pathname={pathname} />
      ))}

      <Text className="mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        Services
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} className="max-h-56">
        {services.map((service) => (
          <NavigationItem
            key={service.id}
            href={service.path}
            label={service.name}
            icon={service.icon}
            pathname={pathname}
          />
        ))}
      </ScrollView>

      <View className="mt-auto border-t border-gray-100 pt-4">
        <Pressable
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
          className="flex-row items-center rounded-xl px-3 py-2.5"
        >
          <Ionicons name="log-out-outline" size={18} color="#4b5563" />
          <Text className="ml-3 text-sm font-semibold text-gray-700">
            Log out
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CompactWebHeader({ pathname }: { pathname: string }) {
  const { logout } = useAuth();
  const router = useRouter();
  const activeLabel = useMemo(() => {
    const all = [...primaryRoutes, ...marketplaceRoutes];
    return all.find((item) => isActive(pathname, item.href))?.label ?? "Campus Hub";
  }, [pathname]);

  return (
    <View className="border-b border-gray-200 bg-white px-5 py-3">
      <View className="mx-auto w-full max-w-5xl flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-gray-950">
            <Ionicons name="sparkles" size={17} color="#ffffff" />
          </View>
          <Text className="ml-2.5 text-base font-bold text-gray-950">
            Campus Hub
          </Text>
          <Text className="ml-3 text-sm text-gray-400">/</Text>
          <Text className="ml-3 text-sm font-semibold text-gray-600">
            {activeLabel}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.push("/account")}
            className="mr-2 rounded-full border border-gray-200 px-3.5 py-2"
          >
            <Text className="text-sm font-semibold text-gray-700">Account</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
            className="rounded-full bg-gray-950 px-3.5 py-2"
          >
            <Text className="text-sm font-semibold text-white">Log out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function WebAppShell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const desktop = width >= 1100;

  return (
    <View className="flex-1 bg-gray-50">
      {desktop ? (
        <View className="flex-1 flex-row">
          <DesktopSidebar pathname={pathname} />
          <View className="min-w-0 flex-1">{children}</View>
        </View>
      ) : (
        <View className="flex-1">
          <CompactWebHeader pathname={pathname} />
          <View className="min-w-0 flex-1">{children}</View>
        </View>
      )}
    </View>
  );
}
