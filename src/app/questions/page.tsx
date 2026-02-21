import QuestionsView from '@/components/QuestionsView';
import { Toaster } from 'react-hot-toast';

export default function QuestionsPage() {
    return (
        <main className="min-h-screen py-6 px-4">
            <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#fff', color: '#452a17', borderRadius: '16px', fontWeight: 'bold' } }} />
            <QuestionsView />
        </main>
    );
}
