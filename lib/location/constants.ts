/** Persisted active browse location (`city_id` UUID). */
export const LOCATION_COOKIE_NAME = "dj_active_city";

/** 30 days — long absence falls back to profile home city. */
export const LOCATION_COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60;
