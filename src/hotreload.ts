if (window.location.host.indexOf('localhost') >= 0) {
    const socket = new WebSocket('ws://localhost:8081');
    socket.addEventListener('close', () => {
        window.location.reload(false);
    });
}
