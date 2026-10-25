# It’s a Healthy Life — Mobile and Web Platform
## Role review, optimized product flows, and build specification

**Version:** 1.1  
**Prepared:** 25 October 2026  
**Source reviewed:** `User Roles.xlsx` (single sheet, three role columns: User, Expert, Super Admin)  
**Figma work:** [2026 updated page](https://www.figma.com/design/3YXpXCWkD3WLBU1Uijh7xm/DT_It-s-a-Healthy-Life?node-id=2017-99)

---

## 1. Product readout

The workbook describes a three-sided wellness platform:

- **Members (end users)** use the iOS/Android app for fitness and nutrition tracking, finding and booking qualified experts, learning from content, taking part in challenges, shopping, and getting support.
- **Experts (fitness trainers/coaches)** use a web workspace to manage approved profiles, assigned clients, schedules, communications, content, and earnings.
- **Super admins** use a web console to verify experts, manage members and experts, oversee bookings and payments, publish content, operate the store, handle support and reports, and moderate the community.

The strongest product opportunity is to make these one connected service rather than three separate dashboards. A single member profile, booking record, calendar, message thread, payment record, content catalogue, and moderation history should drive the relevant experience for each role. The end user should not need to re-enter information for a trainer booking; the expert should see only the information the member chose to share; the admin should have traceable controls for exceptions.

The workbook is a useful feature inventory, but it is not yet a complete product specification. It does not define several operational rules (cancellation amounts and cutoffs, payout timing, session completion, disputes, calendar providers, privacy and retention, and moderation actions). This document preserves the listed features and marks the missing decisions as proposed rules or decisions to confirm.

## 2. Role and access model

| Capability | Member mobile app | Expert web workspace | Super-admin web console |
|---|---|---|---|
| Create account, login, password reset | Yes; email/password and supported Apple/Google sign-in | Yes; expert application and account | Yes; admin invitation/managed account preferred |
| Expert credentials | View approved credentials and sample media | Submit and maintain own bio, certifications and sample videos; status and resubmission | Review, request changes, approve or reject; record reason and reviewer |
| Member health/profile data | Own data; edit and control sharing | Only assigned clients and only data shared for coaching | Restricted support/safety access with reason and audit trail |
| Discover and book experts | Search, filter, compare, select format/time and pay | Set services, price, availability and view assigned bookings | View booking operations and resolve exceptions |
| Scheduling and calendar | Personal schedule, reminders, reschedule/cancel under policy | Calendar, client details and calendar sync | Platform-wide schedule and booking reporting |
| Messaging and calls | Confirmed-booking communication; help/support | Assigned clients; chat, audio and video | Support queues and safety escalation; no routine private-chat browsing |
| Meal plans, recipes, workouts | Browse, save, follow and track | Create or contribute content where approved | Manage/publish library content |
| Challenges and progress | Join, set/adjust goals, record completion, view progress/achievements | See relevant client progress and contribute approved programs | Create, schedule and report on challenges |
| Community/forum | Read, post, comment, report | Post and interact within community rules | Publish, moderate reports, restrict accounts and retain audit history |
| Shop | Browse, purchase, track own orders | No store operations in the source workbook | Manage catalogue, inventory, orders, refunds and fulfilment |
| Payments and earnings | Payment methods, booking payments, receipts and history | Transactions and payout history | Reconciliation, configurable policy, refunds and payout exceptions |
| Notifications and settings | Profile, preferences, FAQ and support | Work preferences, calendar and communication settings | Global configuration, FAQ/content, notification and policy settings |

**Permission rule:** authorize every action in the backend, not only by hiding UI controls. Experts must never see unassigned clients or their private health details. Admin access to sensitive records should be limited by role, purpose and audit logging. Never store raw card details in the platform; use a payment provider’s tokenized methods.

## 3. Figma design deliverables and scope correction

The first Figma pass contained only three dashboard layouts. That was too narrow for the request to cover the full role experience. I expanded the file with three dedicated role pages and mapped the workbook features into editable screen layouts. The original dashboard frames remain on the **“2026 updated”** page.

### Member Mobile App — 23 screens

Welcome, account creation, login, password reset, fitness profile setup, home dashboard, expert search/profile, booking checkout/confirmation, member calendar, meal log and food-entry form, meal/recipe/workout libraries, monthly challenge, community feed, store/order tracking and checkout, profile/billing/notification settings, help request, booking chat and video call.

[Open the Member Mobile App page](https://www.figma.com/design/3YXpXCWkD3WLBU1Uijh7xm/DT_It-s-a-Healthy-Life?node-id=2024-2)

### Expert Workspace — 8 screens

Sign-in/recovery, dashboard, profile and verification, client roster and demographic summary, calendar and availability, booking-linked messages/calls, content studio and earnings/transactions.

[Open the Expert Workspace page](https://www.figma.com/design/3YXpXCWkD3WLBU1Uijh7xm/DT_It-s-a-Healthy-Life?node-id=2024-3)

### Super Admin Console — 12 screens

Secure sign-in/invitation, overview, expert verification review, member/expert management with restrict/suspend/restore actions, booking/payment exception handling, platform calendar with transaction filters, content studio with reviewed AI drafts and social scheduling, challenge manager, store inventory/orders, moderation/support/FAQ, analytics/reports and versioned platform policies/settings.

[Open the Super Admin Console page](https://www.figma.com/design/3YXpXCWkD3WLBU1Uijh7xm/DT_It-s-a-Healthy-Life?node-id=2024-4)

The role pages contain 23 member, 8 expert and 12 admin frames (43 role frames total). The three dashboard previews on “2026 updated” duplicate role content and are not included in that total. Names, counts, dates and amounts visible in frames are illustrative placeholders, not live data. The screens use editable Figma text and shape layers. They are **static design screens**: buttons and navigation are visual controls and are not connected as a clickable prototype or to a backend. This document describes the intended product behavior; it does not claim that every behavior is already represented in the static frames.

## 4. Member mobile app

### 4.1 Account creation and onboarding

1. Welcome screen offers **Create account**, **Log in**, and supported quick sign-in (Apple on iOS; Google where enabled).
2. Collect only required account details first. Verify email/phone and provide a password reset path.
3. Ask the member to complete a fitness profile progressively: age/date of birth, height, weight, goals, experience, activity level, dietary preferences/allergies, accessibility needs, and units. Make optional fields clearly optional.
4. Explain why health-related information is requested, request explicit consent, and offer granular controls for sharing it with a chosen expert.
5. Let the member skip nonessential setup and reach the app. Provide profile-completion prompts later.
6. Show a clear error/retry path for unavailable sign-in providers, expired verification, duplicate accounts and network loss.

### 4.2 Primary navigation and dashboard

Use a persistent five-tab mobile navigation: **Home, Plan, Track, Community, Profile**. Keep the main home screen focused on today’s next action and progress. The existing hamburger-menu inventory maps into these destinations and secondary screens:

- Home: progress summary, next booking, saved plan, challenge status and quick actions, including a visible quick link to the store.
- Plan: meal plans, workout plans and calendar.
- Track: food log, activity log, body measurements and progress charts.
- Community: social forum, categories, post detail, comments and report action.
- Profile: personal/fitness profile, settings, payment methods/history, FAQ and support. Let members configure in-app sound and email/push notification preferences separately.
- Search entry point: experts, recipes, workouts and relevant content with filters.
- Shop and recipe/workout libraries remain reachable from Home/Plan or a clearly named Explore area; do not hide high-use functions several menu layers deep.

### 4.3 Meal and activity tracking

- Let members search foods, use frequently logged/recent items, select serving size and edit portions.
- Support manual meal logging and photo attachment. Display calories and macros with units and show the source of estimates.
- Add meals to a day/meal slot, edit or delete entries, and reflect changes immediately in daily totals.
- Keep the first release honest: photo uploads can be stored or attached, but automated food recognition/macros are a later capability. When enabled, show detected foods and estimated portions for member confirmation before saving.
- Add workout/activity completion, session notes and optional measurements; charts use dated records and clearly label units.
- Treat food and body metrics as sensitive health-related information. Do not infer a diagnosis or present estimates as medical advice.

### 4.4 Find, evaluate and book an expert

1. Search by goal, discipline, service type, language, price, location/remote format, availability and rating.
2. Expert results show approval status, qualifications, specialties, service format, price and next available time.
3. Profile detail shows bio, verified credentials, sample videos, service descriptions, reviews and cancellation terms.
4. Select virtual or face-to-face service, a time slot and duration. Show the member’s local timezone and the expert’s timezone when different.
5. Choose a saved payment method or add a provider-hosted card/PayPal method. Show full price, fees, cancellation deadline and refund/payout treatment before confirmation.
6. Temporarily reserve the slot during checkout to prevent double booking. Confirm the booking only after successful payment authorization.
7. Create one booking record and one linked conversation. Enable member/expert chat and call actions after confirmation; share no personal phone number by default.
8. Add the session to the in-app calendar and offer a calendar invitation or supported calendar sync. Send confirmation and reminders.

### 4.5 Booking, cancellation and payment lifecycle

Keep booking, payment and payout as separate linked state machines. A booking can be confirmed while payment is authorized, then completed while payout is still pending. A refund is a payment outcome, not a booking state. This separation prevents contradictory labels and makes retries and reconciliation safer.

- **Slot:** available → temporarily held → booked, or hold expired/released.
- **Booking:** requested (if approval is needed) → confirmed → completed, cancelled, reschedule requested, no-show or disputed → closed. A reschedule request does not change the booked time until the member accepts the proposed time.
- **Payment:** requires action → authorized → captured (where the provider flow requires capture) → partially/fully refunded or settled. Keep provider identifiers and webhook events for reconciliation.
- **Payout:** not eligible → pending → held for review or eligible → transferred → failed/retried. Payout status must never be inferred from the booking label.

- The workbook asks that booking funds be held and released after completion. Implement this through a payment provider’s supported authorization, capture and delayed-transfer/payout features; do not promise legal escrow unless the selected provider and jurisdiction support it.
- The platform should record the policy version shown at booking, price breakdown, provider transaction IDs and all state changes.
- For member cancellation, calculate any fee/refund from a configurable, versioned policy. The workbook does not specify member cancellation cutoffs or fee bands; the business must set these before launch.
- **Expert cancellation rule from the workbook:** experts must cancel at least 24 hours before the session. If they need to cancel, notify the member immediately and offer available replacement times. Change the booking time only after the member accepts. If the member declines, or does not respond by a defined deadline, cancel and initiate the applicable refund. An expert cancellation inside the 24-hour window must be recorded as a late cancellation and trigger a member feedback prompt; with the member’s consent, that feedback is visible on the expert’s profile. The workbook does not specify an exception process or expert compensation, so those remain policy decisions.
- Do not present feedback about a cancelled session as a review of a completed coaching session. Label the prompt clearly as cancellation feedback.
- Proposed completion safeguard: expert marks complete; member can confirm or raise a problem within a clear window; unresolved cases pause payout for admin review. Define late arrival, no-show, technical failure, reschedule and dispute rules before production.
- Show receipts, transaction state, refund status and payment history in the member’s account.

### 4.6 Plans, content, challenges, community and store

- Meal plans: browse/search/filter, inspect details, save to a list, add planned meals to the calendar, and track adherence without implying that a plan is clinically prescribed.
- Recipe library: searchable categories and dietary filters, serving size, ingredients, instructions and save/share.
- Workout library: searchable categories and training levels with clear equipment, duration, modifications and media.
- Monthly challenges: admins define challenge steps, time/duration, example images or videos, eligibility and rules. Members can adjust allowed goals, check off each step with the required completion method, view dated progress charts/stats and unlock achievements. Provide accessibility alternatives and do not award completion from a tap where the configured evidence rules require another method.
- Forum: categories for food, exercise, mental wellbeing and other admin-managed topics; create/edit/delete own posts, comment, react, report, block/mute and view community guidelines.
- Shop: catalogue, stock status, cart/checkout, order confirmation, shipment/fulfilment state and order history.
- Help: searchable FAQ plus a support request with category, description, attachments and status. Escalate urgent or safety issues through a clearly defined path.

## 5. Expert web workspace

### 5.1 Application and approval

- Expert creates an account, supplies a complete bio, specialties, service types/prices, certifications and sample video/media, and accepts professional/community terms.
- Statuses: **Draft → Submitted → Needs changes → Resubmitted → Approved / Rejected / Suspended**. Only approved profiles appear in member search or accept paid bookings.
- Admin feedback must identify missing or rejected evidence. Preserve versions and reviewer/audit data. Provide secure document upload, file type/size limits and removal/replacement.
- Experts can edit their public profile and availability; material credential changes can trigger re-review.

### 5.2 Workspace modules

- **Overview:** today’s schedule at a glance, assigned clients, adherence/progress signals, earnings and pending actions. Include the requested demographic summaries/graphs by age and gender, using aggregated data and minimum-group thresholds to avoid exposing small groups.
- **My clients:** assigned-client list, search/filter/sort, booking history, shared plans, goal/progress notes and reminders. No access to unassigned client records.
- **Calendar:** day/week/month, availability rules, time zone, blocked time, confirmed/reschedule/cancelled sessions, and links to message/call. Sync through supported Google/Apple/Outlook calendar integrations with least-privilege event access.
- **Messages:** conversation list and booking-linked chat, media attachments, audio/video call entry, delivery/read states and report/block/escalation.
- **Content:** create, save draft, preview, submit/publish based on moderation rules, update and archive posts. Choose approved categories and intended destinations (forum, recipe library, workout/exercise, challenge content). The expert’s content should not silently appear as a meal plan or official advice without the required review/format.
- **Earnings:** completed/pending/cancelled sessions, fees, payout status, transaction history and downloadable statements. Explain adjustments and link a payment dispute to its booking.
- **Notifications/settings:** appointment changes, messages, client check-ins, payout events, notification preferences and calendar settings.

### 5.3 Calls and client safety

Use in-app audio/video or a privacy-preserving provider. Handle permission denied, weak network, dropped calls and missed sessions. Keep call links limited to authorized booking participants and expire them after the session. Record calls only with explicit consent and a defined retention policy; default to no recording.

## 6. Super-admin web console

### 6.1 Platform overview

The overview should surface operational work, not only vanity totals: active members, approved/pending/suspended experts, bookings by state, gross payments/refunds/payouts, support backlog, content reports, verification queue and service-level performance. Filters should apply consistently by date, role, region and status; include an export permission and audit trail.

### 6.2 Admin modules

- **People:** search/filter members; review account/support history; restrict, suspend or unblock with a reason and appeal path.
- **Experts:** review credentials/media, request changes, approve/reject/suspend, inspect verification history and audit actions.
- **Bookings:** view all booking states; investigate schedule conflicts, late cancellations, no-shows and reschedule/refund exceptions.
- **Payments:** review provider transaction records, refund actions, payout holds and reconciliation. Use role separation for high-value/manual adjustments.
- **Content:** author and manage articles, meals, meal plans, recipes, workouts and media; schedule publishing; revise/archive; manage category metadata and visibility.
- **Auto-generated content:** generate draft meal-plan or schedule content for review, run a content/duplicate/safety check, then schedule it. Do not automatically publish unreviewed health guidance. Social media publishing requires connected accounts, explicit channel selection, preview, scheduling, failure status and retry controls.
- **Challenges:** create monthly challenge steps, estimated time, example images/videos, rules, dates, eligible audience, accessibility alternatives, completion/check-off method, reward/achievement criteria and progress reports.
- **Store & orders:** catalogue, SKU/variant, stock adjustments, low-stock alerts, order status, fulfilment, refunds and inventory audit.
- **Reports/moderation:** triage user reports, evidence, action history, warnings/restrictions, appeals and urgent-risk escalation. Admin actions should not delete the evidence trail.
- **Support/FAQ:** triage tickets, assign, respond, set status/priority and publish editable FAQs.
- **Settings:** versioned booking/cancellation rules, fees, tax/payment configuration, notification templates, content rules, support routing and feature flags. Record who changed what and when.

**Admin guardrail:** support/admin users should not browse private coaching conversations by default. Provide narrowly scoped access for a reported conversation or legal/safety request, with a reason, audit entry and least-privilege permissions.

## 7. End-to-end experience rules

1. **One source of truth:** member, expert and admin screens subscribe to the same canonical booking, payment, content and order records.
2. **Clear status and next step:** every pending state explains who must act, what happens next and when.
3. **No dead ends:** verification rejection, failed payment, expired slot, upload failure, missed call, refund delay, out-of-stock product and reported content all have recovery paths.
4. **Time-zone correctness:** store timestamps in UTC; display local time with explicit timezone on booking confirmation and notifications; handle daylight-saving changes.
5. **Idempotent transactions:** retries must not double-book, double-charge, duplicate posts or issue duplicate refunds.
6. **Notification consistency:** in-app inbox is the history of record; push/email are preference-based delivery channels. Deep links open the relevant screen and respect login/role.
7. **Accessible interaction:** touch targets, text contrast, dynamic text, screen-reader labels, captions/transcripts for instructional video, reduced-motion preference and non-color-only status indicators.
8. **Graceful loading/error states:** skeletons, empty states, retries, offline-safe drafts and clear confirmation after consequential actions.
9. **International readiness:** currency, locale, units, dates, decimal formats and language should be account-aware rather than hard-coded.
10. **Privacy by design:** consent, data minimization, export/delete request handling, secure media access, retention rules and role-based access for health-related data.

## 8. Recommended delivery sequence

### Release 1 — core service

- Role-based account creation and sign-in; expert verification workflow.
- Member profile and consent; expert discovery/profile; availability and confirmed booking.
- Payment authorization, receipts, cancellation/reschedule/refund state and auditable admin exception handling.
- Member/expert calendar and booking-linked messaging (text first; calls can follow if integration readiness requires).
- Member dashboard, manual meal/activity logging, curated meal/recipe/workout content and basic challenge tracking.
- Expert client list, schedule, content and transaction views.
- Admin people/expert/booking/payment/content/support/moderation basics.
- Store catalogue and order flow if commerce is a launch requirement; otherwise keep the entry point hidden until fulfilment is ready.

### Release 2 — engagement and operations

- Audio/video calls; calendar-provider sync; progress charts; more challenge types and achievements.
- Expert analytics, payout statements, full store inventory/order operations and advanced admin reporting.
- Forum moderation tools, content scheduling, email/push preference center and social publishing integrations.

### Later enhancements

- Photo-based meal recognition with member confirmation and confidence/portion adjustment.
- Automated meal-plan/content drafts with expert/admin review; no unsupervised health recommendations.
- More advanced coaching plans, integrations, personalization and platform analytics based on consented data.

## 9. Workbook feature coverage audit

| Workbook requirement | Covered in this specification |
|---|---|
| Member account, quick login and password reset | §4.1 |
| Detailed fitness profile and settings | §4.1, §4.2, §7 |
| Dashboard search/filter, saved meal plans, calendar, shop, recipes, challenges | §4.2–4.6 |
| Manual food logging, macros, photos, future automatic recognition | §4.3 |
| Forum, workout library, shop, recipes, help/support | §4.2, §4.6 |
| Find expert by training/goal | §4.4 |
| Admin-created monthly challenge steps, timing, sample media, check-offs, adjustable goals, progress charts and achievements | §4.6, §6.2 |
| Payment method/history, editable FAQ, sound/email notifications, quick store access | §4.2, §4.6, §6.2, §7 |
| Expert account, bio, certifications, videos and admin approval | §5.1, §6.2 |
| Expert client filtering, schedule, calls/messages, calendar integration, demographics | §5.2 |
| Expert posts, categories, interactions and transaction history | §5.2 |
| Member search, expert profile evidence/reviews/availability, virtual or face-to-face booking | §4.4 |
| Booking payment, completion payout, cancellation percentages, expert cancellation and review | §4.5 |
| Member/expert chat, attachments, audio/video calls | §4.6, §5.2–5.3 |
| Admin user/expert management, filtering, blocks and reports | §6.2 |
| Admin dashboard demographics, payments, subscribers, transactions and schedules | §6.1–6.2 |
| Admin content/media in all sections and scheduled automatic posts/social sharing | §6.2 |
| Admin store inventory and order management | §6.2 |
| Admin/support messaging and FAQ control | §6.2 |

## 10. Decisions to lock before implementation

These are the meaningful gaps in the source workbook; resolving them prevents inconsistent user experiences and payment disputes.

1. **Cancellation policy:** member and expert cancellation cutoffs, fee/refund bands, expert share, late-cancellation compensation, no-show and technical-failure treatment.
2. **Completion and dispute window:** who marks a session complete, how long a member has to dispute, what evidence is needed, and when payout releases.
3. **Payment provider and geography:** support for cards/PayPal, currencies, tax, delayed payout, refund timing and countries at launch.
4. **Expert business model:** platform commission, payout schedule, minimum payout and any subscription/transaction fees.
5. **Calendar integration scope:** calendar invitation only vs two-way Google/Apple/Outlook sync; permissions and conflict behavior.
6. **Health-data governance:** consent wording, retention, export/deletion, access logs, supported regions and whether any regulated clinical services are in scope.
7. **Community safety:** report categories, response targets, escalation path and appeal process.
8. **Content governance:** whether expert posts publish immediately, require review, or use trust-based permissions; approval rules for health/nutrition material.
9. **Social publishing:** launch channels, account ownership/authorization and handling of rejected posts or expired connections.
10. **Store operations:** physical/digital products, shipping regions, taxes, returns, inventory source and fulfilment owner.
11. **Communication scope:** whether calls/video are in Release 1 and which vendor, recording policy (recommended default: off) and retention.
12. **Launch service levels:** support coverage hours, refund response time, credential-review SLA and moderation response targets.

## 11. QA checklist for product and design handoff

Before a production build is accepted, walk through these cases for all three roles:

- Member: sign up/log in/reset; finish or skip onboarding; edit profile/consent; search/filter expert; inspect credentials/reviews; book both service formats; payment success/failure/retry; slot collision; timezone/daylight-saving; confirmation/reminders; message/call access; cancellation/reschedule/refund; session completion/dispute; meal entry edit/delete and recalculated totals; challenge join/check-in/goal change/achievement; forum post/report/block; shop purchase/out-of-stock/refund; FAQ/support request; notification preferences.
- Expert: application draft/submission/upload error; request changes/resubmission/approval; profile and availability edit; assigned-client access boundary; double-booking prevention and external calendar conflict; session list/state changes; message/media/call permission and dropped call; client progress; create/edit/draft/publish/archive content; earnings/payout/refund adjustment.
- Super admin: role-protected login; credential approve/reject/request changes; user/expert search and restriction/appeal; booking issue, cancellation and payout hold; refund/reconciliation; FAQ/content/challenge update; duplicate or unsafe auto-generated content stays draft; store inventory/order/refund; report triage and audit trail; support assignment; filter/export access; policy change versioning.
- All roles: empty/loading/error/offline states, keyboard/screen-reader support, readable status without color, notification deep links, session expiry, least-privilege access and auditability.

**Figma/design note:** the role pages contain 43 role frames: 23 member, 8 expert and 12 admin, plus three earlier dashboard previews on “2026 updated.” This is a first-pass static screen set, not a production-complete prototype. Click-through interactions, responsive breakpoints, all loading/error/empty states and backend behavior still need to be designed and implemented. The coverage table maps every feature listed in the workbook; some items are product behaviors rather than dedicated screens.

## 12. Engineering blueprint for web and mobile

This section turns the product flows into implementation boundaries without choosing a programming language, cloud, database or payment vendor. Keep the web workspace, admin console and mobile app as role-specific clients over shared services and records.

### 12.1 Product surfaces and service boundaries

| Surface/service | Owns |
|---|---|
| Member mobile app | Onboarding, profile/consent, discovery, booking, plans, tracking, community, store and support UI |
| Expert web workspace | Credential application, availability, assigned clients, bookings, communication, content and earnings UI |
| Admin web console | Verification, support, moderation, policy configuration, catalogue/order operations and reporting UI |
| Identity and access | Authentication, sessions, role and permission checks, account recovery and audit of privileged actions |
| Core platform API | Profiles, expert directory, availability, booking, messaging metadata, content, challenges and notifications |
| Payment integration | Provider tokens, authorization/capture/refund events, reconciliation and payout transfers; never raw card data |
| Media and communications | Secure uploads, media delivery, push/email, and call-provider session creation |

These are logical boundaries, not a requirement to deploy separate microservices. A modular backend can implement them initially if modules enforce ownership and permissions.

### 12.2 Core records

Implement these as linked records with stable IDs and timestamps. Keep sensitive health fields separately permissioned from public profile fields.

| Record | Key relationships and fields |
|---|---|
| Account | Identity-provider ID, verified contacts, account status, locale, time zone |
| Role grant | Account, role, scope, status, granted/revoked by and timestamp |
| Member profile | Account, goals, preferences, units, consent versions and sharing grants |
| Expert profile | Account, bio, specialties, service formats/prices, credential state, public media |
| Credential review | Expert, submitted evidence, reviewer, decision, reason, timestamps and version |
| Availability slot | Expert, start/end UTC, local display zone, capacity, hold expiry and status |
| Booking | Member, expert, service, chosen slot, policy version, participants and state history |
| Payment transaction | Booking/order, provider reference, amount/currency, transaction state and event history |
| Payout | Expert, eligible booking/transactions, amount, status, provider reference and hold reason |
| Conversation | Booking or support context, participant IDs, message records and access policy |
| Content item | Author, type/category, audience, moderation state, publication schedule and media refs |
| Challenge/progress | Challenge rules/dates; member goal, dated check-ins, evidence and achievement state |
| Order/inventory | Member, line items/SKUs, stock movements, fulfilment, refunds and status history |
| Support/report | Reporter, subject, category, evidence refs, assigned staff, resolution and audit events |

### 12.3 API capability groups

Expose capability-oriented APIs (or equivalent internal modules), with authorization enforced server-side on every read and write:

- **Identity/profile:** account lifecycle, role grants, profile, consent and data export/deletion requests.
- **Discovery/scheduling:** expert search, profile detail, availability, slot holds and conflict-safe release.
- **Bookings:** create, confirm, cancel, request/accept reschedule, complete, dispute and view state history.
- **Payments:** create provider checkout/authorization, process signed provider events, refund, reconcile and transfer eligible payouts.
- **Coaching/content:** plans, recipes, workouts, logs, challenges, progress, posts, comments and moderation actions.
- **Communications:** booking-linked conversations, support cases, notifications and time-limited call session tokens.
- **Commerce/admin:** catalogue, inventory movements, orders, fulfillment, support, verification, reporting and versioned policies.

Use idempotency keys for booking checkout, provider callbacks, refunds, order creation and payout transfers. Treat provider webhooks as at-least-once and verify signatures before updating internal state.

### 12.4 Invariants the implementation must preserve

- A slot can have at most one active booking; an expired checkout hold releases it automatically.
- Only verified, active experts can appear in discovery or accept paid bookings.
- An expert can access only assigned client records and data the member has shared for coaching.
- A member’s accepted reschedule is required before changing the confirmed session time.
- Payment and payout state changes come from validated provider events or audited admin actions, not client-side status updates.
- Every policy decision uses the policy version accepted at booking; later policy edits do not silently alter existing bookings.
- Refund and payout operations are idempotent and produce an auditable ledger trail.
- Admin access to private health or conversation data is purpose-limited and logged.
- Content generated with automation stays draft until authorized human review and publication.

### 12.5 Build acceptance criteria

Before calling the platform build-ready, define and review: supported countries/currencies; member cancellation bands and expert late-cancellation consequences; completion/no-show/dispute rules; selected payment and communication providers; data retention/consent; calendar sync scope; commerce fulfillment/returns; and moderation/support response ownership. Then implement and verify each role’s happy path and recovery states in the QA checklist above, including responsive web layouts and mobile accessibility.

