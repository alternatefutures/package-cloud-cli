/**
 * Example Alternate Futures Function Configuration with Routing
 * @type {import('@alternatefutures/cli').AlternateFuturesFunctionConfig}
 */
module.exports = {
  name: 'my-gateway',
  type: 'function',
  // Routes map path patterns to target URLs
  // Patterns support wildcards (*)
  // Routes are automatically prioritized (exact matches > specific paths > wildcards)
  routes: {
    '/api/users/*': 'https://users-service.com',
    '/api/products/*': 'https://products-service.com',
    '/api/*': 'https://api.example.com',
    '/*': 'https://default.com'
  },
};
