import { memo } from 'react';
import { useForm } from 'react-hook-form';

const AddressForm = memo(({ address, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: address || {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      type: 'Home',
      isDefault: false
    }
  });

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          id="fullName"
          type="text"
          {...register('fullName', { required: 'Full name is required' })}
          className={`w-full px-3 py-2 border ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          id="phone"
          type="tel"
          {...register('phone', {
            required: 'Phone number is required',
            pattern: {
              value: /^[0-9]{10}$/,
              message: 'Must be 10 digits'
            }
          })}
          className={`w-full px-3 py-2 border ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
          placeholder="9876543210"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 *
        </label>
        <input
          id="addressLine1"
          type="text"
          {...register('addressLine1', { required: 'Address is required' })}
          className={`w-full px-3 py-2 border ${
            errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
          placeholder="House No., Building Name"
        />
        {errors.addressLine1 && (
          <p className="mt-1 text-sm text-red-600">{errors.addressLine1.message}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div>
        <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2 (Optional)
        </label>
        <input
          id="addressLine2"
          type="text"
          {...register('addressLine2')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Road Name, Area, Colony"
        />
      </div>

      {/* City and State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            id="city"
            type="text"
            {...register('city', { required: 'City is required' })}
            className={`w-full px-3 py-2 border ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
            placeholder="Mumbai"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            id="state"
            type="text"
            {...register('state', { required: 'State is required' })}
            className={`w-full px-3 py-2 border ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
            placeholder="Maharashtra"
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
          )}
        </div>
      </div>

      {/* ZIP Code and Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
            PIN Code *
          </label>
          <input
            id="zipCode"
            type="text"
            {...register('zipCode', {
              required: 'PIN code is required',
              pattern: {
                value: /^[0-9]{6}$/,
                message: 'Must be 6 digits'
              }
            })}
            className={`w-full px-3 py-2 border ${
              errors.zipCode ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
            placeholder="400001"
          />
          {errors.zipCode && (
            <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <input
            id="country"
            type="text"
            {...register('country', { required: 'Country is required' })}
            className={`w-full px-3 py-2 border ${
              errors.country ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
            placeholder="India"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
          )}
        </div>
      </div>

      {/* Address Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address Type
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="Home"
              {...register('type')}
              className="mr-2 text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm">Home</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="Work"
              {...register('type')}
              className="mr-2 text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm">Work</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="Other"
              {...register('type')}
              className="mr-2 text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm">Other</span>
          </label>
        </div>
      </div>

      {/* Make Default */}
      <div className="flex items-center">
        <input
          id="isDefault"
          type="checkbox"
          {...register('isDefault')}
          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
        />
        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
          Make this my default address
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition font-medium"
        >
          Save Address
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
});

AddressForm.displayName = 'AddressForm';

export default AddressForm;
