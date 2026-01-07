import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
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
                        Forgot your password? No problem! Just provide your email address and we will email you a password reset link.
                    </p>
                </div>
            }
        >
            <Head title="Forgot Password" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="text-violet-900">
                <InputLabel htmlFor="email" value="Insert your email address:" />
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full border-violet-200 focus:border-violet-500 focus:ring-violet-500 px-2 py-2"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        Email Password Reset Link
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
