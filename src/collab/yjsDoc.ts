// Y.Doc creation and shared type accessors
import * as Y from 'yjs';

let _doc: Y.Doc | null = null;

export function getOrCreateDoc(): Y.Doc {
  if (!_doc) _doc = new Y.Doc();
  return _doc;
}

export function getDoc(): Y.Doc | null {
  return _doc;
}

export function destroyDoc(): void {
  _doc?.destroy();
  _doc = null;
}

// Typed accessors for shared types
export function getNodesMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap('nodes') as Y.Map<Y.Map<unknown>>;
}

export function getEdgesMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap('edges') as Y.Map<Y.Map<unknown>>;
}

export function getSwimlanesMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('swimlanes');
}

export function getLegendsMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('legends');
}

export function getBannersMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('banners');
}

export function getLayersMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('layers');
}

export function getStylesMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('styles');
}

export function getMetaMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap('meta');
}
