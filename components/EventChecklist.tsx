"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
  dueDate?: string;
};

type Props = {
  jobId: string;
  companyId: string;
  eventStartDate: string;
  jobTitle: string;
};

export default function EventChecklist({ jobId, companyId, eventStartDate, jobTitle }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadChecklist();
  }, [jobId]);

  const loadChecklist = async () => {
    try {
      const data = await apiCall(`/event-checklists?jobId=${jobId}`, {
        method: "GET",
      });

      if (data.success && data.checklist) {
        setItems(data.checklist.checklist_items);
      } else {
        // Create default checklist
        const defaultItems = generateDefaultChecklist(eventStartDate);
        setItems(defaultItems);
      }
    } catch (error) {
      console.error("Error loading checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultChecklist = (eventDate: string): ChecklistItem[] => {
    const eventDay = new Date(eventDate);
    const threeDaysBefore = new Date(eventDay);
    threeDaysBefore.setDate(eventDay.getDate() - 3);
    const twoDaysBefore = new Date(eventDay);
    twoDaysBefore.setDate(eventDay.getDate() - 2);
    const oneDayBefore = new Date(eventDay);
    oneDayBefore.setDate(eventDay.getDate() - 1);

    return [
      {
        id: "1",
        text: "Review approved candidates",
        checked: false,
        dueDate: threeDaysBefore.toISOString().split("T")[0],
      },
      {
        id: "2",
        text: "Download team roster PDF",
        checked: false,
        dueDate: threeDaysBefore.toISOString().split("T")[0],
      },
      {
        id: "3",
        text: "Send event details to all candidates",
        checked: false,
        dueDate: twoDaysBefore.toISOString().split("T")[0],
      },
      {
        id: "4",
        text: "Confirm venue and timing",
        checked: false,
        dueDate: twoDaysBefore.toISOString().split("T")[0],
      },
      {
        id: "5",
        text: "Send final reminder to all candidates",
        checked: false,
        dueDate: oneDayBefore.toISOString().split("T")[0],
      },
      {
        id: "6",
        text: "Prepare attendance sheet",
        checked: false,
        dueDate: oneDayBefore.toISOString().split("T")[0],
      },
      {
        id: "7",
        text: "Check equipment/supplies needed",
        checked: false,
        dueDate: oneDayBefore.toISOString().split("T")[0],
      },
      {
        id: "8",
        text: "Confirm payment arrangements",
        checked: false,
        dueDate: eventDate,
      },
    ];
  };

  const toggleItem = async (itemId: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setItems(updatedItems);
    await saveChecklist(updatedItems);
  };

  const saveChecklist = async (updatedItems: ChecklistItem[]) => {
    setSaving(true);
    try {
      await apiCall("/event-checklists", {
        method: "POST",
        body: JSON.stringify({
          jobId,
          companyId,
          checklistItems: updatedItems,
        }),
      });
    } catch (error) {
      console.error("Error saving checklist:", error);
    } finally {
      setSaving(false);
    }
  };

  const getDaysUntil = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getUrgencyColor = (daysUntil: number | null) => {
    if (daysUntil === null) return "bg-gray-100";
    if (daysUntil < 0) return "bg-red-50 border-red-200";
    if (daysUntil === 0) return "bg-orange-50 border-orange-200";
    if (daysUntil <= 1) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const getUrgencyBadge = (daysUntil: number | null) => {
    if (daysUntil === null) return null;
    if (daysUntil < 0) return <span className="text-red-600 font-semibold text-xs">⚠️ Overdue</span>;
    if (daysUntil === 0) return <span className="text-orange-600 font-semibold text-xs">🔥 Today!</span>;
    if (daysUntil === 1) return <span className="text-yellow-600 font-semibold text-xs">⏰ Tomorrow</span>;
    return <span className="text-gray-500 text-xs">{daysUntil} days</span>;
  };

  const completedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            ✅ Event Day Checklist
          </h3>
          <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
        </div>
        {saving && (
          <span className="text-sm text-gray-500 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            Saving...
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">
            Progress: {completedCount}/{totalCount} completed
          </span>
          <span className="text-sm font-semibold text-indigo-600">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const daysUntil = getDaysUntil(item.dueDate);
          return (
            <div
              key={item.id}
              className={`border-2 rounded-2xl p-4 transition-all ${
                item.checked
                  ? "bg-gray-50 border-gray-200 opacity-60"
                  : getUrgencyColor(daysUntil)
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                  className="w-5 h-5 mt-0.5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`text-sm font-medium ${
                        item.checked
                          ? "line-through text-gray-500"
                          : "text-gray-800"
                      }`}
                    >
                      {item.text}
                    </span>
                    {!item.checked && getUrgencyBadge(daysUntil)}
                  </div>
                  {item.dueDate && (
                    <span className="text-xs text-gray-500 mt-1 block">
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedCount === totalCount && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 text-center">
          <p className="text-green-800 font-bold text-lg">🎉 All Done!</p>
          <p className="text-green-600 text-sm">You're ready for the event!</p>
        </div>
      )}
    </div>
  );
}