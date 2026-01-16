import { memo } from 'react';

const AddressCard = memo(({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  showActions = true
}) => {
  return (
    <div
      className={`relative bg-white rounded-lg border-2 p-4 transition ${
        isSelected
          ? 'border-pink-600 bg-pink-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Selection Radio/Checkbox */}
      {onSelect && (
        <div className="absolute top-4 right-4">
          <input
            type="radio"
            checked={isSelected}
            onChange={() => onSelect(address._id)}
            className="w-4 h-4 text-pink-600 focus:ring-pink-500"
          />
        </div>
      )}

      {/* Address Content */}
      <div className={onSelect ? 'pr-8' : ''}>
        {/* Name and Type Badge */}
        <div className="flex items-center space-x-2 mb-2">
          <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
          {address.isDefault && (
            <span className="bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full font-medium">
              Default
            </span>
          )}
          {address.type && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {address.type}
            </span>
          )}
        </div>

        {/* Phone */}
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Phone:</span> {address.phone}
        </p>

        {/* Address Lines */}
        <p className="text-sm text-gray-700 mb-1">
          {address.addressLine1}
        </p>
        {address.addressLine2 && (
          <p className="text-sm text-gray-700 mb-1">
            {address.addressLine2}
          </p>
        )}

        {/* City, State, ZIP */}
        <p className="text-sm text-gray-700">
          {address.city}, {address.state} - {address.zipCode}
        </p>
        {address.country && (
          <p className="text-sm text-gray-700">
            {address.country}
          </p>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200">
            {onEdit && (
              <button
                onClick={() => onEdit(address)}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                Edit
              </button>
            )}
            {onDelete && !address.isDefault && (
              <button
                onClick={() => onDelete(address._id)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

AddressCard.displayName = 'AddressCard';

export default AddressCard;
