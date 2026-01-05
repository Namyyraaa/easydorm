import AppHeader from '@/Components/AppHeader';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-violet-50 text-violet-900">
            <AppHeader />
            <main className="mx-auto max-w-7xl px-6 py-12">
                <div className="mx-auto w-full sm:max-w-md">
                    <div className="overflow-hidden rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
