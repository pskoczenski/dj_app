import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/db/schema-constants";
import { DEFAULT_SIGNUP_CITY_ID } from "@/lib/db/default-city";
import { getLocationCookie } from "@/lib/location/cookie";
import { LocationProvider } from "@/lib/location/location-provider";
import { citiesServerService } from "@/lib/services/cities-server";
import { MainLayoutClient } from "./main-layout-client";
import type { City } from "@/types";

const PROFILE_WITH_CITY =
  "*, cities:city_id(id, name, state_name, state_code, created_at)";

async function resolveHomeCity(): Promise<City> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from(TABLES.profiles)
      .select(PROFILE_WITH_CITY)
      .eq("id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    const row = profile as {
      cities?: City | null;
      city_id?: string | null;
    } | null;

    if (row?.cities) return row.cities;
    if (row?.city_id) {
      const c = await citiesServerService.getById(row.city_id);
      if (c) return c;
    }
  }

  const fallback = await citiesServerService.getById(DEFAULT_SIGNUP_CITY_ID);
  if (!fallback) {
    throw new Error(
      "Default signup city missing — run migrations / seed (DEFAULT_SIGNUP_CITY_ID).",
    );
  }
  return fallback;
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const homeCity = await resolveHomeCity();
  const cookieStore = await cookies();
  const cookieCityId = getLocationCookie(cookieStore);

  let initialOverrideCity: City | null = null;
  if (cookieCityId && cookieCityId !== homeCity.id) {
    const c = await citiesServerService.getById(cookieCityId);
    if (c) initialOverrideCity = c;
  }

  return (
    <LocationProvider
      homeCity={homeCity}
      initialOverrideCity={initialOverrideCity}
    >
      <MainLayoutClient>{children}</MainLayoutClient>
    </LocationProvider>
  );
}
