# Garden Management System - Implementation Plan

This document outlines the architecture and features required to build the comprehensive "Garden Management" system, integrating the **Gardener Dashboard** and **Garden Advisor** modules. 

## 1. Target Audience & Scope
- **Target Audience:** Home Kitchen Gardeners, hobbyists with potted plants (gamle), and professional gardeners.
- **Core Value:** Providing direct, continuous, and expert guidance for plant care, disease management, and correct dosing of fertilizers/medicines.

## 2. Kitchen Garden Profile & Setup
- **Onboarding Requirement:** Users must add a minimum of **5 items/plants** to initialize their Kitchen Garden profile.
- **Plant Details:** For each plant, the user will input:
  - Plant Name / Type
  - Variety / Species
  - Location (e.g., Balcony, Backyard, Pot)
  - Date planted
- **Media Uploads:** Users can upload continuous progress pictures of their plants for tracking.

## 3. Issue Reporting & Tracking
- **Problem Reporting:** A dedicated feature to report issues (e.g., yellowing leaves, pests).
- **Direct Link to Advisor:** When a problem is reported, it instantly alerts the subscribed Garden Advisor with all historical data (past pics, plant details).

## 4. Garden Advisor (Doctor/Guide) Integration
- **Automatic Suggestion Algorithm:** Once a user adds their initial 5 items, the system will automatically recommend Advisors whose expertise matches the planted items (e.g., Vegetable experts for Kitchen Gardens).
- **Routine Scheduling & To-Do Lists:** Advisors will create a recurring care calendar (e.g., watering schedules, monthly fertilizer). Gardeners will see this as a daily "To-Do List" in their app.
- **Seasonal Alerts:** Push notifications for weather changes (e.g., "Move pots indoors for winter").
- **Prescription System:** When a user reports an issue with a photo, the advisor can reply with a precise "Prescription" detailing the medicine name, dosage, and application method.
- **AI Garden Doctor (First Filter):** Users can optionally use the AI Camera to scan a disease before paying/messaging the human advisor, saving time for basic issues.
- **E-Commerce Integration:** Any medicine, pot, or seed recommended by the Advisor/AI will feature a direct "Buy Now" button linked to the platform's Shop, boosting sales.

## 5. Subscription & 3-Tier Pricing Model
The platform will operate on a hybrid SaaS + Marketplace 3-tier model:

### Tier 1: Free Plan (Platform Base)
- **Limits:** Maximum of 5 plants lifetime (active). 
- **AI Features:** Limited AI Scans and limited AI Chats (e.g., 10-20 queries per week).
- **Lifecycle:** When a plant dies or is harvested, its status is marked as "Lifecycle Complete".

### Tier 2: Basic Plan (Platform Premium)
- **Limits:** Unlimited plants can be added to the digital garden.
- **AI Features:** Unlimited AI Scans and Unlimited AI Chats.
- **Revenue:** Fixed monthly/yearly SaaS subscription fee directly to FarmsKing.

### Tier 3: Advisor Plan (Service Marketplace)
- **Pricing:** Advisors set their own customized fees. All advisor plans are listed in the marketplace.
- **Plant Adoption System:** Even if a user has "Unlimited" plants on the Basic plan, an Advisor will only "Adopt" and guide a specific number of plants (based on the advisor's allowed limit/tier).
- **Swap Requests:** If a gardener wants the advisor to guide a different plant from their garden, they must send a "Change Adopted Plant Request" to the advisor for approval.

## 6. Advanced Engagement Features (To Be Developed Later)
- **Harvest & Savings Tracker:** For Kitchen Gardens, users can log their harvested produce (e.g., "2 kg Tomatoes"). The app calculates the monetary savings based on local market rates.
- **Smart Weather Alerts:** Integration with local weather APIs to send predictive alerts (e.g., "Rain expected tomorrow, skip watering your balcony pots").
- **Community Showcase (Social Feed):** A gallery where gardeners can share photos of their blooming flowers or large vegetables, allowing others to like and comment.
- **Gamification & Badges:** Award digital badges (e.g., "Master Gardener", "Green Thumb") for maintaining healthy plants for extended periods.
- **Seed & Plant Exchange (Barter):** A hyper-local feature allowing users in the same city to swap extra seeds, saplings, or cuttings for free.
- **Pest & Disease Outbreak Radar:** An automated alert system that warns gardeners if a specific pest (e.g., Whitefly) is reported by multiple users in their city.
- **DIY Home Composting Guide:** A tracking system for kitchen waste compost bins, with direct guidance from advisors on making organic manure at home.
- **Kid's Corner (Family Gardening):** A gamified sub-profile for children with simple tasks (like watering) to earn digital stars, encouraging family participation.
- **Vacation Mode:** A feature that provides specific watering techniques before a user leaves for a trip, or alerts a neighbor.
- **Upcycling & DIY Planters:** AI and Advisor tips on converting household plastic waste (bottles, buckets) into beautiful pots.
- **100% Organic Certificate:** A digital, shareable certificate awarded to Kitchen Gardens that log no chemical pesticide usage for 6 months.
- **Garden Short Videos (Reels):** A dedicated feed where Advisors post 60-second educational videos, helping them market their paid plans organically.
- **Plant Adoption & Rescue Center:** A local marketplace to give away dying or unwanted plants for free so other gardeners can rescue them.
- **Garden Layout Planner:** AI or Advisor-generated layout maps showing exactly where to place pots in a balcony for optimal sunlight.
- **Indoor Microgreens & Sprouts:** A dedicated guide for users with zero outdoor space to grow fast-yielding greens on their kitchen counters.
- **Monthly Gardening Challenges:** Platform-wide photo contests (e.g., "Biggest Tomato of the Month") with rewards like free organic fertilizer.
- **Garden Scrapbook (Time-lapse):** Automatically stitch photos of a plant's growth over time into a shareable video or visual journal.
- **Companion Planting Guide:** Advisor recommendations on which plants to grow together to naturally repel pests and boost growth.
- **Eco & Water Savings Tracker:** Calculate and display the exact liters of water saved by following the advisor's precise watering schedule.
- **Pollinator Attractor Mode:** Guidance on planting specific flowers near vegetable patches to attract bees/butterflies for better pollination.
- **Ready-to-Grow Seasonal Kits:** Curated e-commerce kits (e.g., "Winter Veggie Kit") that automatically add the correct items and an advisor to the user's profile upon purchase.
- **Subscription Freeze/Pause:** Allow users to pause their advisor subscription during non-gardening months (e.g., peak summer) and resume it later.
- **Weed vs Plant AI Checker:** Specialized AI tool to help beginners identify and remove weeds growing alongside their main plants in pots.
- **Advisor Rating & Review System:** When an advisor's subscription plan expires, the user is prompted to provide a 5-star rating and written review, which builds a public reputation score for the advisor.
- **Drag-and-Drop Garden Grid Planner:** An interactive tool to physically map out where seeds/pots are placed and calculate required spacing.
- **Offline Accessibility:** Ensure core features (like the daily To-Do checklist) work seamlessly in gardens/rooftops without internet connectivity.
- **B2B Nursery Integration:** Partner with local nurseries to display targeted ads or direct purchase links for plants/supplies, earning affiliate commissions.
- **Smart Frost / Heatwave Auto-Reminders:** Emergency push notifications prompting users to cover or move plants during extreme weather events.

## 7. Platform Monetization (Direct FarmsKing Revenue)
- **Advisor Certification Course:** Before anyone can become a paid Garden Advisor on the platform, they must pass an online "FarmsKing Certified Expert" course. FarmsKing charges a one-time certification fee (e.g., ₹999), generating upfront B2B revenue while ensuring quality control.
- **FarmsKing Seller Products (Marketplace Integration):** Advisors can prescribe/recommend medicines, pots, and seeds directly from the inventory of verified Sellers on the FarmsKing platform. When the gardener purchases through that direct link, FarmsKing earns its standard marketplace commission from the seller.
- **Corporate "Green" Tie-ups:** Bulk packages sold to IT companies to gift their employees a desk plant and a 3-month FarmsKing advisory subscription.
- **Data Monetization & Targeted Ads:** Aggregate user crop data (e.g., "5000 users growing tomatoes in Delhi") to sell highly targeted advertising spots to major fertilizer/seed brands.
- **Premium Done-For-You Setup:** FarmsKing sends a physical team to the user's house to completely set up their balcony garden for a high premium fee.
- **Plant Replacement Insurance:** Users pay a small premium (e.g., ₹200) when buying a costly plant from the app. If it dies within 3 months, FarmsKing replaces it for free.
- **Soil Health Testing Kit:** Selling DIY soil testing kits. Users enter the color results in the app, which then suggests specific FarmsKing fertilizers to fix the soil.

## 8. Required UI/UX Updates
- **Terminology:** Ensure all references strictly use "Gardener", "Garden", "Kitchen Garden", and "Garden Advisor". Remove any legacy terms like "Farmer" or "Crop" from this module.
- **New Screens to Build:**
  1. `Kitchen Garden Setup Wizard` (to mandate the 5-plant minimum).
  2. `Plant Detail & Media Gallery` (for picture uploads).
  3. `Report a Problem` (ticket system linked to the advisor).
  4. `Advisor Subscription Marketplace` (to choose 6-month, yearly, or per-plant plans).
