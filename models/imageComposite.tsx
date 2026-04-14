import { db } from "../app-firebase";
import {
  query,
  collection,
  doc,
  where,
  limit,
  orderBy,
  OrderByDirection,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  QuerySnapshot,
  DocumentData,
  startAfter,
  startAt,
} from "firebase/firestore";
import { Projects } from "./project";
import { Collections } from "./collection";
import Trait from "./trait";
import TraitValue from "./traitValue";
import ImageLayer from "./imageLayer";
import { ImageCompositeGroups } from "./imageCompositeGroup";

export default interface ImageComposite {
  id: string;
  externalURL: string | null;
  traits: TraitValuePair[];
  traitsHash: string;
  additionalMetadataEntries: { [attributeTitle: string]: string };
}

export interface TraitValuePair {
  trait: Trait;
  traitValue: TraitValue | null;
  imageLayer: ImageLayer | null;
}

export namespace ImageComposites {
  export const FB_COLLECTION_NAME = "composites";

  export async function all(
    projectId: string,
    collectionId: string,
    compositeGroupId: string
  ): Promise<Array<any>> {
    const limit = 500;
    const initialData = await paginated(projectId, collectionId, compositeGroupId, limit, null);

    let batchSize:number = initialData.docs.length;
    let lastItem = initialData.docs[batchSize - 1];

    const results = [initialData.docs];

    while (batchSize === limit) {
      console.log(batchSize);
      const result = await paginated(projectId, collectionId, compositeGroupId, limit, lastItem);
      results.push(result.docs);
      // Get ready for the next loop
      lastItem = result.docs[batchSize - 1];
      batchSize = result.docs.length;
    }
  
    const composites = results.map((compositeDocs) => {
      return compositeDocs.map((compositeDoc) => {
        const composite = compositeDoc.data();
        composite.id = compositeDoc.id;
        return composite;
      });
    }).flat();

    return composites;
  }

  export async function paginated(
    projectId: string,
    collectionId: string,
    compositeGroupId: string,
    perPage: number,
    offset: DocumentData | null,
  ): Promise<QuerySnapshot<DocumentData>> {
    const compositesQuery = query(
      collection(
        db,
        Projects.FB_COLLECTION_NAME +
          "/" +
          projectId +
          "/" +
          Collections.FB_COLLECTION_NAME +
          "/" +
          collectionId +
          "/" +
          ImageCompositeGroups.FB_COLLECTION_NAME +
          "/" +
          compositeGroupId +
          "/" +
          FB_COLLECTION_NAME
      ),
      orderBy('externalURL'),
      limit(perPage),
      startAt(offset),
    );

    return getDocs(compositesQuery);
  }

  export async function withId(
    id: string,
    projectId: string,
    collectionId: string,
    compositeGroupId: string
  ): Promise<ImageComposite> {
    const compositeDocRef = doc(
      db,
      Projects.FB_COLLECTION_NAME +
        "/" +
        projectId +
        "/" +
        Collections.FB_COLLECTION_NAME +
        "/" +
        collectionId +
        "/" +
        ImageCompositeGroups.FB_COLLECTION_NAME +
        "/" +
        compositeGroupId +
        "/" +
        FB_COLLECTION_NAME +
        "/" +
        id
    );

    let compositeDoc = await getDoc(compositeDocRef);

    let composite = compositeDoc.data() as ImageComposite;
    composite.id = compositeDoc.id;
    return composite;
  }

  export async function create(
    imageComposite: ImageComposite,
    projectId: string,
    collectionId: string,
    compositeGroupId: string
  ): Promise<ImageComposite> {
    const docQuery = collection(
      db,
      Projects.FB_COLLECTION_NAME +
        "/" +
        projectId +
        "/" +
        Collections.FB_COLLECTION_NAME +
        "/" +
        collectionId +
        "/" +
        ImageCompositeGroups.FB_COLLECTION_NAME +
        "/" +
        compositeGroupId +
        "/" +
        FB_COLLECTION_NAME
    );

    let docRef = await addDoc(docQuery, imageComposite);

    return {
      ...imageComposite,
    } as ImageComposite;
  }

  export async function update(
    updates: { [x: string]: any },
    id: string,
    projectId: string,
    collectionId: string,
    compositeGroupId: string
  ): Promise<void> {
    const docRef = doc(
      db,
      Projects.FB_COLLECTION_NAME +
        "/" +
        projectId +
        "/" +
        Collections.FB_COLLECTION_NAME +
        "/" +
        collectionId +
        "/" +
        ImageCompositeGroups.FB_COLLECTION_NAME +
        "/" +
        compositeGroupId +
        "/" +
        FB_COLLECTION_NAME +
        "/" +
        id
    );

    return await updateDoc(docRef, updates);
  }

  export async function remove(
    id: string,
    projectId: string,
    collectionId: string,
    compositeGroupId: string
  ) {
    const docRef = doc(
      db,
      Projects.FB_COLLECTION_NAME +
        "/" +
        projectId +
        "/" +
        Collections.FB_COLLECTION_NAME +
        "/" +
        collectionId +
        "/" +
        ImageCompositeGroups.FB_COLLECTION_NAME +
        "/" +
        compositeGroupId +
        "/" +
        FB_COLLECTION_NAME +
        "/" +
        id
    );
    return await deleteDoc(docRef);
  }
}
