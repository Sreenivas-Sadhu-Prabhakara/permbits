# Extract — WordPress Advanced Administration: Hardening (File Permissions)

Source: https://developer.wordpress.org/advanced-administration/security/hardening/
Fetched: 2026-07-23

Verbatim passages relied on by the corpus:

> For Directories: find /path/to/your/wordpress/install/ -type d -exec chmod 755 {} \;

> For Files: find /path/to/your/wordpress/install/ -type f -exec chmod 644 {} \;

> All files are set to 0644 and all directories are set to 0755, and writable by only
> the user and readable by everyone else, including the web server.

wp-config.php —

> make sure that only you (and the web server) can read this file (it generally means
> a 400 or 440 permission).

NOTE: the wp-config recipe therefore ships as 440 (not the folkloric 600) to match the
source's literal wording.
