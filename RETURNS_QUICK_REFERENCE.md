# Returns Management - Quick Reference

## Overview
Complete Returns Management system integrated into user webapp with create, view, track, and cancel functionality.

## Key Files

### 1. Main Returns Page
**Path:** `/Users/yaswanthgandhi/Documents/validatesharing/user-webapp/src/pages/Returns.jsx`
- Complete returns management interface
- Create, view, filter, and cancel returns
- 700+ lines of fully functional React code

### 2. Return API
**Path:** `/Users/yaswanthgandhi/Documents/validatesharing/user-webapp/src/api/returnApi.js`
- Dedicated API functions for returns
- Already integrated in `/api/index.js` as `returnApi`

### 3. Updated Files
- **App.jsx** - Added `/returns` route
- **Profile.jsx** - Added Returns tab with preview

## Quick Start

### Access Returns Page
```
Navigate to: /returns (Protected route)
Or: Profile → Returns tab
```

### Create Return Request
```javascript
// User selects:
1. Delivered order
2. Items to return
3. Return type (Refund/Exchange)
4. Reason for return
5. Optional description

// Submit → Creates return request
```

### View Returns
```
- All Returns (default)
- Filter by: Pending, In Progress, Completed, Cancelled
- Click return card to view details
```

## API Usage

### Import
```javascript
import { returnApi } from '../api';
// or
import { getMyReturns, createReturnRequest } from '../api/returnApi';
```

### Get User Returns
```javascript
const response = await returnApi.getUserReturns({ skipCache: true });
const returns = response.data.returns || response.data || [];
```

### Create Return
```javascript
const returnData = {
  order: orderId,
  items: [
    { product: productId, name: 'Product', quantity: 1, price: 100 }
  ],
  type: 'refund', // or 'exchange'
  reason: 'defective',
  description: 'Optional details'
};

const response = await returnApi.createReturnRequest(returnData);
```

### Cancel Return
```javascript
const response = await returnApi.cancelReturnRequest(returnId, 'User reason');
```

## Status Values

| Status | Description | Color |
|--------|-------------|-------|
| pending | Awaiting approval | Yellow |
| approved | Return approved | Green |
| rejected | Return rejected | Red |
| picked_up | Item picked up | Blue |
| received | Item received | Purple |
| inspected | Item inspected | Indigo |
| refund_initiated | Refund started | Cyan |
| refund_completed | Refund done | Green |
| exchange_initiated | Exchange started | Orange |
| exchange_completed | Exchange done | Green |
| cancelled | User cancelled | Gray |

## Return Reasons

```javascript
const reasons = [
  'defective',          // Defective Product
  'wrong_item',         // Wrong Item Received
  'not_as_described',   // Not as Described
  'size_issue',         // Size Issue
  'quality_issue',      // Quality Issue
  'changed_mind',       // Changed Mind
  'other'              // Other
];
```

## Color Theme

### Primary Colors
```css
Pink-600: #ec4899  /* Buttons, links, highlights */
Pink-700: #db2777  /* Hover states */
Pink-50:  #fdf2f8  /* Light backgrounds */
```

### Status Colors
```css
/* Pending */
bg-yellow-100 text-yellow-800 border-yellow-200

/* Approved/Completed */
bg-green-100 text-green-800 border-green-200

/* Rejected/Error */
bg-red-100 text-red-800 border-red-200

/* Processing */
bg-blue-100 text-blue-800 border-blue-200
bg-purple-100 text-purple-800 border-purple-200

/* Cancelled */
bg-gray-100 text-gray-800 border-gray-200
```

## Component Structure

```jsx
<Returns>
  {/* Header */}
  <div>
    <h1>Returns & Exchanges</h1>
    <button>New Return Request</button>
  </div>

  {/* Filter Tabs */}
  <div className="flex gap-2 border-b">
    <button className={activeTab === 'all' ? 'border-pink-600' : ''}>
      All Returns
    </button>
    {/* More tabs... */}
  </div>

  {/* Returns List */}
  {returns.map(returnItem => (
    <div key={returnItem._id} className="bg-white rounded-lg">
      {/* Return card content */}
    </div>
  ))}

  {/* Create Return Modal */}
  {showCreateModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50">
      <form onSubmit={handleCreateReturn}>
        {/* Form fields */}
      </form>
    </div>
  )}

  {/* Return Details Modal */}
  {selectedReturn && (
    <div className="fixed inset-0 bg-black bg-opacity-50">
      {/* Return details */}
    </div>
  )}
</Returns>
```

## Profile Integration

### Returns Tab
```jsx
// In Profile.jsx
const menuItems = [
  // ...
  {
    id: 'returns',
    label: 'Returns',
    icon: <svg>...</svg>
  }
];

// Returns section
case 'returns':
  return (
    <div>
      {/* Show recent 5 returns */}
      {/* Link to /returns for all */}
    </div>
  );
```

## Utility Functions

### Format Currency
```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};
```

### Format Date
```javascript
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
```

### Get Status Color
```javascript
const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    // ...
  };
  return colors[status] || colors.cancelled;
};
```

## Common Patterns

### Loading State
```jsx
{loading ? (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
    <p className="text-gray-600">Loading returns...</p>
  </div>
) : (
  // Content
)}
```

### Empty State
```jsx
{returns.length === 0 ? (
  <div className="text-center p-12">
    <svg className="w-20 h-20 text-gray-400 mx-auto mb-4">...</svg>
    <h3 className="text-lg font-semibold text-gray-900">No Returns Yet</h3>
    <p className="text-gray-600">You haven't created any return requests</p>
    <button className="mt-6 px-6 py-3 bg-pink-600 text-white rounded-lg">
      Create Return Request
    </button>
  </div>
) : (
  // Returns list
)}
```

### Status Badge
```jsx
<span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
  {status.replace(/_/g, ' ').toUpperCase()}
</span>
```

### Modal
```jsx
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
      {/* Modal content */}
    </div>
  </div>
)}
```

## Error Handling

### API Calls
```javascript
try {
  const response = await returnApi.createReturnRequest(data);
  if (response.success) {
    toast.success('Return request created successfully!');
    fetchReturns();
  }
} catch (error) {
  console.error('Error creating return:', error);
  const errorMessage = error.response?.data?.message || 'Failed to create return';
  toast.error(errorMessage);
}
```

### Form Validation
```javascript
if (!formData.orderId) {
  toast.error('Please select an order');
  return;
}

if (formData.items.length === 0) {
  toast.error('Please select at least one item');
  return;
}

if (!formData.reason) {
  toast.error('Please provide a reason for return');
  return;
}
```

## Testing Commands

```bash
# Start dev server
cd /Users/yaswanthgandhi/Documents/validatesharing/user-webapp
npm run dev

# Navigate to
# http://localhost:5173/returns
# or
# http://localhost:5173/profile (Returns tab)
```

## Backend Requirements

Ensure these endpoints are available:
- `GET /returns` - Get user returns
- `POST /returns` - Create return
- `GET /returns/:id` - Get return details
- `POST /returns/:id/cancel` - Cancel return
- `GET /returns/check-eligibility/:orderId` - Check eligibility
- `GET /orders` - Get user orders (for selection)

## Troubleshooting

### Returns not showing
- Check if user is authenticated
- Verify backend API is running
- Check network tab for API errors
- Ensure returns data structure matches expected format

### Cannot create return
- Verify user has delivered orders
- Check form validation errors
- Verify all required fields are filled
- Check backend API response

### Status badges wrong color
- Verify status value matches expected format
- Check `getStatusColor()` function
- Ensure Tailwind classes are correct

## Documentation

Full documentation available at:
- `/Users/yaswanthgandhi/Documents/validatesharing/user-webapp/RETURNS_INTEGRATION_GUIDE.md`
- `/Users/yaswanthgandhi/Documents/validatesharing/user-webapp/RETURNS_IMPLEMENTATION_SUMMARY.md`

## Support

For issues:
1. Check browser console for errors
2. Verify API responses in Network tab
3. Test with different user accounts
4. Review backend logs
5. Check documentation files

---

**Last Updated:** January 19, 2026
**Version:** 1.0.0
**Status:** Production Ready
