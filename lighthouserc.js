module.exports = {
  ci: {
    collect: {
      staticDistDir: './public/',
    },
    upload: {
      target: 'lhci',
      serverBaseUrl: 'https://lighthouse.ringodev.com',
      token: process.env.LHCI_TOKEN,
      basicAuth: {
        username: process.env.LHCI_USERNAME,
        password: process.env.LHCI_PASSWORD
      }
    },
  },
};
