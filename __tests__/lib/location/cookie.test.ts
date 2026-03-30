import {
  clearLocationCookie,
  getLocationCookie,
  setLocationCookie,
} from "@/lib/location/cookie";
import {
  LOCATION_COOKIE_MAX_AGE_SEC,
  LOCATION_COOKIE_NAME,
} from "@/lib/location/constants";

describe("location cookie helpers", () => {
  let cookieJar = "";
  beforeAll(() => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get() {
        return cookieJar;
      },
      set(v: string) {
        cookieJar = v;
      },
    });
  });

  beforeEach(() => {
    cookieJar = "";
  });

  it("getLocationCookie reads from a cookie store (server shape)", () => {
    const store = {
      get: (name: string) =>
        name === LOCATION_COOKIE_NAME
          ? { value: "  abc-123  " }
          : undefined,
    };
    expect(getLocationCookie(store)).toBe("abc-123");
  });

  it("getLocationCookie reads from document.cookie on the client", () => {
    document.cookie = `${LOCATION_COOKIE_NAME}=uuid-1; Path=/`;
    expect(getLocationCookie()).toBe("uuid-1");
  });

  it("setLocationCookie writes name, encoded value, Path, Max-Age, SameSite", () => {
    setLocationCookie("city/uuid%");
    expect(cookieJar).toContain(`${LOCATION_COOKIE_NAME}=`);
    expect(cookieJar).toContain(encodeURIComponent("city/uuid%"));
    expect(cookieJar).toContain("Path=/");
    expect(cookieJar).toContain(`Max-Age=${LOCATION_COOKIE_MAX_AGE_SEC}`);
    expect(cookieJar).toContain("SameSite=Lax");
  });

  it("clearLocationCookie removes cookie via Max-Age=0", () => {
    clearLocationCookie();
    expect(cookieJar).toContain("Max-Age=0");
    expect(cookieJar).toContain(`${LOCATION_COOKIE_NAME}=`);
  });
});
