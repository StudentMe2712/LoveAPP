"use client";

import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { checkPairAction } from '@/app/actions/auth';

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };

export default function DrawingBoard() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pairId, setPairId] = useState<string | null>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [color, setColor] = useState('#cca573');
    const [isDrawing, setIsDrawing] = useState(false);

    // We keep track of the current stroke without triggering full re-renders on every point
    // to keep it performant while dragging.
    const currentStrokeRef = useRef<Stroke | null>(null);
    const [channel, setChannel] = useState<any>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        checkPairAction().then(res => {
            if (res.pair?.id) setPairId(res.pair.id);
        });
    }, []);

    useEffect(() => {
        if (!pairId) return;
        const ch = supabase.channel(`drawing-${pairId}`, {
            config: { broadcast: { ack: false } }
        });

        ch.on('broadcast', { event: 'new_stroke' }, payload => {
            setStrokes(prev => [...prev, payload.stroke]);
        });

        ch.on('broadcast', { event: 'clear_board' }, () => {
            setStrokes([]);
        });

        ch.subscribe();
        setChannel(ch);

        return () => { supabase.removeChannel(ch); };
    }, [pairId, supabase]);

    useEffect(() => {
        redrawCanvas();
    }, [strokes]);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fdfbf9'; // matching exact bg
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw all saved strokes
        strokes.forEach(stroke => drawStrokeToCanvas(ctx, stroke));

        // Draw current stroke if exists
        if (currentStrokeRef.current) {
            drawStrokeToCanvas(ctx, currentStrokeRef.current);
        }
    };

    const drawStrokeToCanvas = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.points.length === 0) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        stroke.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const pos = getCoordinates(e);
        currentStrokeRef.current = { color, width: 8, points: [pos] };
        redrawCanvas(); // Draw dot
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !currentStrokeRef.current) return;
        const pos = getCoordinates(e);
        currentStrokeRef.current.points.push(pos);
        redrawCanvas(); // Efficient redraw using ref
    };

    const stopDrawing = () => {
        if (!isDrawing || !currentStrokeRef.current) return;
        setIsDrawing(false);

        const finishedStroke = { ...currentStrokeRef.current };
        // Save to state to persist locally
        setStrokes(prev => [...prev, finishedStroke]);

        // Broadcast
        if (channel && finishedStroke.points.length > 0) {
            channel.send({
                type: 'broadcast',
                event: 'new_stroke',
                payload: { stroke: finishedStroke }
            });
        }
        currentStrokeRef.current = null;
    };

    const clearBoard = () => {
        setStrokes([]);
        if (channel) {
            channel.send({
                type: 'broadcast',
                event: 'clear_board'
            });
        }
    };

    const colors = ['#cca573', '#e07a5f', '#3d405b', '#81b29a', '#f2cc8f', '#1a1614', '#ffffff'];

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="flex gap-2 bg-[#e8dfd5] dark:bg-[#3d332c] p-2 rounded-2xl w-full justify-between items-center shadow-inner">
                <div className="flex gap-1.5 flex-wrap">
                    {colors.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-white shadow-md' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
                <button
                    onClick={clearBoard}
                    className="text-xs font-bold uppercase tracking-wider text-[#9e6b36] hover:text-[#cca573] transition-colors shrink-0 px-2"
                >
                    Очистить
                </button>
            </div>

            <div className="relative w-full aspect-square border-4 border-[#e8dfd5] dark:border-[#3d332c] rounded-3xl overflow-hidden shadow-sm bg-[#fdfbf9] cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    width={800} // Double resolution for retina sharpness
                    height={800}
                    className="w-full h-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            <p className="text-xs font-bold opacity-50 text-center uppercase tracking-wider">Синхронизируется в реальном времени ✨</p>
        </div>
    );
}
