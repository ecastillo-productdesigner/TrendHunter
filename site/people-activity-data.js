import { PEOPLE } from './people-data.js';
import { COLLECTION_STORIES } from './collection-story-data.js';
import { collectionFollowActivity, interleaveCollectionFollows } from './people-collection-activity.js?v=2';

// Stable fictional public activity. The same rows drive display and unread signals,
// so capped collection-follow suggestions never leave an inaccessible red dot.
export function peopleActivityItems(followed, kind = 'all') {
  const follows = [];
  const groups = PEOPLE.filter(person => followed.includes(person.id) && (kind === 'all' || person.kind === kind)).map(person => {
    const rows = person.kind === 'creators'
      ? COLLECTION_STORIES.filter(story => story.authorId === person.id).map((story, index) => ({
          id: `${person.id}:${story.href}`, type: 'story', person, story, notify: index < 2,
          snapshot: { title: story.title, image: story.image, collections: story.collections.join(',') },
        }))
      : Object.entries(person.calls || {}).map(([predictionId, call], index) => ({
          id: `${person.id}:${predictionId}`, type: 'prediction', person, predictionId, call, notify: index === 0,
          snapshot: { call },
        }));
    const follow = collectionFollowActivity(person.id);
    if (follow) follows.push({ ...follow, type: 'collection-follow', person, notify: true, snapshot: { collection: follow.collection.href } });
    return rows;
  });
  const rows = Array.from({ length: Math.max(0, ...groups.map(group => group.length)) }, (_, i) => groups.map(group => group[i]).filter(Boolean)).flat();
  return interleaveCollectionFollows(rows, follows);
}
