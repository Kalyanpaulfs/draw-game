/**
 * Sound Configuration
 * Defines types and mapping for game sound effects.
 */

export enum SoundEvent {
    // Lobby & Room
    PLAYER_JOIN = 'player_join',
    PLAYER_LEAVE = 'player_leave',
    PLAYER_READY = 'player_ready',
    PLAYER_UNREADY = 'player_unready',
    ROOM_READY = 'room_ready',
    GAME_START = 'game_start',

    // Turn & Round
    DRAWER_SELECTED = 'drawer_selected',
    PHASE_CHOOSING_WORD = 'phase_choosing_word',
    DIFFICULTY_SELECTED = 'difficulty_selected',
    WORD_CHOSEN = 'word_chosen',
    PHASE_DRAWING = 'phase_drawing',
    TIMER_WARNING = 'timer_warning',
    ROUND_END = 'round_end',
    NEXT_ROUND = 'next_round',

    // Guessing & Chat
    GUESS_CORRECT = 'guess_correct',
    GUESS_CLOSE = 'guess_close',
    GUESS_WRONG = 'guess_wrong', // Subtle
    ALL_GUESSED = 'all_guessed',

    // Game Results
    GAME_OVER = 'game_over',
    WINNER = 'winner',
    SCORE_UPDATE = 'score_update',

    // UI Feedback
    CLICK_SOFT = 'click_soft',
    MODAL_OPEN = 'modal_open',
    MODAL_CLOSE = 'modal_close',
    ERROR = 'error',
    NOTIFICATION = 'notification'
}

