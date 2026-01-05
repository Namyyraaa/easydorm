import { Head, Link } from '@inertiajs/react';
import AppHeader from '@/Components/AppHeader';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="ResiDorm - Welcome" />
            <div className="min-h-screen bg-violet-50 text-violet-900">
                <AppHeader />

                {/* Body */}
                <main className="mx-auto max-w-7xl px-6 py-16">
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                        {/* Left column */}
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-violet-800">
                                Welcome to ResiDorm
                            </h1>
                            <p className="mt-6 text-base leading-relaxed text-violet-700">
                                ResiDorm is a comprehensive dormitory management system that streamlines resident assignments,
                                room management, maintenance requests, events, fines, and notifications — empowering staff and residents
                                with a modern, efficient platform.
                            </p>
                            <div className="mt-8 flex items-center gap-4">
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

                        {/* Right column */}
                        <div className="relative">
                            <div className="aspect-[4/3] w-full rounded-xl border-2 border-dashed border-violet-300 bg-violet-100 flex items-center justify-center">
                                <span className="text-violet-500">Image Placeholder (PNG)</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
