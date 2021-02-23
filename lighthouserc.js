module.exports = {
  ci: {
    collect: {
      staticDistDir: './public/',
    },
    upload: {
      target: 'lhci',
      serverBaseUrl: 'https://your-lhci-server-url.example.com',
      token: LHCI_TOKEN, 
    },
  },
};
