"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { checkPairAction } from '@/app/actions/auth';
import toast from 'react-hot-toast';

type Player = 'X' | 'O' | null;

export default function TicTacToeGame() {
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [pairId, setPairId] = useState<string | null>(null);
    const [myPlayerSymbol, setMyPlayerSymbol] = useState<'X' | 'O' | null>(null);
    const [channel, setChannel] = useState<any>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        checkPairAction().then(res => {
            if (res.pair?.id) {
                setPairId(res.pair.id);
                // Simple deterministic assignment based on user IDs
                const myId = res.userId || '';
                const p1 = res.pair.user1_id;
                setMyPlayerSymbol(myId === p1 ? 'X' : 'O');
            }
        });
    }, []);

    useEffect(() => {
        if (!pairId) return;
        const ch = supabase.channel(`game-${pairId}`, {
            config: { broadcast: { ack: false } }
        });

        ch.on('broadcast', { event: 'tictactoe_move' }, payload => {
            setBoard(payload.board);
            setXIsNext(payload.xIsNext);
        });

        ch.on('broadcast', { event: 'tictactoe_restart' }, () => {
            setBoard(Array(9).fill(null));
            setXIsNext(true);
            toast("Игра началась заново 🔄", { icon: "🏁" });
        });

        ch.subscribe();
        setChannel(ch);

        return () => { supabase.removeChannel(ch); };
    }, [pairId, supabase]);

    const calculateWinner = (squares: Player[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const [a, b, c] of lines) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
        }
        return null;
    };

    const handleClick = (i: number) => {
        if (calculateWinner(board) || board[i]) return;

        // Prevent moving if it's not our turn
        const currentPlayerSymbol = xIsNext ? 'X' : 'O';
        if (myPlayerSymbol && myPlayerSymbol !== currentPlayerSymbol) {
            toast.error("Сейчас ход партнера!");
            return;
        }

        const newBoard = board.slice();
        newBoard[i] = currentPlayerSymbol;

        setBoard(newBoard);
        setXIsNext(!xIsNext);

        if (channel) {
            channel.send({
                type: 'broadcast',
                event: 'tictactoe_move',
                payload: { board: newBoard, xIsNext: !xIsNext }
            });
        }
    };

    const restartGame = () => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
        if (channel) {
            channel.send({
                type: 'broadcast',
                event: 'tictactoe_restart'
            });
        }
    };

    const winner = calculateWinner(board);
    const isDraw = !winner && board.every(Boolean);

    let status;
    if (winner) {
        status = winner === myPlayerSymbol ? "Вы победили! 🎉" : "Партнер победил 💔";
    } else if (isDraw) {
        status = "Ничья! 🤝";
    } else {
        const currentPlayerSymbol = xIsNext ? 'X' : 'O';
        status = myPlayerSymbol === currentPlayerSymbol ? "Ваш ход!" : "Ожидаем ход партнера...";
    }

    return (
        <div className="w-full flex justify-center items-center flex-col pt-4">
            <h2 className="text-xl font-bold mb-2">{status}</h2>
            <p className="text-sm opacity-60 mb-8 tracking-widest uppercase font-bold">Вы играете за: {myPlayerSymbol}</p>

            <div className="grid grid-cols-3 gap-2 bg-[#e8dfd5] dark:bg-[#3d332c] p-2 rounded-3xl w-full max-w-[300px] aspect-square shadow-sm">
                {board.map((cell, i) => (
                    <button
                        key={i}
                        onClick={() => handleClick(i)}
                        className="bg-[#fdfbf9] dark:bg-[#1a1614] rounded-2xl text-5xl font-extrabold flex items-center justify-center transition-all hover:bg-white dark:hover:bg-[#2d2621] active:scale-95"
                    >
                        <span className={cell === 'X' ? 'text-[#e07a5f]' : 'text-[#81b29a]'}>
                            {cell}
                        </span>
                    </button>
                ))}
            </div>

            <button
                onClick={restartGame}
                className="mt-10 py-3 px-8 bg-[#cca573] hover:bg-[#b98b53] text-white rounded-full font-bold shadow-sm transition-colors"
            >
                Начать заново
            </button>
        </div>
    );
}
