import { useForm, usePage } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function UpdateUserProfileDetailsForm({ className = '' }) {
  const { props } = usePage();
  const initial = props.profile || { gender: '', intake_session: '', faculty_id: '', interaction_style: '', daily_schedule: '' };
  const hobbies = props.hobbies || [];
  const userHobbies = (props.userHobbies || []).map(Number);
  const faculties = props.faculties || [];

  const form = useForm({
    gender: initial.gender || '',
    intake_session: initial.intake_session || '',
    faculty_id: initial.faculty_id || '',
    interaction_style: initial.interaction_style || '',
    daily_schedule: initial.daily_schedule || '',
    hobby_ids: userHobbies,
  });

  const submit = (e) => {
    e.preventDefault();
    form.patch(route('profile.details.update'));
  };

  const toggleHobby = (id, checked) => {
    if (checked) {
      form.setData('hobby_ids', Array.from(new Set([...(form.data.hobby_ids || []), id])));
    } else {
      form.setData('hobby_ids', (form.data.hobby_ids || []).filter(hid => hid !== id));
    }
  };

  return (
    <section className={className}>
      <div className="mx-auto max-w-3xl">
        <header>
          <h2 className="text-lg font-medium text-gray-900">Profile Details</h2>
          <p className="mt-1 text-sm text-gray-600">Update your gender, intake session, faculty, interaction style, daily schedule and hobbies.</p>
        </header>

        <form onSubmit={submit} className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            className="mt-1 w-full rounded border border-gray-300 shadow-sm text-sm p-2 focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
            value={form.data.gender}
            onChange={(e) => form.setData('gender', e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {form.errors.gender && <p className="text-sm text-red-600">{form.errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Intake Session (e.g. 24/25)</label>
          <input
            className="mt-1 w-full rounded border border-gray-300 shadow-sm text-sm p-2 focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
            placeholder="24/25"
            value={form.data.intake_session}
            onChange={(e) => form.setData('intake_session', e.target.value)}
          />
          {form.errors.intake_session && <p className="text-sm text-red-600">{form.errors.intake_session}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Faculty</label>
          <select
            className="mt-1 w-full rounded border border-gray-300 shadow-sm text-sm p-2 focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
            value={form.data.faculty_id}
            onChange={(e) => form.setData('faculty_id', e.target.value)}
          >
            <option value="">Select faculty</option>
            {faculties.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
            ))}
          </select>
          {form.errors.faculty_id && <p className="text-sm text-red-600">{form.errors.faculty_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Interaction Style</label>
          <select
            className="mt-1 w-full rounded border border-gray-300 shadow-sm text-sm p-2 focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
            value={form.data.interaction_style}
            onChange={(e) => form.setData('interaction_style', e.target.value)}
          >
            <option value="">Select interaction style</option>
            <option value="quiet_and_independent">Quiet and Independent</option>
            <option value="friendly_and_interactive">Friendly and Interactive</option>
            <option value="flexible">Flexible</option>
          </select>
          {form.errors.interaction_style && <p className="text-sm text-red-600">{form.errors.interaction_style}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Daily Schedule</label>
          <select
            className="mt-1 w-full rounded border border-gray-300 shadow-sm text-sm p-2 focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
            value={form.data.daily_schedule}
            onChange={(e) => form.setData('daily_schedule', e.target.value)}
          >
            <option value="">Select daily schedule</option>
            <option value="consistent">Consistent</option>
            <option value="variable">Variable</option>
          </select>
          {form.errors.daily_schedule && <p className="text-sm text-red-600">{form.errors.daily_schedule}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies</label>
          <div className="border rounded p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {hobbies.map(h => {
                const selected = (form.data.hobby_ids || []).includes(h.id);
                return (
                  <button
                    key={h.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleHobby(h.id, !selected)}
                    className={`h-9 w-full inline-flex items-center justify-center rounded border text-sm transition-shadow focus:outline-none hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1 ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  >
                    <span className="capitalize">{h.name}</span>
                  </button>
                );
              })}
              {hobbies.length === 0 && (
                <p className="text-sm text-gray-500">No hobbies available.</p>
              )}
            </div>
          </div>
          {form.errors.hobby_ids && <p className="text-sm text-red-600">{form.errors.hobby_ids}</p>}
        </div>

        <div className="flex items-center gap-4">
          <PrimaryButton disabled={form.processing}>Save</PrimaryButton>
          {form.recentlySuccessful && <p className="text-sm text-gray-600">Saved.</p>}
        </div>
      </form>
      </div>
    </section>
  );
}
