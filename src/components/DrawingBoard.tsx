"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { checkPairAction } from "@/app/actions/auth";

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };
type CursorTrailPoint = { x: number; y: number; timestamp: number };
type CursorInfo = { name: string; color: string; trail: CursorTrailPoint[] };

type NewStrokePayload = { stroke?: Stroke };
type CursorMovePayload = { userId?: string; x?: number; y?: number; name?: string; color?: string };
type CursorLeavePayload = { userId?: string };

const COLORS = ["#cca573", "#e07a5f", "#3d405b", "#81b29a", "#f2cc8f", "#1a1614", "#ffffff"];

export default function DrawingBoard() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pairId, setPairId] = useState<string | null>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [color, setColor] = useState("#cca573");
    const [isDrawing, setIsDrawing] = useState(false);
    const [myId, setMyId] = useState("");
    const [myName, setMyName] = useState("");
    const myColorRef = useRef("#e07a5f");
    const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});
    const [cursorNow, setCursorNow] = useState(() => Date.now());
    const lastCursorSentRef = useRef(0);
    const currentStrokeRef = useRef<Stroke | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            ),
        [],
    );

    useEffect(() => {
        let active = true;

        void supabase.auth.getUser().then(({ data: { user } }) => {
            if (!active || !user) return;
            setMyId(user.id);
            setMyName(user.user_metadata?.display_name || "Вы");
            const selectedColor = COLORS[parseInt(user.id.substring(0, 8), 16) % COLORS.length] || "#e07a5f";
            myColorRef.current = selectedColor;
        });

        void checkPairAction().then((res) => {
            if (!active) return;
            if (res.pair?.id) setPairId(res.pair.id);
        });

        return () => {
            active = false;
        };
    }, [supabase]);

    const drawStrokeToCanvas = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.points.length === 0) return;

        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        stroke.points.forEach((p, i) => {
            if (i === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        });

        ctx.stroke();
    }, []);

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fdfbf9";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        strokes.forEach((stroke) => drawStrokeToCanvas(ctx, stroke));

        if (currentStrokeRef.current) {
            drawStrokeToCanvas(ctx, currentStrokeRef.current);
        }
    }, [drawStrokeToCanvas, strokes]);

    useEffect(() => {
        if (!pairId) return;

        const channel = supabase.channel(`drawing-${pairId}`, {
            config: { broadcast: { ack: false } },
        });

        channel.on("broadcast", { event: "new_stroke" }, ({ payload }) => {
            const parsed = payload as NewStrokePayload;
            if (!parsed.stroke || !Array.isArray(parsed.stroke.points)) return;
            setStrokes((prev) => [...prev, parsed.stroke as Stroke]);
        });

        channel.on("broadcast", { event: "cursor_move" }, ({ payload }) => {
            const parsed = payload as CursorMovePayload;
            if (
                typeof parsed.userId !== "string"
                || typeof parsed.x !== "number"
                || typeof parsed.y !== "number"
            ) {
                return;
            }

            const now = Date.now();
            setCursors((prev) => {
                const existing = prev[parsed.userId!] || {
                    name: parsed.name || "?",
                    color: parsed.color || "#e07a5f",
                    trail: [],
                };
                const newTrail = [...existing.trail, { x: parsed.x!, y: parsed.y!, timestamp: now }];
                if (newTrail.length > 15) newTrail.shift();

                return {
                    ...prev,
                    [parsed.userId!]: {
                        ...existing,
                        name: parsed.name || existing.name,
                        color: parsed.color || existing.color,
                        trail: newTrail,
                    },
                };
            });
        });

        channel.on("broadcast", { event: "cursor_leave" }, ({ payload }) => {
            const parsed = payload as CursorLeavePayload;
            if (typeof parsed.userId !== "string") return;
            setCursors((prev) => {
                const next = { ...prev };
                delete next[parsed.userId!];
                return next;
            });
        });

        channel.on("broadcast", { event: "clear_board" }, () => {
            setStrokes([]);
        });

        channel.subscribe();
        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [pairId, supabase]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            const now = Date.now();
            setCursorNow(now);

            setCursors((prev) => {
                let changed = false;
                const next: Record<string, CursorInfo> = { ...prev };

                for (const id of Object.keys(next)) {
                    const activeTrail = next[id]!.trail.filter((p) => now - p.timestamp < 600);
                    if (activeTrail.length !== next[id]!.trail.length) {
                        changed = true;
                        next[id] = { ...next[id]!, trail: activeTrail };
                    }
                }

                return changed ? next : prev;
            });
        }, 50);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;

        if ("touches" in e) {
            clientX = e.touches[0]!.clientX;
            clientY = e.touches[0]!.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    }, []);

    const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const pos = getCoordinates(e);
        currentStrokeRef.current = { color, width: 8, points: [pos] };
        redrawCanvas();
    }, [color, getCoordinates, redrawCanvas]);

    const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const pos = getCoordinates(e);

        if (isDrawing && currentStrokeRef.current) {
            currentStrokeRef.current.points.push(pos);
            redrawCanvas();
        }

        const now = Date.now();
        const channel = channelRef.current;
        if (channel && myId && now - lastCursorSentRef.current > 40) {
            lastCursorSentRef.current = now;
            void channel.send({
                type: "broadcast",
                event: "cursor_move",
                payload: { userId: myId, x: pos.x, y: pos.y, name: myName, color: myColorRef.current },
            });
        }
    }, [getCoordinates, isDrawing, myId, myName, redrawCanvas]);

    const stopDrawing = useCallback(() => {
        if (!isDrawing || !currentStrokeRef.current) return;

        setIsDrawing(false);
        const finishedStroke = { ...currentStrokeRef.current };
        setStrokes((prev) => [...prev, finishedStroke]);

        const channel = channelRef.current;
        if (channel && finishedStroke.points.length > 0) {
            void channel.send({
                type: "broadcast",
                event: "new_stroke",
                payload: { stroke: finishedStroke },
            });
        }

        currentStrokeRef.current = null;
    }, [isDrawing]);

    const handlePointerLeave = useCallback(() => {
        stopDrawing();

        const channel = channelRef.current;
        if (channel && myId) {
            void channel.send({
                type: "broadcast",
                event: "cursor_leave",
                payload: { userId: myId },
            });
        }
    }, [myId, stopDrawing]);

    const clearBoard = useCallback(() => {
        setStrokes([]);
        const channel = channelRef.current;
        if (!channel) return;

        void channel.send({ type: "broadcast", event: "clear_board" });
    }, []);

    const downloadCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement("a");
        link.download = "nash-domik-risunok.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }, []);

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="flex gap-2 bg-[#e8dfd5] dark:bg-[#3d332c] p-2 rounded-2xl w-full justify-between items-center shadow-inner">
                <div className="flex gap-1.5 flex-wrap">
                    {COLORS.map((swatch) => (
                        <button
                            key={swatch}
                            onClick={() => setColor(swatch)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${color === swatch ? "scale-110 border-white shadow-md" : "border-transparent"}`}
                            style={{ backgroundColor: swatch }}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={downloadCanvas}
                        aria-label="Скачать рисунок"
                        className="w-8 h-8 flex items-center justify-center text-[#9e6b36] hover:text-[#cca573] transition-colors active:scale-90"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                            <path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
                        </svg>
                    </button>
                    <button
                        onClick={clearBoard}
                        className="text-xs font-bold uppercase tracking-wider text-[#9e6b36] hover:text-[#cca573] transition-colors px-1"
                    >
                        Очистить
                    </button>
                </div>
            </div>

            <div className="relative w-full aspect-square border-4 border-[#e8dfd5] dark:border-[#3d332c] rounded-3xl overflow-hidden shadow-sm bg-[#fdfbf9] cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={800}
                    className="w-full h-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={handlePointerMove}
                    onMouseUp={stopDrawing}
                    onMouseLeave={handlePointerLeave}
                    onTouchStart={startDrawing}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={stopDrawing}
                />

                {Object.entries(cursors).map(([id, cursor]) => {
                    if (id === myId || cursor.trail.length === 0) return null;
                    const head = cursor.trail[cursor.trail.length - 1]!;

                    return (
                        <div key={id} className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                            {cursor.trail.map((p, i) => {
                                const age = cursorNow - p.timestamp;
                                const opacity = Math.max(0, 1 - (age / 600));
                                const size = opacity * 16;

                                return (
                                    <div
                                        key={i}
                                        className="absolute rounded-full shadow-[0_0_12px_currentColor] transition-none drop-shadow-md"
                                        style={{
                                            left: `${(p.x / 800) * 100}%`,
                                            top: `${(p.y / 800) * 100}%`,
                                            transform: "translate(-50%, -50%)",
                                            backgroundColor: cursor.color,
                                            color: cursor.color,
                                            opacity: opacity * 0.6,
                                            width: size,
                                            height: size,
                                        }}
                                    />
                                );
                            })}

                            <div
                                className="absolute flex flex-col items-center drop-shadow-md transition-none"
                                style={{
                                    left: `${(head.x / 800) * 100}%`,
                                    top: `${(head.y / 800) * 100}%`,
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: cursor.color }} />
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 bg-white/90 text-black shadow-sm" style={{ color: cursor.color }}>
                                    {cursor.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-xs font-bold opacity-50 text-center uppercase tracking-wider">Синхронизируется в реальном времени ✨</p>
        </div>
    );
}
