import { useForm, usePage } from '@inertiajs/react';

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
      <header>
        <h2 className="text-lg font-medium text-gray-900">Profile Details</h2>
        <p className="mt-1 text-sm text-gray-600">Update your gender, intake session, faculty, interaction style, daily schedule and hobbies.</p>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium">Gender</label>
          <select
            className="mt-1 w-full border rounded p-2"
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
          <label className="block text-sm font-medium">Intake Session (e.g. 24/25)</label>
          <input
            className="mt-1 w-full border rounded p-2"
            placeholder="24/25"
            value={form.data.intake_session}
            onChange={(e) => form.setData('intake_session', e.target.value)}
          />
          {form.errors.intake_session && <p className="text-sm text-red-600">{form.errors.intake_session}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Faculty</label>
          <select
            className="mt-1 w-full border rounded p-2"
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
          <label className="block text-sm font-medium">Interaction Style</label>
          <select
            className="mt-1 w-full border rounded p-2"
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
          <label className="block text-sm font-medium">Daily Schedule</label>
          <select
            className="mt-1 w-full border rounded p-2"
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
          <label className="block text-sm font-medium mb-2">Hobbies</label>
          <div className="max-h-48 overflow-auto border rounded p-2 space-y-1">
            {hobbies.map(h => (
              <label key={h.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(form.data.hobby_ids || []).includes(h.id)}
                  onChange={(e) => toggleHobby(h.id, e.target.checked)}
                />
                <span className="capitalize">{h.name}</span>
              </label>
            ))}
            {hobbies.length === 0 && (
              <p className="text-sm text-gray-500">No hobbies available.</p>
            )}
          </div>
          {form.errors.hobby_ids && <p className="text-sm text-red-600">{form.errors.hobby_ids}</p>}
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          {form.recentlySuccessful && <p className="text-sm text-gray-600">Saved.</p>}
        </div>
      </form>
    </section>
  );
}
