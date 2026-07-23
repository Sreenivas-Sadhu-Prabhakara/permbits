# Extract — sudoers(5) man page

Source used: https://linux.die.net/man/5/sudoers (mirror)
Primary (https://www.sudo.ws/docs/man/sudoers.man/) returned HTTP 403 at verification
time, so the die.net mirror was used and the corpus item carries this caveat.
Fetched: 2026-07-23

Verbatim passage relied on by the corpus:

> The sudoers file must not be world-writable, the default file mode is 0440
> (readable by owner and group, writable by none).

Related mirror passages (ownership checks logged by sudo):

> /etc/sudoers is owned by uid N, should be 0
