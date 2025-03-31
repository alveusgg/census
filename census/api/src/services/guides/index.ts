import { NotFoundError, ProcessingError } from '@alveusgg/error';
import { RoomSnapshot } from '@tldraw/sync-core';
import { TLStoreSnapshot } from '@tldraw/tlschema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { documents, guides } from '../../db/schema/guides.js';
import { useDB } from '../../db/transaction.js';
import { useUser } from '../../utils/env/env.js';

export const getGuideBySlug = async (slug: string) => {
  const db = useDB();
  const guide = await db.query.guides.findFirst({
    where: eq(guides.slug, slug),
    with: {
      published: true,
      draft: true
    }
  });
  if (!guide) {
    throw new NotFoundError('Guide with that slug not found');
  }
  return guide;
};

export const getGuideById = async (id: string) => {
  const db = useDB();
  const guide = await db.query.guides.findFirst({
    where: eq(guides.id, id),
    with: {
      draft: true,
      published: true
    }
  });
  return guide;
};

export const getDocumentById = async (id: string) => {
  const db = useDB();
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, id)
  });
  if (!document) {
    throw new NotFoundError('Document not found');
  }
  return document;
};

export const updateDocument = async (id: string, snapshot: RoomSnapshot) => {
  const db = useDB();
  await db.update(documents).set({ content: snapshot }).where(eq(documents.id, id));
};

export const createDraft = async (guideId: string) => {
  const user = useUser();
  const db = useDB();
  const id = randomUUID();

  const [draft] = await db
    .insert(documents)
    .values({
      id,
      guideId,
      contributorIds: [user.id]
    })
    .returning();

  if (!draft) {
    throw new ProcessingError('Failed to create draft');
  }

  return draft;
};

interface CreateGuideParams {
  title: string;
  description: string;
}

export const createGuide = async (slug: string, params: CreateGuideParams) => {
  const db = useDB();
  const id = randomUUID();

  return await db.transaction(async tx => {
    const draft = await createDraft(id);
    const [guide] = await tx
      .insert(guides)
      .values({
        id,
        slug,
        ...params,
        draftDocumentId: draft.id
      })
      .returning();

    return guide;
  });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const publishGuide = async (guideId: string) => {
  const db = useDB();
  const guide = await db.query.guides.findFirst({
    where: eq(guides.id, guideId),
    with: {
      draft: true,
      published: true
    }
  });
  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  // The worker based sync persistance is debounced by 5 seconds
  // We need to wait for the debounced sync to complete before publishing
  // Just in case any changes are made to the guide while it's being published
  await wait(5_000);

  return await db.transaction(async tx => {
    if (guide.published) {
      const [published] = await tx
        .update(documents)
        .set({
          content: guide.draft.content
        })
        .where(eq(documents.id, guide.published.id))
        .returning();

      return published;
    }

    const [published] = await tx
      .insert(documents)
      .values({
        ...guide.draft,
        id: randomUUID()
      })
      .returning();

    await tx
      .update(guides)
      .set({
        publishedDocumentId: published.id
      })
      .where(eq(guides.id, guide.id));

    return published;
  });
};

export const convertRoomSnapshotToStoreSnapshot = (snapshot: RoomSnapshot): TLStoreSnapshot => {
  return {
    store: Object.fromEntries(snapshot.documents.map(d => [d.state.id, d.state])),
    schema: snapshot.schema!
  } as TLStoreSnapshot;
};
