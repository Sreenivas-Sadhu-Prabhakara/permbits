# Extract — POSIX.1-2017 umask utility (DESCRIPTION + EXAMPLES)

Source: https://pubs.opengroup.org/onlinepubs/9699919799/utilities/umask.html
Fetched: 2026-07-23

Verbatim passages relied on by the corpus:

> The umask utility shall set the file mode creation mask of the current shell
> execution environment ... This mask shall affect the initial value of the file
> permission bits of subsequently created files.

> Either of the commands:
> umask a=rx,ug+w
> umask 002
> sets the mode mask so that subsequently created files have their S_IWOTH bit cleared.

Note: the 666-for-files / 777-for-directories request values are the near-universal
convention of creating programs (open(2) with 0666, mkdir with 0777); the corpus item
labels that part convention, and the app's arithmetic (666 & ~umask, 777 & ~umask)
is asserted in the Node self-tests.
