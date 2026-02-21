"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createMomentAction } from '@/app/actions/moments';

export default function MomentUploader() {
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Пожалуйста, выберите фото 📸');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Загружаем момент...');

        try {
            const formData = new FormData();
            formData.append('photo', file);
            if (caption) formData.append('caption', caption);

            const res = await createMomentAction(formData);

            if (res?.error) {
                toast.error(res.error, { id: toastId });
            } else {
                toast.success('Момент опубликован! 💖', { id: toastId });
                setFile(null);
                setCaption('');
            }
        } catch (e) {
            toast.error('Ошибка загрузки', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-white dark:bg-[#2d2621] p-5 rounded-3xl shadow-sm border border-[#e3d2b3] dark:border-[#55331a]">
            <h2 className="text-xl font-bold mb-4">Поделиться моментом</h2>

            <div className="flex flex-col gap-3">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#cca573] dark:border-[#855328] rounded-2xl cursor-pointer hover:bg-[#f5eedc] dark:hover:bg-[#452a17] transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <span className="text-3xl mb-2">📸</span>
                        <p className="text-sm font-medium">{file ? file.name : 'Выбрать фото'}</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={loading} />
                </label>

                {file && (
                    <input
                        type="text"
                        placeholder="Подпись (необязательно)..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        disabled={loading}
                        className="w-full p-3 rounded-xl border border-[#e3d2b3] dark:border-[#855328] bg-transparent focus:outline-none focus:border-[#9e6b36]"
                    />
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="w-full py-4 mt-2 bg-[#b98b53] text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex justify-center items-center"
                >
                    {loading ? 'Загрузка...' : 'Отправить'}
                </button>
            </div>
        </div>
    );
}
