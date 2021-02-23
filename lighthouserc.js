module.exports = {
  ci: {
    collect: {
      staticDistDir: './public/',
    },
    upload: {
      target: 'lhci',
      serverBaseUrl: 'https://lighthouse.ringodev.com',
      token: env.LHCI_TOKEN, 
    },
  },
};
