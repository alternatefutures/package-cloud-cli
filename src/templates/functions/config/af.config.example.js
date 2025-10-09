/**
 * Example Alternate Futures Function Configuration with Routing
 * @type {import('@alternatefutures/cli').AlternateFuturesFunctionConfig}
 */
module.exports = {
  name: 'my-gateway',
  type: 'function',
  routes: [
    {
      path: '/api/users/*',
      destination: 'https://users-service.com',
      methods: ['GET', 'POST'],
      preservePath: true,
      priority: 10,
    },
    {
      path: '/api/products/*',
      destination: 'https://products-service.com',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      priority: 20,
    },
    {
      path: '/*',
      destination: 'https://default.com',
      priority: 999, // Lower priority = fallback
    },
  ],
};
