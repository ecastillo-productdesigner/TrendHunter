// Browser-local prototype discussion. Fixtures are fictional, not real community activity.
// Production requires a shared API with server-side authentication and moderation.
export const COMMENT_LIMIT = 1000;
export const COMMENT_USER = 'current-reader';
const PREFIX = 'trendhunter.comments.v1:';

export function sampleComments(story) {
  const entries = [
    ['alex-rivera', 'Alex Rivera', 'What would make this useful beyond the initial excitement? I’d like to see how people keep using it over time.', 2],
    ['morgan-lee', 'Morgan Lee', 'The everyday examples are what I find most interesting. Small changes can tell us a lot about where an idea is heading.', 3],
    ['jamie-park', 'Jamie Park', 'I’d be interested in a follow-up showing what changes over the next few months.', 1],
  ];
  return entries.map(([slug, name, text, likes], index) => ({
    id: `sample-${index}`, parentId: null, authorId: slug, name, text,
    avatar: `assets/readers/${slug}.png`, profile: `reader-${slug}.html`,
    createdAt: `2026-11-03T${12 + index}:00:00.000Z`, editedAt: null,
    likes, liked: false, deleted: false, reported: false,
  }));
}

export function createCommentStore({ storage, signedIn, name = () => 'Clementine', now = () => new Date().toISOString(), id = () => crypto.randomUUID() }) {
  const fail = code => { throw new Error(code); };
  function read(story) {
    let saved;
    try { saved = storage.getItem(PREFIX + story); } catch { return sampleComments(story); }
    if (saved === null) return sampleComments(story);
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item.id !== 'string' || typeof item.text !== 'string' || typeof item.authorId !== 'string' || !Number.isFinite(Date.parse(item.createdAt)))) fail('CORRUPT');
      return parsed;
    } catch { fail('READ_FAILED'); }
  }
  function mutate(story, change) {
    if (!signedIn()) fail('AUTH_REQUIRED');
    const comments = read(story);
    const result = change(comments);
    try { storage.setItem(PREFIX + story, JSON.stringify(comments)); }
    catch { fail('SAVE_FAILED'); }
    return result;
  }
  const textValue = value => {
    const text = String(value).trim();
    if (!text || text.length > COMMENT_LIMIT) fail('INVALID_TEXT');
    return text;
  };
  function find(comments, commentId) {
    return comments.find(item => item.id === commentId) || fail('NOT_FOUND');
  }
  function own(comments, commentId) {
    const item = find(comments, commentId);
    if (item.authorId !== COMMENT_USER || item.deleted) fail('NOT_ALLOWED');
    return item;
  }
  return {
    read,
    post(story, text, parentId = null) {
      return mutate(story, comments => {
        const value = textValue(text);
        if (parentId) {
          const parent = find(comments, parentId);
          if (parent.parentId || parent.deleted) fail('INVALID_PARENT');
        }
        const comment = { id: id(), parentId, authorId: COMMENT_USER, name: name().trim() || 'Clementine', text: value,
          avatar: 'assets/profile/avatar-clementine.png', profile: 'userprofile.html', createdAt: now(), editedAt: null,
          likes: 0, liked: false, deleted: false, reported: false };
        comments.push(comment);
        return comment;
      });
    },
    edit(story, commentId, text) {
      return mutate(story, comments => {
        const item = own(comments, commentId);
        item.text = textValue(text); item.editedAt = now();
      });
    },
    remove(story, commentId) {
      return mutate(story, comments => {
        const item = own(comments, commentId);
        // Retain a tombstone only when needed to preserve somebody else's replies.
        if (comments.some(reply => reply.parentId === item.id)) { item.deleted = true; item.text = ''; item.liked = false; }
        else {
          comments.splice(comments.indexOf(item), 1);
          const parent = comments.find(comment => comment.id === item.parentId);
          if (parent?.deleted && !comments.some(reply => reply.parentId === parent.id)) comments.splice(comments.indexOf(parent), 1);
        }
      });
    },
    like(story, commentId) {
      return mutate(story, comments => {
        const item = find(comments, commentId);
        if (item.deleted) fail('NOT_ALLOWED');
        item.liked = !item.liked;
      });
    },
    report(story, commentId) {
      return mutate(story, comments => {
        const item = find(comments, commentId);
        if (item.authorId === COMMENT_USER || item.deleted) fail('NOT_ALLOWED');
        item.reported = true;
      });
    },
  };
}
