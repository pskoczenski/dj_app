/** Brief copy for creators choosing between cancel and soft-delete. */
export function EventCancelVsDeleteHelp() {
  return (
    <div className="rounded-default border border-root-line bg-dark-moss/50 px-4 py-3">
      <p className="text-sm font-medium text-bone">Cancel vs delete</p>
      <ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-stone">
        <li>
          <span className="font-medium text-bone">Cancel</span> — While the
          event is still published or a draft, you can mark it cancelled. It stays
          in discovery, search, calendars, and on profiles, shown as{" "}
          <span className="text-bone">cancelled</span>.
        </li>
        <li>
          <span className="font-medium text-bone">Delete</span> — The event is
          removed from the app (soft delete). It will not appear in lists or
          search. This cannot be undone. People already in a group chat for this
          event may still see a short notice that it was removed.
        </li>
      </ul>
    </div>
  );
}
