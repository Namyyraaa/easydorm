import { Head, Link } from '@inertiajs/react';
import AppHeader from '@/Components/AppHeader';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="ResiDorm - Welcome" />
            <div
                className="relative min-h-screen text-violet-900 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/images/residormumspic.png')" }}
            >
                <AppHeader />

                {/* Body */}
                <main className="mx-auto max-w-7xl px-6 min-h-[calc(100vh-5rem)] grid place-items-center">
                    <div className="max-w-2xl text-center mx-auto">
                        <h1
                            className="text-4xl font-extrabold tracking-tight text-violet-800"
                            style={{ textShadow: '0 2px 4px rgba(255,255,255,0.9), 0 0 1px rgba(255,255,255,0.7)' }}
                        >
                            Welcome to ResiDorm
                        </h1>
                        <p
                            className="mt-6 text-base leading-relaxed text-violet-700"
                            style={{ textShadow: '0 1px 2px rgba(255,255,255,0.85)' }}
                        >
                            ResiDorm is a comprehensive dormitory management system that streamlines resident assignments,
                            room management, maintenance requests, events, fines, and notifications — empowering staff and residents
                            with a modern, efficient platform.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <Link
                                href={route('login')}
                                className="inline-flex items-center rounded-lg bg-violet-600 px-6 py-3 text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                            >
                                Log in
                            </Link>
                            <Link
                                href={route('register')}
                                className="inline-flex items-center rounded-lg border border-violet-300 bg-white px-6 py-3 text-violet-700 shadow-sm transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-300"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
