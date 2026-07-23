# Extract — GNU Coreutils manual (File permissions chapters)

Sources:
- https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html
- https://www.gnu.org/software/coreutils/manual/html_node/Directory-Setuid-and-Setgid.html
Fetched: 2026-07-23

Verbatim passages relied on by the corpus:

Mode Structure —

> [set-user-ID] On execution, set the process's effective user ID to that of the file.

> [set-group-ID] On execution, set the process's effective group ID to that of the
> file. For directories on most systems, give files created in the directory the same
> group as the directory.

> [restricted deletion flag / sticky] Prevent unprivileged users from removing or
> renaming a file in a directory unless they own the file or the directory; this is
> commonly found on world-writable directories like /tmp.

Directories and the Set-User-ID and Set-Group-ID Bits —

> if a directory's set-group-ID bit is set, newly created subfiles inherit the same
> group as the directory, and newly created subdirectories inherit the set-group-ID
> bit of the parent directory.

> On a few systems, a directory's set-user-ID bit has a similar effect on the
> ownership of new subfiles and the set-user-ID bits of new subdirectories.

> a command like chmod does not affect the set-user-ID or set-group-ID bits of a
> directory unless the user specifically mentions them.
