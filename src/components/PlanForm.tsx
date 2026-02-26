"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { createPlanAction } from "@/app/actions/plans";

type CreatedPlan = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  suggested_slots: string[];
  chosen_slot: string | null;
  status: string;
  target_date: string | null;
  created_at: string;
};

export default function PlanForm({ onCancel }: { onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [slots, setSlots] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const handleAddSlot = () => setSlots((prev) => [...prev, ""]);

  const handleSlotChange = (index: number, value: string) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveSlot = (index: number) => {
    setSlots((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    const toastId = toast.loading("Создаём план...");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (targetDate) formData.append("target_date", targetDate);
    slots.forEach((slot) => {
      if (slot.trim()) formData.append("suggested_slots", slot.trim());
    });

    const result = await createPlanAction(formData);

    if (result.error) {
      toast.error(result.error, { id: toastId });
      setLoading(false);
      return;
    }

    const createdPlan = (result.plan || null) as CreatedPlan | null;
    if (createdPlan) {
      window.dispatchEvent(new CustomEvent("plans:created", { detail: createdPlan }));
    }

    toast.success("План предложен! 🗓️", { id: toastId });
    setTitle("");
    setDescription("");
    setTargetDate("");
    setSlots([""]);
    onCancel();
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-[#fcf8ef] dark:bg-[#3d332c] p-6 rounded-[32px] border-[4px] border-[#e3d2b3] dark:border-[#55331a] mb-8 flex flex-col gap-4"
    >
      <input
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Что будем делать?"
        className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none"
      />

      <div className="flex gap-2 w-full">
        <input
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          className="p-3 w-1/2 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none"
          placeholder="Дата (опционально)"
        />
      </div>

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Детали (место, бюджет, дресс-код)..."
        className="p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none min-h-[100px]"
      />

      <div className="flex flex-col gap-2">
        <p className="font-bold text-[#9e6b36] dark:text-[#cca573] text-sm ml-1">Предложенные даты/время:</p>
        {slots.map((slot, index) => (
          <div key={index} className="flex gap-2">
            <input
              required
              value={slot}
              onChange={(event) => handleSlotChange(index, event.target.value)}
              placeholder="Например: Пятница вечер 19:00"
              className="flex-1 p-3 rounded-xl border-2 border-[#e3d2b3] dark:border-[#855328] bg-white dark:bg-[#1f1a16] focus:border-[#9e6b36] outline-none"
            />
            {slots.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveSlot(index)}
                className="px-4 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-bold hover:bg-red-200"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {slots.length < 5 && (
          <button
            type="button"
            onClick={handleAddSlot}
            className="text-sm font-bold opacity-60 hover:opacity-100 self-start mt-1 text-[#9e6b36] dark:text-[#cca573]"
          >
            + Добавить вариант
          </button>
        )}
      </div>

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border-2 border-[#e3d2b3] dark:border-[#855328] text-[#9e6b36] dark:text-[#cca573] rounded-xl font-bold"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 py-3 bg-[#b98b53] hover:bg-[#9e6b36] text-white rounded-xl font-bold disabled:opacity-50 transition-colors"
        >
          Предложить
        </button>
      </div>
    </form>
  );
}