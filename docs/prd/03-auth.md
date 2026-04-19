# Authentication & Authorization

- **Login Page:** Form email/username dan password.
- **No Registration:** User tidak dapat mendaftar sendiri. Data user dimasukkan melalui database seeding atau menu User Management oleh Admin.
- **Setup Admin Status:** Status instalasi awal di-cache di Upstash Redis (`system:setup_complete`) untuk menghindari query `COUNT(*)` berulang ke database pada setiap halaman atau middleware.
- **Session Management:** Better Auth untuk proteksi route. Redirect ke `/login` jika belum autentikasi.

## API

- `POST /api/auth/login` → `{email, password}` → `200 {user, session}` | `401`
- `POST /api/auth/logout` → `204`
