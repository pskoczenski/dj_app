"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { eventsService } from "@/lib/services/events";
import { eventLineupService } from "@/lib/services/event-lineup";
import { conversationsService } from "@/lib/services/conversations";
import { storageService } from "@/lib/services/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GenreSelect } from "@/components/forms/genre-select";
import { ImageUpload } from "@/components/forms/image-upload";
import { CityAutocomplete } from "@/components/forms/city-autocomplete";
import { citiesService } from "@/lib/services/cities";
import { genresService } from "@/lib/services/genres";
import {
  LineupBuilder,
  type LineupEntry,
} from "@/components/events/lineup-builder";
import { LineupCard } from "@/components/events/lineup-card";
import { EventCancelVsDeleteHelp } from "@/components/events/event-cancel-vs-delete-help";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  buildAdmissionPayload,
  decomposeAdmission,
  type AdmissionFormType,
  type TierRow,
} from "@/lib/utils/admission-form";
import type {
  Admission,
  City,
  Event,
  EventInsert,
  EventUpdate,
  EventLineup,
  EventStatus,
  Genre,
} from "@/types";
import {
  InvalidLineupSetTimeError,
  parseLineupSetTimeToPostgres,
} from "@/lib/format-time";

function normLineupForDirtyCompare(entries: LineupEntry[]): unknown[] {
  return [...entries]
    .map((e) => ({
      eventLineupId: e.eventLineupId ?? null,
      profileId: e.profileId,
      setTime: e.setTime.trim(),
      sortOrder: e.sortOrder,
      isHeadliner: e.isHeadliner,
    }))
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.profileId.localeCompare(b.profileId);
    });
}

function serializeEditFormState(args: {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  streetAddress: string;
  cityId: string;
  country: string;
  ticketUrl: string;
  genreIds: string[];
  flyerUrl: string | null;
  lineup: LineupEntry[];
  admissionType: AdmissionFormType;
  fixedAmount: string;
  scaleMin: string;
  scaleMax: string;
  tiers: TierRow[];
  isTicketed: boolean;
}): string {
  return JSON.stringify({
    title: args.title.trim(),
    description: args.description.trim(),
    startDate: args.startDate,
    endDate: args.endDate,
    startTime: args.startTime,
    endTime: args.endTime,
    venue: args.venue.trim(),
    streetAddress: args.streetAddress.trim(),
    cityId: args.cityId,
    country: args.country.trim(),
    ticketUrl: args.ticketUrl.trim(),
    genreIds: [...args.genreIds].sort(),
    flyerUrl: args.flyerUrl ?? "",
    lineup: normLineupForDirtyCompare(args.lineup),
    admission: {
      type: args.admissionType,
      fixedAmount: args.fixedAmount.trim(),
      scaleMin: args.scaleMin.trim(),
      scaleMax: args.scaleMax.trim(),
      tiers: args.tiers.map((t) => ({
        label: t.label.trim(),
        amount: t.amount.trim(),
        until: t.until.trim(),
      })),
    },
    isTicketed: args.isTicketed,
  });
}

/** Minimal row shape for LineupCard preview from builder state. */
function lineupEntryToCardProps(entry: LineupEntry): {
  item: EventLineup;
  profile: {
    id: string;
    display_name: string;
    slug: string;
    profile_image_url: string | null;
    genres: string[] | null;
  };
} {
  const trimmedSet = entry.setTime.trim();
  const set_time =
    trimmedSet === ""
      ? null
      : (parseLineupSetTimeToPostgres(trimmedSet) ?? trimmedSet);

  const item = {
    id: entry.tempId,
    event_id: "",
    profile_id: entry.profileId,
    added_by: "",
    set_time,
    sort_order: entry.sortOrder,
    is_headliner: entry.isHeadliner,
    created_at: null,
  } as EventLineup;

  const profile = {
    id: entry.profileId,
    display_name: entry.displayName,
    slug: entry.slug,
    profile_image_url: entry.profileImageUrl,
    genres: null as string[] | null,
  };

  return { item, profile };
}

interface EventFormProps {
  mode: "create" | "edit";
  event?: Event;
  initialLineup?: LineupEntry[];
  currentUserId: string;
}

const EMPTY_LINEUP: LineupEntry[] = [];

export function EventForm({
  mode,
  event,
  initialLineup = EMPTY_LINEUP,
  currentUserId,
}: EventFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startDate, setStartDate] = useState(event?.start_date ?? "");
  const [endDate, setEndDate] = useState(event?.end_date ?? "");
  const [startTime, setStartTime] = useState(event?.start_time ?? "");
  const [endTime, setEndTime] = useState(event?.end_time ?? "");
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [streetAddress, setStreetAddress] = useState(
    event?.street_address ?? "",
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(
    event?.cities ?? null,
  );
  const [country, setCountry] = useState(event?.country ?? "");
  const [ticketUrl, setTicketUrl] = useState(event?.ticket_url ?? "");

  // Admission pricing state
  const {
    admissionType: initAdmissionType,
    fixedAmount: initFixedAmount,
    scaleMin: initScaleMin,
    scaleMax: initScaleMax,
    tiers: initTiers,
  } = decomposeAdmission(event?.admission as Admission | null | undefined);
  const [admissionType, setAdmissionType] = useState<AdmissionFormType>(initAdmissionType);
  const [fixedAmount, setFixedAmount] = useState(initFixedAmount);
  const [scaleMin, setScaleMin] = useState(initScaleMin);
  const [scaleMax, setScaleMax] = useState(initScaleMax);
  const [tiers, setTiers] = useState<TierRow[]>(() =>
    initTiers.map((t, i) => ({
      ...t,
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `tier-${i}`,
    })),
  );
  const [isTicketed, setIsTicketed] = useState<boolean>(event?.is_ticketed ?? false);

  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [flyerUrl, setFlyerUrl] = useState<string | null>(
    event?.flyer_image_url ?? null,
  );
  const [lineup, setLineup] = useState<LineupEntry[]>(initialLineup);

  useEffect(() => {
    if (mode !== "edit") return;
    setLineup(initialLineup);
  }, [mode, event?.id, initialLineup]);

  const persistLineupRemove = useCallback(async (entry: LineupEntry) => {
    if (!entry.eventLineupId) return;
    try {
      await eventLineupService.remove(entry.eventLineupId);
    } catch {
      toast.error("Could not remove this DJ from the lineup.");
      throw new Error("remove failed");
    }
  }, []);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [genresReadyForDirty, setGenresReadyForDirty] = useState(
    mode !== "edit",
  );
  const [cityReadyForDirty, setCityReadyForDirty] = useState(mode !== "edit");

  useEffect(() => {
    if (mode !== "edit") {
      setGenresReadyForDirty(true);
      setSelectedGenres([]);
      return;
    }
    if (!event?.genre_ids || event.genre_ids.length === 0) {
      setSelectedGenres([]);
      setGenresReadyForDirty(true);
      return;
    }
    setGenresReadyForDirty(false);
    let alive = true;
    void genresService.getByIds(event.genre_ids).then((g) => {
      if (!alive) return;
      setSelectedGenres(g);
      setGenresReadyForDirty(true);
    });
    return () => {
      alive = false;
    };
  }, [mode, event?.id, event?.genre_ids]);

  useEffect(() => {
    let cancelled = false;
    if (!event) {
      setSelectedCity(null);
      setCityReadyForDirty(true);
      return () => {
        cancelled = true;
      };
    }
    if (mode === "edit") {
      setCityReadyForDirty(false);
    }
    if (event.cities) {
      setSelectedCity(event.cities);
      if (mode === "edit") setCityReadyForDirty(true);
    } else if (event.city_id) {
      void citiesService.getById(event.city_id).then((c) => {
        if (!cancelled) {
          setSelectedCity(c);
          if (mode === "edit") setCityReadyForDirty(true);
        }
      });
    } else {
      setSelectedCity(null);
      if (mode === "edit") setCityReadyForDirty(true);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, event?.city_id, event?.cities?.id, mode]);

  const editHydrationReady =
    mode !== "edit" || (genresReadyForDirty && cityReadyForDirty);

  const savedComparable = useMemo(() => {
    if (mode !== "edit" || !event) return "";
    const decomposed = decomposeAdmission(event.admission as Admission | null | undefined);
    return serializeEditFormState({
      title: event.title ?? "",
      description: event.description ?? "",
      startDate: event.start_date ?? "",
      endDate: event.end_date ?? "",
      startTime: event.start_time ?? "",
      endTime: event.end_time ?? "",
      venue: event.venue ?? "",
      streetAddress: event.street_address ?? "",
      cityId: event.city_id ?? "",
      country: event.country ?? "",
      ticketUrl: event.ticket_url ?? "",
      genreIds: event.genre_ids ?? [],
      flyerUrl: event.flyer_image_url ?? null,
      lineup: initialLineup,
      admissionType: decomposed.admissionType,
      fixedAmount: decomposed.fixedAmount,
      scaleMin: decomposed.scaleMin,
      scaleMax: decomposed.scaleMax,
      tiers: decomposed.tiers,
      isTicketed: event.is_ticketed ?? false,
    });
  }, [mode, event, initialLineup]);

  const currentComparable = useMemo(
    () =>
      mode !== "edit" || !event
        ? ""
        : serializeEditFormState({
            title,
            description,
            startDate,
            endDate,
            startTime,
            endTime,
            venue,
            streetAddress,
            cityId: selectedCity?.id ?? "",
            country,
            ticketUrl,
            genreIds: selectedGenres.map((g) => g.id),
            flyerUrl,
            lineup,
            admissionType,
            fixedAmount,
            scaleMin,
            scaleMax,
            tiers,
            isTicketed,
          }),
    [
      mode,
      event,
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      streetAddress,
      selectedCity?.id,
      country,
      ticketUrl,
      selectedGenres,
      flyerUrl,
      lineup,
      admissionType,
      fixedAmount,
      scaleMin,
      scaleMax,
      tiers,
      isTicketed,
    ],
  );

  const isDirty =
    mode === "edit" &&
    !!event &&
    editHydrationReady &&
    savedComparable !== currentComparable;

  const requestLeaveEdit = useCallback(() => {
    if (mode !== "edit" || !event) return;
    if (!isDirty) {
      router.push(`/events/${event.id}`);
      return;
    }
    setLeaveDialogOpen(true);
  }, [mode, event, isDirty, router]);

  const confirmLeaveEdit = useCallback(() => {
    setLeaveDialogOpen(false);
    if (event) router.push(`/events/${event.id}`);
  }, [event, router]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const isValid =
    title.trim().length > 0 &&
    startDate.length > 0 &&
    selectedCity !== null;

  const primarySubmitLabel = mode === "edit" ? "Update Event" : "Publish";
  const primarySubmitPendingLabel =
    mode === "edit" ? "Updating…" : "Saving…";

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!startDate) e.startDate = "Start date is required.";
    if (!selectedCity) e.cityId = "City is required.";
    if (admissionType === "fixed") {
      const v = parseFloat(fixedAmount);
      if (!fixedAmount.trim() || isNaN(v) || v < 0)
        e.admission = "Enter a valid price.";
    }
    if (admissionType === "sliding_scale") {
      const min = parseFloat(scaleMin);
      const max = parseFloat(scaleMax);
      if (isNaN(min) || isNaN(max) || min < 0 || max < 0)
        e.admission = "Enter valid min and max prices.";
      else if (min > max) e.admission = "Min must not exceed max.";
    }
    if (admissionType === "tiered") {
      const hasValid = tiers.some(
        (t) => t.amount.trim() && !isNaN(parseFloat(t.amount)),
      );
      if (!hasValid) e.admission = "Add at least one tier with a valid price.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function parseSetTimeOrThrow(raw: string): string | null {
    const t = raw.trim();
    if (!t) return null;
    const parsed = parseLineupSetTimeToPostgres(t);
    if (!parsed) {
      toast.error(
        "Invalid set time. Use formats like 10:30 PM, 10 PM, or 22:30.",
      );
      throw new InvalidLineupSetTimeError();
    }
    return parsed;
  }

  function isLineupDuplicateError(err: unknown): boolean {
    if (err instanceof Error) {
      if (err.message.includes("already in the lineup")) return true;
      if (/duplicate key|unique constraint|23505/i.test(err.message)) return true;
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      String((err as { code: unknown }).code) === "23505"
    ) {
      return true;
    }
    return false;
  }

  async function saveLineup(eventId: string) {
    for (const entry of lineup) {
      if (entry.eventLineupId) {
        await eventLineupService.updateRow(entry.eventLineupId, {
          sort_order: entry.sortOrder,
          is_headliner: entry.isHeadliner,
          set_time: parseSetTimeOrThrow(entry.setTime),
        });
        continue;
      }
      try {
        await eventLineupService.add({
          event_id: eventId,
          profile_id: entry.profileId,
          added_by: currentUserId,
          sort_order: entry.sortOrder,
          is_headliner: entry.isHeadliner,
          set_time: parseSetTimeOrThrow(entry.setTime),
        });
      } catch (err) {
        if (isLineupDuplicateError(err)) continue;
        throw err;
      }
    }
  }

  async function handleSubmit(status: EventStatus) {
    if (!validate() || !selectedCity) return;
    setSaving(true);

    try {
      if (mode === "create") {
        const genre_ids = selectedGenres.map((g) => g.id);
        const payload: EventInsert = {
          title: title.trim(),
          description: description || null,
          start_date: startDate,
          end_date: endDate || null,
          start_time: startTime || null,
          end_time: endTime || null,
          venue: venue || null,
          street_address: streetAddress.trim() || null,
          city_id: selectedCity.id,
          country: country || null,
          ticket_url: ticketUrl || null,
          admission: buildAdmissionPayload({ admissionType, fixedAmount, scaleMin, scaleMax, tiers }),
          is_ticketed: isTicketed,
          genre_ids,
          flyer_image_url: flyerUrl,
          created_by: currentUserId,
          status,
        };

        const created = await eventsService.create(payload);
        await saveLineup(created.id);
        let groupChatSetupFailed = false;
        if (status === "published") {
          try {
            await conversationsService.ensureEventGroupThread(created.id);
          } catch (err) {
            groupChatSetupFailed = true;
            console.error("ensureEventGroupThread failed after create", err);
          }
        }
        toast.success(
          status === "published" ? "Event published!" : "Draft saved!",
        );
        if (groupChatSetupFailed) {
          toast.warning(
            "Group chat could not be created. Your event was saved—try editing and publishing again, or contact support if this keeps happening.",
          );
        }
        router.push(`/events/${created.id}`);
      } else if (event) {
        const genre_ids = selectedGenres.map((g) => g.id);
        const prevStatus = event.status;
        const payload: EventUpdate = {
          title: title.trim(),
          description: description || null,
          start_date: startDate,
          end_date: endDate || null,
          start_time: startTime || null,
          end_time: endTime || null,
          venue: venue || null,
          street_address: streetAddress.trim() || null,
          city_id: selectedCity.id,
          country: country || null,
          ticket_url: ticketUrl || null,
          admission: buildAdmissionPayload({ admissionType, fixedAmount, scaleMin, scaleMax, tiers }),
          is_ticketed: isTicketed,
          genre_ids,
          flyer_image_url: flyerUrl,
          status,
        };

        await eventsService.update(event.id, payload);
        await saveLineup(event.id);
        let groupChatSetupFailed = false;
        if (payload.status === "published") {
          try {
            if (prevStatus !== "published") {
              await conversationsService.ensureEventGroupThread(event.id);
            } else {
              await conversationsService.syncEventGroupParticipants(event.id);
            }
          } catch (err) {
            groupChatSetupFailed = true;
            console.error("Event group messaging sync failed after update", err);
          }
        }
        toast.success("Event updated!");
        if (groupChatSetupFailed) {
          toast.warning(
            "Group chat could not be synced. Other changes were saved—try saving again if you need the chat.",
          );
        }
        router.push(`/events/${event.id}`);
      }
    } catch (err) {
      if (!(err instanceof InvalidLineupSetTimeError)) {
        toast.error("Failed to save event. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSoftDelete() {
    if (!event) return;
    setSaving(true);
    try {
      await eventsService.softDelete(event.id);
      toast.success("Event deleted.");
      setDeleteDialogOpen(false);
      router.push("/events");
    } catch {
      toast.error("Failed to delete event. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit("published");
      }}
      className="flex flex-col gap-6"
    >
      {mode === "edit" && event ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => requestLeaveEdit()}
            aria-label="Back to event"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
          <h1 className="font-display min-w-0 flex-1 text-center text-2xl font-bold text-bone">
            Edit Event
          </h1>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => requestLeaveEdit()}
            aria-label="Close editor"
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>
      ) : null}

      {/* Flyer */}
      <div>
        <p className="mb-1 text-sm font-medium text-bone">Event Flyer</p>
        <p className="mb-2 text-xs text-stone">Best size: 1200×600px · 2:1 landscape</p>
        <ImageUpload
          currentUrl={flyerUrl}
          onUploadComplete={async (file) => {
            const url = event?.id
              ? await storageService.uploadEventFlyer(event.id, file)
              : await storageService.uploadEventFlyerDraft(currentUserId, file);
            setFlyerUrl(url);
            return url;
          }}
          onRemove={() => setFlyerUrl(null)}
          label="Upload event flyer"
        />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label htmlFor="event-title" className="text-sm font-medium text-bone">
          Title *
        </label>
        <Input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
        {errors.title && (
          <p className="text-xs text-dried-blood">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="event-description"
          className="text-sm font-medium text-bone"
        >
          Description
        </label>
        <Textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      {/* Date & Time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="event-start-date"
            className="text-sm font-medium text-bone"
          >
            Start Date *
          </label>
          <Input
            id="event-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          {errors.startDate && (
            <p className="text-xs text-dried-blood">{errors.startDate}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="event-end-date"
            className="text-sm font-medium text-bone"
          >
            End Date
          </label>
          <Input
            id="event-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="event-start-time"
            className="text-sm font-medium text-bone"
          >
            Start Time
          </label>
          <Input
            id="event-start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="event-end-time"
            className="text-sm font-medium text-bone"
          >
            End Time
          </label>
          <Input
            id="event-end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="event-venue"
            className="text-sm font-medium text-bone"
          >
            Venue
          </label>
          <Input
            id="event-venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Holocene"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="event-street-address"
            className="text-sm font-medium text-bone"
          >
            Street address
          </label>
          <Input
            id="event-street-address"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="e.g. 1001 SE Morrison St"
            autoComplete="street-address"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label
            htmlFor="event-city-id"
            className="text-sm font-medium text-bone"
          >
            City
          </label>
          <CityAutocomplete
            id="event-city-id"
            value={selectedCity}
            onChange={setSelectedCity}
            aria-label="Event city"
          />
          {errors.cityId ? (
            <p className="text-sm text-destructive">{errors.cityId}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="event-country"
            className="text-sm font-medium text-bone"
          >
            Country
          </label>
          <Input
            id="event-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>

      {/* Ticket URL */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="event-ticket-url"
          className="text-sm font-medium text-bone"
        >
          Ticket URL
        </label>
        <Input
          id="event-ticket-url"
          type="url"
          value={ticketUrl}
          onChange={(e) => setTicketUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Admission */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-bone">Admission</p>
        <Tabs
          value={admissionType}
          onValueChange={(v) => setAdmissionType(v as AdmissionFormType)}
        >
          <TabsList className="h-auto w-full justify-start bg-mb-surface-3 p-1">
            {(
              [
                ["not_specified", "Not specified"],
                ["free", "Free"],
                ["fixed", "Fixed"],
                ["sliding_scale", "Sliding scale"],
                ["tiered", "Tiered"],
              ] as const
            ).map(([val, label]) => (
              <TabsTrigger key={val} value={val} className="text-xs">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="fixed">
            <div className="mt-3 flex flex-col gap-1">
              <label
                htmlFor="admission-fixed-amount"
                className="text-sm font-medium text-bone"
              >
                Price
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone text-sm">
                  $
                </span>
                <Input
                  id="admission-fixed-amount"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="20"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sliding_scale">
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="admission-scale-min"
                  className="text-sm font-medium text-bone"
                >
                  Min
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone text-sm">
                    $
                  </span>
                  <Input
                    id="admission-scale-min"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="10"
                    value={scaleMin}
                    onChange={(e) => setScaleMin(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="admission-scale-max"
                  className="text-sm font-medium text-bone"
                >
                  Max
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone text-sm">
                    $
                  </span>
                  <Input
                    id="admission-scale-max"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="25"
                    value={scaleMax}
                    onChange={(e) => setScaleMax(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tiered">
            <div className="mt-3 flex flex-col gap-3">
              {tiers.map((tier, idx) => (
                <div key={tier.id} className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-xs font-medium text-stone">
                      Label
                    </label>
                    <Input
                      placeholder="Advance"
                      value={tier.label}
                      onChange={(e) =>
                        setTiers((prev) =>
                          prev.map((t, i) =>
                            i === idx ? { ...t, label: e.target.value } : t,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex w-24 flex-col gap-1">
                    <label className="text-xs font-medium text-stone">
                      Price
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone text-sm">
                        $
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="15"
                        value={tier.amount}
                        onChange={(e) =>
                          setTiers((prev) =>
                            prev.map((t, i) =>
                              i === idx ? { ...t, amount: e.target.value } : t,
                            ),
                          )
                        }
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-xs font-medium text-stone">
                      Until (optional)
                    </label>
                    <Input
                      placeholder="before 10pm"
                      value={tier.until}
                      onChange={(e) =>
                        setTiers((prev) =>
                          prev.map((t, i) =>
                            i === idx ? { ...t, until: e.target.value } : t,
                          ),
                        )
                      }
                    />
                  </div>
                  {tiers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setTiers((prev) => prev.filter((_, i) => i !== idx))
                      }
                      aria-label="Remove tier"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  setTiers((prev) => [
                    ...prev,
                    {
                      id: typeof crypto !== "undefined"
                        ? crypto.randomUUID()
                        : String(Math.random()),
                      label: "",
                      amount: "",
                      until: "",
                    },
                  ])
                }
              >
                + Add tier
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {errors.admission && (
          <p className="text-xs text-dried-blood">{errors.admission}</p>
        )}

        {/* Ticketed checkbox — independent of admission type */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-bone">
          <Checkbox
            checked={isTicketed}
            onCheckedChange={(checked) => setIsTicketed(Boolean(checked))}
          />
          Requires a ticket
        </label>
      </div>

      {/* Genres */}
      <div className="flex flex-col gap-1">
        <GenreSelect
          label="Genres"
          value={selectedGenres}
          onChange={setSelectedGenres}
          maxSelections={10}
        />
      </div>

      {/* Lineup */}
      <LineupBuilder
        value={lineup}
        onChange={setLineup}
        currentUserId={currentUserId}
        persistRemove={mode === "edit" ? persistLineupRemove : undefined}
      />

      {lineup.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-bone">Added DJs</h3>
          <div className="flex flex-col gap-2">
            {[...lineup]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((entry) => {
                const { item, profile } = lineupEntryToCardProps(entry);
                return (
                  <LineupCard
                    key={entry.tempId}
                    item={item}
                    profile={profile}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || !isValid}>
            {saving ? primarySubmitPendingLabel : primarySubmitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving || !title.trim()}
            onClick={() => handleSubmit("draft")}
          >
            Save as Draft
          </Button>
        </div>
        {mode === "edit" && event ? (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => requestLeaveEdit()}
          >
            Cancel edit
          </Button>
        ) : null}
      </div>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you leave now, they will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={() => confirmLeaveEdit()}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {mode === "edit" && event && (
        <div className="flex flex-col gap-4 border-t border-root-line pt-6">
          <EventCancelVsDeleteHelp />
          {event.status === "cancelled" && (
            <p className="text-sm text-stone">
              This event is already cancelled. Delete it below if you want it
              removed from the app entirely.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {event.status !== "cancelled" && (
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={() => handleSubmit("cancelled")}
              >
                Cancel event
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="border-dried-blood/50 text-dried-blood hover:bg-dried-blood/10 dark:text-dried-blood"
              disabled={saving}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete event
            </Button>
          </div>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                <AlertDialogDescription>
                  {event.status === "cancelled"
                    ? `“${event.title.trim() || "This event"}” will be removed from discovery, search, and calendars. This cannot be undone.`
                    : `“${event.title.trim() || "This event"}” will be removed from discovery, search, and calendars. This cannot be undone. Use “Cancel event” above if you only want it marked as cancelled but still visible.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={saving}>Back</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={saving}
                  onClick={() => void handleSoftDelete()}
                >
                  {saving ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </form>
  );
}
