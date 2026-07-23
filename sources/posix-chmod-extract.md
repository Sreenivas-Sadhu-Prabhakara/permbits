# Extract — POSIX.1-2017 chmod utility (EXTENDED DESCRIPTION)

Source: https://pubs.opengroup.org/onlinepubs/9699919799/utilities/chmod.html
Fetched: 2026-07-23

Verbatim passages relied on by the corpus:

> The who symbols u, g, and o shall specify the user, group, and other parts of the
> file mode bits, respectively. A who consisting of the symbol a shall be equivalent
> to ugo.

> The perm symbols r, w, and x represent the read, write, and execute/search portions
> of file mode bits, respectively.

> The perm symbol X shall represent the execute/search portion of the file mode bits
> if the file is a directory or if the current (unmodified) file mode bits have at
> least one of the execute bits (S_IXUSR, S_IXGRP, or S_IXOTH) set. It shall be
> ignored if the file is not a directory and none of the execute bits are set.

> The perm symbol s shall represent the set-user-ID-on-execution (when who contains or
> implies u) and set-group-ID-on-execution (when who contains or implies g) bits.

> The perm symbol t shall specify the S_ISVTX bit. When used with a file of type
> directory, it can be used with the who symbol a, or with no who symbol.

> For an octal integer mode operand, the file mode bits shall be set absolutely.
