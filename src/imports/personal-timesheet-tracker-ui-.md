Design a modern desktop UI for a Windows productivity application called Personal Timesheet Tracker.

The app is a standalone offline desktop application for tracking daily working hours and tasks.

The UI should feel like a modern productivity dashboard similar to Notion, Linear, Raycast, or a clean developer tool, not a plain form-based interface.

The design should avoid monotone layouts and plain grey tables. Use:

vibrant but professional color accents

soft gradients

subtle textures

rounded card layouts

smooth charts

modern typography

The UI must support light mode and dark mode.

Main Layout

Create a desktop layout with three main sections:

Left Sidebar Navigation
Top Header Bar
Main Dashboard Area

Sidebar Navigation

Vertical sidebar with icons and labels.

Sections:

Dashboard
Tasks
Weekly Analytics
Reports
Settings

Sidebar should have:

hover highlight

active selection indicator

subtle background gradient

clean modern icons

Header Bar

Top header should contain:

Application Title
Current Date
Daily Goal indicator
Export PDF button
Dark/Light mode toggle

Dashboard Screen

The dashboard should contain multiple modern card components.

Cards should use:

soft shadows

colorful accents

smooth rounded edges

Card 1: Daily Goal & Progress

Allow user to set daily goal hours.

Example:

Daily Goal: 8 Hours

Display:

Worked Hours
Remaining Hours

Use animated progress circle.

Color logic:

Green → goal reached
Yellow → 50–80% progress
Red → below 50%

Add edit icon to update daily goal.

Card 2: Today's Tasks

Display today's tasks in a card-style table.

Columns:

Task Name
Expected Time
Actual Time
Status
Notes

Important UI improvements:

• Replace "Actions" column with Status column

Status values:

Complete
Incomplete

Completed tasks should:

have a soft green highlight

show a check icon

Task Completion Logic

When actual hours reach 80% or more of expected hours, automatically mark task as Completed.

Color example:

Green highlight → completed
Neutral color → incomplete

Add Task Interaction

Remove "Add Task" tab.

Instead:

When user clicks Add Task button on dashboard → open a popup task creation window.

Add Task Window

Modern modal window with clean form design.

Fields:

Task Name
Estimated Hours (rename from expected hours)
Actual Hours Worked (rename from actual hours)
Notes
Date
Category

Date Field UI

Date selector should appear as a stylish button-like component.

Example:

Rounded date badge

"Today"
"12 May 2026"

Use a calendar popup when clicked.

Hours Input Formatting

Hours should display naturally:

Examples:

1 → "1 hour"
1.5 → "1 hour 30 minutes"
2 → "2 hours"

Do not show 1.00 format.

Category Field

Category should support:

Autocomplete
Database storage

Behavior:

If user adds new category → store in database.

Next time user adds task → suggest previously used categories.

Autofill Behavior

For fields like:

Estimated Hours
Actual Hours Worked
Category

If user clicks the field:

Autofilled placeholder text should clear automatically.

Do not leave placeholder text when typing begins.

Weekly Analytics Screen

Create a visually rich analytics dashboard.

Include:

Weekly hours bar chart
Weekly average
Total hours worked

Charts should be:

smooth
colorful
animated

Use gradient bars.

Example:

Mon | ██████ 6h
Tue | ████████ 8h
Wed | █████ 5h
Thu | ███████ 7h
Fri | ██████ 6h

Visual Style Improvements

The UI currently feels plain.

Improve using:

soft gradients
color accents
card shadows
micro animations
iconography

Make the app visually enjoyable.

Weekly Report Export UI

Create a Reports tab where users can export weekly reports.

Add button:

Export Weekly Report

PDF Layout Design

Design a professional PDF layout preview.

Sections:

Title

Personal Work Timesheet Report
Week: 12 May – 18 May

Summary

Total Hours
Target Hours
Weekly Average

Task Table

Task | Hours | Notes

Charts

Weekly hours bar chart

Work Distribution Diagram

Example:

Work Hours Distribution

API Development → 3h
Bug Fixing → 2h
Testing → 1h

Ensure the distribution chart is readable and not compressed.

The visualization should have proper spacing and scaling.

UI Fixes From Feedback

Ensure:

Task table labels align properly
Notes column visible
Status clearly displayed
Card padding consistent
Spacing clean

Design System

Use:

Modern font such as Inter or SF Pro
Soft rounded UI elements
Consistent spacing system

Create reusable components:

Stat Card
Task Row
Progress Circle
Charts
Modal Form
Buttons

Interaction Details

Add subtle micro-interactions:

Hover elevation on cards
Smooth chart animations
Button hover effects
Progress bar animation

Keep interactions subtle but modern.

Final Goal

The UI should feel like a modern productivity dashboard, not a simple time tracker.

It should be:

clean
engaging
visually polished
easy to use daily