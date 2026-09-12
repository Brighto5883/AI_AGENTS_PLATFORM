AI Agents Platform — System Overview & Handoff Documentation

1. Purpose of this document

This document explains the current architecture, responsibilities, data flow, major features, and development state of the AI Agents Platform.

It is intended as a handoff document for another developer or technical collaborator who needs to understand how the platform works without having to reconstruct the architecture from the codebase and previous development discussions.

The platform is being developed as a unified application rather than as a collection of unrelated projects. Its main purpose is to provide users with AI-powered agents and services through a mobile application, while also providing a marketplace where users can buy, sell, and eventually request products and interact with other marketplace users.

2. High-level architecture

The platform currently follows a full-stack architecture:

                    ┌─────────────────────────┐
                    │       Mobile App        │
                    │     React Native        │
                    │         Expo             │
                    └────────────┬────────────┘
                                 │
                           HTTP / JSON
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      FastAPI Backend    │
                    │       Python            │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        Authentication       AI/Agent APIs      Marketplace
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      PostgreSQL DB      │
                    └─────────────────────────┘

                         Marketplace media
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Cloudflare R2        │
                    │     Image Storage        │
                    └─────────────────────────┘

The important architectural principle is that the marketplace is not a separate application with its own authentication or database.

It is a domain/module inside the same FastAPI application and uses the platform's existing users, authentication, database, and infrastructure.

3. Main technology stack

Backend

Python

FastAPI

PostgreSQL

SQLAlchemy

Async SQLAlchemy sessions

Alembic migrations

JWT authentication

FastAPI Users

UUID-based user and marketplace identifiers

Pydantic schemas

Cloudflare R2 for marketplace image storage

Mobile frontend

React Native

Expo

Expo Router

TypeScript

NativeWind/Tailwind-style classes

React Context for authentication state

fetch() through a shared API service

Legacy / previous UI

There was an older Streamlit marketplace frontend used during earlier development/testing.

It is not the intended production mobile interface. The current direction is the React Native/Expo mobile application.

4. Backend organization

The backend is organized around a single FastAPI application.

The marketplace is modularized under:

backend/
└── app/
    ├── marketplace/
    │   ├── moderation/
    │   ├── media/
    │   ├── schemas/
    │   ├── routes/
    │   └── services/
    ├── ...
    ├── core/
    │   └── factories.py
    └── app.py

The exact number of files can evolve, but the important architectural boundary is:

app/marketplace/

contains marketplace-specific behavior.

Generic platform infrastructure such as authentication, database access, pricing, and payment infrastructure remains outside the marketplace module when it is reusable by other parts of the platform.

Marketplace routes are registered with the main FastAPI application.

Marketplace services are constructed through the application's dependency/factory/container architecture.

This keeps marketplace functionality modular without creating a second backend.

5. Authentication

Authentication is shared across the entire platform.

A user authenticates through the platform's normal authentication system and receives a JWT.

The mobile application stores the token through the token service.

The shared API layer then attaches the token to authenticated requests.

The mobile flow is:

User logs in
     ↓
FastAPI authentication
     ↓
JWT returned
     ↓
Mobile token service stores token
     ↓
apiFetch() retrieves token
     ↓
Authorization: Bearer <token>
     ↓
FastAPI authenticates request

This is important for the marketplace because marketplace users are the same users who use the AI-agent services.

The marketplace does not maintain a separate user table or login mechanism.

6. Mobile application structure

The current mobile application structure is:

mob_app/
├── app/
│   ├── (app)/
│   │   ├── agents/
│   │   │   ├── email.tsx
│   │   │   ├── podcast.tsx
│   │   │   ├── road.tsx
│   │   │   └── whatsapp.tsx
│   │   ├── home.tsx
│   │   ├── marketplace/
│   │   │   ├── create.tsx
│   │   │   ├── index.tsx
│   │   │   ├── _layout.tsx
│   │   │   ├── [listingId].tsx
│   │   │   └── my-listings.tsx
│   │   └── _layout.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── index.tsx
│   └── _layout.tsx
│
├── components/
│   ├── AgentCard.tsx
│   ├── FilePicker.tsx
│   ├── marketplace/
│   │   └── ListingCard.tsx
│   ├── ServiceCard.tsx
│   └── WhatsAppCard.tsx
│
├── config/
│   ├── env.ts
│   └── services.ts
│
├── context/
│   └── AuthContext.tsx
│
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── marketplaceService.ts
│   ├── roadService.ts
│   ├── tokenService.ts
│   └── whatsappService.ts
│
├── types/
│   ├── agent.ts
│   ├── auth.ts
│   ├── marketplace.ts
│   ├── road.ts
│   └── whatsapp.ts
│
└── utils/
    └── access.ts

7. Root routing

The root Expo Router layout wraps the application in the authentication provider.

Conceptually:

RootLayout
    ↓
AuthProvider
    ↓
Expo Router Stack

The root index checks authentication state.

Loading
   ↓
Is authenticated?
   ├── Yes → /home
   └── No  → /login

Therefore the user does not manually choose between the authenticated and unauthenticated areas.

8. Home screen and services architecture

The home screen acts as the main workspace.

Rather than hard-coding each service directly into the home page, services are configured centrally in:

config/services.ts

The current service model contains:

id
name
description
icon
path
status

Examples include:

Road Design Assistant

WhatsApp Assistant

KU Marketplace

Email Assistant

Podcast Assistant

The marketplace is currently configured as:

name: KU Marketplace
path: /marketplace
status: available

The home screen renders these through the generic:

ServiceCard

This means a separate MarketplaceCard is not used for launching the marketplace.

The architecture is:

services.ts
     ↓
Home
     ↓
ServiceCard
     ↓
service.path
     ↓
/marketplace

Specialized components are introduced only where a feature actually requires specialized UI.

For example, the marketplace has:

components/marketplace/ListingCard.tsx

because marketplace listings have domain-specific presentation requirements.

9. Marketplace architecture

The marketplace is a module inside the main platform.

Its purpose is to allow platform users to interact in a campus-oriented marketplace.

The marketplace currently supports the basic seller flow:

User
  ↓
Marketplace
  ↓
Create product listing
  ↓
Upload product images
  ↓
Backend processes listing
  ↓
Images stored
  ↓
Listing becomes available
  ↓
Other users can view listings

The current frontend marketplace routes are:

/marketplace
/marketplace/create
/marketplace/[listingId]
/marketplace/my-listings

10. Marketplace route layout

The marketplace has its own Expo Router layout:

marketplace/_layout.tsx

It contains a nested stack for marketplace screens.

The marketplace therefore has its own route boundary while still living inside the authenticated (app) section.

Conceptually:

(app)
   ↓
marketplace
   ├── index
   ├── create
   ├── [listingId]
   └── my-listings

11. Marketplace listing lifecycle

A normal product listing follows this general lifecycle:

Create listing request
       ↓
Validate user
       ↓
Validate listing information
       ↓
Create listing record
       ↓
Process uploaded images
       ↓
Store images
       ↓
Create ListingImage records
       ↓
Return listing response
       ↓
Frontend displays listing

The listing can contain multiple images.

Images are not stored as large binary data directly inside PostgreSQL.

Instead, the database stores metadata and a storage key, while the actual image file is stored in object storage.

12. Listing database model

The primary marketplace entity is Listing.

Its important fields are:

id
seller_id
title
description
price
category
image_path
is_approved
needs_review
review_reason
created_at

Meaning of important fields

id

UUID identifying the listing.

seller_id

UUID identifying the platform user who created the listing.

This connects marketplace ownership to the existing platform user system.

title

Short product name.

description

Detailed product information.

price

The asking price.

The backend uses a decimal/numeric database representation rather than floating-point money.

category

The marketplace category.

image_path

A legacy/compatibility field. The newer image architecture uses ListingImage records and object storage.

is_approved

Whether the listing has passed the marketplace approval process.

needs_review

Whether the listing requires moderation/review.

review_reason

Optional explanation for why manual review is required.

created_at

Timestamp of listing creation.

13. Multiple-image architecture

Marketplace images are represented by:

ListingImage

A listing has a one-to-many relationship with its images:

Listing
   │
   ├── ListingImage
   ├── ListingImage
   ├── ListingImage
   └── ...

The ListingImage model contains:

id
listing_id
storage_key
original_filename
content_type
file_size
display_order
created_at

The database also enforces uniqueness of:

listing_id + display_order

This ensures that one listing cannot have two images occupying the same display position.

14. Image storage

The marketplace uses Cloudflare R2 for image storage.

The architecture is:

Mobile App
    │
    │ multipart/form-data
    ▼
FastAPI
    │
    ├── validate/process image
    │
    ├── generate storage key
    │
    ▼
Cloudflare R2
    │
    └── actual image

PostgreSQL stores metadata:

ListingImage
    ↓
storage_key
original_filename
content_type
file_size
display_order

The actual image bytes remain in object storage.

This separates database records from potentially large media files and makes the image system more scalable.

15. Listing image service

Image operations are handled by a dedicated listing-image service.

Its responsibilities include:

processing uploaded images

generating storage keys

storing images

creating image database records

generating access URLs

cleaning up stored files when necessary

The service flushes database changes when required but does not own the overall transaction commit.

This is intentional.

The higher-level listing service controls the transaction so that listing creation and associated image records remain part of a coherent operation.

16. Listing service

The marketplace listing service is responsible for application-level listing creation logic.

The simplified flow is:

ListingService.create_listing()
        ↓
Create Listing
        ↓
Handle payment requirements if applicable
        ↓
Add/process images
        ↓
Return internal creation result

The internal service result is separate from the API response schema.

This separation prevents internal service implementation details from becoming part of the public API contract.

17. API response model

The public API returns a listing representation containing:

id
seller_id
title
description
price
category
image_path
is_approved
needs_review
review_reason
created_at
images[]

Each image contains:

id
original_filename
content_type
file_size
display_order
url

The url is intended for the frontend to display the stored image.

18. Mobile marketplace types

The mobile frontend mirrors the API response with TypeScript types.

Conceptually:

Listing
    ├── id
    ├── seller_id
    ├── title
    ├── description
    ├── price
    ├── category
    ├── image_path
    ├── is_approved
    ├── needs_review
    ├── review_reason
    ├── created_at
    └── images[]

The frontend price is represented as a string.

This is intentional because the backend uses Python Decimal/database numeric values for money.

JavaScript floating-point arithmetic should not be used casually for monetary values.

19. Marketplace API service

Marketplace network operations are centralized in:

services/marketplaceService.ts

The service uses the shared:

apiFetch()

rather than directly calling fetch().

The flow is:

Marketplace screen
       ↓
marketplaceService
       ↓
apiFetch
       ↓
get JWT token
       ↓
Authorization header
       ↓
BACKEND_URL + endpoint
       ↓
FastAPI

This prevents every screen from independently implementing authentication headers and backend URL handling.

20. Shared API layer

The mobile application's:

services/api.ts

contains the shared API request mechanism.

Its main responsibilities are:

retrieve the current JWT

construct request headers

attach the authorization token

prepend the configured backend URL

perform the request

Marketplace services therefore only need to specify their endpoint and request details.

21. Marketplace storefront

The marketplace landing page is:

app/(app)/marketplace/index.tsx

It acts as the marketplace storefront.

The intended UI direction is deliberately more polished than a basic CRUD screen because the marketplace is a consumer-facing marketplace experience.

The storefront includes/targets:

marketplace branding

search

product categories

featured/discoverable listings

listing cards

empty states

a prominent sell/create action

navigation to user listings

navigation to individual listing details

The main product presentation component is:

components/marketplace/ListingCard.tsx

22. Current normal listing flow

The currently working basic flow is:

Marketplace
    ↓
Create
    ↓
Enter product details
    ↓
Select images
    ↓
Submit
    ↓
FastAPI marketplace endpoint
    ↓
Listing + images stored
    ↓
Marketplace storefront
    ↓
Listing appears
    ↓
User taps listing
    ↓
Listing detail screen

This means the marketplace already has the foundation for both sides of the basic marketplace experience:

users can post products

users can discover/view products

23. Product detail screen

The dynamic route:

marketplace/[listingId].tsx

represents one particular marketplace listing.

The listing ID comes from the route.

Conceptually:

/marketplace/123...
       ↓
[listingId]
       ↓
request listing information
       ↓
display product detail

The detail screen is the natural place for future marketplace interactions such as:

seller information

contact seller

comments

reporting

favorites

sharing

purchasing/contact actions

24. My listings

The route:

marketplace/my-listings.tsx

is dedicated to listings belonging to the authenticated user.

The conceptual distinction is:

Marketplace
    → all/discoverable listings

My Listings
    → listings owned by current user

This separation is important because marketplace ownership is based on the authenticated seller_id.

25. Wanted Listings

The next major marketplace feature is Wanted Listings.

A normal listing answers:

"I have this item and I want to sell it."

A wanted listing answers:

"I am looking for this item and I want someone who has it to contact me."

Example:

Normal listing:
Samsung Galaxy A15 — KSh 18,000

Wanted listing:
Looking for Samsung Galaxy A15
Budget: KSh 15,000–18,000
Condition: Used or new

Wanted listings should be treated as their own domain object rather than pretending they are ordinary product listings.

The intended future frontend structure is:

marketplace/
└── wanted/
    ├── index.tsx
    ├── create.tsx
    ├── [wantedId].tsx
    └── my-wanted.tsx

This gives wanted listings their own discovery, creation, detail, and ownership screens.

26. Wanted listing functionality

The planned Wanted Listings functionality includes:

create a wanted listing

view wanted listings

search wanted listings

filter wanted listings

view a wanted listing's details

view the current user's wanted listings

close/delete a wanted listing

eventually allow sellers to respond to a request

The intended user flow is:

User wants an item
       ↓
Creates wanted listing
       ↓
Other users browse/search wanted listings
       ↓
A seller recognizes the requested product
       ↓
Seller can respond/contact the requester

27. Marketplace search

Search will eventually operate across marketplace listings.

The basic search concept is:

User enters search query
        ↓
Marketplace search state
        ↓
API request
        ↓
Backend filters listings
        ↓
Matching listings returned
        ↓
ListingCard renders results

Search should primarily operate against useful marketplace fields such as:

title

description

category

Search belongs at the marketplace level rather than being implemented separately inside every screen.

28. Marketplace filtering

Filtering will complement text search.

Expected filters include:

category

minimum price

maximum price

sorting

potentially condition and other marketplace-specific attributes later

The user experience should allow filters to be changed without navigating away from the storefront.

A conceptual request might eventually look like:

GET /marketplace/listings/
    ?search=iphone
    &category=phones
    &min_price=10000
    &max_price=50000
    &sort=recent

The exact endpoint/query contract must follow the backend implementation.

29. Comments and feedback

A comments/feedback system is planned as the next interaction layer.

The basic idea is:

Listing
   ↓
Comments
   ├── Comment 1
   ├── Comment 2
   └── Comment 3

A user should eventually be able to:

view comments

submit a comment

delete their own comment

potentially report inappropriate comments

The mobile component structure is intended to include:

components/marketplace/
├── CommentBox.tsx
└── CommentItem.tsx

The comments system should be attached to the appropriate marketplace entity rather than creating a generic social-media system unnecessarily.

30. Moderation

Marketplace moderation is already part of the backend architecture.

The listing model contains:

is_approved
needs_review
review_reason

This allows the platform to distinguish between:

Approved listing
        ↓
Normal marketplace discovery


Listing requiring review
        ↓
Moderation workflow

The marketplace therefore has a foundation for content moderation rather than assuming that every submitted listing should immediately be treated as trusted content.

31. Payments

Payment infrastructure is separated from marketplace-specific business logic.

The marketplace can require payment for appropriate operations, while reusable payment/pricing infrastructure remains outside the marketplace module.

This prevents marketplace code from becoming tightly coupled to one particular payment implementation.

The listing creation service has already been designed with payment requirements in mind.

32. Transaction boundaries

A major backend design principle is that lower-level services do not arbitrarily commit database transactions.

For example:

ListingService
     ↓
ListingImageService
     ↓
database flush

The higher-level operation controls the final commit.

This makes it possible to keep related operations consistent.

For example, if listing creation succeeds but image processing fails, the application can handle the transaction coherently rather than leaving unrelated partial database state behind.

33. Database and migration strategy

PostgreSQL is the primary database.

Alembic is used for schema migrations.

Marketplace schema changes are therefore made through migrations rather than manually editing the production database.

This has already been important during marketplace development, particularly when introducing:

listing_images

and its relationship with:

listings

34. Why ListingImage is separate from Listing

The older listing design had:

image_path

which is insufficient for a modern marketplace where users may upload multiple images.

The newer design separates image records:

Listing
    ↓
ListingImage[]

Advantages:

multiple images per product

ordering

metadata per image

independent storage keys

easier deletion

easier future image transformations

cleaner object-storage integration

The old image_path field remains for compatibility/legacy reasons, but the newer system is centered around ListingImage.

35. Mobile image uploads

The React Native application uses multipart form data for image uploads.

The general pattern is:

FormData
    ├── text fields
    └── images
          ├── uri
          ├── name
          └── MIME type

React Native file objects are adapted to the multipart request expected by FastAPI.

The existing road-design service established the project's multipart upload pattern, and the marketplace follows the same overall architecture.

36. Environment configuration

The mobile app obtains its backend URL through:

config/env.ts

rather than hard-coding the backend address throughout the application.

The API layer then constructs:

BACKEND_URL + endpoint

This makes development environments easier to change.

During development, the backend may be exposed through a tunnel such as ngrok when a physical mobile device needs access to the development server.

37. Development environment

The project is currently being developed on Linux/Ubuntu with:

Node.js

npm

Expo

React Native

TypeScript

Python

FastAPI

PostgreSQL

Git

The mobile application is launched through Expo.

The development setup has also involved physical-device networking and tunnel configuration.

Some Expo CLI connection warnings can occur independently of application correctness; they should be distinguished from actual application/runtime errors.

38. Existing AI-agent services

The marketplace is only one part of the larger platform.

The platform also contains AI-agent/service areas such as:

Road Design Assistant

Designed around road-design/engineering assistance.

The mobile application communicates with the backend through:

roadService.ts

and supports file-based queries.

WhatsApp Assistant

Designed to assist with WhatsApp customer conversations.

Its workflow includes AI-generated draft replies that the user can review, edit, and send.

The mobile implementation has specialized UI:

WhatsAppCard.tsx

and a corresponding:

whatsappService.ts

Email Assistant

Planned/coming soon.

Podcast Assistant

Planned/coming soon.

The platform therefore combines AI-agent functionality with marketplace functionality inside one authenticated application.

39. Generic versus specialized frontend components

The frontend intentionally distinguishes between reusable platform UI and domain-specific UI.

Generic

ServiceCard

is used to represent services on the home screen.

It should not know detailed marketplace behavior.

Marketplace-specific

ListingCard

belongs under:

components/marketplace/

because it understands marketplace listing presentation.

This keeps the architecture clean:

Generic platform UI
        ↓
Reusable

Marketplace UI
        ↓
Marketplace-specific

40. Why the marketplace does not have MarketplaceCard

The marketplace does not need a separate MarketplaceCard simply to launch the marketplace.

The existing service architecture already handles that:

services.ts
      ↓
ServiceCard
      ↓
/marketplace

Creating another launcher component would duplicate existing functionality.

A specialized component is justified when the component represents a marketplace concept, such as:

ListingCard
WantedListingCard
CommentItem
MarketplaceFilters

41. Current marketplace state

At the current stage, the marketplace has reached the following milestone:

Working/basic foundation

authenticated platform users can enter the marketplace

users can create/post a product

product information is sent to the FastAPI backend

product images can be uploaded

listing images are represented separately from listings

images use Cloudflare R2 storage

listings can be retrieved

users can view listed products

individual listing details have a dedicated route

users have a dedicated "My Listings" area

marketplace API communication uses the shared authenticated API layer

Being developed next

Wanted Listings

marketplace search

marketplace filters

comments/feedback

seller/buyer interaction

favorites

reporting

listing management improvements

better marketplace navigation

pagination/infinite scrolling

stronger loading/error/empty states

further UI polish

42. Planned marketplace navigation

The marketplace is expected to evolve toward a structure approximately like:

KU Marketplace
│
├── Discover
│   ├── Search
│   ├── Categories
│   ├── Filters
│   └── Product listings
│
├── Wanted
│   ├── Browse wanted
│   ├── Create wanted
│   ├── Wanted details
│   └── My wanted
│
├── Sell
│   └── Create listing
│
├── My Listings
│   ├── Active
│   ├── Under review
│   └── Closed
│
└── Profile / Marketplace activity

This is a direction for the marketplace UX, not a statement that every screen above has already been implemented.

43. Intended marketplace user experience

The marketplace should feel like a real marketplace rather than an administrative CRUD interface.

The intended experience is:

Open marketplace
      ↓
Immediately see discoverable products
      ↓
Search or browse categories
      ↓
Open an attractive product card
      ↓
View images/details/price
      ↓
Interact with seller/listing

At the same time, creating a listing should remain straightforward:

Sell something
      ↓
Add photos
      ↓
Enter title
      ↓
Enter description
      ↓
Choose category
      ↓
Enter price
      ↓
Submit

The design should balance visual richness with usability.

44. Error and state handling

The frontend should eventually distinguish at least these states:

Loading
Empty
Success
Error
Submitting
Refreshing

For example:

Fetching listings
      ↓
Loading UI

No listings
      ↓
Marketplace empty state

Listings found
      ↓
Listing cards

API failure
      ↓
Error state + retry

The same principle applies to listing creation and image upload.

45. Security principles

Important security boundaries include:

authenticated marketplace operations require the platform JWT

ownership should be determined server-side from the authenticated user, not trusted from arbitrary client input

users should only be allowed to modify/delete resources they own

moderation status should be controlled by backend logic

object-storage keys should not be blindly accepted from clients

payment state should be validated by backend services

marketplace input should be validated using backend schemas

database operations should use the authenticated user's UUID relationships

The mobile app is a client and should never be treated as a trusted authority.

46. Important architectural principle: backend is authoritative

The frontend should not duplicate business rules that belong to the backend.

For example:

Frontend:
"What fields should I send?"

Backend:
"Are these fields valid?"
"Does this user have permission?"
"Is this listing approved?"
"Does payment need to occur?"
"Can this listing be created?"

The frontend provides a good user experience, but the backend remains authoritative.

47. Intended future interaction model

The marketplace is moving from a simple listing system toward a two-sided interaction system.

Initially:

Seller → Product → Buyer

With Wanted Listings:

Seller → Product → Buyer

Buyer → Wanted Request → Seller

With comments/feedback:

User
  ↓
Listing
  ↓
Discussion / feedback

Eventually this can support richer marketplace interactions without changing the fundamental architecture.

48. Recommended development sequence from the current state

The safest development sequence is:

1. Wanted Listings
       ↓
2. Search
       ↓
3. Filters
       ↓
4. Comments / feedback
       ↓
5. Seller/requester interaction
       ↓
6. Listing management
       ↓
7. Favorites / reporting
       ↓
8. Pagination
       ↓
9. Loading/error/empty-state polish
       ↓
10. Final marketplace UI refinement

Search and filtering should ultimately be implemented against backend query parameters rather than downloading the entire marketplace and filtering large datasets only on the device.

49. Development philosophy

The project is intentionally being developed incrementally.

The preferred pattern is:

Backend capability
       ↓
Backend API contract
       ↓
TypeScript type
       ↓
Marketplace service
       ↓
Screen
       ↓
Domain-specific component
       ↓
Integration testing
       ↓
UI refinement

This avoids building large amounts of frontend code around APIs that do not yet exist.

It also keeps the frontend and backend contracts explicit.

50. Current conceptual data flow

For a normal product listing:

                    USER
                      │
                      ▼
             React Native UI
                      │
                      ▼
           marketplaceService
                      │
                      ▼
                 apiFetch()
                      │
              JWT attached
                      │
                      ▼
             FastAPI endpoint
                      │
                      ▼
             Marketplace service
                      │
             ┌────────┴─────────┐
             ▼                  ▼
         PostgreSQL          R2 Storage
             │                  │
             │             product images
             │                  │
             └────────┬─────────┘
                      ▼
               API response
                      │
                      ▼
             React Native UI
                      │
                      ▼
                ListingCard

51. Current project mental model

The easiest way for a new developer to understand the platform is to think of it as four layers:

┌──────────────────────────────────────┐
│              UI LAYER                │
│ React Native + Expo Router           │
│ Screens + Components                 │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│          CLIENT SERVICE LAYER        │
│ marketplaceService, roadService,     │
│ whatsappService, authService         │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│             API LAYER                │
│ FastAPI routes + Pydantic schemas    │
│ Authentication + authorization       │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│          DOMAIN / DATA LAYER         │
│ Services + SQLAlchemy + PostgreSQL   │
│ R2 media storage + payments          │
└──────────────────────────────────────┘

The marketplace should continue to respect this separation as new features are added.

52. Summary for a new developer

If you are joining this project, the most important things to understand are:

This is one platform, not several independent applications.

FastAPI is the main backend.

PostgreSQL is the main database.

Authentication is shared across all platform services.

The marketplace is a backend module under app/marketplace/.

The mobile application is React Native/Expo with Expo Router.

Marketplace API calls go through marketplaceService.ts, which uses the shared apiFetch().

Listings belong to authenticated users through seller_id.

Marketplace images use a separate ListingImage model and Cloudflare R2.

The frontend uses ListingCard for marketplace product presentation.

The generic ServiceCard launches the marketplace from the home screen.

Wanted Listings are intended to be a separate marketplace entity.

Search/filtering should eventually be implemented through backend query parameters.

Comments/feedback will add interaction around marketplace listings.

The backend remains authoritative for permissions, validation, moderation, payments, and business rules.

The current marketplace milestone is: users can post products and view listed products.

The next major milestone is turning the basic listing system into a complete two-sided marketplace through Wanted Listings, search/filtering, comments, and marketplace interactions.

53. Current status at a glance

Area

Status

Platform authentication

Implemented

Shared JWT API layer

Implemented

React Native/Expo app

Implemented

Generic service navigation

Implemented

Marketplace route structure

Implemented

Product listing creation

Implemented

Product listing retrieval

Implemented

Product detail route

Implemented

My listings route

Implemented

Multiple listing images

Implemented

Cloudflare R2 image storage

Implemented/configured

Listing moderation fields

Implemented

Wanted Listings

Next development area

Marketplace search

Next development area

Marketplace filters

Next development area

Comments/feedback

Next development area

Seller/requester interaction

Planned

Favorites

Planned

Reporting

Planned

Advanced listing management

Planned

Pagination/infinite scrolling

Planned

Final marketplace polish

Ongoing

54. Final architectural picture

The platform is ultimately moving toward this:

                         AI AGENTS PLATFORM
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
          AI SERVICES                          KU MARKETPLACE
                │                                   │
      ┌─────────┼─────────┐               ┌─────────┼─────────┐
      │         │         │               │         │         │
    Road     WhatsApp   Future          Buy/Sell  Wanted   Interaction
    Agent     Agent     Agents          Listings  Listings  & Feedback
      │         │         │               │         │         │
      └─────────┴─────────┴───────────────┴─────────┴─────────┘
                                  │
                                  ▼
                           FASTAPI BACKEND
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
       Authentication          PostgreSQL           R2 Storage
             │                    │                    │
             └────────────────────┴────────────────────┘

The key idea is that AI services and marketplace functionality share the same platform foundation while keeping their domain-specific logic separated.

This allows the platform to grow into a broader ecosystem without turning the codebase into a collection of tightly coupled features.