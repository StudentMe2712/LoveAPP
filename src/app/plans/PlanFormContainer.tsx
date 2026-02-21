"use client";

import React, { useState } from 'react';
import PlanForm from '@/components/PlanForm';

export default function PlanFormContainer() {
    const [isAdding, setIsAdding] = useState(false);

    if (isAdding) {
        return <PlanForm onCancel={() => setIsAdding(false)} />;
    }

    return (
        <button
            onClick={() => setIsAdding(true)}
            className="w-full py-4 mb-6 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-3xl font-bold text-lg shadow-sm active:scale-95 transition-all"
        >
            + Предложить план 🗓️
        </button>
    );
}
