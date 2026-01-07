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
                

                <div className="relative z-10">
                    <AppHeader />

                    {/* Body */}
                    <main className="mx-auto max-w-7xl px-6 min-h-[calc(100vh-5rem)] grid place-items-center">
                        <div className="relative inline-block max-w-2xl text-center mx-auto px-6 py-8">
                            <div className="absolute inset-0 -z-10 rounded-2xl bg-white/60 shadow-xl backdrop-blur-[2px]"></div>
                            <img
                                src="/images/residormumslogo.png"
                                alt="ResiDorm logo"
                                className="mx-auto mb-4 sm:mb-6 h-16 w-auto object-contain"
                            />
                            <h1 className="text-4xl font-extrabold tracking-tight text-violet-800 ">
                                Welcome to ResiDorm
                            </h1>
                            <p className="mt-6 text-base  leading-relaxed text-violet-800">
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
            </div>
        </>
    );
}
