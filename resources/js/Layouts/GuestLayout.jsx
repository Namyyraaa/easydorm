import AppHeader from '@/Components/AppHeader';

export default function GuestLayout({ children, top }) {
    return (
        <div
            className="relative min-h-screen text-violet-900 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/residormumspic.png')" }}
        >
            <div className="absolute inset-0 bg-white/45"></div>

            <div className="relative z-10">
                <AppHeader />
                <main className="mx-auto max-w-7xl px-6 py-12">
                    {top && (
                        <div className="mx-auto w-full sm:max-w-md mb-6">{top}</div>
                    )}
                    <div className="mx-auto w-full sm:max-w-md">
                        <div className="overflow-hidden rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
