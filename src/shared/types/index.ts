// Generic, framework-agnostic utility types with zero domain knowledge
// (Nullable<T>, Maybe<T>, ...). Three other places exist on purpose so this
// file doesn't become a dumping ground:
//   - Domain types    -> entities/<entity>/model (owned by that entity)
//   - DTO / API types -> shared/api/types (wire shape of services/* payloads)
//   - Vue prop/emit types -> co-located with the component that declares them

export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;
