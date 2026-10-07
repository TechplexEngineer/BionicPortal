# SOP Visibility and Archive Design

**Date:** 2026-10-07

## Goal

Allow admins and mentors to create and manage SOPs that default to private, allow them to explicitly share SOPs with students, and allow any student to archive an SOP globally while preserving admin/mentor restore access.

## Current behavior

- SOPs are available only to admins and mentors.
- Only admins can create, edit, and permanently delete SOPs.
- The database stores title, Markdown content, and timestamps only.

## Behavior and authorization

| Role | Active private SOP | Active shared SOP | Archived SOP | Create/edit | Archive | Restore | Delete |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Admin | View | View | View when archived view is selected | Yes | Yes | Yes | Yes |
| Mentor | View | View | View when archived view is selected | Yes | Yes | Yes | No |
| Student | No access | View | No access | No | Yes | No | No |

Students can archive a shared, active SOP. Archiving is global, so it removes that SOP from the active list for all roles. Admins and mentors can select an archived view and restore the SOP for everyone. Archived SOPs remain editable by admins and mentors.

New SOPs default to private and active. The editor exposes a “Share with students” control; enabling it makes the SOP student-visible when it is active. Editing the control updates visibility immediately after save.

## Data model

Extend `sops` with:

- `private`: non-null boolean column backed by SQLite integer, default `true`.
- `archived`: non-null boolean column backed by SQLite integer, default `false`.

Existing SOP rows will be backfilled as shared (`private = false`) and active (`archived = false`) so the migration does not unexpectedly hide currently published content.

## Server behavior

- The SOP load action will require a logged-in user with role `admin`, `mentor`, or `user` (student).
- Admins and mentors receive active SOPs by default. They can request an archived view that includes archived SOPs, while preserving the private/shared distinction only for student filtering.
- Students receive only SOPs where `private = false` and `archived = false`.
- Create and update accept title, content, and the sharing flag. Both admins and mentors may submit them.
- Archive accepts an SOP id and changes only `archived` to `true`; it is available to admins, mentors, and students, but the server must reject student attempts against private or already archived SOPs.
- Restore accepts an SOP id and changes only `archived` to `false`; it is available only to admins and mentors.
- Permanent delete remains admin-only.
- Mentor authorization follows the application's `mentor` role; there is no separate approval flag on the session user.
- All actions must validate the target SOP and return a controlled failure for invalid ids or unauthorized state transitions.

## UI behavior

- Students can access the SOP page and see only shared active SOPs.
- Admins and mentors see a filter/control for active versus archived SOPs.
- Admins and mentors see “Edit” on visible SOPs, with a “Share with students” checkbox in the editor.
- Admins and mentors see “Archive” for active SOPs and “Restore” for archived SOPs.
- Students see “Archive SOP” for shared active SOPs and never see delete, edit, restore, private SOPs, or archived SOPs.
- The existing permanent delete confirmation remains visible only to admins.

## Testing

Server tests will cover:

1. Students can load shared active SOPs but not private or archived SOPs.
2. Admins and mentors can create and update title, content, and sharing state.
3. New SOPs default to private and active when the fields are omitted.
4. Students can archive a shared active SOP, and the update targets only the requested SOP.
5. Admins and mentors can archive and restore SOPs; students cannot restore or delete them.
6. Permanent deletion remains admin-only.

Page tests will cover the sharing checkbox and role-appropriate archive/restore/delete controls. The migration and type-check/build commands will also be run before completion.

## Scope boundaries

- Archive is a single global state, not a per-student preference.
- No archive history, audit log, or scheduled unarchive is added.
- No new permanent-delete behavior is introduced.
