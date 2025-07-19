# Kanban Board Setup Instructions

## Required Package Installation

To enable the drag and drop functionality for the Kanban board, you need to install the following package:

```bash
npm install @hello-pangea/dnd
```

This package provides the drag and drop functionality used in the Kanban board components.

## Alternative Implementation (No External Dependencies)

If you prefer not to install external packages, you can implement a simpler version using HTML5 drag and drop API. Here's how to modify the components:

### 1. Update KanbanBoard component to use HTML5 drag and drop
### 2. Update KanbanCard component to use native drag events
### 3. Update KanbanColumn component to handle drop events

The current implementation uses @hello-pangea/dnd for better user experience and touch support, but the native HTML5 API can work as an alternative.

## Features Included

- ✅ Project selection dropdown
- ✅ Kanban board with 4 columns (To Do, In Progress, Review, Completed)
- ✅ Drag and drop task cards between columns
- ✅ Real-time status updates to Google Sheets
- ✅ Task card details (priority, assignee, due date, hours, amount)
- ✅ Progress indicators
- ✅ Activity logging for status changes
- ✅ Responsive design
- ✅ Loading states and error handling

## Usage

1. Navigate to `/kanban` page
2. Select a project from the dropdown
3. View all tasks for that project in Kanban columns
4. Drag and drop tasks between columns to change their status
5. Changes are automatically saved to Google Sheets
6. Activity is logged for audit trail