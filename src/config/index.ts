export const config = {
  api: {
    baseUrl: 'https://del-qa-api.kebapp-chefs.com/graphql',
    graphql: '/graphql', // Changed to relative path for proxy
    maps: {
      tiles: 'https://maps.kebapp-chefs.com/styles/basic-preview/512/{z}/{x}/{y}.png'
    }
  }
} as const;