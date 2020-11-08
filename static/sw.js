const CACHE_VERSION = 1.2;

const BASE_CACHE_FILES = [
    '/css/styles.css',
    '/css/blue_theme.css',
    '/manifest.json',
    '/img/logo/favicon.ico',
    '/img/logo.png',
];

const OFFLINE_CACHE_FILES = [
    '/img/logo.png',
];

const NOT_FOUND_CACHE_FILES = [];

const OFFLINE_PAGE = '/index.html';
const NOT_FOUND_PAGE = '/index.html';

const CACHE_VERSIONS = {
    assets: 'assets-v' + CACHE_VERSION,
    content: 'content-v' + CACHE_VERSION,
    offline: 'offline-v' + CACHE_VERSION,
    notFound: '404-v' + CACHE_VERSION,
};

// Define MAX_TTL's in SECONDS for specific file extensions
const MAX_TTL = {
    '/': 3600,
    html: 3600,
    json: 86400,
    js: 86400,
    css: 86400,
};

const CACHE_BLACKLIST = [
    (str) => {
        return !(str.startsWith('https://ringodev.com') || str.startsWith('https://www.ringodev.com'));
    },
];

const SUPPORTED_METHODS = [
    'GET',
];

/**
 * isBlackListed
 * @param {string} url
 * @returns {boolean}
 */
function isBlacklisted(url) {
    return (CACHE_BLACKLIST.length > 0) ? !CACHE_BLACKLIST.filter((rule) => {
        if (typeof rule === 'function') {
            return !rule(url);
        } else {
            return false;
        }
    }).length : false
}

/**
 * getFileExtension
 * @param {string} url
 * @returns {string}
 */
function getFileExtension(url) {
    let extension = url.split('.').reverse()[0].split('?')[0];
    return (extension.endsWith('/')) ? '/' : extension;
}

/**
 * getTTL
 * @param {string} url
 */
function getTTL(url) {
    if (typeof url === 'string') {
        let extension = getFileExtension(url);
        if (typeof MAX_TTL[extension] === 'number') {
            return MAX_TTL[extension];
        } else {
            return null;
        }
    } else {
        return null;
    }
}

/**
 * installServiceWorker
 * @returns {Promise}
 */
function installServiceWorker() {
    return Promise.all(
        [
            caches.open(CACHE_VERSIONS.assets)
                .then(
                    (cache) => {
                        return cache.addAll(BASE_CACHE_FILES);
                    }
                ),
            caches.open(CACHE_VERSIONS.offline)
                .then(
                    (cache) => {
                        return cache.addAll(OFFLINE_CACHE_FILES);
                    }
                ),
            caches.open(CACHE_VERSIONS.notFound)
                .then(
                    (cache) => {
                        return cache.addAll(NOT_FOUND_CACHE_FILES);
                    }
                )
        ]
    );
}

/**
 * cleanupLegacyCache
 * @returns {Promise}
 */
function cleanupLegacyCache() {

    let currentCaches = Object.keys(CACHE_VERSIONS)
        .map(
            (key) => {
                return CACHE_VERSIONS[key];
            }
        );

    return new Promise(
        (resolve, reject) => {

            caches.keys()
                .then(
                    (keys) => {
                        return legacyKeys = keys.filter(
                            (key) => {
                                return !~currentCaches.indexOf(key);
                            }
                        );
                    }
                )
                .then(
                    (legacy) => {
                        if (legacy.length) {
                            Promise.all(
                                legacy.map(
                                    (legacyKey) => {
                                        return caches.delete(legacyKey)
                                    }
                                )
                            )
                                .then(
                                    () => {
                                        resolve()
                                    }
                                )
                                .catch(
                                    (err) => {
                                        reject(err);
                                    }
                                );
                        } else {
                            resolve();
                        }
                    }
                )
                .catch(
                    () => {
                        reject();
                    }
                );

        }
    );
}


self.addEventListener(
    'install', event => {
        event.waitUntil(installServiceWorker());
    }
);

// The activate handler takes care of cleaning up old caches.
self.addEventListener(
    'activate', event => {
        event.waitUntil(
            Promise.all(
                [
                    cleanupLegacyCache(),
                ]
            )
                .catch(
                    (err) => {
                        event.skipWaiting();
                    }
                )
        );
    }
);

self.addEventListener(
    'fetch', event => {
        event.respondWith(
            caches.open(CACHE_VERSIONS.content)
                .then(
                    (cache) => {
                        return cache.match(event.request)
                            .then(
                                (response) => {
                                    if (response) {
                                        let headers = response.headers.entries();
                                        let date = null;
                                        for (let pair of headers) {
                                            if (pair[0] === 'date') {
                                                date = new Date(pair[1]);
                                            }
                                        }
                                        if (date) {
                                            let age = parseInt((new Date().getTime() - date.getTime()) / 1000);
                                            let ttl = getTTL(event.request.url);
                                            if (ttl && age > ttl) {
                                                return new Promise(
                                                    (resolve) => {
                                                        return fetch(event.request)
                                                            .then(
                                                                (updatedResponse) => {
                                                                    if (updatedResponse) {
                                                                        cache.put(event.request, updatedResponse.clone());
                                                                        resolve(updatedResponse);
                                                                    } else {
                                                                        resolve(response)
                                                                    }
                                                                }
                                                            )
                                                            .catch(
                                                                () => {
                                                                    resolve(response);
                                                                }
                                                            );
                                                    }
                                                )
                                                    .catch(
                                                        (err) => {
                                                            return response;
                                                        }
                                                    );
                                            } else {
                                                return response;
                                            }
                                        } else {
                                            return response;
                                        }
                                    } else {
                                        return null;
                                    }
                                }
                            )
                            .then(
                                (response) => {
                                    if (response) {
                                        return response;
                                    } else {
                                        return fetch(event.request)
                                            .then(
                                                (response) => {
                                                    if (response.status < 400) {
                                                        if (~SUPPORTED_METHODS.indexOf(event.request.method) && !isBlacklisted(event.request.url)) {
                                                            cache.put(event.request, response.clone());
                                                        }
                                                        return response;
                                                    } else {
                                                        return caches.open(CACHE_VERSIONS.notFound)
                                                            .then((cache) => {
                                                                return cache.match(NOT_FOUND_PAGE);
                                                            })
                                                    }
                                                }
                                            )
                                            .then((response) => {
                                                if (response) {
                                                    return response;
                                                }
                                            })
                                            .catch(
                                                () => {
                                                    return caches.open(CACHE_VERSIONS.offline)
                                                        .then(
                                                            (offlineCache) => {
                                                                return offlineCache.match(OFFLINE_PAGE)
                                                            }
                                                        )
                                                }
                                            )
                                    }
                                }
                            )
                            .catch(
                                (error) => {
                                    console.error('  Error in fetch handler:', error);
                                    throw error;
                                }
                            );
                    }
                )
        );
    }
);
// is called when the User clicks on the Notification
self.addEventListener('notificationclick', function (e) {
    var notification = e.notification;
    var primaryKey = notification.data.primaryKey;
    var action = e.action;

    if (action === 'close') {
        notification.close();
    } else {
        clients.openWindow('https://www.ringodev.com/');
        notification.close();
    }
});
self.addEventListener('push', function (e) {
    if (e.data) console.log('Data of push event', e.data.text());
    var options = {
        body: e.data ? JSON.parse(e.data.text()).data : '',
        icon: 'img/logo_1024px.png',
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore', title: 'Check it out',
                icon: 'img/stocks.png'
            },
            {
                action: 'close', title: 'Close',
                icon: 'img/blackjack.png'
            },
        ]
    };
    e.waitUntil(
        self.registration.showNotification('RingoDev received an update!', options)
    );
});
