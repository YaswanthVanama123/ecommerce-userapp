import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const OrderTimeline = ({ orderId, compact = false }) => {
  const [timeline, setTimeline] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('milestones'); // 'milestones' or 'detailed'
  const [filter, setFilter] = useState('all'); // 'all', 'important', 'status', 'payment', 'shipment'

  useEffect(() => {
    if (orderId) {
      fetchTimeline();
      fetchMilestones();
    }
  }, [orderId]);

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/timeline`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTimeline(data.data.timeline);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/timeline/milestones`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMilestones(data.data.milestones);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType, type) => {
    const icons = {
      status_change: '🔄',
      payment: '💳',
      shipment: '📦',
      modification: '✏️',
      cancellation: '❌',
      return: '↩️',
      refund: '💰',
      note: '📝',
      CheckCircle: '✓',
      ThumbsUp: '👍',
      Package: '📦',
      Truck: '🚚',
      Home: '🏠',
      XCircle: '✖'
    };
    return icons[eventType || type] || '📌';
  };

  const getEventColor = (eventType, severity, color) => {
    if (color) {
      const colors = {
        green: 'bg-green-100 text-green-800 border-green-300',
        blue: 'bg-blue-100 text-blue-800 border-blue-300',
        yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        purple: 'bg-purple-100 text-purple-800 border-purple-300',
        red: 'bg-red-100 text-red-800 border-red-300'
      };
      return colors[color] || 'bg-gray-100 text-gray-800 border-gray-300';
    }

    if (severity === 'error' || severity === 'critical') {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (severity === 'warning') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    if (eventType === 'payment' || eventType === 'refund') {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (eventType === 'shipment') {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    if (eventType === 'cancellation') {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActorName = (actor) => {
    if (!actor) return 'System';
    return actor.name || actor.email || actor.type || 'Unknown';
  };

  const filteredTimeline = timeline.filter(group => {
    if (filter === 'all') return true;
    const event = group.primaryEvent;
    if (filter === 'important') return event.isImportant;
    if (filter === 'status') return event.eventType === 'status_change';
    if (filter === 'payment') return event.eventType === 'payment' || event.eventType === 'refund';
    if (filter === 'shipment') return event.type === 'shipping_event' || event.eventType === 'shipment';
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Mobile: Horizontal Timeline
  if (window.innerWidth < 768 && !compact) {
    return (
      <div className="py-6">
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setView('milestones')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              view === 'milestones'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setView('detailed')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              view === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Detailed View
          </button>
        </div>

        {view === 'milestones' ? (
          <div className="overflow-x-auto">
            <div className="flex space-x-4 pb-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.key} className="flex flex-col items-center min-w-[120px]">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 ${
                      milestone.status === 'completed'
                        ? 'bg-green-500 border-green-600 text-white'
                        : milestone.status === 'pending'
                        ? 'bg-gray-200 border-gray-300 text-gray-500'
                        : 'bg-red-100 border-red-300 text-red-500'
                    } transition-all duration-300`}
                  >
                    {getEventIcon(milestone.icon)}
                  </div>
                  {index < milestones.length - 1 && (
                    <div
                      className={`h-1 w-20 mt-2 ${
                        milestone.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                  <p className="text-sm font-semibold text-center mt-3">{milestone.label}</p>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {milestone.timestamp
                      ? formatTimestamp(milestone.timestamp)
                      : formatTimestamp(milestone.estimatedTimestamp)}
                  </p>
                  <p className="text-xs text-gray-600 text-center mt-1 px-2">
                    {milestone.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTimeline.map((group, index) => {
              const event = group.primaryEvent;
              return (
                <div key={index} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getEventIcon(event.eventType, event.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">
                          {event.status || event.action || event.description}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      {event.note && (
                        <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                      )}
                      {event.actor && (
                        <p className="text-xs text-gray-500 mt-2">
                          By {getActorName(event.actor)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Vertical Timeline
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setView('milestones')}
            className={`px-4 py-2 rounded-lg ${
              view === 'milestones'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setView('detailed')}
            className={`px-4 py-2 rounded-lg ${
              view === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Detailed Timeline
          </button>
        </div>

        {view === 'detailed' && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Events</option>
            <option value="important">Important Only</option>
            <option value="status">Status Changes</option>
            <option value="payment">Payment Events</option>
            <option value="shipment">Shipping Updates</option>
          </select>
        )}
      </div>

      {view === 'milestones' ? (
        <div className="relative">
          {milestones.map((milestone, index) => (
            <div key={milestone.key} className="flex items-start mb-8 group">
              <div className="flex flex-col items-center mr-6">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 ${
                    milestone.status === 'completed'
                      ? 'bg-green-500 border-green-600 text-white shadow-lg'
                      : milestone.status === 'pending'
                      ? 'bg-gray-200 border-gray-300 text-gray-500'
                      : 'bg-red-100 border-red-300 text-red-500'
                  } transition-all duration-300 group-hover:scale-110`}
                >
                  {getEventIcon(milestone.icon)}
                </div>
                {index < milestones.length - 1 && (
                  <div
                    className={`w-1 h-24 mt-2 ${
                      milestone.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    } transition-all duration-300`}
                  />
                )}
              </div>
              <div className="flex-1 bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 group-hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{milestone.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    {milestone.trackingNumber && (
                      <p className="text-sm text-blue-600 mt-2 font-mono">
                        {milestone.trackingNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {milestone.timestamp ? (
                      <>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(milestone.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(milestone.timestamp).toLocaleTimeString()}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-500">Expected</p>
                        <p className="text-xs text-gray-500">
                          {new Date(milestone.estimatedTimestamp).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
          {filteredTimeline.map((group, groupIndex) => {
            const event = group.primaryEvent;
            return (
              <div key={groupIndex} className="relative mb-6">
                <div className="flex items-start">
                  <div className="flex flex-col items-center mr-4 relative z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-4 ${getEventColor(
                        event.eventType,
                        event.severity,
                        event.color
                      )} bg-white shadow`}
                    >
                      {getEventIcon(event.eventType, event.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div
                      className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                        event.isImportant ? 'border-yellow-500' : 'border-gray-300'
                      } hover:shadow-lg transition-shadow`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {event.status || event.action || event.description}
                          </h4>
                          {event.actor && (
                            <p className="text-sm text-gray-500 mt-1">
                              by {getActorName(event.actor)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(event.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {event.note && (
                        <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded">
                          {event.note}
                        </p>
                      )}

                      {event.location && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">Location:</span> {event.location}
                        </p>
                      )}

                      {event.metadata && event.metadata.transactionId && (
                        <p className="text-xs text-gray-500 font-mono mt-2">
                          Transaction: {event.metadata.transactionId}
                        </p>
                      )}

                      {group.relatedEvents && group.relatedEvents.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                            {group.relatedEvents.length} related event
                            {group.relatedEvents.length > 1 ? 's' : ''}
                          </summary>
                          <div className="mt-2 ml-4 space-y-2">
                            {group.relatedEvents.map((relatedEvent, idx) => (
                              <div
                                key={idx}
                                className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
                              >
                                {relatedEvent.description || relatedEvent.note}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {event.timeSincePrevious && (
                        <p className="text-xs text-gray-400 mt-3">
                          {Math.floor(event.timeSincePrevious / 60000)} minutes after previous event
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

OrderTimeline.propTypes = {
  orderId: PropTypes.string.isRequired,
  compact: PropTypes.bool
};

export default OrderTimeline;
