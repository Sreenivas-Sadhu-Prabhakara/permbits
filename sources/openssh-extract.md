# Extract — OpenSSH ssh(1) and sshd(8) (FILES sections)

Sources:
- https://man.openbsd.org/ssh.1
- https://man.openbsd.org/sshd.8
Fetched: 2026-07-23

Verbatim passages relied on by the corpus:

ssh(1), ~/.ssh/ —

> There is no general requirement to keep the entire contents of this directory
> secret, but the recommended permissions are read/write/execute for the user, and
> not accessible by others.

ssh(1), ~/.ssh/config —

> Because of the potential for abuse, this file must have strict permissions:
> read/write for the user, and not writable by others.

ssh(1), identity files (~/.ssh/id_rsa etc.) —

> These files contain sensitive data and should be readable by the user but not
> accessible by others (read/write/execute).

sshd(8), ~/.ssh/authorized_keys —

> The content of the file is not highly sensitive, but the recommended permissions are
> read/write for the user, and not accessible by others.

> If this file, the ~/.ssh directory, or the user's home directory are writable by
> other users, then the file could be modified or replaced by unauthorized users. In
> this case, sshd will not allow it to be used unless the StrictModes option has been
> set to "no".
