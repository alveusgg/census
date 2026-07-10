import SuperJSON, { SuperJSONResult } from 'superjson';

const jsonResponses = new WeakSet<object>();

export const transformer = {
  serialize(object: Parameters<typeof SuperJSON.serialize>[0]): SuperJSONResult {
    if (typeof object === 'object' && object !== null && jsonResponses.has(object)) {
      return { json: object as SuperJSONResult['json'] };
    }

    return SuperJSON.serialize(object);
  },
  deserialize<T>(payload: SuperJSONResult): T {
    return SuperJSON.deserialize<T>(payload);
  }
};

/**
 * Mark a response as JSON-safe so it can skip SuperJSON's metadata traversal.
 * Dates in marked responses are serialized as ISO strings by JSON.stringify.
 */
export const jsonResponse = <T extends object>(response: T): T => {
  jsonResponses.add(response);
  return response;
};
