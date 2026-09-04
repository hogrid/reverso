import { mediaUrl } from '@reverso/client';
import { reverso } from '@/lib/reverso';

const FALLBACK_TEAM = [
  {
    name: 'Ada Lovelace',
    role: 'Lead Engineer',
    avatar: '/placeholder.jpg',
    bio: 'Builds the core of the platform and obsesses over correctness.',
  },
  {
    name: 'Alan Turing',
    role: 'Architect',
    avatar: '/placeholder.jpg',
    bio: 'Designs the systems that keep everything running smoothly.',
  },
];

/**
 * Repeater showcase: a team grid.
 * Markers use the `$` placeholder ONLY in the 3rd position and live INSIDE
 * the map callback. The repeater is read with items('showcase.team', ...).
 */
export async function TeamSection() {
  const page = await reverso.getPage('showcase');
  const members = page.items('showcase.team', FALLBACK_TEAM);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">Team (repeater)</h2>

      <div className="grid gap-6 sm:grid-cols-2">
        {members.map((member, index) => (
          <article
            key={`${member.name ?? 'member'}-${index}`}
            className="flex gap-4 rounded-lg border border-slate-100 p-4"
          >
            <img
              data-reverso="showcase.team.$.avatar"
              data-reverso-type="image"
              data-reverso-label="Avatar"
              src={mediaUrl(member.avatar, '/placeholder.jpg')}
              alt="Team member avatar"
              className="h-16 w-16 rounded-full object-cover"
            />
            <div>
              <h3
                data-reverso="showcase.team.$.name"
                data-reverso-type="text"
                data-reverso-label="Name"
                className="font-semibold"
              >
                {String(member.name ?? 'Team member')}
              </h3>
              <p
                data-reverso="showcase.team.$.role"
                data-reverso-type="text"
                data-reverso-label="Role"
                className="text-sm text-blue-600"
              >
                {String(member.role ?? 'Role')}
              </p>
              <p
                data-reverso="showcase.team.$.bio"
                data-reverso-type="textarea"
                data-reverso-label="Bio"
                className="mt-1 text-sm text-slate-600"
              >
                {String(member.bio ?? '')}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
