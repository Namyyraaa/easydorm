import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            top={
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center gap-3 pb-2">
                        <img
                            src="/images/residormumslogo.png"
                            alt="ResiDorm logo"
                            className="h-14 w-auto object-contain"
                        />
                        <span className="text-2xl font-extrabold tracking-tight text-violet-800">
                            ResiDorm
                        </span>
                    </div>
                    <p className="text-sm text-violet-800">
                        Sign in to manage dorm life, maintenance, events, and more.
                    </p>
                </div>
            }
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-violet-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="text-violet-900">
                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full border-violet-200 focus:border-violet-500 focus:ring-violet-500 px-2 py-2"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full border-violet-200 focus:border-violet-500 focus:ring-violet-500 px-2 py-2"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-violet-700">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-violet-700 underline hover:text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton
                        className="ms-4 bg-violet-600 hover:bg-violet-700 focus:bg-violet-700 focus:ring-violet-400"
                        disabled={processing}
                    >
                        Log in
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
