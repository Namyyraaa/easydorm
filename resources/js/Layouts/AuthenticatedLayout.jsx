import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    // Role flags from shared props
    const isSuperAdmin = !!auth.isSuperAdmin;
    const isStaff = !!auth.isStaff;
    const isStudent = !!auth.isStudent;
    const isJakmas = !!auth.isJakmas;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    // Display only the first two words of the user's name
    const displayName = (() => {
        const full = (user?.name || '').trim();
        const words = full.split(/\s+/).filter(Boolean);
        return words.slice(0, 2).join(' ');
    })();

    return (
        <div className="min-h-screen bg-violet-50 text-violet-900">
            <nav className="border-b border-violet-200 bg-white/80 backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/" className="flex items-center gap-3">
                                    <img
                                        src="/images/residormumslogo.png"
                                        alt="ResiDorm logo"
                                        className="h-9 w-auto rounded-md  object-contain"
                                    />
                                    <span className="text-lg font-bold text-violet-700">ResiDorm</span>
                                </Link>
                            </div>

                            <div className="hidden space-x-6 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink href={route('dashboard')} active={route().current('dashboard')}>Dashboard</NavLink>
                                {isSuperAdmin && (
                                    <>
                                        <NavLink href={route('admin.dorms.index')} active={route().current('admin.dorms.index')}>Dorms</NavLink>
                                        <NavLink href={route('admin.inventory.categories.index')} active={route().current('admin.inventory.categories.index')}>Inventory Categories</NavLink>
                                    </>
                                )}
                                {isStaff && (
                                    <>
                                        {(() => {
                                            const residentsActive = route().current('staff.residents.list') || route().current('staff.residents.assignPage');
                                            const base = 'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none';
                                            const active = residentsActive
                                                ? ' border-violet-400 text-violet-900 focus:border-violet-700'
                                                : ' border-transparent text-gray-500 hover:border-violet-300 hover:text-violet-700 focus:border-violet-500 focus:text-violet-900';
                                            return (
                                                <div className={base + active}>
                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button type="button" className="inline-flex items-center text-sm font-medium leading-5 text-inherit focus:outline-none h-16 cursor-pointer">
                                                                Residents
                                                                <svg className="-me-0.5 ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </Dropdown.Trigger>
                                                        <Dropdown.Content>
                                                            <Dropdown.Link href={route('staff.residents.list')}>Residents List</Dropdown.Link>
                                                            <Dropdown.Link href={route('staff.residents.assignPage')}>Resident Assignment</Dropdown.Link>
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </div>
                                            );
                                        })()}
                                        <NavLink href={route('staff.maintenance.index')} active={route().current('staff.maintenance.index')}>Maintenance</NavLink>
                                        <NavLink href={route('staff.complaints.index')} active={route().current('staff.complaints.index')}>Complaints</NavLink>
                                        {(() => {
                                            const finesActive = route().current('staff.fines.index') || route().current('staff.fineAppeals.index');
                                            const base = 'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none';
                                            const active = finesActive
                                                ? ' border-violet-400 text-violet-900 focus:border-violet-700'
                                                : ' border-transparent text-gray-500 hover:border-violet-300 hover:text-violet-700 focus:border-violet-500 focus:text-violet-900';
                                            return (
                                                <div className={base + active}>
                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button type="button" className="inline-flex items-center text-sm font-medium leading-5 text-inherit focus:outline-none h-16 cursor-pointer">
                                                                Fines
                                                                <svg className="-me-0.5 ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </Dropdown.Trigger>
                                                        <Dropdown.Content>
                                                            <Dropdown.Link href={route('staff.fines.index', { tab: 'list' })}>Fine List</Dropdown.Link>
                                                            <Dropdown.Link href={route('staff.fineAppeals.index')}>Fine Appeals</Dropdown.Link>
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </div>
                                            );
                                        })()}
                                        <NavLink href={route('staff.visitors.index')} active={route().current('staff.visitors.index')}>Visitors</NavLink>
                                        <NavLink href={route('staff.events.index')} active={route().current('staff.events.index')}>Events</NavLink>
                                        <NavLink href={route('staff.jakmas.index')} active={route().current('staff.jakmas.index')}>JAKMAS</NavLink>

                                        {(() => {
                                            const inventoryActive = route().current('staff.inventory.items.index') || route().current('staff.inventory.stock.index') || route().current('staff.inventory.transactions.index');
                                            const base = 'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none';
                                            const active = inventoryActive
                                                ? ' border-violet-400 text-violet-900 focus:border-violet-700'
                                                : ' border-transparent text-gray-500 hover:border-violet-300 hover:text-violet-700 focus:border-violet-500 focus:text-violet-900';
                                            return (
                                                <div className={base + active}>
                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button type="button" className="inline-flex items-center text-sm font-medium leading-5 text-inherit focus:outline-none h-16 cursor-pointer">
                                                                Inventory
                                                                <svg className="-me-0.5 ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </Dropdown.Trigger>
                                                        <Dropdown.Content>
                                                            <Dropdown.Link href={route('staff.inventory.items.index')}>Items</Dropdown.Link>
                                                            <Dropdown.Link href={route('staff.inventory.stock.index')}>Room Allocations</Dropdown.Link>
                                                            <Dropdown.Link href={route('staff.inventory.transactions.index')}>Transactions</Dropdown.Link>
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </div>
                                            );
                                        })()}
                                    </>
                                )}
                                {isStudent && (
                                    <>
                                        <NavLink href={route('student.maintenance.index')} active={route().current('student.maintenance.index')}>My Maintenance</NavLink>
                                        <NavLink href={route('student.complaints.index')} active={route().current('student.complaints.index')}>My Complaints</NavLink>
                                        <NavLink href={route('student.fines.index')} active={route().current('student.fines.index')}>My Fines</NavLink>
                                        {isJakmas ? (
                                            (() => {
                                                const eventsActive = route().current('student.events.index') || route().current('jakmas.events.index');
                                                const base = 'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none';
                                                const active = eventsActive
                                                    ? ' border-violet-400 text-violet-900 focus:border-violet-700'
                                                    : ' border-transparent text-gray-500 hover:border-violet-300 hover:text-violet-700 focus:border-violet-500 focus:text-violet-900';
                                                return (
                                                    <div className={base + active}>
                                                        <Dropdown>
                                                            <Dropdown.Trigger>
                                                                <button type="button" className="inline-flex items-center text-sm font-medium leading-5 text-inherit focus:outline-none h-16 cursor-pointer">
                                                                    Events
                                                                    <svg className="-me-0.5 ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </Dropdown.Trigger>
                                                            <Dropdown.Content>
                                                                <Dropdown.Link href={route('student.events.index')}>Event List</Dropdown.Link>
                                                                <Dropdown.Link href={route('jakmas.events.index')}>JAKMAS Events</Dropdown.Link>
                                                            </Dropdown.Content>
                                                        </Dropdown>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <NavLink href={route('student.events.index')} active={route().current('student.events.index')}>Events</NavLink>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-violet-700 transition duration-150 ease-in-out hover:text-violet-900 focus:outline-none"
                                            >
                                                <span className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">{displayName}</span>

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <div className="px-3 py-2 w-52 whitespace-normal break-words text-sm font-medium text-violet-800 border-b border-violet-200">
                                            {user.name}
                                        </div>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>Dashboard</ResponsiveNavLink>
                        {isSuperAdmin && (
                            <>
                                <ResponsiveNavLink href={route('admin.dorms.index')} active={route().current('admin.dorms.index')}>Dorms</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('admin.inventory.categories.index')} active={route().current('admin.inventory.categories.index')}>Inventory Categories</ResponsiveNavLink>
                            </>
                        )}
                        {isStaff && (
                            <>
                                <div className="px-4 pt-2 font-semibold text-xs text-violet-600 uppercase">Residents</div>
                                <ResponsiveNavLink href={route('staff.residents.list')} active={route().current('staff.residents.list')}>Residents List</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.residents.assignPage')} active={route().current('staff.residents.assignPage')}>Resident Assignment</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.maintenance.index')} active={route().current('staff.maintenance.index')}>Maintenance</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.complaints.index')} active={route().current('staff.complaints.index')}>Complaints</ResponsiveNavLink>
                                <div className="px-4 pt-2 font-semibold text-xs text-violet-600 uppercase">Fines</div>
                                <ResponsiveNavLink href={route('staff.fines.index', { tab: 'list' })} active={route().current('staff.fines.index')}>Fine List</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.fineAppeals.index')} active={route().current('staff.fineAppeals.index')}>Fine Appeals</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.visitors.index')} active={route().current('staff.visitors.index')}>Visitors</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.events.index')} active={route().current('staff.events.index')}>Events</ResponsiveNavLink>
                                <div className="px-4 pt-2 font-semibold text-xs text-violet-600 uppercase">Inventory</div>
                                <ResponsiveNavLink href={route('staff.inventory.items.index')} active={route().current('staff.inventory.items.index')}>Items</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.inventory.stock.index')} active={route().current('staff.inventory.stock.index')}>Room Allocations</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.inventory.transactions.index')} active={route().current('staff.inventory.transactions.index')}>Transactions</ResponsiveNavLink>
                            </>
                        )}
                        {isStudent && (
                            <>
                                <ResponsiveNavLink href={route('student.maintenance.index')} active={route().current('student.maintenance.index')}>My Maintenance</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('student.complaints.index')} active={route().current('student.complaints.index')}>My Complaints</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('student.fines.index')} active={route().current('student.fines.index')}>My Fines</ResponsiveNavLink>
                                {isJakmas ? (
                                    <>
                                        <div className="px-4 pt-2 font-semibold text-xs text-violet-600 uppercase">Events</div>
                                        <ResponsiveNavLink href={route('student.events.index')} active={route().current('student.events.index')}>Event List</ResponsiveNavLink>
                                        <ResponsiveNavLink href={route('jakmas.events.index')} active={route().current('jakmas.events.index')}>JAKMAS Events</ResponsiveNavLink>
                                    </>
                                ) : (
                                    <ResponsiveNavLink href={route('student.events.index')} active={route().current('student.events.index')}>Events</ResponsiveNavLink>
                                )}
                            </>
                        )}
                    </div>

                    <div className="border-t border-violet-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-violet-800">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-violet-600">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
