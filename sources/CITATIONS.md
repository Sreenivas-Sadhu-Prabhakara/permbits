# permbits — corpus citations

Every fact and recipe in `data/corpus.js` was verified against the sources below on
**2026-07-23** by fetching the page and string-matching the quoted sentence. The staged
files in this directory are *extracts* (the verbatim passages we rely on, captured at
fetch time), not full page mirrors. Where a primary source was unreachable, the mirror
used is named and the corpus item says so.

## Primary sources

| # | Source | URL | Used for | Status |
|---|--------|-----|----------|--------|
| 1 | POSIX.1-2017 `chmod` utility (The Open Group) | https://pubs.opengroup.org/onlinepubs/9699919799/utilities/chmod.html | symbolic grammar, capital X, s/t semantics, octal-absolute | verified 2026-07-23 |
| 2 | POSIX.1-2017 `ls` utility (The Open Group) | https://pubs.opengroup.org/onlinepubs/9699919799/utilities/ls.html | mode-field layout, type chars, s/S/t/T display, `+` alternate-access marker | verified 2026-07-23 |
| 3 | POSIX.1-2017 `umask` utility (The Open Group) | https://pubs.opengroup.org/onlinepubs/9699919799/utilities/umask.html | umask semantics + 002 example | verified 2026-07-23 |
| 4 | GNU Coreutils manual — Mode Structure | https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html | setuid/setgid/sticky meaning, /tmp example | verified 2026-07-23 |
| 5 | GNU Coreutils manual — Directories and the Set-User-ID and Set-Group-ID Bits | https://www.gnu.org/software/coreutils/manual/html_node/Directory-Setuid-and-Setgid.html | setgid/setuid on directories | verified 2026-07-23 |
| 6 | OpenSSH `ssh(1)` | https://man.openbsd.org/ssh.1 | ~/.ssh 700, config 600, private keys 600 | verified 2026-07-23 |
| 7 | OpenSSH `sshd(8)` | https://man.openbsd.org/sshd.8 | authorized_keys 600, StrictModes home-dir check | verified 2026-07-23 |
| 8 | `sudoers(5)` man page — **mirror** at linux.die.net | https://linux.die.net/man/5/sudoers | sudoers mode 0440 | verified 2026-07-23 via mirror; **sudo.ws returned HTTP 403** at verification time — the corpus item carries this caveat |
| 9 | WordPress Advanced Administration — Hardening | https://developer.wordpress.org/advanced-administration/security/hardening/ | web dirs 755, files 644, wp-config 400/440 | verified 2026-07-23 |
| 10 | AWS EC2 User Guide — General connection prerequisites | https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connection-prereqs-general.html | chmod 400 .pem, "Error: Unprotected private key file" | verified 2026-07-23 |
| 11 | `githooks(5)` (git-scm.com) | https://git-scm.com/docs/githooks | hooks need the executable bit | verified 2026-07-23 |
| 12 | NetBSD `ftp(1)` | https://man.netbsd.org/ftp.1 | .netrc must not be readable by others | verified 2026-07-23 |

## Beta (could not be verified against one authoritative sentence)

- **/etc/shadow mode** — distro-specific (Debian root:shadow 640 vs Red Hat 000); no
  single upstream authority exists. Shipped `beta: true` with an in-UI caveat telling
  the user to check `ls -l /etc/shadow` and override.
- **~/.gnupg 700** — community-standard fix echoed on GnuPG's own gnupg-users mailing
  list (https://lists.gnupg.org/pipermail/gnupg-users/2003-October/020342.html), but we
  found no authoritative man-page sentence mandating the exact mode. Shipped
  `beta: true` with the caveat stated in the UI.

## Honest deviation from generic folklore

- **wp-config.php** ships as **440** (not the folkloric 600) because the WordPress
  hardening guide's literal wording is "it generally means a 400 or 440 permission".

## Staged extracts in this directory

- `posix-chmod-extract.md`, `posix-ls-extract.md`, `posix-umask-extract.md`
- `gnu-coreutils-extract.md`
- `openssh-extract.md`
- `sudoers-extract.md`
- `wordpress-hardening-extract.md`
- `aws-ec2-extract.md`
- `githooks-netbsd-ftp-extract.md`
