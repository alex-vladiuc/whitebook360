# Supabase Auth (Minimum Setup)

## Minimum tables

**Profiles** (linked to `auth.users` by `user_id`). This is the only custom table required for basic auth + profile loading.

```sql
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'employee',
  created_at timestamptz not null default now()
);
```

### Optional (recommended) RLS policies
You can keep RLS off while prototyping. If you enable RLS, add the minimal policies below so each user can read/write their own profile.

```sql
alter table public.profiles enable row level security;

create policy "Profiles are readable by the owner"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Profiles are insertable by the owner"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Profiles are updatable by the owner"
  on public.profiles for update
  using (auth.uid() = user_id);
```

## Frontend auth flow (exact sequence)

1. **Sign up** → `supabase.auth.signUp` with `emailRedirectTo` and `data.full_name`.
2. **User verifies email** (Supabase confirmation link).
3. **Login** → `supabase.auth.signInWithPassword`.
4. **Session persistence** happens automatically via Supabase client local storage.
5. **After login** → `useAuth` calls `ensureProfile` to `upsert` a row in `profiles` if missing.
6. **Profile fetch** → `useAuth` stores `profile` in context for role checks and UI use.

