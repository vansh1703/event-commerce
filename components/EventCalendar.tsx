"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  event_type: string;
  location: string;
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
  helpers_needed: number;
  payment: string;
};

type Props = {
  jobs: Job[];
};

export default function EventCalendar({ jobs }: Props) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const getEventsForDate = (dateString: string) => {
    return jobs.filter(job => {
      const eventStart = new Date(job.event_start_date);
      eventStart.setHours(0, 0, 0, 0);
      const eventEnd = new Date(job.event_end_date);
      eventEnd.setHours(0, 0, 0, 0);
      const checkDate = new Date(dateString);
      checkDate.setHours(0, 0, 0, 0);

      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 md:p-4" />);
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
      const dateString = formatDate(year, month, day);
      const eventsOnDay = getEventsForDate(dateString);
      const dateObj = new Date(year, month, day);
      dateObj.setHours(0, 0, 0, 0);
      const isToday = dateObj.getTime() === today.getTime();
      const isPast = dateObj < today;

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(dateString)}
          className={`relative p-2 md:p-4 border border-gray-200 rounded-xl cursor-pointer transition-all hover:shadow-lg min-h-[80px] md:min-h-[100px] ${
            isToday
              ? "bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-400 border-2"
              : isPast
              ? "bg-gray-50"
              : "bg-white hover:bg-indigo-50"
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span
              className={`text-sm md:text-lg font-bold ${
                isToday
                  ? "text-indigo-600"
                  : isPast
                  ? "text-gray-400"
                  : "text-gray-800"
              }`}
            >
              {day}
            </span>
            {isToday && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </div>

          {eventsOnDay.length > 0 && (
            <div className="space-y-1">
              {eventsOnDay.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-lg truncate"
                  title={`${event.title} (${event.event_start_time} - ${event.event_end_time})`}
                >
                  <div className="font-semibold truncate">{event.title}</div>
                  <div className="text-xs opacity-90">
                    {event.event_start_time.slice(0, 5)} - {event.event_end_time.slice(0, 5)}
                  </div>
                </div>
              ))}
              {eventsOnDay.length > 2 && (
                <div className="text-xs text-indigo-600 font-semibold">
                  +{eventsOnDay.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            📅 Event Calendar
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            View all your scheduled events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToToday}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-sm"
          >
            Today
          </button>

          <button
            onClick={goToNextMonth}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center font-bold text-gray-600 text-sm md:text-base p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">{renderCalendar()}</div>

      {/* Event Legend */}
      <div className="border-t-2 border-gray-200 pt-4">
        <h4 className="font-bold text-gray-800 mb-3">📊 Event Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{jobs.length}</p>
            <p className="text-sm text-blue-600">Total Events</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">
              {jobs.filter(j => new Date(j.event_start_date) >= new Date()).length}
            </p>
            <p className="text-sm text-green-600">Upcoming Events</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">
              {jobs.filter(j => new Date(j.event_start_date).toDateString() === new Date().toDateString()).length}
            </p>
            <p className="text-sm text-purple-600">Events Today</p>
          </div>
        </div>
      </div>

      {/* Selected Date Events Modal */}
      {selectedDate && selectedEvents.length > 0 && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Events on {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className="text-gray-600 mt-1">
                  {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/company/applicants/${event.id}`)}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-800 mb-1">
                        {event.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {event.event_type} • {event.location}
                      </p>
                    </div>
                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="bg-white rounded-xl p-3 border border-green-200">
                      <p className="text-xs text-gray-500 mb-1">⏰ Time</p>
                      <p className="font-semibold text-gray-800">
                        {event.event_start_time} - {event.event_end_time}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-green-200">
                      <p className="text-xs text-gray-500 mb-1">📅 Duration</p>
                      <p className="font-semibold text-gray-800">
                        {event.event_start_date === event.event_end_date
                          ? "Single Day"
                          : `${event.event_start_date} to ${event.event_end_date}`}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-green-200">
                      <p className="text-xs text-gray-500 mb-1">👥 Helpers</p>
                      <p className="font-semibold text-gray-800">
                        {event.helpers_needed} needed
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-green-200">
                      <p className="text-xs text-gray-500 mb-1">💰 Payment</p>
                      <p className="font-semibold text-gray-800">
                        {event.payment}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/company/applicants/${event.id}`);
                    }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-sm"
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="mt-6 w-full bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}