import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-violet-400 text-violet-900 focus:border-violet-700'
                    : 'border-transparent text-gray-500 hover:border-violet-300 hover:text-violet-700 focus:border-violet-500 focus:text-violet-900') +
                className
            }
        >
            {children}
        </Link>
    );
}
