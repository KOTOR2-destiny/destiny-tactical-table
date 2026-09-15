# Destiny Tactical Table

Browser-based collaborative tactical tabletop for the Destiny Saga Edition campaign.

## v0.1

- Supabase email/password authentication
- Isolated campaign/session/scene data model
- GM-created synchronized test table
- Six-character player join codes
- Four Destiny PC test tokens
- Player token claiming and server-enforced control permissions
- Realtime token synchronization
- Grid snapping, pan, zoom, mouse and touch input
- Responsive GM/player interface
- Row Level Security on exposed game tables

Backend: Supabase project `zeyvkuhqgbqjqalxubrq`.

The browser intentionally contains only the Supabase publishable key. Authorization is enforced by Postgres RLS and protected RPC functions; no service-role or secret key belongs in this repository.
