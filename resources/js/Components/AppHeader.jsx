import { Link } from '@inertiajs/react';
import { Home } from 'lucide-react';

export default function AppHeader() {
    return (
        <header className="w-full border-b border-violet-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src="/images/residormumslogo.png"
                        alt="ResiDorm logo"
                        className="h-9 w-auto rounded-md  object-contain"
                    />
                    <span className="text-xl font-bold text-violet-700">ResiDorm</span>
                    
                </div>
                {/* Show Home button on login/register/forgot-password pages */}
                {(route().current('login') || route().current('register') || route().current('password.request')) && (
                    <div className="flex items-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-violet-500 px-2 py-2 text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
                        >
                            <Home className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
