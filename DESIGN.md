# WU-InternShip — Internship & Cooperative Education Design System

## Overview
WU-InternShip is a design system for university internship and cooperative education coordination platforms. The aesthetic is modern, professional, yet approachable — a confident deep violet anchors the institutional brand and workflows, while a warm gold-to-orange scale signals active applications, milestones, deadlines, and highlights. Surfaces are clean and breathable on a white background; corners are smoothly rounded; information density is balanced to serve three user groups simultaneously: students tracking applications and daily logs, university advisors evaluating progress, and company mentors reviewing intern performance. The system balances academic rigor with modern SaaS usability, avoiding both bureaucratic clutter and informal playfulness.

## Colors
- **Primary / Violet Deep** (#3D348B): Primary brand color — main CTAs, active navigation, key milestones, headers
- **Violet Bright** (#7678ED): Hover states, interactive highlights, secondary accents, links
- **Accent / Gold** (#F7B801): Secondary brand & highlights — badges, active markers, featured items
- **Accent / Orange** (#F18701): Pending status, application deadlines, warnings
- **Accent / Deep Orange** (#F35B04): Urgent alerts, critical warnings, approaching-deadline indicators
- **Background** (#FFFFFF): Main page background, cards, modals, and all surfaces
- **Text / Black** (#000000): Primary typography on white and light backgrounds
- **Text / White** (#FFFFFF): Typography on violet or orange fills (buttons, badges, headers)

## Typography
- **Display**: Inter (fallback Prompt, sans-serif) — headlines, dashboard summaries, metrics
- **Body Sans**: Inter (fallback Sarabun, sans-serif) — general UI, tables, document review text
- **Mono**: JetBrains Mono — student IDs, application reference codes, dates, timestamps

Type scale: Hero 40/48 (bold 700), H1 32/40 (bold 700), H2 24/32 (semi-bold 600), H3 20/28 (semi-bold 600), Body Large 16/24 (medium 500), Body 14/20 (regular 400), Small 12/16 (regular 400), Metric Number 36/40 (bold 700 tabular mono).

All type is set in black (#000000) on white/light surfaces, and white (#FFFFFF) on violet or orange fills.

## Elevation
WU-InternShip uses clean, subtle elevation tailored for data-dense coordination systems, all on a white base:
- Cards: 1px violet-bright border (#7678ED), lifts on hover with shadow (0 4px 12px rgba(61, 52, 139, 0.10)).
- Active/Selected Cards: 2px violet-deep border (#3D348B) with a soft tinted glow (0 8px 24px rgba(61, 52, 139, 0.15)).
- Modals & Drawers: white surface, 0 20px 40px rgba(0, 0, 0, 0.15) with backdrop wash blur (4px).
- Border Radius: 6px for small tags/inputs, 10px for standard buttons/cards, 16px for modals and large containers, 999px for status badges and avatar chips.

## Components
- **Application Status Card**: Dashboard widget displaying student application status. White background, 10px radius, 1px violet-bright border, company logo/icon at top-left, role title in H3 (black), deadline countdown badge (gold fill #F7B801 with black text), and progress indicator in violet-deep.
- **Primary Action Button**: Minimum height 44px, 10px radius, violet-deep fill (#3D348B) with white text, font weight 600. Hover transitions to violet-bright (#7678ED) with subtle 120ms ease. Active scales to 0.98.
- **Secondary Action Button**: Outlined button with 1px violet-bright border (#7678ED), white background, black text. Hover applies a light violet-bright tint background.
- **Status Badge (Pills)**: 999px radius, 12px font size, semi-bold text:
  - Pending / Under Review: Orange fill (#F18701), white text, clock icon.
  - Approved / Matched: Violet-deep fill (#3D348B), white text, check icon.
  - Action Required / Rejected: Deep orange fill (#F35B04), white text, alert icon.
  - Draft: White background, 1px violet-bright border, black text.
- **Data Table / Application Grid**: White rows on white background, sticky header with 1px violet-bright divider, row hover highlights with a light violet-bright tint.
- **Document Upload Dropzone**: White surface with 2px dashed violet-bright outline border. Drag-over state shifts border to violet-deep (#3D348B) with a light violet tint background.
- **Weekly Log Submission Tile**: White card showing week number, status badge, submission timestamp, and advisor sign-off checkbox. Missing submission alerts render with a gold (#F7B801) fill.
- **Filter & Search Bar**: Integrated search input with 1px violet-bright border, 8px radius, accompanied by multi-select dropdown pills for academic term, company name, and approval status.

## Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 40, 48, 64px
- Container max-width: 1440px with 32px horizontal padding (desktop)
- Table row height: 52px (standard density), 64px (comfortable density with avatars/roles)
- Card grid gap: 20px desktop, 16px tablet/mobile
- Section spacing: 32px between dashboard modules

## Motion
Subtle and utility-driven:
- Transitions: 150ms–200ms cubic-bezier(0.4, 0, 0.2, 1) for button states and dropdown menus.
- Status Updates: Progress bar fills animate smoothly over 300ms ease-out.
- Modals: Fade-in and slight slide-up (8px to 0) over 200ms.

## Iconography
Clean stroke icons (2px stroke weight, 20px default size):
- Navigation: Dashboard, Document/Application, Building/Company, Academic Cap, Users, Settings.
- System Actions: Upload, Download, Filter, Search, Check, Close, Warning Triangle.
- Active menu icons use Violet Deep (#3D348B); warning and pending icons use Orange (#F18701) or Deep Orange (#F35B04).

## Voice and Tone
- Professional, concise, and guiding.
- Action-oriented labels: "ยื่นใบสมัคร", "ส่งบันทึกประจำสัปดาห์", "อนุมัติผลการประเมิน" (Submit Application, Send Weekly Log, Approve Evaluation).
- Clear system feedback: ระบุเหตุผลให้ชัดเจนเมื่อเอกสารไม่ผ่าน เช่น "กรุณาแนบเอกสารยินยอมจากผู้ปกครองเพิ่มเติม" แทนการแจ้งข้อผิดพลาดแบบคลุมเครือ
