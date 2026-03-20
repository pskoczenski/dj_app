"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eventsService } from "@/lib/services/events";
import { eventLineupService } from "@/lib/services/event-lineup";
import { storageService } from "@/lib/services/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GenreTagInput } from "@/components/forms/genre-tag-input";
import { ImageUpload } from "@/components/forms/image-upload";
import {
  LineupBuilder,
  type LineupEntry,
} from "@/components/events/lineup-builder";
import { toast } from "sonner";
import type { Event, EventInsert, EventUpdate, EventStatus } from "@/types";

interface EventFormProps {
  mode: "create" | "edit";
  event?: Event;
  initialLineup?: LineupEntry[];
  currentUserId: string;
}

export function EventForm({
  mode,
  event,
  initialLineup = [],
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
  const [city, setCity] = useState(event?.city ?? "");
  const [stateField, setStateField] = useState(event?.state ?? "");
  const [country, setCountry] = useState(event?.country ?? "");
  const [ticketUrl, setTicketUrl] = useState(event?.ticket_url ?? "");
  const [genres, setGenres] = useState<string[]>(event?.genres ?? []);
  const [flyerUrl, setFlyerUrl] = useState<string | null>(
    event?.flyer_image_url ?? null,
  );
  const [lineup, setLineup] = useState<LineupEntry[]>(initialLineup);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValid = title.trim().length > 0 && startDate.length > 0;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!startDate) e.startDate = "Start date is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function saveLineup(eventId: string) {
    for (const entry of lineup) {
      try {
        await eventLineupService.add({
          event_id: eventId,
          profile_id: entry.profileId,
          added_by: currentUserId,
          sort_order: entry.sortOrder,
          is_headliner: entry.isHeadliner,
          set_time: entry.setTime || null,
        });
      } catch (err) {
        if (err instanceof Error && err.message.includes("already in the lineup")) {
          continue;
        }
        throw err;
      }
    }
  }

  async function handleSubmit(status: EventStatus) {
    if (!validate()) return;
    setSaving(true);

    try {
      if (mode === "create") {
        const payload: EventInsert = {
          title: title.trim(),
          description: description || null,
          start_date: startDate,
          end_date: endDate || null,
          start_time: startTime || null,
          end_time: endTime || null,
          venue: venue || null,
          city: city || null,
          state: stateField || null,
          country: country || null,
          ticket_url: ticketUrl || null,
          genres: genres.length > 0 ? genres : null,
          flyer_image_url: flyerUrl,
          created_by: currentUserId,
          status,
        };

        const created = await eventsService.create(payload);
        await saveLineup(created.id);
        toast.success(
          status === "published" ? "Event published!" : "Draft saved!",
        );
        router.push(`/events/${created.id}`);
      } else if (event) {
        const payload: EventUpdate = {
          title: title.trim(),
          description: description || null,
          start_date: startDate,
          end_date: endDate || null,
          start_time: startTime || null,
          end_time: endTime || null,
          venue: venue || null,
          city: city || null,
          state: stateField || null,
          country: country || null,
          ticket_url: ticketUrl || null,
          genres: genres.length > 0 ? genres : null,
          flyer_image_url: flyerUrl,
          status,
        };

        await eventsService.update(event.id, payload);
        await saveLineup(event.id);
        toast.success("Event updated!");
        router.push(`/events/${event.id}`);
      }
    } catch {
      toast.error("Failed to save event. Please try again.");
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
      {/* Flyer */}
      <div>
        <p className="mb-2 text-sm font-medium text-bone">Event Flyer</p>
        <ImageUpload
          currentUrl={flyerUrl}
          onUploadComplete={async (file) => {
            const eventId = event?.id ?? "temp";
            const url = await storageService.uploadEventFlyer(eventId, file);
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
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="event-city"
            className="text-sm font-medium text-bone"
          >
            City
          </label>
          <Input
            id="event-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="event-state"
            className="text-sm font-medium text-bone"
          >
            State
          </label>
          <Input
            id="event-state"
            value={stateField}
            onChange={(e) => setStateField(e.target.value)}
          />
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

      {/* Genres */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-bone">Genres</label>
        <GenreTagInput value={genres} onChange={setGenres} max={10} />
      </div>

      {/* Lineup */}
      <LineupBuilder
        value={lineup}
        onChange={setLineup}
        currentUserId={currentUserId}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || !isValid}>
          {saving ? "Saving…" : "Publish"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving || !title.trim()}
          onClick={() => handleSubmit("draft")}
        >
          Save as Draft
        </Button>
        {mode === "edit" && event?.status !== "cancelled" && (
          <Button
            type="button"
            variant="destructive"
            disabled={saving}
            onClick={() => handleSubmit("cancelled")}
          >
            Cancel Event
          </Button>
        )}
      </div>
    </form>
  );
}
