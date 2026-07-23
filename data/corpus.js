/* permbits corpus — 12 concept facts + 24 recipes. Every item carries provenance.
   Quotes are verbatim from the cited source as fetched on the verified_on date.
   Items that could not be verified against an authoritative source are flagged
   beta: true and the UI exposes a user override — nothing here is invented.
   Dual-export: browser global + Node tests. */
'use strict';

const CONCEPTS = [
  {
    id: 'setuid-file',
    title: 'setuid on an executable file',
    body: 'The set-user-ID bit (octal 4000, shown as s/S in the owner execute slot) makes a program run with the file owner’s user ID instead of yours.',
    quote: 'On execution, set the process’s effective user ID to that of the file.',
    source: { doc: 'GNU Coreutils manual', section: 'Mode Structure', url: 'https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'setgid-file',
    title: 'setgid on an executable file',
    body: 'The set-group-ID bit (octal 2000, shown as s/S in the group execute slot) makes a program run with the file’s group ID.',
    quote: 'On execution, set the process’s effective group ID to that of the file.',
    source: { doc: 'GNU Coreutils manual', section: 'Mode Structure', url: 'https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'setgid-dir',
    title: 'setgid on a directory',
    body: 'On a setgid directory, new files inherit the directory’s group and new subdirectories inherit the setgid bit — the standard trick for shared group workspaces.',
    quote: 'if a directory’s set-group-ID bit is set, newly created subfiles inherit the same group as the directory, and newly created subdirectories inherit the set-group-ID bit of the parent directory.',
    source: { doc: 'GNU Coreutils manual', section: 'Directories and the Set-User-ID and Set-Group-ID Bits', url: 'https://www.gnu.org/software/coreutils/manual/html_node/Directory-Setuid-and-Setgid.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'setuid-dir',
    title: 'setuid on a directory',
    body: 'setuid on a directory has no portable meaning — only a few systems give it an ownership-inheritance effect, and tools like chmod leave directory setuid/setgid bits alone unless you name them explicitly.',
    quote: 'On a few systems, a directory’s set-user-ID bit has a similar effect on the ownership of new subfiles and the set-user-ID bits of new subdirectories.',
    source: { doc: 'GNU Coreutils manual', section: 'Directories and the Set-User-ID and Set-Group-ID Bits', url: 'https://www.gnu.org/software/coreutils/manual/html_node/Directory-Setuid-and-Setgid.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'sticky-dir',
    title: 'sticky bit on a directory (restricted deletion)',
    body: 'The sticky bit (octal 1000, shown as t/T in the other execute slot) on a directory stops users deleting or renaming files they do not own — this is why /tmp is mode 1777.',
    quote: 'Prevent unprivileged users from removing or renaming a file in a directory unless they own the file or the directory; this is commonly found on world-writable directories like /tmp.',
    source: { doc: 'GNU Coreutils manual', section: 'Mode Structure', url: 'https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'sticky-file',
    title: 'sticky bit on a regular file',
    body: 'On a regular file the sticky bit has no standardized effect — POSIX defines the t symbol as the S_ISVTX bit and only gives it directory semantics (restricted deletion); on modern Linux it is ignored for regular files.',
    quote: 'The perm symbol t shall specify the S_ISVTX bit. When used with a file of type directory, it can be used with the who symbol a, or with no who symbol.',
    source: { doc: 'POSIX.1-2017', section: 'chmod utility — EXTENDED DESCRIPTION', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/chmod.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'umask-arithmetic',
    title: 'How the umask works',
    body: 'The umask is a mask of bits to take away from newly created files. Programs conventionally request 666 for files and 777 for directories, so the effective default is 666 & ~umask (file) and 777 & ~umask (directory).',
    quote: 'The umask utility shall set the file mode creation mask of the current shell execution environment … This mask shall affect the initial value of the file permission bits of subsequently created files.',
    source: { doc: 'POSIX.1-2017', section: 'umask utility — DESCRIPTION', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/umask.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'umask-common',
    title: 'Common umask values',
    body: '022 (default on most distros: group/other lose write), 002 (group keeps write — common with per-user groups), 077 (private: group/other lose everything). POSIX’s own example uses 002.',
    quote: 'Either of the commands: umask a=rx,ug+w / umask 002 sets the mode mask so that subsequently created files have their S_IWOTH bit cleared.',
    source: { doc: 'POSIX.1-2017', section: 'umask utility — EXAMPLES', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/umask.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'dir-execute',
    title: 'Execute on a directory means search',
    body: 'On a directory, x is search/traverse permission: you need it to enter the directory or reach anything inside it. r without x lets you list names but not open them; x without r lets you reach known names but not list.',
    quote: 'x The file is executable or the directory is searchable.',
    source: { doc: 'POSIX.1-2017', section: 'ls utility — STDOUT (mode field)', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/ls.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'symbolic-grammar',
    title: 'Symbolic mode grammar (and capital X)',
    body: 'A clause is [ugoa][+-=][rwxXst], comma-separated. Capital X sets execute only where it makes sense: on directories, or on files that already have some execute bit.',
    quote: 'The perm symbol X shall represent the execute/search portion of the file mode bits if the file is a directory or if the current (unmodified) file mode bits have at least one of the execute bits (S_IXUSR, S_IXGRP, or S_IXOTH) set. It shall be ignored if the file is not a directory and none of the execute bits are set.',
    source: { doc: 'POSIX.1-2017', section: 'chmod utility — EXTENDED DESCRIPTION', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/chmod.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'ls-layout',
    title: 'The ls -l mode field, character by character',
    body: 'Character 1 is the entry type (- file, d directory, l symlink, c character device, b block device, p FIFO; s socket on most systems), then three rwx triplets for owner, group and other, with s/S/t/T replacing x where special bits are set.',
    quote: 'The <entry type> character shall describe the type of file, as follows: d Directory. b Block special file. c Character special file. l (ell) Symbolic link. p FIFO. - Regular file.',
    source: { doc: 'POSIX.1-2017', section: 'ls utility — STDOUT', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/ls.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'acl-marker',
    title: 'The trailing + (alternate access method)',
    body: 'An 11th character after the nine permission slots (commonly +) means an alternate access method such as a POSIX ACL also applies — the nine classic bits are then not the whole story. Reading or editing ACLs is beyond this tool: use getfacl/setfacl.',
    quote: 'The <optional alternate access method flag> shall be the empty string if there is no alternate or additional access control method associated with the file; otherwise, it shall be a string containing a single printable character that is not a <blank>.',
    source: { doc: 'POSIX.1-2017', section: 'ls utility — STDOUT', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/ls.html' },
    verified_on: '2026-07-23'
  }
];

const RECIPES = [
  {
    id: 'ssh-private-key',
    situation: 'SSH private key (~/.ssh/id_ed25519, id_rsa)',
    octal: '600',
    command: 'chmod 600 ~/.ssh/id_ed25519',
    why: 'OpenSSH treats private keys as sensitive and refuses keys other users can read.',
    quote: 'These files contain sensitive data and should be readable by the user but not accessible by others (read/write/execute).',
    source: { doc: 'OpenSSH ssh(1)', section: 'FILES — ~/.ssh/id_*', url: 'https://man.openbsd.org/ssh.1' },
    verified_on: '2026-07-23'
  },
  {
    id: 'ssh-dir',
    situation: '~/.ssh directory',
    octal: '700',
    command: 'chmod 700 ~/.ssh',
    why: 'The recommended permissions are read/write/execute for the user only.',
    quote: 'There is no general requirement to keep the entire contents of this directory secret, but the recommended permissions are read/write/execute for the user, and not accessible by others.',
    source: { doc: 'OpenSSH ssh(1)', section: 'FILES — ~/.ssh/', url: 'https://man.openbsd.org/ssh.1' },
    verified_on: '2026-07-23'
  },
  {
    id: 'authorized-keys',
    situation: '~/.ssh/authorized_keys',
    octal: '600',
    command: 'chmod 600 ~/.ssh/authorized_keys',
    why: 'sshd refuses the file if it (or ~/.ssh, or your home) is writable by others, unless StrictModes is off.',
    quote: 'The content of the file is not highly sensitive, but the recommended permissions are read/write for the user, and not accessible by others.',
    source: { doc: 'OpenSSH sshd(8)', section: 'FILES — ~/.ssh/authorized_keys', url: 'https://man.openbsd.org/sshd.8' },
    verified_on: '2026-07-23'
  },
  {
    id: 'ssh-config',
    situation: '~/.ssh/config',
    octal: '600',
    command: 'chmod 600 ~/.ssh/config',
    why: 'ssh requires strict permissions on the per-user config because of the potential for abuse.',
    quote: 'Because of the potential for abuse, this file must have strict permissions: read/write for the user, and not writable by others.',
    source: { doc: 'OpenSSH ssh(1)', section: 'FILES — ~/.ssh/config', url: 'https://man.openbsd.org/ssh.1' },
    verified_on: '2026-07-23'
  },
  {
    id: 'aws-pem',
    situation: 'AWS EC2 key pair (.pem)',
    octal: '400',
    command: 'chmod 400 key-pair-name.pem',
    why: 'AWS requires the key readable only by you before ssh -i will work.',
    quote: 'use the following command to set the permissions of your private key file so that only you can read it. chmod 400 key-pair-name.pem',
    source: { doc: 'AWS EC2 User Guide', section: 'General connection prerequisites — set permissions', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connection-prereqs-general.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'unprotected-key-fix',
    situation: 'Fix “WARNING: UNPROTECTED PRIVATE KEY FILE!”',
    octal: '600',
    command: 'chmod 600 /path/to/private_key',
    why: 'The warning fires because the key is readable by group/other; 600 (or 400) restores user-only access.',
    quote: 'If you do not set these permissions, then you cannot connect to your instance using this key pair. … Error: Unprotected private key file',
    caveat: 'For AWS .pem keys AWS documents chmod 400; 600 also satisfies OpenSSH.',
    source: { doc: 'AWS EC2 User Guide', section: 'General connection prerequisites — set permissions', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connection-prereqs-general.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'web-dirs',
    situation: 'Web/WordPress directories',
    octal: '755',
    command: 'find /path/to/site/ -type d -exec chmod 755 {} \\;',
    why: 'Directories need search (x) for the web server while staying writable only by the owner.',
    quote: 'For Directories: find /path/to/your/wordpress/install/ -type d -exec chmod 755 {} \\;',
    source: { doc: 'WordPress Advanced Administration', section: 'Hardening — File Permissions', url: 'https://developer.wordpress.org/advanced-administration/security/hardening/' },
    verified_on: '2026-07-23'
  },
  {
    id: 'web-files',
    situation: 'Web/WordPress files',
    octal: '644',
    command: 'find /path/to/site/ -type f -exec chmod 644 {} \\;',
    why: 'Files readable by the server, writable only by the owner — WordPress core updates set exactly this.',
    quote: 'All files are set to 0644 and all directories are set to 0755, and writable by only the user and readable by everyone else, including the web server.',
    source: { doc: 'WordPress Advanced Administration', section: 'Hardening — File Permissions', url: 'https://developer.wordpress.org/advanced-administration/security/hardening/' },
    verified_on: '2026-07-23'
  },
  {
    id: 'wp-config',
    situation: 'wp-config.php (holds DB credentials)',
    octal: '440',
    command: 'chmod 440 wp-config.php',
    why: 'Only you and the web server should be able to read the credentials file.',
    quote: 'make sure that only you (and the web server) can read this file (it generally means a 400 or 440 permission).',
    caveat: 'Use 400 if the server reads it as your user (e.g. suPHP/PHP-FPM under your account).',
    source: { doc: 'WordPress Advanced Administration', section: 'Hardening — Securing wp-config.php', url: 'https://developer.wordpress.org/advanced-administration/security/hardening/' },
    verified_on: '2026-07-23'
  },
  {
    id: 'setgid-shared-dir',
    situation: 'Shared group directory (setgid)',
    octal: '2775',
    command: 'chmod 2775 /srv/shared',
    why: 'setgid makes new files inherit the directory’s group, so teammates can collaborate without chgrp.',
    quote: 'if a directory’s set-group-ID bit is set, newly created subfiles inherit the same group as the directory, and newly created subdirectories inherit the set-group-ID bit of the parent directory.',
    source: { doc: 'GNU Coreutils manual', section: 'Directories and the Set-User-ID and Set-Group-ID Bits', url: 'https://www.gnu.org/software/coreutils/manual/html_node/Directory-Setuid-and-Setgid.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'world-writable-tmp',
    situation: 'World-writable scratch directory (like /tmp)',
    octal: '1777',
    command: 'chmod 1777 /srv/scratch',
    why: 'Everyone may create files; the sticky bit stops users deleting files they do not own.',
    quote: 'Prevent unprivileged users from removing or renaming a file in a directory unless they own the file or the directory; this is commonly found on world-writable directories like /tmp.',
    source: { doc: 'GNU Coreutils manual', section: 'Mode Structure', url: 'https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'make-executable',
    situation: 'Make a script executable',
    octal: '755',
    command: 'chmod 755 script.sh',
    why: 'Adds execute for everyone while keeping the file writable only by you; use chmod u+x to add execute for yourself only.',
    quote: 'x The file is executable or the directory is searchable.',
    source: { doc: 'POSIX.1-2017', section: 'ls utility — STDOUT (mode field)', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/ls.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'home-dir',
    situation: 'Private home directory',
    octal: '700',
    command: 'chmod 700 ~',
    why: 'Keeps other local users out entirely; sshd also refuses key logins when your home is writable by others.',
    quote: 'If this file, the ~/.ssh directory, or the user’s home directory are writable by other users, then the file could be modified or replaced by unauthorized users.',
    caveat: '750 is a common alternative when your group should read your home.',
    source: { doc: 'OpenSSH sshd(8)', section: 'FILES — ~/.ssh/authorized_keys (StrictModes)', url: 'https://man.openbsd.org/sshd.8' },
    verified_on: '2026-07-23'
  },
  {
    id: 'sudoers',
    situation: '/etc/sudoers',
    octal: '440',
    command: 'chmod 440 /etc/sudoers',
    why: 'sudo validates the mode and refuses a world-writable sudoers; always edit with visudo.',
    quote: 'The sudoers file must not be world-writable, the default file mode is 0440 (readable by owner and group, writable by none).',
    caveat: 'Verified against the sudoers(5) man page mirror at die.net (sudo.ws returned 403 at verification time). Always edit via visudo, which preserves the mode.',
    source: { doc: 'sudoers(5) man page (mirror)', section: 'sudoers — file mode', url: 'https://linux.die.net/man/5/sudoers' },
    verified_on: '2026-07-23'
  },
  {
    id: 'etc-shadow',
    situation: '/etc/shadow (password hashes)',
    octal: '640',
    command: 'chmod 640 /etc/shadow',
    why: 'Hashes must never be world-readable; the exact mode and group vary by distribution.',
    caveat: 'DISTRO-SPECIFIC: Debian/Ubuntu ship root:shadow 640, Red Hat family ships 000. Check your distro’s default with ls -l /etc/shadow before changing anything.',
    beta: true,
    source: { doc: 'Distribution packaging (varies)', section: 'no single authoritative upstream mode', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/chmod.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'umask-022',
    situation: 'Standard umask (022)',
    octal: '022',
    command: 'umask 022',
    why: 'New files come out 644 and directories 755 — group and other lose write.',
    quote: 'This mask shall affect the initial value of the file permission bits of subsequently created files.',
    source: { doc: 'POSIX.1-2017', section: 'umask utility — DESCRIPTION', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/umask.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'umask-077',
    situation: 'Private umask (077)',
    octal: '077',
    command: 'umask 077',
    why: 'New files come out 600 and directories 700 — nothing for group or other.',
    quote: 'This mask shall affect the initial value of the file permission bits of subsequently created files.',
    source: { doc: 'POSIX.1-2017', section: 'umask utility — DESCRIPTION', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/umask.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'recursive-arx',
    situation: 'Recursively make readable (dirs traversable, scripts stay executable)',
    octal: '755',
    command: 'chmod -R a+rX /path/to/tree',
    why: 'Capital X adds execute only to directories and files that already had it — plain a+rx would wrongly make every file executable.',
    quote: 'The perm symbol X shall represent the execute/search portion of the file mode bits if the file is a directory or if the current (unmodified) file mode bits have at least one of the execute bits … set.',
    source: { doc: 'POSIX.1-2017', section: 'chmod utility — EXTENDED DESCRIPTION', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/chmod.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'passwd-setuid',
    situation: '/usr/bin/passwd — the canonical setuid example',
    octal: '4755',
    command: 'ls -l /usr/bin/passwd   # -rwsr-xr-x',
    why: 'passwd must edit root-owned /etc/shadow, so it runs setuid root: the s in rws means it executes with the file owner’s (root’s) user ID.',
    quote: 'On execution, set the process’s effective user ID to that of the file.',
    caveat: 'Look, don’t touch: exact mode/owner vary slightly by distro. Never chmod system binaries yourself — package managers maintain them.',
    source: { doc: 'GNU Coreutils manual', section: 'Mode Structure (setuid)', url: 'https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'git-hook',
    situation: 'Git hook won’t run',
    octal: '755',
    command: 'chmod u+x .git/hooks/pre-commit',
    why: 'Git silently skips hook files that are not executable.',
    quote: 'Hooks that don’t have the executable bit set are ignored.',
    source: { doc: 'githooks(5)', section: 'DESCRIPTION', url: 'https://git-scm.com/docs/githooks' },
    verified_on: '2026-07-23'
  },
  {
    id: 'netrc',
    situation: '~/.netrc (stored FTP/HTTP credentials)',
    octal: '600',
    command: 'chmod 600 ~/.netrc',
    why: 'Clients refuse to auto-login from a .netrc that other users can read.',
    quote: 'ftp will abort the auto-login process if the .netrc is readable by anyone besides the user.',
    source: { doc: 'NetBSD ftp(1)', section: 'THE .netrc FILE — password', url: 'https://man.netbsd.org/ftp.1' },
    verified_on: '2026-07-23'
  },
  {
    id: 'gnupg-dir',
    situation: '~/.gnupg directory',
    octal: '700',
    command: 'chmod 700 ~/.gnupg',
    why: 'gpg warns “unsafe permissions on homedir” when the keyring directory is accessible to others.',
    caveat: 'BETA: 700 is the community-standard fix echoed on GnuPG’s own mailing lists, but we found no single authoritative man-page sentence mandating it — verify the warning disappears on your system.',
    beta: true,
    source: { doc: 'gnupg-users mailing list (gnupg.org)', section: 'WARNING: unsafe permissions on homedir', url: 'https://lists.gnupg.org/pipermail/gnupg-users/2003-October/020342.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'remove-execute',
    situation: 'Remove execute from a file for everyone',
    octal: '644',
    command: 'chmod a-x document.txt',
    why: 'Documents should not be executable; a-x clears all three execute bits in one clause.',
    quote: 'A who consisting of the symbol a shall be equivalent to ugo.',
    caveat: 'Do not use -R a-x on a tree — it also strips search permission from directories; use find -type f, or a-x on single files.',
    source: { doc: 'POSIX.1-2017', section: 'chmod utility — EXTENDED DESCRIPTION', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/chmod.html' },
    verified_on: '2026-07-23'
  },
  {
    id: 'read-only-share',
    situation: 'Read-only shared directory',
    octal: '555',
    command: 'chmod 555 /srv/readonly',
    why: 'Everyone can list and enter (r-x), nobody — not even the owner via this mode — can add or remove entries.',
    quote: 'x The file is executable or the directory is searchable.',
    caveat: 'The owner (and root) can always chmod it writable again; 555 is a guard-rail, not a lock.',
    source: { doc: 'POSIX.1-2017', section: 'ls utility — STDOUT (mode field)', url: 'https://pubs.opengroup.org/onlinepubs/9699919799/utilities/ls.html' },
    verified_on: '2026-07-23'
  }
];

const CORPUS = { CONCEPTS, RECIPES };

if (typeof module !== 'undefined') module.exports = CORPUS;
if (typeof window !== 'undefined') window.PERMBITS_CORPUS = CORPUS;
