import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Clock3,
  EyeOff,
  Flag,
  Globe2,
  LockKeyhole,
  MessageCircle,
  MessagesSquare,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
} from 'lucide-react';
import { EmptyState, Notice, Spinner } from '../components/Ui';
import { communityApi } from '../lib/api';

const TOPICS = [
  ['anxiety', 'Anxiety'],
  ['stress', 'Stress'],
  ['sleep', 'Sleep'],
  ['relationships', 'Relationships'],
  ['grief', 'Grief'],
  ['work-study', 'Work or study'],
  ['self-esteem', 'Self-esteem'],
  ['other', 'Other'],
];

const REPORT_REASONS = [
  ['unsafe', 'Unsafe content'],
  ['harassment', 'Harassment'],
  ['misinformation', 'Misinformation'],
  ['spam', 'Spam'],
  ['other', 'Other concern'],
];

const defaultDraft = {
  title: '',
  body: '',
  topic: 'stress',
  visibility: 'public',
  acknowledgedNotEmergency: false,
};

const formatDate = (value) => new Intl.DateTimeFormat('en-BD', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(value));

function ProfessionalStatus({ user }) {
  if (user.role !== 'therapist') {
    return (
      <div className="community-role-card">
        <span className="community-role-icon"><ShieldCheck size={20} /></span>
        <div><p className="font-semibold text-pine-950">A protected peer space</p><p className="mt-1 text-sm leading-6 text-slate-500">You can post and read support, but only a verified therapist can write the professional response.</p></div>
      </div>
    );
  }

  const verified = user.therapistProfile?.verificationStatus === 'verified';
  return (
    <div className={`community-role-card ${verified ? 'is-verified' : 'is-pending'}`}>
      <span className="community-role-icon"><UserRoundCheck size={20} /></span>
      <div>
        <p className="font-semibold text-pine-950">{verified ? 'Verified therapist access' : 'Professional verification pending'}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{verified ? 'You may provide the one professional response on an unanswered post.' : 'You can use the community as a member. Response tools unlock after a manual credential review.'}</p>
      </div>
    </div>
  );
}

function PostComposer({ draft, setDraft, onSubmit, submitting, expanded, onExpand, onCollapse }) {
  const update = (field) => (event) => setDraft((current) => ({
    ...current,
    [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
  }));

  if (!expanded) {
    return (
      <section id="community-composer" className="community-quick-composer card">
        <span className="community-composer-avatar" aria-hidden="true"><EyeOff size={19} /></span>
        <button type="button" className="community-composer-trigger" onClick={onExpand}>Share something anonymously...</button>
        <button type="button" className="community-composer-action" onClick={onExpand}><Plus size={16} /> Post</button>
      </section>
    );
  }

  return (
    <form id="community-composer" className="community-composer card" onSubmit={onSubmit}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div><p className="eyebrow">Share anonymously</p><h2 className="mt-2 section-title">What would you like support with?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Readers see a random alias—not your name or profile picture.</p></div>
        <div className="flex flex-wrap items-center gap-2"><span className="community-anonymous-pill"><EyeOff size={14} /> Anonymous to readers</span><button type="button" className="community-text-button" onClick={onCollapse}>Close</button></div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_0.55fr]">
        <div>
          <label className="field-label" htmlFor="community-title">Short title</label>
          <input id="community-title" className="field" maxLength="120" value={draft.title} onChange={update('title')} placeholder="What has been on your mind?" required />
        </div>
        <div>
          <label className="field-label" htmlFor="community-topic">Topic</label>
          <select id="community-topic" className="field" value={draft.topic} onChange={update('topic')}>{TOPICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3"><label className="field-label" htmlFor="community-body">Your message</label><span className="text-xs font-semibold text-slate-400">{draft.body.length}/3000</span></div>
        <textarea id="community-body" className="field min-h-36 resize-y" maxLength="3000" value={draft.body} onChange={update('body')} placeholder="Share only what feels safe. Avoid names, phone numbers, addresses, or other identifying details." required />
      </div>

      <fieldset className="mt-5">
        <legend className="field-label">Who may see this post?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`community-visibility-option ${draft.visibility === 'public' ? 'is-selected' : ''}`}><input className="sr-only" type="radio" name="community-visibility" value="public" checked={draft.visibility === 'public'} onChange={update('visibility')} /><Globe2 size={19} /><span><strong>Community</strong><small>All signed-in members and verified therapists</small></span></label>
          <label className={`community-visibility-option ${draft.visibility === 'private' ? 'is-selected' : ''}`}><input className="sr-only" type="radio" name="community-visibility" value="private" checked={draft.visibility === 'private'} onChange={update('visibility')} /><LockKeyhole size={19} /><span><strong>Private support</strong><small>Only you and verified therapists</small></span></label>
        </div>
      </fieldset>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
        <input className="mt-1 h-4 w-4 shrink-0" type="checkbox" checked={draft.acknowledgedNotEmergency} onChange={update('acknowledgedNotEmergency')} required />
        <span>I understand this is not emergency care and a therapist response is not guaranteed. If there is immediate danger, I will seek immediate local emergency help.</span>
      </label>

      <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <p className="max-w-xl text-xs leading-5 text-slate-500">MindHaven keeps your account link privately for ownership and safety controls. Do not include identifying details in the post itself.</p>
        <button className="primary-button shrink-0" type="submit" disabled={submitting}>{submitting ? <Spinner /> : <Send size={16} />}{submitting ? 'Publishing' : 'Publish anonymously'}</button>
      </div>
    </form>
  );
}

function TherapistResponse({ response }) {
  if (!response) return null;
  return (
    <div className="community-response">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pine-700 text-white"><BadgeCheck size={19} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-pine-950">{response.therapist?.name || 'Verified therapist'}</p><span className="community-verified-pill"><BadgeCheck size={12} /> Verified therapist</span></div>
          {(response.therapist?.specialization || response.therapist?.workplace) && <p className="mt-1 text-xs text-slate-500">{[response.therapist.specialization, response.therapist.workplace].filter(Boolean).join(' · ')}</p>}
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{response.body}</p>
          <p className="mt-3 text-xs text-slate-400">Responded {formatDate(response.respondedAt)}</p>
        </div>
      </div>
      <p className="mt-4 border-t border-pine-100 pt-3 text-xs leading-5 text-slate-500">General guidance only. This response does not create a therapist-client relationship or replace an assessment.</p>
    </div>
  );
}

function CommunityPostCard({ post, token, onChanged, notify }) {
  const [responseBody, setResponseBody] = useState('');
  const [responding, setResponding] = useState(false);
  const [reportReason, setReportReason] = useState('unsafe');
  const [error, setError] = useState('');
  const aliasInitials = post.anonymousAlias.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase();

  const changeVisibility = async () => {
    setError('');
    try {
      await communityApi.updatePost(token, post._id, { visibility: post.visibility === 'public' ? 'private' : 'public' });
      notify(post.visibility === 'public' ? 'Post is now visible only to you and verified therapists.' : 'Post is now visible to signed-in community members.');
      onChanged();
    } catch (requestError) { setError(requestError.message); }
  };

  const remove = async () => {
    if (!window.confirm('Delete this community post and its therapist response? This cannot be undone.')) return;
    setError('');
    try { await communityApi.deletePost(token, post._id); notify('Community post deleted.'); onChanged(); } catch (requestError) { setError(requestError.message); }
  };

  const respond = async (event) => {
    event.preventDefault();
    setResponding(true);
    setError('');
    try { await communityApi.respond(token, post._id, responseBody); setResponseBody(''); notify('Professional response published.'); onChanged(); } catch (requestError) { setError(requestError.message); } finally { setResponding(false); }
  };

  const report = async () => {
    setError('');
    try { const result = await communityApi.report(token, post._id, reportReason); notify(result.message); } catch (requestError) { setError(requestError.message); }
  };

  return (
    <article className="community-post-card card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-3"><span className="community-alias-avatar" aria-hidden="true">{aliasInitials}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-pine-950">{post.anonymousAlias}</p>{post.isOwner && <span className="community-owner-pill">Your post</span>}</div><p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span>{TOPICS.find(([value]) => value === post.topic)?.[1] || 'Other'}</span><span aria-hidden="true">•</span><span>{formatDate(post.createdAt)}</span></p></div></div>
        <span className={`community-visibility-pill ${post.visibility === 'private' ? 'is-private' : ''}`}>{post.visibility === 'private' ? <LockKeyhole size={13} /> : <Globe2 size={13} />}{post.visibility === 'private' ? 'Private support' : 'Community'}</span>
      </div>

      <h2 className="mt-5 text-xl font-semibold tracking-tight text-pine-950">{post.title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{post.body}</p>

      <div className="community-post-status"><span>{post.therapistResponse ? <BadgeCheck size={15} /> : <Clock3 size={15} />}{post.therapistResponse ? 'Answered by a verified therapist' : 'Waiting for a professional response'}</span><span><MessageCircle size={15} /> {post.therapistResponse ? '1 professional response' : 'No public comments'}</span></div>

      <TherapistResponse response={post.therapistResponse} />

      {post.canRespond && (
        <form className="community-response-form" onSubmit={respond}>
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-pine-950">Add the single professional response</p><p className="mt-1 text-xs text-slate-500">Once published, no other therapist can respond to this post.</p></div><UserRoundCheck size={20} className="shrink-0 text-pine-600" /></div>
          <textarea className="field mt-4 min-h-28 resize-y" maxLength="3000" value={responseBody} onChange={(event) => setResponseBody(event.target.value)} placeholder="Offer clear, bounded, non-diagnostic guidance and recommend appropriate care when needed." required />
          <div className="mt-3 flex justify-end"><button className="primary-button" type="submit" disabled={responding}>{responding ? <Spinner /> : <Send size={15} />}{responding ? 'Publishing' : 'Publish professional response'}</button></div>
        </form>
      )}

      {!post.therapistResponse && !post.canRespond && <div className="community-awaiting"><Clock3 size={16} /><span>Awaiting one verified therapist response. Members cannot comment.</span></div>}

      {error && <div className="mt-4"><Notice type="error">{error}</Notice></div>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {post.isOwner ? (
          <div className="flex flex-wrap gap-2"><button type="button" className="community-text-button" onClick={changeVisibility}>{post.visibility === 'public' ? <LockKeyhole size={14} /> : <Globe2 size={14} />}{post.visibility === 'public' ? 'Make private' : 'Make public'}</button><button type="button" className="community-text-button is-danger" onClick={remove}><Trash2 size={14} /> Delete</button></div>
        ) : (
          <div className="flex flex-wrap items-center gap-2"><select className="community-report-select" aria-label="Report reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)}>{REPORT_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" className="community-text-button" onClick={report}><Flag size={14} /> Report</button></div>
        )}
        <p className="text-xs text-slate-400">No public replies or direct messages</p>
      </div>
    </article>
  );
}

export default function CommunityPage({ token, user, notify }) {
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState(defaultDraft);
  const [scope, setScope] = useState('all');
  const [status, setStatus] = useState('all');
  const [topic, setTopic] = useState('all');
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const loadPosts = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const nextPosts = await communityApi.getPosts(token, { scope, status, ...(topic === 'all' ? {} : { topic }) });
      if (currentRequest === requestId.current) setPosts(nextPosts);
    } catch (requestError) {
      if (currentRequest === requestId.current) setError(requestError.message);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [scope, status, token, topic]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const publish = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await communityApi.createPost(token, draft);
      setDraft(defaultDraft);
      setScope('mine');
      setStatus('all');
      setTopic('all');
      setComposerExpanded(false);
      notify('Your anonymous community post is live.');
      await loadPosts();
    } catch (requestError) { setError(requestError.message); } finally { setSubmitting(false); }
  };

  const openComposer = () => {
    setComposerExpanded(true);
    window.setTimeout(() => document.getElementById('community-title')?.focus(), 0);
  };

  return (
    <div className="page-enter app-page community-page">
      <header className="community-feed-hero">
        <div className="community-feed-hero-icon"><MessagesSquare size={23} /></div>
        <div className="min-w-0 flex-1"><p className="eyebrow text-pine-100">MindHaven Community</p><h1>Anonymous support, guided by professionals.</h1><p>A calmer feed for sharing honestly and receiving one qualified perspective.</p></div>
        <button className="primary-button shrink-0" type="button" onClick={openComposer}><Plus size={16} /> New post</button>
      </header>

      {error && <div className="mt-5"><Notice type="error">{error}</Notice></div>}

      <div className="community-social-layout mt-5">
        <aside className="community-left-rail" aria-label="Community filters">
          <div className="community-rail-card card">
            <p className="community-rail-title">Your feed</p>
            <button type="button" className={`community-rail-link ${scope === 'all' ? 'is-active' : ''}`} onClick={() => setScope('all')}><MessagesSquare size={17} /> Community feed</button>
            <button type="button" className={`community-rail-link ${scope === 'mine' ? 'is-active' : ''}`} onClick={() => setScope('mine')}><EyeOff size={17} /> My anonymous posts</button>
          </div>
          <div className="community-rail-card card">
            <p className="community-rail-title">Browse topics</p>
            <button type="button" className={`community-topic-link ${topic === 'all' ? 'is-active' : ''}`} onClick={() => setTopic('all')}>All topics</button>
            {TOPICS.map(([value, label]) => <button key={value} type="button" className={`community-topic-link ${topic === value ? 'is-active' : ''}`} onClick={() => setTopic(value)}>{label}</button>)}
          </div>
        </aside>

        <main className="community-stream min-w-0" aria-labelledby="community-feed-heading">
          <PostComposer draft={draft} setDraft={setDraft} onSubmit={publish} submitting={submitting} expanded={composerExpanded} onExpand={openComposer} onCollapse={() => setComposerExpanded(false)} />
          <div className="community-stream-heading">
            <div><h2 id="community-feed-heading">{scope === 'mine' ? 'Your anonymous posts' : topic === 'all' ? 'Community feed' : TOPICS.find(([value]) => value === topic)?.[1]}</h2><p>{posts.length} {posts.length === 1 ? 'conversation' : 'conversations'}</p></div>
            <select className="community-filter" aria-label="Response status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Latest posts</option><option value="open">Awaiting response</option><option value="answered">Answered</option></select>
          </div>
          {loading ? <div className="card mt-3 flex min-h-52 items-center justify-center text-pine-700"><Spinner label="Loading community posts" /></div> : posts.length ? <div className="mt-3 space-y-3">{posts.map((post) => <CommunityPostCard key={post._id} post={post} token={token} notify={notify} onChanged={loadPosts} />)}</div> : <div className="card mt-3 p-5"><EmptyState symbol={<MessagesSquare size={22} />} title={scope === 'mine' ? 'You have not posted yet' : 'No conversations match this feed'} message={scope === 'mine' ? 'Start an anonymous post to ask for one professional perspective.' : 'Try a different topic or response filter.'} action={<button type="button" className="secondary-button" onClick={openComposer}><Plus size={15} /> Start a post</button>} /></div>}
        </main>

        <aside className="community-right-rail">
          <ProfessionalStatus user={user} />
          <div className="community-boundaries card">
            <p className="community-rail-title">How this space works</p>
            <ul><li><EyeOff size={16} /><span><strong>Anonymous by default</strong>Your name and picture stay hidden.</span></li><li><BadgeCheck size={16} /><span><strong>One qualified answer</strong>Only a verified therapist may respond.</span></li><li><ShieldCheck size={16} /><span><strong>No reply pile-ons</strong>No member comments or direct messages.</span></li></ul>
            <button type="button" className="secondary-button mt-4 w-full" onClick={openComposer}>Share anonymously</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
