import React, { useEffect, useState } from 'react';
import api, { unwrapError } from '../utils/api';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

const EMPTY_SKILL = { name: '', proficiency: 50 };
const EMPTY_PROJECT = { title: '', description: '', technologies: '', url: '' };

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, rolesRes] = await Promise.all([api.get('/profile'), api.get('/roles')]);
        const p = profileRes.data.data.profile;
        setProfile({
          ...p,
          currentSkills: p.currentSkills?.length ? p.currentSkills : [{ ...EMPTY_SKILL }],
          projects: p.projects?.length ? p.projects : [],
        });
        setRoles(rolesRes.data.data.roles);
      } catch (err) {
        setError(unwrapError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateSkill(idx, field, value) {
    setProfile((prev) => {
      const skills = [...prev.currentSkills];
      skills[idx] = { ...skills[idx], [field]: field === 'proficiency' ? Number(value) : value };
      return { ...prev, currentSkills: skills };
    });
  }

  function addSkill() {
    setProfile((prev) => ({ ...prev, currentSkills: [...prev.currentSkills, { ...EMPTY_SKILL }] }));
  }

  function removeSkill(idx) {
    setProfile((prev) => ({ ...prev, currentSkills: prev.currentSkills.filter((_, i) => i !== idx) }));
  }

  function updateProject(idx, field, value) {
    setProfile((prev) => {
      const projects = [...prev.projects];
      projects[idx] = { ...projects[idx], [field]: value };
      return { ...prev, projects };
    });
  }

  function addProject() {
    setProfile((prev) => ({ ...prev, projects: [...prev.projects, { ...EMPTY_PROJECT }] }));
  }

  function removeProject(idx) {
    setProfile((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== idx) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        education: profile.education,
        bio: profile.bio,
        currentSkills: profile.currentSkills.filter((s) => s.name.trim()),
        projects: profile.projects.map((p) => ({
          ...p,
          technologies: Array.isArray(p.technologies)
            ? p.technologies
            : (p.technologies || '').split(',').map((t) => t.trim()).filter(Boolean),
        })),
        targetRole: profile.targetRole,
        experienceLevel: profile.experienceLevel,
      };
      const res = await api.put('/profile', payload);
      setProfile((prev) => ({ ...prev, ...res.data.data.profile }));
      setMessage('Profile saved.');
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20 text-brand-steel">Loading profile…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-brand-light">Your profile</h1>
      <p className="mt-1 text-sm text-brand-steel">
        Tell SkillForge about your background so we can generate an accurate skill-gap analysis.
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-brand-light">Basics</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-light">Education</label>
              <input
                type="text"
                value={profile.education || ''}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2.5 text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
                placeholder="e.g. B.S. Computer Science, expected 2027"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-light">Bio</label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2.5 text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
                placeholder="A short summary of your background and goals."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-light">Target role</label>
                <select
                  value={profile.targetRole || ''}
                  onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
                  className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2.5 text-brand-light focus:border-brand-orchid focus:outline-none"
                >
                  <option value="">Select a role…</option>
                  {roles.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-light">Experience level</label>
                <select
                  value={profile.experienceLevel || 'beginner'}
                  onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value })}
                  className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2.5 text-brand-light focus:border-brand-orchid focus:outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-light">Current skills</h2>
            <Button type="button" variant="secondary" onClick={addSkill}>
              + Add skill
            </Button>
          </div>
          <div className="space-y-3">
            {profile.currentSkills.map((skill, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-steel/20 p-3">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(idx, 'name', e.target.value)}
                  placeholder="Skill name (e.g. JavaScript)"
                  className="min-w-[160px] flex-1 rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={skill.proficiency}
                  onChange={(e) => updateSkill(idx, 'proficiency', e.target.value)}
                  className="w-32 accent-brand-orchid"
                  aria-label={`Proficiency for ${skill.name || 'skill'}`}
                />
                <span className="w-10 text-sm font-semibold text-brand-orchid">{skill.proficiency}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(idx)}
                  className="text-sm text-brand-steel hover:text-red-300"
                  aria-label="Remove skill"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-light">Projects</h2>
            <Button type="button" variant="secondary" onClick={addProject}>
              + Add project
            </Button>
          </div>
          <div className="space-y-4">
            {profile.projects.map((project, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border border-brand-steel/20 p-3">
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => updateProject(idx, 'title', e.target.value)}
                  placeholder="Project title"
                  className="w-full rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
                />
                <textarea
                  value={project.description}
                  onChange={(e) => updateProject(idx, 'description', e.target.value)}
                  placeholder="Short description"
                  rows={2}
                  className="w-full rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}
                    onChange={(e) => updateProject(idx, 'technologies', e.target.value)}
                    placeholder="Technologies (comma separated)"
                    className="flex-1 rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeProject(idx)}
                    className="text-sm text-brand-steel hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {profile.projects.length === 0 && (
              <p className="text-sm text-brand-steel">No projects added yet.</p>
            )}
          </div>
        </Card>

        {message && (
          <div className="rounded-lg border border-brand-orchid/40 bg-brand-orchid/10 px-3 py-2 text-sm text-brand-orchid">
            {message}
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </div>
  );
}
