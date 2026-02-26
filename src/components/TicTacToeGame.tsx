"use client";

import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { checkPairAction } from '@/app/actions/auth';
import { getTicTacToeScoreAction, incrementTicTacToeScoreAction } from '@/app/actions/tictactoe';
import toast from 'react-hot-toast';
import { hapticFeedback } from '@/lib/utils/haptics';
import confetti from 'canvas-confetti';
import { useResolvedPartnerName } from '@/lib/hooks/useResolvedPartnerName';

type Player = 'X' | 'O' | null;
type TicTacToeScores = {
    user1_score: number;
    user2_score: number;
};

export default function TicTacToeGame() {
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [pairId, setPairId] = useState<string | null>(null);
    const [myPlayerSymbol, setMyPlayerSymbol] = useState<'X' | 'O' | null>(null);
    const [myName, setMyName] = useState<string>('');
    const [myId, setMyId] = useState<string | null>(null);
    const [scores, setScores] = useState<TicTacToeScores | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const resolvedPartnerName = useResolvedPartnerName();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.user_metadata?.display_name) {
                setMyName(user.user_metadata.display_name);
            }
        });
        checkPairAction().then(res => {
            if (res.pair?.id) {
                setPairId(res.pair.id);
                const uid = res.userId || '';
                setMyId(uid);
                const p1 = res.pair.user1_id;
                setMyPlayerSymbol(uid === p1 ? 'X' : 'O');

                getTicTacToeScoreAction(res.pair.id).then(scoreRes => {
                    if (scoreRes.scores) setScores(scoreRes.scores);
                });
            }
        });
    }, [supabase]);

    useEffect(() => {
        if (!pairId) return;
        const ch = supabase.channel(`game-${pairId}`, {
            config: { broadcast: { ack: false } }
        });

        ch.on('broadcast', { event: 'tictactoe_move' }, ({ payload }) => {
            setBoard(payload.board);
            setXIsNext(payload.xIsNext);
        });

        ch.on('broadcast', { event: 'tictactoe_score' }, ({ payload }) => {
            setScores(payload.scores);
        });

        ch.on('broadcast', { event: 'tictactoe_restart' }, ({ payload }) => {
            setBoard(Array(9).fill(null));
            setXIsNext(payload?.xIsNext ?? true);
            toast("Игра началась заново 🔄", { icon: "🏁" });
        });

        ch.subscribe();
        channelRef.current = ch;

        return () => {
            supabase.removeChannel(ch);
            channelRef.current = null;
        };
    }, [pairId, supabase]);

    const calculateWinner = (squares: Player[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const [a, b, c] of lines) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a], line: [a, b, c] };
            }
        }
        return { winner: null, line: null };
    };

    const handleClick = (i: number) => {
        hapticFeedback.light();
        const { winner } = calculateWinner(board);
        if (winner || board[i]) return;

        const currentPlayerSymbol = xIsNext ? 'X' : 'O';
        if (myPlayerSymbol && myPlayerSymbol !== currentPlayerSymbol) {
            toast.error(`Сейчас ход ${resolvedPartnerName}!`);
            return;
        }

        const newBoard = board.slice();
        newBoard[i] = currentPlayerSymbol;

        setBoard(newBoard);
        setXIsNext(!xIsNext);

        const newResult = calculateWinner(newBoard);
        if (newResult.winner) {
            hapticFeedback.success();
            if (newResult.winner === myPlayerSymbol) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            if (newResult.winner === myPlayerSymbol && pairId && myId) {
                incrementTicTacToeScoreAction(pairId, myId).then(res => {
                    const channel = channelRef.current;
                    if (res.scores && channel) {
                        setScores(res.scores);
                        channel.send({
                            type: 'broadcast',
                            event: 'tictactoe_score',
                            payload: { scores: res.scores }
                        });
                    }
                });
            }
        }

        const channel = channelRef.current;
        if (channel) {
            channel.send({
                type: 'broadcast',
                event: 'tictactoe_move',
                payload: { board: newBoard, xIsNext: !xIsNext }
            });
        }
    };

    const restartGame = () => {
        const startX = Math.random() < 0.5; // random who goes first
        setBoard(Array(9).fill(null));
        setXIsNext(startX);
        const channel = channelRef.current;
        if (channel) {
            channel.send({
                type: 'broadcast',
                event: 'tictactoe_restart',
                payload: { xIsNext: startX }
            });
        }
    };

    const { winner, line } = calculateWinner(board);
    const isDraw = !winner && board.every(Boolean);

    let status;
    if (winner) {
        status = winner === myPlayerSymbol ? "Вы победили! 🎉" : `${resolvedPartnerName} победил(а) 💔`;
    } else if (isDraw) {
        status = "Ничья! 🤝";
    } else {
        const currentPlayerSymbol = xIsNext ? 'X' : 'O';
        status = myPlayerSymbol === currentPlayerSymbol ? "Ваш ход!" : `Ожидаем ход ${resolvedPartnerName}...`;
    }

    const showModal = winner || isDraw;

    return (
        <div className="w-full flex justify-center items-center flex-col pt-4 relative">
            {showModal && (
                <div className="absolute inset-x-0 -inset-y-10 z-50 flex items-center justify-center bg-[#f2ebe3]/80 dark:bg-[#1a1614]/80 backdrop-blur-sm rounded-3xl">
                    <div className="bg-[#fdfbf9] dark:bg-[#2c2623] p-8 w-full max-w-[280px] rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-[#e8dfd5] dark:border-[#3d332c] flex flex-col items-center animate-in zoom-in-95 duration-200">
                        <span className="text-6xl mb-4 drop-shadow-sm">
                            {winner === myPlayerSymbol ? '🎉' : isDraw ? '🤝' : '💔'}
                        </span>
                        <h2 className="text-2xl font-extrabold mb-6 text-center text-[#4a403b] dark:text-[#d4c8c1]">
                            {winner === myPlayerSymbol ? 'Вы победили!' : isDraw ? 'Ничья!' : `${resolvedPartnerName} победил(а)`}
                        </h2>
                        <button
                            onClick={restartGame}
                            className="w-full py-4 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-2xl font-bold shadow-sm transition-transform active:scale-95 text-lg"
                        >
                            Сыграть еще раз
                        </button>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-bold mb-2">{status}</h2>
            <p className="text-sm opacity-60 mb-8 tracking-widest uppercase font-bold">
                Вы играете как: {myName || myPlayerSymbol}
                {myName && <span className="ml-1 opacity-50">({myPlayerSymbol})</span>}
            </p>

            <div className="grid grid-cols-3 gap-2 bg-[#e8dfd5] dark:bg-[#3d332c] p-2 rounded-3xl w-full max-w-[300px] aspect-square shadow-sm">
                {board.map((cell, i) => {
                    const isWinningCell = line?.includes(i);
                    return (
                        <button
                            key={i}
                            onClick={() => handleClick(i)}
                            className={`bg-[#fdfbf9] dark:bg-[#1a1614] rounded-2xl text-5xl font-extrabold flex items-center justify-center transition-all hover:bg-white dark:hover:bg-[#2d2621] active:scale-95 ${isWinningCell ? 'shadow-[0_0_15px_rgba(204,165,115,0.5)] scale-105 z-10 border-2 border-[#cca573] animate-pulse' : ''
                                }`}
                        >
                            <span className={cell === 'X' ? 'text-[#e07a5f]' : 'text-[#81b29a]'}>
                                {cell}
                            </span>
                        </button>
                    )
                })}
            </div>

            {scores && (
                <div className="mt-8 bg-[#fdfbf9] dark:bg-[#2c2623] px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-4 text-lg border border-[#e8dfd5] dark:border-[#3d332c] shadow-sm">
                    <span className="text-[#e07a5f]">{myPlayerSymbol === 'X' ? myName || 'Вы' : resolvedPartnerName}</span>
                    <div className="flex items-center gap-2 bg-[#e8dfd5] dark:bg-[#1a1614] px-4 py-1.5 rounded-full">
                        <span>{scores.user1_score}</span>
                        <span className="opacity-40 text-sm">:</span>
                        <span>{scores.user2_score}</span>
                    </div>
                    <span className="text-[#81b29a]">{myPlayerSymbol === 'O' ? myName || 'Вы' : resolvedPartnerName}</span>
                </div>
            )}

            <button
                onClick={restartGame}
                className="mt-6 py-3 px-8 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-full font-bold shadow-sm transition-colors"
            >
                Начать заново
            </button>
        </div>
    );
}
