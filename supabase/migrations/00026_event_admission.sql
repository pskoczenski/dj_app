-- Add structured admission pricing and ticketed flag to events.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS admission   jsonb    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_ticketed boolean  NOT NULL DEFAULT false;

-- Guard the type discriminant so invalid shapes can't be stored.
ALTER TABLE events
  ADD CONSTRAINT events_admission_type_check CHECK (
    admission IS NULL
    OR (
      jsonb_typeof(admission) = 'object'
      AND (admission->>'type') IN ('free', 'fixed', 'sliding_scale', 'tiered')
    )
  );

COMMENT ON COLUMN events.admission IS
  'Structured admission price. NULL = not specified. '
  'Shape: {type:"free"} | {type:"fixed",amount:number} | '
  '{type:"sliding_scale",min:number,max:number} | '
  '{type:"tiered",tiers:[{label,amount,until?}]}';

COMMENT ON COLUMN events.is_ticketed IS
  'True if a ticket (free or paid) is required for entry. '
  'Independent of admission type; pairs with ticket_url.';
