# Extract — POSIX.1-2017 ls utility (STDOUT, mode field)

Source: https://pubs.opengroup.org/onlinepubs/9699919799/utilities/ls.html
Fetched: 2026-07-23

Verbatim passages relied on by the corpus:

> The <entry type> character shall describe the type of file, as follows:
> d Directory. b Block special file. c Character special file. l (ell) Symbolic link.
> p FIFO. - Regular file.

> S If in <owner permissions>, the file is not executable and set-user-ID mode is set.
> If in <group permissions>, the file is not executable and set-group-ID mode is set.

> s If in <owner permissions>, the file is executable and set-user-ID mode is set.
> If in <group permissions>, the file is executable and set-group-ID mode is set.

> t If in <other permissions> and the file is a directory, search permission is
> granted to others, and the restricted deletion flag is set.

> x The file is executable or the directory is searchable.

> The <optional alternate access method flag> shall be the empty string if there is no
> alternate or additional access control method associated with the file; otherwise,
> it shall be a string containing a single printable character that is not a <blank>.
