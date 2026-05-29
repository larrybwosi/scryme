# Notification Sounds

The application requires notification sound files. Place the following MP3 files in this directory:

## Required Sound Files

1. **notification-info.mp3** - For informational notifications
   - Suggested: Subtle "ding" or "pop" sound (~200-500ms)

2. **notification-success.mp3** - For success notifications
   - Suggested: Pleasant chime or "success" sound (~300-700ms)

3. **notification-warning.mp3** - For warning notifications
   - Suggested: Attention-grabbing but not jarring sound (~300-600ms)

4. **notification-error.mp3** - For error notifications
   - Suggested: Alert sound that indicates urgency (~500-800ms)

5. **notification-sale.mp3** - For completed sales
   - Suggested: Cash register "cha-ching" or celebratory sound (~500-1000ms)

## Sound Recommendations

- Keep sounds short (under 1 second)
- Use pleasant, enterprise-appropriate tones
- Ensure sounds are normalized to similar volume levels
- Format: MP3, 128kbps or higher
- Sample rate: 44.1kHz or 48kHz

## Sources for Sounds

You can create or download sounds from:

- [Freesound.org](https://freesound.org)
- [Zapsplat.com](https://zapsplat.com)
- [Mixkit.co](https://mixkit.co/free-sound-effects/notification/)
- Create custom sounds using audio editing software

## Fallback

If sound files are not found, the notification system will silently fail and continue without audio.
Notifications will still work properly, just without sound effects.
