/* eslint-disable */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow new Error()', category: 'Best Practices' },
    messages: {
      noRawError: `It's best to avoid raw Error() instances. Instead, use the custom errors found in @alveusgg/error. These can be handled, serialized and deserialized in the API and client without any additional work.`
    }
  },
  create(context) {
    return {
      NewExpression(node) {
        if (node.callee && node.callee.name === 'Error') {
          context.report({ node, messageId: 'noRawError' });
        }
      }
    };
  }
};
