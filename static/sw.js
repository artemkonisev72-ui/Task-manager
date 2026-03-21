self.addEventListener('push', function(event) {
    if (!event.data) return;
    
    try {
        const payload = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(payload.title || 'Task Manager', {
                body: payload.message || '',
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                vibrate: [200, 100, 200],
                data: payload.url || '/'
            })
        );
    } catch (e) {
        // Фолбэк на случай если сервер прислал просто текст
        event.waitUntil(
            self.registration.showNotification('Уведомление', {
                body: event.data.text()
            })
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: "window" }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data || '/');
            }
        })
    );
});
