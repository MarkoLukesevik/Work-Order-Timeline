Work Order Schedule Timeline

An interactive manufacturing ERP timeline component built with Angular. This application allows users to visualize, create, and manage work orders across multiple work centers with a dynamic timescale.

🚀 Key Features
 - Dynamic Zooming: Seamlessly switch between Day, Week, and Month views.
 - Infinite Scroll: Automatically prepends and appends dates as you scroll, allowing for an endless timeline experience.
 - Overlap Detection: Real-time validation prevents scheduling two work orders in the same work center simultaneously.
 - Responsive Coordinate System: Uses percentage-based positioning to ensure work order bars align perfectly across all screen sizes.
 - Persistence: Integrated with localStorage to keep your schedule intact after a refresh.

🛠 Tech Stack
 - Framework: Angular 21 (Standalone Components)
 - State Management: Angular Signals (for reactive, granular updates)
 - Styling: SCSS (Modular architecture with CSS Variables for theming)
 - Form Handling: Reactive Forms with custom Cross-Field Validators
 - UI Components: ng-select and @ng-bootstrap/ng-bootstrap (Datepicker)

🧠 Technical Approach & Decisions
  1. Performance Optimization (NgZone)
     To ensure the timeline remains butter-smooth during scrolling, the scroll listener is attached outside of Angular's Zone. This prevents the framework from triggering change detection on every pixel scrolled, only re-entering the zone when a threshold is met to load more dates.
  2. The Coordinate Engine
     Instead of mapping dates directly to static pixels, the system calculates positions based on a relative percentage of the visible range. This ensures that the UI remains perfectly responsive if the container width changes.
  3. Custom Modal Infrastructure
     Instead of using standard *ngIf modals, I implemented a ModalService using Angular’s createComponent API. This decouples the UI logic from the DOM structure, allowing for programmatic "slide-out" panels that support focus-trapping and keyboard navigation.
  4. Overlap Algorithm
     Conflict detection is handled in the WorkOrderService using interval comparison logic:
     StartsBeforeExistingEnds && EndsAfterExistingStarts.
     The check is performed during form validation to provide instant feedback to the user.

🏃‍♂️ Getting Started
  Clone the repository
  
  Install dependencies:
  npm install

  Run the application:
  ng serve
  Open your browser: Navigate to http://localhost:4200

📁 Project Structure
 - src/app/components: Presentational and container components (Timeline, Bar, Panel).
 - src/app/services: Business logic (WorkOrder management and Timeline utilities).
 - src/app/models & src/app/enums: Strongly typed interfaces and status definitions.
 - src/app/base-components: Reusable UI patterns like the Base Modal.

📹 Demo Video
