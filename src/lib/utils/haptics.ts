// Safe wrapper for navigator.vibrate
// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate

export const hapticFeedback = {
    // A single light tap (e.g., sending a message, pressing a button)
    light: () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
    },

    // A medium tap (e.g., saving a setting, warning)
    medium: () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(30);
        }
    },

    // A heavy tap (e.g., deleting an item, error)
    heavy: () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    },

    // A success pattern (e.g., winning a game, locking a plan)
    success: () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([50, 50, 50]);
        }
    },

    // A celebration pattern (e.g., confetti)
    celebration: () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([50, 50, 100, 50, 100, 50, 150]);
        }
    }
};
