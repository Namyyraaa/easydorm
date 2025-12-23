import ApplicationLogo from '@/Components/ApplicationLogo';
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

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
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
                                        <NavLink href={route('staff.residents.index')} active={route().current('staff.residents.index')}>Residents</NavLink>
                                        <NavLink href={route('staff.maintenance.index')} active={route().current('staff.maintenance.index')}>Maintenance</NavLink>
                                        <NavLink href={route('staff.complaints.index')} active={route().current('staff.complaints.index')}>Complaints</NavLink>
                                        <NavLink href={route('staff.visitors.index')} active={route().current('staff.visitors.index')}>Visitors</NavLink>

                                        {(() => {
                                            const inventoryActive = route().current('staff.inventory.items.index') || route().current('staff.inventory.stock.index') || route().current('staff.inventory.transactions.index');
                                            const base = 'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none';
                                            const active = inventoryActive ? ' border-indigo-400 text-gray-900 focus:border-indigo-700' : ' border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-gray-300 focus:text-gray-700';
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
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                            >
                                                {user.name}

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
                                <ResponsiveNavLink href={route('staff.residents.index')} active={route().current('staff.residents.index')}>Residents</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.maintenance.index')} active={route().current('staff.maintenance.index')}>Maintenance</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.complaints.index')} active={route().current('staff.complaints.index')}>Complaints</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.visitors.index')} active={route().current('staff.visitors.index')}>Visitors</ResponsiveNavLink>
                                <div className="px-4 pt-2 font-semibold text-xs text-gray-500 uppercase">Inventory</div>
                                <ResponsiveNavLink href={route('staff.inventory.items.index')} active={route().current('staff.inventory.items.index')}>Items</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.inventory.stock.index')} active={route().current('staff.inventory.stock.index')}>Room Allocations</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.inventory.transactions.index')} active={route().current('staff.inventory.transactions.index')}>Transactions</ResponsiveNavLink>
                            </>
                        )}
                        {isStudent && (
                            <>
                                <ResponsiveNavLink href={route('student.maintenance.index')} active={route().current('student.maintenance.index')}>My Maintenance</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('student.complaints.index')} active={route().current('student.complaints.index')}>My Complaints</ResponsiveNavLink>
                            </>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
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
